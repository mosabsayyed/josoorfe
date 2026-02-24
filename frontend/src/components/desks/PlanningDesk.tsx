import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Pause, ArrowUpDown, Users, Zap, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Gantt } from 'wx-react-gantt';
import 'wx-react-gantt/dist/gantt.css';
import { chatService } from '../../services/chatService';
import { createRiskPlan, fetchAllRiskPlans, fetchRiskPlan, RiskPlanSummary } from '../../services/planningService';
import { parsePlanResponse, InterventionPlan, PlanDeliverable, PlanTask } from '../../utils/planParser';
import './PlanningDesk.css';

type PlanningMode = 'intervention' | 'strategic-reset' | 'scenario';

export interface InterventionContext {
  riskId: string;
  riskName: string;
  capabilityId: string;
  capabilityName: string;
  band: string;
  exposurePct: number;
  selectedOption: {
    id: string;
    title: string;
    description: string;
  };
}

interface PlanningDeskProps {
  interventionContext?: InterventionContext | null;
  onClearContext?: () => void;
}

export function PlanningDesk({ interventionContext, onClearContext }: PlanningDeskProps) {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<PlanningMode>('intervention');

  // Auto-switch to intervention when context arrives
  useEffect(() => {
    if (interventionContext) {
      setSelectedMode('intervention');
    }
  }, [interventionContext]);

  const modeButtons: { id: PlanningMode; label: string; description: string }[] = [
    { id: 'intervention', label: t('josoor.planning.interventionPlanning'), description: t('josoor.planning.inYearTacticalAdjustments') },
    { id: 'strategic-reset', label: t('josoor.planning.strategicReset'), description: t('josoor.planning.annualDirectionSetting') },
    { id: 'scenario', label: t('josoor.planning.scenarioSimulation'), description: t('josoor.planning.whatIfAnalysis') },
  ];

  return (
    <div className="planning-container">
      {/* Header */}
      <div className="planning-header">
        <h1 className="planning-title">{t('josoor.planning.planningDesk')}</h1>
      </div>

      {/* Mode Selection */}
      <div className="mode-selection">
        <div className="mode-buttons-container">
          {modeButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedMode(btn.id)}
              className={`mode-btn ${selectedMode === btn.id
                ? 'mode-btn-active'
                : 'mode-btn-inactive'
                }`}
            >
              <div className="mode-btn-label">{btn.label}</div>
              <div className={`mode-btn-desc ${selectedMode === btn.id ? 'mode-btn-desc-active' : 'mode-btn-desc-inactive'}`}>
                {btn.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="planning-content">
        {selectedMode === 'intervention' && (
          <InterventionPlanning
            context={interventionContext}
            onClearContext={onClearContext}
          />
        )}
        {selectedMode === 'strategic-reset' && <StrategicReset />}
        {selectedMode === 'scenario' && <ScenarioSimulation />}
      </div>
    </div>
  );
}

// ─── Intervention Planning (In-Year) ────────────────────────────────

interface InterventionPlanningProps {
  context?: InterventionContext | null;
  onClearContext?: () => void;
}

function InterventionPlanning({ context, onClearContext }: InterventionPlanningProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [narrative, setNarrative] = useState<string>('');
  const [plan, setPlan] = useState<InterventionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCommitted, setIsCommitted] = useState(false);

  // Call LLM when context arrives
  useEffect(() => {
    if (!context) return;

    let cancelled = false;

    const generatePlan = async () => {
      setIsLoading(true);
      setError(null);
      setNarrative('');
      setPlan(null);
      setIsCommitted(false);

      try {
        const userPrompt = language === 'ar'
          ? `أريد خطة تدخل للمخاطر "${context.riskName}" التي تؤثر على القدرة "${context.capabilityName}". نطاق المخاطر ${context.band} ونسبة التعرض ${context.exposurePct}%. اخترت استراتيجية "${context.selectedOption.title}": ${context.selectedOption.description}. أنشئ خطة منظمة تتضمن المخرجات الرئيسية والمهام التفصيلية لكل مخرج.`
          : `I need an intervention plan for risk "${context.riskName}" affecting capability "${context.capabilityName}". Risk band is ${context.band}, exposure is ${context.exposurePct}%. The chosen strategy is "${context.selectedOption.title}": ${context.selectedOption.description}. Create a structured plan with key deliverables and detailed tasks for each deliverable.`;

        const response = await chatService.sendMessage({
          query: userPrompt,
          prompt_key: 'intervention_planning',
          language,
        });

        if (cancelled) return;

        const answer = response.llm_payload?.answer || response.message || response.answer || '';
        const parsed = parsePlanResponse(answer);

        setNarrative(parsed.narrative);
        setPlan(parsed.plan);

        if (!parsed.plan) {
          setError(t('josoor.planning.planParseError') || 'Could not parse plan from AI response.');
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[InterventionPlanning] LLM call failed:', err);
          setError(err.message || 'Failed to generate plan');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    generatePlan();
    return () => { cancelled = true; };
  }, [context, t]);

  const ganttColumns = [
    { id: 'text', header: 'Task', flexgrow: 1 },
    { id: 'owner', header: 'Owner', width: 120, align: 'center' as const },
    { id: 'start', header: 'Start', align: 'center' as const },
    { id: 'duration', header: 'Duration', width: 80, align: 'center' as const },
  ];

  // Convert plan to Gantt data format
  const ganttData = useMemo(() => {
    if (!plan) return { tasks: [], links: [], scales: [] };

    const tasks: any[] = [];
    const links: any[] = [];
    let linkId = 1;

    plan.deliverables.forEach((del: PlanDeliverable) => {
      // Add deliverable as a summary row
      tasks.push({
        id: del.id,
        text: del.name,
        start: new Date(del.start_date),
        end: new Date(del.end_date),
        type: 'summary',
        open: true,
      });

      del.tasks.forEach((task: PlanTask) => {
        tasks.push({
          id: task.id,
          text: task.name,
          start: new Date(task.start_date),
          end: new Date(task.end_date),
          parent: del.id,
          type: 'task',
          owner: task.owner,
        });

        // Add dependency links
        if (task.depends_on && task.depends_on.length > 0) {
          task.depends_on.forEach((depId: string) => {
            links.push({
              id: linkId++,
              source: depId,
              target: task.id,
              type: 'e2s',
            });
          });
        }
      });
    });

    const scales = [
      { unit: 'month', step: 1, format: 'MMMM yyyy' },
      { unit: 'week', step: 1, format: 'wo' },
    ];

    return { tasks, links, scales };
  }, [plan]);

  // Handle commit
  const handleCommit = useCallback(async () => {
    if (!plan || !context) return;

    try {
      await createRiskPlan(context.riskId, plan);
      setIsCommitted(true);
    } catch (err: any) {
      console.error('[InterventionPlanning] Commit failed:', err);
      setError(err.message || 'Failed to commit plan');
    }
  }, [plan, context]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setPlan(null);
    setNarrative('');
    setError(null);
    setIsCommitted(false);
    onClearContext?.();
  }, [onClearContext]);

  // ── No context: show saved plans list ──
  if (!context) {
    return <SavedPlansList />;
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="intervention-container">
        <RiskContextHeader context={context} />
        <div className="intervention-loading">
          <Loader2 className="loading-spinner" />
          <p className="loading-text">{t('josoor.planning.generatingPlan')}</p>
        </div>
      </div>
    );
  }

  // ── Committed state ──
  if (isCommitted) {
    return (
      <div className="intervention-container">
        <RiskContextHeader context={context} />
        <div className="intervention-committed">
          <CheckCircle className="committed-icon" />
          <p className="committed-text">{t('josoor.planning.planCommitted')}</p>
          <button className="btn-intervention-secondary" onClick={handleCancel}>
            {t('josoor.planning.backToPlanning') || 'Back to Planning'}
          </button>
        </div>
      </div>
    );
  }

  // ── Main: narrative + Gantt ──
  return (
    <div className="intervention-container">
      {/* Risk Context Header */}
      <RiskContextHeader context={context} />

      {/* Error */}
      {error && (
        <div className="intervention-error">
          <XCircle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Narrative */}
      {narrative && (
        <div className="intervention-narrative">
          <div className="block-header-green">{t('josoor.planning.planNarrative')}</div>
          <div
            className="narrative-content"
            dangerouslySetInnerHTML={{ __html: narrative }}
          />
        </div>
      )}

      {/* Gantt Chart */}
      {plan && ganttData.tasks.length > 0 && (
        <div className="intervention-gantt-section">
          <div className="gantt-header">
            <div className="block-header-green">{t('josoor.planning.editGantt')}</div>
            <div className="gantt-actions">
              <button className="btn-intervention-secondary" onClick={handleCancel}>
                {t('josoor.planning.cancelPlan')}
              </button>
              <button className="btn-intervention-primary" onClick={handleCommit}>
                {t('josoor.planning.commitPlan')}
              </button>
            </div>
          </div>
          <div className="gantt-container">
            <Gantt
              tasks={ganttData.tasks}
              links={ganttData.links}
              scales={ganttData.scales}
              columns={ganttColumns}
              cellHeight={38}
              cellBorders="full"
            />
          </div>
        </div>
      )}

      {/* If plan was null but we have narrative — show just the action buttons */}
      {!plan && narrative && (
        <div className="gantt-actions" style={{ marginTop: '1rem' }}>
          <button className="btn-intervention-secondary" onClick={handleCancel}>
            {t('josoor.planning.cancelPlan')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Saved Plans List ────────────────────────────────────────────────

function SavedPlansList() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<RiskPlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ riskId: string; plan: InterventionPlan } | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await fetchAllRiskPlans();
        if (!cancelled) setPlans(result);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load plans');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleViewPlan = async (summary: RiskPlanSummary) => {
    setLoadingPlanId(summary.riskId);
    try {
      const plan = await fetchRiskPlan(summary.riskId);
      if (plan) {
        setSelectedPlan({ riskId: summary.riskId, plan });
      } else {
        setError('Plan data not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plan details');
    } finally {
      setLoadingPlanId(null);
    }
  };

  // ── Detail view for a selected plan ──
  if (selectedPlan) {
    const { plan } = selectedPlan;
    const ganttTasks: any[] = [];
    const ganttLinks: any[] = [];
    let linkId = 1;

    plan.deliverables.forEach((del: PlanDeliverable) => {
      ganttTasks.push({
        id: del.id,
        text: del.name,
        start: new Date(del.start_date),
        end: new Date(del.end_date),
        type: 'summary',
        open: true,
      });
      del.tasks.forEach((task: PlanTask) => {
        ganttTasks.push({
          id: task.id,
          text: task.name,
          start: new Date(task.start_date),
          end: new Date(task.end_date),
          parent: del.id,
          type: 'task',
          owner: task.owner,
        });
        if (task.depends_on?.length) {
          task.depends_on.forEach((depId: string) => {
            ganttLinks.push({ id: linkId++, source: depId, target: task.id, type: 'e2s' });
          });
        }
      });
    });

    const ganttColumns = [
      { id: 'text', header: 'Task', flexgrow: 1 },
      { id: 'owner', header: 'Owner', width: 120, align: 'center' as const },
      { id: 'start', header: 'Start', align: 'center' as const },
      { id: 'duration', header: 'Duration', width: 80, align: 'center' as const },
    ];

    const scales = [
      { unit: 'month', step: 1, format: 'MMMM yyyy' },
      { unit: 'week', step: 1, format: 'wo' },
    ];

    return (
      <div className="intervention-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            className="btn-intervention-secondary"
            onClick={() => setSelectedPlan(null)}
            style={{ padding: '6px 14px' }}
          >
            ← {t('josoor.planning.backToPlanning') || 'Back'}
          </button>
          <h3 style={{ margin: 0, color: 'var(--component-text-primary)', fontSize: '16px' }}>
            {plan.name}
          </h3>
        </div>

        {plan.sponsor && (
          <div style={{ fontSize: '13px', color: 'var(--component-text-secondary)', marginBottom: '12px' }}>
            {t('josoor.planning.sponsor') || 'Sponsor'}: {plan.sponsor}
          </div>
        )}

        <div style={{ fontSize: '12px', color: 'var(--component-text-muted)', marginBottom: '16px' }}>
          {plan.deliverables.length} {t('josoor.planning.deliverables') || 'deliverables'} · {plan.deliverables.reduce((sum, d) => sum + d.tasks.length, 0)} {t('josoor.planning.tasks') || 'tasks'}
        </div>

        {ganttTasks.length > 0 && (
          <div className="gantt-container">
            <Gantt
              tasks={ganttTasks}
              links={ganttLinks}
              scales={scales}
              columns={ganttColumns}
              cellHeight={38}
              cellBorders="full"
            />
          </div>
        )}
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="intervention-container">
      <h3 style={{ color: 'var(--component-text-primary)', fontSize: '16px', marginBottom: '16px' }}>
        {t('josoor.planning.savedPlans') || 'Saved Plans'}
      </h3>

      {isLoading && (
        <div className="intervention-loading">
          <Loader2 className="loading-spinner" />
          <p className="loading-text">{t('josoor.planning.loadingPlans') || 'Loading plans...'}</p>
        </div>
      )}

      {error && (
        <div className="intervention-error">
          <XCircle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && plans.length === 0 && (
        <div className="intervention-placeholder">
          <AlertTriangle className="placeholder-icon" />
          <p className="placeholder-text">{t('josoor.planning.noPlansYet') || 'No saved plans yet.'}</p>
          <p style={{ color: 'var(--component-text-muted)', fontSize: '12px', marginTop: '8px' }}>
            {t('josoor.planning.noRiskSelected')}
          </p>
        </div>
      )}

      {!isLoading && plans.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--component-panel-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--component-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  {t('josoor.planning.risk') || 'Risk'}
                </th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--component-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  {t('josoor.planning.planName') || 'Plan'}
                </th>
                <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--component-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  {t('josoor.planning.deliverables') || 'Deliverables'}
                </th>
                <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--component-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  {t('josoor.planning.tasks') || 'Tasks'}
                </th>
                <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--component-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  {t('josoor.planning.status') || 'Status'}
                </th>
                <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--component-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr
                  key={p.planId}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleViewPlan(p)}
                >
                  <td style={{ padding: '10px' }}>
                    <div style={{ color: 'var(--component-text-primary)', fontWeight: 600, fontSize: '13px' }}>{p.riskName || p.riskId}</div>
                    <div style={{ color: 'var(--component-text-muted)', fontSize: '11px' }}>{p.riskId}</div>
                  </td>
                  <td style={{ padding: '10px', color: 'var(--component-text-secondary)' }}>
                    {p.planName}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: 'var(--component-text-secondary)' }}>
                    {p.deliverableCount}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: 'var(--component-text-secondary)' }}>
                    {p.taskCount}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: p.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                      color: p.status === 'Active' ? 'var(--component-color-success)' : 'var(--component-text-muted)',
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {loadingPlanId === p.riskId ? (
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <span style={{ color: 'var(--component-text-accent)', fontSize: '12px' }}>
                        {t('josoor.planning.view') || 'View'} →
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && plans.length > 0 && (
        <p style={{ color: 'var(--component-text-muted)', fontSize: '11px', marginTop: '16px', textAlign: 'center' }}>
          {t('josoor.planning.noRiskSelected')}
        </p>
      )}
    </div>
  );
}

// ─── Risk Context Header Sub-Component ──────────────────────────────

function RiskContextHeader({ context }: { context: InterventionContext }) {
  const { t } = useTranslation();

  const bandColor = context.band === 'Red' ? 'var(--component-color-danger)'
    : context.band === 'Amber' ? 'var(--component-color-warning)'
    : context.band === 'Yellow' ? 'var(--component-color-warning)'
    : 'var(--component-text-accent)';

  return (
    <div className="risk-context-header" style={{ borderColor: bandColor }}>
      <div className="risk-context-label" style={{ color: bandColor }}>
        {t('josoor.planning.riskContext')}
      </div>
      <div className="risk-context-grid">
        <div>
          <div className="field-label">{t('josoor.planning.risk')}</div>
          <div className="field-value">{context.riskName}</div>
        </div>
        <div>
          <div className="field-label">{t('josoor.planning.capability')}</div>
          <div className="field-value">{context.capabilityName}</div>
        </div>
        <div>
          <div className="field-label">{t('josoor.planning.riskBand') || 'Band'}</div>
          <div className="field-value" style={{ color: bandColor }}>{context.band}</div>
        </div>
        <div>
          <div className="field-label">{t('josoor.planning.exposure') || 'Exposure'}</div>
          <div className="field-value">{context.exposurePct}%</div>
        </div>
      </div>
      <div className="risk-context-strategy">
        <div className="field-label">{t('josoor.planning.selectedStrategy')}</div>
        <div className="strategy-value">{context.selectedOption.title}</div>
        <div className="strategy-desc">{context.selectedOption.description}</div>
      </div>
    </div>
  );
}

// B) Strategic Reset Planning (Annual)
function StrategicReset() {
  const { t } = useTranslation();
  return (
    <div className="reset-container">
      {/* 1. Year-End Reality Snapshot (top) */}
      <div className="section-gap">
        <h3 className="section-title">
          {t('josoor.planning.yearEndRealitySnapshot')}
        </h3>
        <div className="snapshot-grid">
          <div className="snapshot-card">
            <div className="field-label">{t('josoor.planning.capabilitiesStabilized')}</div>
            <div className="snapshot-value text-green">22 / 45</div>
            <div className="field-subtext">{t('josoor.planning.stabilityRate49')}</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label">{t('josoor.planning.chronicRisks')}</div>
            <div className="snapshot-value text-red">6</div>
            <div className="field-subtext">{t('josoor.planning.persistentAcrossQuarters')}</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label">{t('josoor.planning.persistentLeakageChains')}</div>
            <div className="snapshot-value text-amber">3</div>
            <div className="field-subtext">{t('josoor.planning.intentLoss25')}</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label">{t('josoor.planning.overbuiltCapabilities')}</div>
            <div className="snapshot-value text-blue">4</div>
            <div className="field-subtext">{t('josoor.planning.lowUtilization')}</div>
          </div>
        </div>
      </div>

      {/* 2. Pattern Explorer (center) */}
      <div className="section-gap">
        <h3 className="section-title">
          {t('josoor.planning.patternExplorer')}
        </h3>
        <div className="pattern-table-container">
          <table className="pattern-table">
            <thead>
              <tr>
                <th className="pattern-th">
                  {t('josoor.planning.capability')}
                </th>
                <th className="pattern-th pattern-th-center">
                  {t('josoor.planning.avgRiskExposure')}
                </th>
                <th className="pattern-th pattern-th-center">
                  {t('josoor.planning.avgLeakage')}
                </th>
                <th className="pattern-th pattern-th-center">
                  {t('josoor.planning.avgLoadUtil')}
                </th>
                <th className="pattern-th pattern-th-center">
                  {t('josoor.planning.policyPressure')}
                </th>
                <th className="pattern-th pattern-th-center">
                  {t('josoor.planning.perfPressure')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: t('josoor.planning.plantOperations'), risk: 72, leakage: 18, load: 95, policy: 8, perf: 12 },
                { name: t('josoor.planning.distributionMgmt'), risk: 45, leakage: 32, load: 68, policy: 5, perf: 7 },
                { name: t('josoor.planning.qualityControl'), risk: 68, leakage: 12, load: 88, policy: 6, perf: 9 },
                { name: t('josoor.planning.assetMaintenance'), risk: 28, leakage: 8, load: 42, policy: 3, perf: 4 },
                { name: t('josoor.planning.networkPlanning'), risk: 52, leakage: 24, load: 72, policy: 7, perf: 6 },
                { name: t('josoor.planning.customerService'), risk: 18, leakage: 6, load: 35, policy: 2, perf: 3 },
              ].map((row, idx) => (
                <tr key={idx} className="pattern-tr">
                  <td className="pattern-td">{row.name}</td>
                  <td className="pattern-td pattern-td-center">
                    <span
                      className={`badge-${row.risk > 65
                        ? 'red'
                        : row.risk > 35
                          ? 'amber'
                          : 'green'
                        }`}
                    >
                      {row.risk}%
                    </span>
                  </td>
                  <td className="pattern-td pattern-td-center">
                    <span
                      className={`badge-${row.leakage > 25
                        ? 'red'
                        : row.leakage > 10
                          ? 'amber'
                          : 'green'
                        }`}
                    >
                      {row.leakage}%
                    </span>
                  </td>
                  <td className="pattern-td pattern-td-center">
                    <span
                      className={`badge-${row.load > 80
                        ? 'red'
                        : row.load > 60
                          ? 'amber'
                          : 'green'
                        }`}
                    >
                      {row.load}%
                    </span>
                  </td>
                  <td className="pattern-td pattern-td-center table-cell-bold">
                    {row.policy}
                  </td>
                  <td className="pattern-td pattern-td-center table-cell-bold">
                    {row.perf}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Direction Reset Panel (right) */}
      <div className="reset-layout">
        <div className="planning-block">
          <div className="block-header-gray">
            {t('josoor.planning.objectiveConsolidationCandidates')}
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.considerMergeRedundant')}</div>
              <div className="recommendation-desc">{t('josoor.planning.threeObjectivesOverlap')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.considerDropLowImpact')}</div>
              <div className="recommendation-desc">{t('josoor.planning.twoObjectivesMinimalReturns')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.considerElevateCritical')}</div>
              <div className="recommendation-desc">{t('josoor.planning.infrastructureHigherPriority')}</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            {t('josoor.planning.policyMixRebalancing')}
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.recommendAddNewPolicy')}</div>
              <div className="recommendation-desc">{t('josoor.planning.pricingReformLeakage')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.recommendRetireIneffective')}</div>
              <div className="recommendation-desc">{t('josoor.planning.twoToolsNoImpact')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.recommendRebalancePortfolio')}</div>
              <div className="recommendation-desc">{t('josoor.planning.overRelianceRegulatory')}</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            {t('josoor.planning.directionResetProposals')}
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.guidanceTightenAmbitious')}</div>
              <div className="recommendation-desc">{t('josoor.planning.qualityMetricsAchievable')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.guidanceRelaxUnrealistic')}</div>
              <div className="recommendation-desc">{t('josoor.planning.distributionTargetsUnattainable')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.guidanceRealignTimelines')}</div>
              <div className="recommendation-desc">{t('josoor.planning.phaseInfrastructureGoals')}</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            {t('josoor.planning.capabilityIntentRecommendations')}
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.plantOperations')}</div>
              <div className="recommendation-desc">{t('josoor.planning.suggestBuildToOperate')}</div>
              <div className="recommendation-rationale">{t('josoor.planning.rationaleStabilization')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.distributionMgmt')}</div>
              <div className="recommendation-desc">{t('josoor.planning.suggestOperateToBuild')}</div>
              <div className="recommendation-rationale">{t('josoor.planning.rationaleChronicUnderperformance')}</div>
            </div>
            <div className="recommendation-item">
              <div className="recommendation-title">{t('josoor.planning.legacySystems')}</div>
              <div className="recommendation-desc">{t('josoor.planning.suggestHoldToDecommission')}</div>
              <div className="recommendation-rationale">{t('josoor.planning.rationaleLowUtilization')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// C) Scenario Simulation (What-If)
function ScenarioSimulation() {
  const { t } = useTranslation();
  return (
    <div className="intervention-container">
      <div className="scenario-layout">
        {/* 1. Scenario Controls (left) */}
        <div className="scenario-controls-stack">
          <h3 className="section-title">
            {t('josoor.planning.scenarioControls')}
          </h3>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.changeObjectivePriority')}
            </div>
            <select className="control-select">
              <option>{t('josoor.planning.waterSecurityHighMedium')}</option>
              <option>{t('josoor.planning.infrastructureMediumHigh')}</option>
              <option>{t('josoor.planning.sustainabilityLowMedium')}</option>
            </select>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.addRemovePolicyTool')}
            </div>
            <select className="control-select">
              <option>{t('josoor.planning.addWaterPricingReform')}</option>
              <option>{t('josoor.planning.removeLegacyConservation')}</option>
            </select>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.shiftCapabilityMaturity')}
            </div>
            <select className="control-select">
              <option>{t('josoor.planning.plantOps3To4')}</option>
              <option>{t('josoor.planning.distribution2To3')}</option>
              <option>{t('josoor.planning.qualityControl4To5')}</option>
            </select>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.injectConstraint')}
            </div>
            <select className="control-select">
              <option>{t('josoor.planning.budgetCut15')}</option>
              <option>{t('josoor.planning.scheduleDelay6Months')}</option>
              <option>{t('josoor.planning.newRegulationStricterQuality')}</option>
            </select>
          </div>
        </div>

        {/* 2. Impact Diff View (center) */}
        <div className="scenario-controls-stack">
          <h3 className="section-title">
            {t('josoor.planning.impactDiffView')}
          </h3>

          <div className="impact-table-container">
            <div className="impact-header">
              <div className="impact-col-header impact-col-header-current">
                {t('josoor.planning.currentState')}
              </div>
              <div className="impact-col-header impact-col-header-scenario">
                {t('josoor.planning.scenarioState')}
              </div>
            </div>

            {[
              { metric: t('josoor.planning.riskExposure'), current: 68, scenario: 54, delta: -14 },
              { metric: t('josoor.planning.loadSaturation'), current: 95, scenario: 78, delta: -17 },
              { metric: t('josoor.planning.leakagePercent'), current: 24, scenario: 32, delta: 8 },
              { metric: t('josoor.planning.capabilitiesEnteringRed'), current: 6, scenario: 4, delta: -2 },
            ].map((row, idx) => (
              <div
                key={idx}
                className="impact-row-grid"
              >
                <div className="impact-cell impact-cell-current">
                  <div className="field-label">{row.metric}</div>
                  <div className="field-value">{row.current}%</div>
                </div>
                <div className="impact-cell">
                  <div className="field-label">{row.metric}</div>
                  <div className="inline-flex-row">
                    <div className="scenario-value">{row.scenario}%</div>
                    <div
                      className={`delta-indicator ${row.delta < 0 ? 'text-green' : 'text-red'}`}
                    >
                      {row.delta < 0 ? (
                        <TrendingDown style={{ width: 12, height: 12 }} />
                      ) : (
                        <TrendingUp style={{ width: 12, height: 12 }} />
                      )}
                      {Math.abs(row.delta)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Verdict Panel (right) */}
        <div className="verdict-stack">
          <h3 className="section-title">
            {t('josoor.planning.verdictPanel')}
          </h3>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.newCriticalCapabilities')}
            </div>
            <div className="stack-sm">
              <div className="verdict-list-item">• {t('josoor.planning.networkPlanning')}</div>
              <div className="verdict-list-item">• {t('josoor.planning.dataAnalytics')}</div>
            </div>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.newBrokenChains')}
            </div>
            <div className="stack-sm">
              <div className="inline-flex-row">
                <div className="status-dot status-dot-danger" />
                <span className="verdict-list-item">{t('josoor.planning.obj3PT5Leakage')}</span>
              </div>
            </div>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.executionFeasibility')}
            </div>
            <div className="inline-flex-row">
              <div className="status-dot status-dot-success" />
              <span className="feasibility-yes">{t('josoor.planning.yes')}</span>
            </div>
          </div>

          <div className="verdict-rec">
            <div className="block-header-green">
              {t('josoor.planning.recommendation')}
            </div>
            <div className="rec-badge">
              {t('josoor.planning.viable')}
            </div>
            <div className="verdict-detail">
              {t('josoor.planning.scenarioReducesCriticalRisks')}
            </div>
          </div>

          <div className="planning-block">
            <div className="disclaimer-text">
              {t('josoor.planning.noApproveButton')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
