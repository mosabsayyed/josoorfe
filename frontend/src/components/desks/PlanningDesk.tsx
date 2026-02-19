import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Pause, ArrowUpDown, Users, Zap } from 'lucide-react';
import './PlanningDesk.css';

type PlanningMode = 'intervention' | 'strategic-reset' | 'scenario';

export function PlanningDesk() {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<PlanningMode>('intervention');

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
        {selectedMode === 'intervention' && <InterventionPlanning />}
        {selectedMode === 'strategic-reset' && <StrategicReset />}
        {selectedMode === 'scenario' && <ScenarioSimulation />}
      </div>
    </div>
  );
}

// A) Intervention Planning (In-Year)
function InterventionPlanning() {
  const { t } = useTranslation();
  const [interventions, setInterventions] = useState<any[]>([]);

  const addIntervention = (type: string) => {
    setInterventions([
      ...interventions,
      {
        id: Date.now(),
        type,
        loadImpact: type === 'Add Project' ? 1 : -1,
        riskImpact: -12,
        delayImpact: -8,
        confidence: 'Medium',
      },
    ]);
  };

  return (
    <div className="intervention-container">
      {/* 1. Context Header (locked, non-editable) */}
      <div className="context-header">
        <div className="context-label">
          {t('josoor.planning.contextLocked')}
        </div>
        <div className="context-grid">
          <div>
            <div className="field-label">{t('josoor.planning.capability')}</div>
            <div className="field-value">{t('josoor.planning.plantOperations')}</div>
            <div className="field-subtext">{t('josoor.planning.l2L3Expandable')}</div>
          </div>
          <div>
            <div className="field-label">{t('josoor.planning.mode')}</div>
            <div className="flex items-center gap-2">
              <span className="status-badge-build">{t('josoor.planning.build')}</span>
            </div>
          </div>
          <div>
            <div className="field-label">{t('josoor.planning.trigger')}</div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-8px">
                <div className="w-1.5 h-1.5 rounded-full bg-red" />
                <span className="text-slate-200">{t('josoor.planning.riskExposure68')}</span>
              </div>
              <div className="flex items-center gap-1 text-8px">
                <div className="w-1.5 h-1.5 rounded-full bg-amber" />
                <span className="text-slate-200">{t('josoor.planning.saturation5Active')}</span>
              </div>
              <div className="text-slate-500 text-7px mt-1">
                {t('josoor.planning.sourceControlSignals')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="canvas-layout">
        {/* 2. Constraint Canvas (center/left) */}
        <div className="canvas-col">
          <h3 className="section-title">
            {t('josoor.planning.constraintCanvas')}
          </h3>

          {/* Capability State Block */}
          <div className="planning-block">
            <div className="block-header-green">
              {t('josoor.planning.capabilityState')}
            </div>
            <div className="cap-state-grid">
              <div>
                <div className="field-label">{t('josoor.planning.maturity')}</div>
                <div className="field-value text-14px">3 / 5</div>
              </div>
              <div>
                <div className="field-label">{t('josoor.planning.trend')}</div>
                <div className="value-trend-down">
                  <TrendingDown className="w-3 h-3" />
                  {t('josoor.planning.declining')}
                </div>
              </div>
              <div>
                <div className="field-label">{t('josoor.planning.allowedLoad')}</div>
                <div className="field-value text-14px">{t('josoor.planning.threeProjects')}</div>
              </div>
              <div>
                <div className="field-label">{t('josoor.planning.currentLoad')}</div>
                <div className="value-alert">
                  <span className="value-large-red">5</span>
                  <AlertTriangle className="w-3 h-3 text-red" />
                </div>
              </div>
            </div>
          </div>

          {/* Footprint Stress Block */}
          <div className="planning-block">
            <div className="block-header-amber">
              {t('josoor.planning.footprintStress')}
            </div>
            <div className="space-y-1.5">
              <div className="stress-row">
                <span className="stress-label">{t('josoor.planning.orgGap')}</span>
                <span className="badge-amber">
                  {t('josoor.planning.medium')}
                </span>
              </div>
              <div className="stress-row">
                <span className="stress-label">{t('josoor.planning.processGap')}</span>
                <span className="badge-red">{t('josoor.planning.high')}</span>
              </div>
              <div className="stress-row">
                <span className="stress-label">{t('josoor.planning.itGap')}</span>
                <span className="badge-green">{t('josoor.planning.low')}</span>
              </div>
            </div>
          </div>

          {/* Risk Constraints Block */}
          <div className="planning-block">
            <div className="block-header-red">
              {t('josoor.planning.riskConstraints')}
            </div>
            <div className="space-y-1.5">
              <div className="risk-row">
                <div className="field-label mb-0.5">{t('josoor.planning.risk')}</div>
                <div className="risk-value-flex">
                  <div className="dot-red" />
                  <span className="text-slate-200 text-10px font-bold">{t('josoor.planning.delayDesalination')}</span>
                </div>
              </div>
              <div className="risk-row">
                <div className="field-label mb-0.5">{t('josoor.planning.affects')}</div>
                <div className="text-slate-200 text-9px">{t('josoor.planning.policyToolPT01')}</div>
              </div>
              <div className="risk-row">
                <div className="field-label mb-0.5">{t('josoor.planning.toleranceRemaining')}</div>
                <div className="value-large-red">{t('josoor.planning.eighteenDays')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Intervention Builder (right panel) */}
        <div className="canvas-col">
          <div className="builder-header">
            <h3 className="section-title">
              {t('josoor.planning.interventionBuilder')}
            </h3>
            <div className="builder-count">{interventions.length} {t('josoor.planning.interventions')}</div>
          </div>

          {/* Add Intervention Buttons */}
          <div className="planning-block">
            <div className="block-header-gray">
              {t('josoor.planning.addIntervention')}
            </div>
            <div className="add-btn-grid">
              <button
                onClick={() => addIntervention('Add Project')}
                className="btn-add-intervention"
              >
                <Plus className="w-3 h-3" />
                {t('josoor.planning.addProject')}
              </button>
              <button
                onClick={() => addIntervention('Pause Project')}
                className="btn-add-intervention"
              >
                <Pause className="w-3 h-3" />
                {t('josoor.planning.pauseProject')}
              </button>
              <button
                onClick={() => addIntervention('Resequence')}
                className="btn-add-intervention"
              >
                <ArrowUpDown className="w-3 h-3" />
                {t('josoor.planning.resequence')}
              </button>
              <button
                onClick={() => addIntervention('Adjust Adoption')}
                className="btn-add-intervention"
              >
                <Users className="w-3 h-3" />
                {t('josoor.planning.adjustAdoption')}
              </button>
              <button
                onClick={() => addIntervention('Escalate Policy')}
                className="btn-add-intervention btn-span-2"
              >
                <Zap className="w-3 h-3" />
                {t('josoor.planning.escalatePolicyTarget')}
              </button>
            </div>
          </div>

          {/* Intervention Cards */}
          <div className="cards-list">
            {interventions.map((intervention, idx) => (
              <div
                key={intervention.id}
                className="intervention-card"
              >
                <div className="card-header">
                  <div className="card-title">
                    {t('josoor.planning.intervention')} {idx + 1}
                  </div>
                  <button
                    onClick={() =>
                      setInterventions(interventions.filter((i) => i.id !== intervention.id))
                    }
                    className="card-remove"
                  >
                    {t('josoor.planning.remove')}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="field-label mb-0.5">{t('josoor.planning.type')}</div>
                    <div className="text-slate-200 text-10px font-bold">{intervention.type}</div>
                  </div>
                  <div className="impact-preview">
                    <div className="block-header-gray block-header-tight">
                      {t('josoor.planning.impactPreview')}
                    </div>
                    <div className="impact-grid">
                      <div className="impact-row">
                        <span className="text-gray">{t('josoor.planning.load')}:</span>
                        <span
                          className={`impact-val-bold ${intervention.loadImpact > 0 ? 'text-red' : 'text-green'
                            }`}
                        >
                          {intervention.loadImpact > 0 ? '+' : ''}
                          {intervention.loadImpact}
                        </span>
                      </div>
                      <div className="impact-row">
                        <span className="text-gray">{t('josoor.planning.risk')}:</span>
                        <span className="text-green impact-val-bold">{intervention.riskImpact}%</span>
                      </div>
                      <div className="impact-row">
                        <span className="text-gray">{t('josoor.planning.delay')}:</span>
                        <span className="text-green impact-val-bold">
                          {intervention.delayImpact}d
                        </span>
                      </div>
                      <div className="impact-row">
                        <span className="text-gray">{t('josoor.planning.confidence')}:</span>
                        <span className="text-amber impact-val-bold">{intervention.confidence}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resulting State Preview */}
          {interventions.length > 0 && (
            <div className="resulting-state">
              <div className="block-header-green">
                {t('josoor.planning.resultingStatePreview')}
              </div>
              <div>
                <div className="resulting-row">
                  <span className="text-gray">{t('josoor.planning.newExposureBand')}:</span>
                  <span className="text-green impact-val-bold">{t('josoor.planning.exposureBandValue')}</span>
                </div>
                <div className="resulting-row">
                  <span className="text-gray">{t('josoor.planning.newLoad')}:</span>
                  <span className="text-green impact-val-bold">
                    {5 + interventions.reduce((sum, i) => sum + i.loadImpact, 0)} {t('josoor.planning.projects')}
                  </span>
                </div>
                <div className="resulting-row">
                  <span className="text-gray">{t('josoor.planning.residualRisk')}:</span>
                  <span className="text-amber impact-val-bold">{t('josoor.planning.medium')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
