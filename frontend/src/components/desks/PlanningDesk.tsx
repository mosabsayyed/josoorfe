import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Pause, ArrowUpDown, Users, Zap, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Gantt } from 'wx-react-gantt';
import { chatService } from '../../services/chatService';
import { parsePlanResponse, InterventionPlan, PlanDeliverable, PlanTask } from '../../utils/planParser';
import './PlanningDesk.css';

const createRiskPlan = async (riskId: string, plan: any) => {
  const res = await fetch('/api/neo4j/risk-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ riskId, plan }),
  });
  if (!res.ok) throw new Error(`Failed to create risk plan: ${res.statusText}`);
  return res.json();
};

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
        <p className="planning-subtitle">{t('josoor.planning.planningSubtitle')}</p>
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
        const userPrompt = `Generate an intervention plan for risk "${context.riskName}" on capability "${context.capabilityName}".
Risk band: ${context.band}, Exposure: ${context.exposurePct}%.
Selected intervention strategy: "${context.selectedOption.title}" — ${context.selectedOption.description}.
Produce a structured plan with deliverables and tasks.`;

        const response = await chatService.sendMessage({
          query: userPrompt,
          prompt_key: 'intervention_planning',
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
          text: `${task.name} (${task.owner})`,
          start: new Date(task.start_date),
          end: new Date(task.end_date),
          parent: del.id,
          type: 'task',
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

  // ── No context: show placeholder ──
  if (!context) {
    return (
      <div className="intervention-container">
        <div className="intervention-placeholder">
          <AlertTriangle className="placeholder-icon" />
          <p className="placeholder-text">{t('josoor.planning.noRiskSelected')}</p>
        </div>
      </div>
    );
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
          <div className="block-header-red">{t('josoor.planning.planNarrative')}</div>
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
            <div className="block-header-red">{t('josoor.planning.editGantt')}</div>
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
            <Gantt tasks={ganttData.tasks} links={ganttData.links} scales={ganttData.scales} />
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

// ─── Risk Context Header Sub-Component ──────────────────────────────

function RiskContextHeader({ context }: { context: InterventionContext }) {
  const { t } = useTranslation();

  const bandColor = context.band === 'Red' ? '#ef4444'
    : context.band === 'Amber' ? '#f59e0b'
    : context.band === 'Yellow' ? '#eab308'
    : '#10b981';

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
      <div className="mb-6">
        <h3 className="section-title">
          {t('josoor.planning.yearEndRealitySnapshot')}
        </h3>
        <div className="snapshot-grid">
          <div className="snapshot-card">
            <div className="field-label mb-2">{t('josoor.planning.capabilitiesStabilized')}</div>
            <div className="snapshot-value text-green">22 / 45</div>
            <div className="field-subtext mt-1">{t('josoor.planning.stabilityRate49')}</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label mb-2">{t('josoor.planning.chronicRisks')}</div>
            <div className="snapshot-value text-red">6</div>
            <div className="field-subtext mt-1">{t('josoor.planning.persistentAcrossQuarters')}</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label mb-2">{t('josoor.planning.persistentLeakageChains')}</div>
            <div className="snapshot-value text-amber">3</div>
            <div className="field-subtext mt-1">{t('josoor.planning.intentLoss25')}</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label mb-2">{t('josoor.planning.overbuiltCapabilities')}</div>
            <div className="snapshot-value text-blue">4</div>
            <div className="field-subtext mt-1">{t('josoor.planning.lowUtilization')}</div>
          </div>
        </div>
      </div>

      {/* 2. Pattern Explorer (center) */}
      <div className="mb-6">
        <h3 className="section-title">
          {t('josoor.planning.patternExplorer')}
        </h3>
        <div className="pattern-table-container">
          <table className="pattern-table">
            <thead className="bg-slate-800">
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
                  <td className="pattern-td pattern-td-center font-bold text-slate-300">
                    {row.policy}
                  </td>
                  <td className="pattern-td pattern-td-center font-bold text-slate-300">
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
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.considerMergeRedundant')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.threeObjectivesOverlap')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.considerDropLowImpact')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.twoObjectivesMinimalReturns')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.considerElevateCritical')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.infrastructureHigherPriority')}</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            {t('josoor.planning.policyMixRebalancing')}
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.recommendAddNewPolicy')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.pricingReformLeakage')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.recommendRetireIneffective')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.twoToolsNoImpact')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.recommendRebalancePortfolio')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.overRelianceRegulatory')}</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            {t('josoor.planning.directionResetProposals')}
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.guidanceTightenAmbitious')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.qualityMetricsAchievable')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.guidanceRelaxUnrealistic')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.distributionTargetsUnattainable')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.guidanceRealignTimelines')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.phaseInfrastructureGoals')}</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            {t('josoor.planning.capabilityIntentRecommendations')}
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.plantOperations')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.suggestBuildToOperate')}</div>
              <div className="text-slate-500 text-8px mt-1">{t('josoor.planning.rationaleStabilization')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.distributionMgmt')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.suggestOperateToBuild')}</div>
              <div className="text-slate-500 text-8px mt-1">{t('josoor.planning.rationaleChronicUnderperformance')}</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">{t('josoor.planning.legacySystems')}</div>
              <div className="text-slate-500 text-8px">{t('josoor.planning.suggestHoldToDecommission')}</div>
              <div className="text-slate-500 text-8px mt-1">{t('josoor.planning.rationaleLowUtilization')}</div>
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
            <select className="control-select mb-2">
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
                  <div className="field-label mb-1">{row.metric}</div>
                  <div className="field-value text-14px">{row.current}%</div>
                </div>
                <div className="impact-cell">
                  <div className="field-label mb-1">{row.metric}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-green text-14px impact-val-bold">{row.scenario}%</div>
                    <div
                      className={`flex items-center gap-1 text-9px font-bold ${row.delta < 0 ? 'text-green' : 'text-red'
                        }`}
                    >
                      {row.delta < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <TrendingUp className="w-3 h-3" />
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
            <div className="space-y-1">
              <div className="text-slate-200 text-10px">• {t('josoor.planning.networkPlanning')}</div>
              <div className="text-slate-200 text-10px">• {t('josoor.planning.dataAnalytics')}</div>
            </div>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.newBrokenChains')}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-10px">
                <div className="w-2 h-2 rounded-full bg-red" />
                <span className="text-slate-200">{t('josoor.planning.obj3PT5Leakage')}</span>
              </div>
            </div>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.executionFeasibility')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green" />
              <span className="text-green text-11px font-bold">{t('josoor.planning.yes')}</span>
            </div>
          </div>

          <div className="verdict-rec">
            <div className="block-header-green">
              {t('josoor.planning.recommendation')}
            </div>
            <div className="rec-badge">
              {t('josoor.planning.viable')}
            </div>
            <div className="text-slate-300 text-9px mt-2 leading-relaxed">
              {t('josoor.planning.scenarioReducesCriticalRisks')}
            </div>
          </div>

          <div className="planning-block">
            <div className="text-slate-500 text-8px normal text-center">
              {t('josoor.planning.noApproveButton')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
