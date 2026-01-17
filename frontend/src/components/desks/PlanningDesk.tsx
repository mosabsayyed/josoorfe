import { useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Pause, ArrowUpDown, Users, Zap } from 'lucide-react';
import './PlanningDesk.css';

type PlanningMode = 'intervention' | 'strategic-reset' | 'scenario';

export function PlanningDesk() {
  const [selectedMode, setSelectedMode] = useState<PlanningMode>('intervention');

  const modeButtons: { id: PlanningMode; label: string; description: string }[] = [
    { id: 'intervention', label: 'Intervention Planning', description: 'In-year tactical adjustments' },
    { id: 'strategic-reset', label: 'Strategic Reset', description: 'Annual direction setting' },
    { id: 'scenario', label: 'Scenario Simulation', description: 'What-if analysis' },
  ];

  return (
    <div className="planning-container">
      {/* Header */}
      <div className="planning-header">
        <h1 className="planning-title">Planning Desk</h1>
        <p className="planning-subtitle">Strategic planning, intervention design, and scenario analysis</p>
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
          Context (Locked)
        </div>
        <div className="context-grid">
          <div>
            <div className="field-label">Capability</div>
            <div className="field-value">Plant Operations</div>
            <div className="field-subtext">L2 → L3 expandable</div>
          </div>
          <div>
            <div className="field-label">Mode</div>
            <div className="flex items-center gap-2">
              <span className="status-badge-build">BUILD</span>
            </div>
          </div>
          <div>
            <div className="field-label">Trigger</div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-8px">
                <div className="w-1.5 h-1.5 rounded-full bg-red" />
                <span className="text-slate-200">Risk exposure 68% (BUILD)</span>
              </div>
              <div className="flex items-center gap-1 text-8px">
                <div className="w-1.5 h-1.5 rounded-full bg-amber" />
                <span className="text-slate-200">Saturation: 5 active projects</span>
              </div>
              <div className="text-slate-500 text-7px mt-1">
                Source: Control Signals → Delivery Signals
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="canvas-layout">
        {/* 2. Constraint Canvas (center/left) */}
        <div className="canvas-col">
          <h3 className="section-title">
            Constraint Canvas
          </h3>

          {/* Capability State Block */}
          <div className="planning-block">
            <div className="block-header-green">
              Capability State
            </div>
            <div className="cap-state-grid">
              <div>
                <div className="field-label">Maturity</div>
                <div className="field-value text-14px">3 / 5</div>
              </div>
              <div>
                <div className="field-label">Trend</div>
                <div className="value-trend-down">
                  <TrendingDown className="w-3 h-3" />
                  Declining
                </div>
              </div>
              <div>
                <div className="field-label">Allowed Load</div>
                <div className="field-value text-14px">3 projects</div>
              </div>
              <div>
                <div className="field-label">Current Load</div>
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
              Footprint Stress
            </div>
            <div className="space-y-1.5">
              <div className="stress-row">
                <span className="stress-label">Org gap</span>
                <span className="badge-amber">
                  Medium
                </span>
              </div>
              <div className="stress-row">
                <span className="stress-label">Process gap</span>
                <span className="badge-red">High</span>
              </div>
              <div className="stress-row">
                <span className="stress-label">IT gap</span>
                <span className="badge-green">Low</span>
              </div>
            </div>
          </div>

          {/* Risk Constraints Block */}
          <div className="planning-block">
            <div className="block-header-red">
              Risk Constraints
            </div>
            <div className="space-y-1.5">
              <div className="risk-row">
                <div className="field-label mb-0.5">Risk</div>
                <div className="risk-value-flex">
                  <div className="dot-red" />
                  <span className="text-slate-200 text-10px font-bold">Delay – Desalination</span>
                </div>
              </div>
              <div className="risk-row">
                <div className="field-label mb-0.5">Affects</div>
                <div className="text-slate-200 text-9px">Policy Tool PT-01</div>
              </div>
              <div className="risk-row">
                <div className="field-label mb-0.5">Tolerance Remaining</div>
                <div className="value-large-red">18 days</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Intervention Builder (right panel) */}
        <div className="canvas-col">
          <div className="builder-header">
            <h3 className="section-title">
              Intervention Builder
            </h3>
            <div className="builder-count">{interventions.length} interventions</div>
          </div>

          {/* Add Intervention Buttons */}
          <div className="planning-block">
            <div className="block-header-gray">
              Add Intervention
            </div>
            <div className="add-btn-grid">
              <button
                onClick={() => addIntervention('Add Project')}
                className="btn-add-intervention"
              >
                <Plus className="w-3 h-3" />
                Add Project
              </button>
              <button
                onClick={() => addIntervention('Pause Project')}
                className="btn-add-intervention"
              >
                <Pause className="w-3 h-3" />
                Pause Project
              </button>
              <button
                onClick={() => addIntervention('Resequence')}
                className="btn-add-intervention"
              >
                <ArrowUpDown className="w-3 h-3" />
                Resequence
              </button>
              <button
                onClick={() => addIntervention('Adjust Adoption')}
                className="btn-add-intervention"
              >
                <Users className="w-3 h-3" />
                Adjust Adoption
              </button>
              <button
                onClick={() => addIntervention('Escalate Policy')}
                className="btn-add-intervention btn-span-2"
              >
                <Zap className="w-3 h-3" />
                Escalate Policy / Target
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
                    Intervention {idx + 1}
                  </div>
                  <button
                    onClick={() =>
                      setInterventions(interventions.filter((i) => i.id !== intervention.id))
                    }
                    className="card-remove"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="field-label mb-0.5">Type</div>
                    <div className="text-slate-200 text-10px font-bold">{intervention.type}</div>
                  </div>
                  <div className="impact-preview">
                    <div className="block-header-gray" style={{ marginBottom: '0.25rem' }}>
                      Impact Preview
                    </div>
                    <div className="impact-grid">
                      <div className="impact-row">
                        <span className="text-gray">Load:</span>
                        <span
                          className={`impact-val-bold ${intervention.loadImpact > 0 ? 'text-red' : 'text-green'
                            }`}
                        >
                          {intervention.loadImpact > 0 ? '+' : ''}
                          {intervention.loadImpact}
                        </span>
                      </div>
                      <div className="impact-row">
                        <span className="text-gray">Risk:</span>
                        <span className="text-green impact-val-bold">{intervention.riskImpact}%</span>
                      </div>
                      <div className="impact-row">
                        <span className="text-gray">Delay:</span>
                        <span className="text-green impact-val-bold">
                          {intervention.delayImpact}d
                        </span>
                      </div>
                      <div className="impact-row">
                        <span className="text-gray">Confidence:</span>
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
                Resulting State Preview
              </div>
              <div>
                <div className="resulting-row">
                  <span className="text-gray">New exposure band:</span>
                  <span className="text-green impact-val-bold">56% (Amber → Amber)</span>
                </div>
                <div className="resulting-row">
                  <span className="text-gray">New load:</span>
                  <span className="text-green impact-val-bold">
                    {5 + interventions.reduce((sum, i) => sum + i.loadImpact, 0)} projects
                  </span>
                </div>
                <div className="resulting-row">
                  <span className="text-gray">Residual risk:</span>
                  <span className="text-amber impact-val-bold">Medium</span>
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
  return (
    <div className="reset-container">
      {/* 1. Year-End Reality Snapshot (top) */}
      <div className="mb-6">
        <h3 className="section-title">
          Year-End Reality Snapshot
        </h3>
        <div className="snapshot-grid">
          <div className="snapshot-card">
            <div className="field-label mb-2">Capabilities Stabilized</div>
            <div className="snapshot-value text-green">22 / 45</div>
            <div className="field-subtext mt-1">49% stability rate</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label mb-2">Chronic Risks</div>
            <div className="snapshot-value text-red">6</div>
            <div className="field-subtext mt-1">Persistent across quarters</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label mb-2">Persistent Leakage Chains</div>
            <div className="snapshot-value text-amber">3</div>
            <div className="field-subtext mt-1">Intent loss {'>'}25%</div>
          </div>
          <div className="snapshot-card">
            <div className="field-label mb-2">Overbuilt Capabilities</div>
            <div className="snapshot-value text-blue">4</div>
            <div className="field-subtext mt-1">Low utilization</div>
          </div>
        </div>
      </div>

      {/* 2. Pattern Explorer (center) */}
      <div className="mb-6">
        <h3 className="section-title">
          Pattern Explorer
        </h3>
        <div className="pattern-table-container">
          <table className="pattern-table">
            <thead className="bg-slate-800">
              <tr>
                <th className="pattern-th">
                  Capability
                </th>
                <th className="pattern-th pattern-th-center">
                  Avg Risk Exposure
                </th>
                <th className="pattern-th pattern-th-center">
                  Avg Leakage %
                </th>
                <th className="pattern-th pattern-th-center">
                  Avg Load Util
                </th>
                <th className="pattern-th pattern-th-center">
                  Policy Pressure
                </th>
                <th className="pattern-th pattern-th-center">
                  Perf Pressure
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Plant Operations', risk: 72, leakage: 18, load: 95, policy: 8, perf: 12 },
                { name: 'Distribution Mgmt', risk: 45, leakage: 32, load: 68, policy: 5, perf: 7 },
                { name: 'Quality Control', risk: 68, leakage: 12, load: 88, policy: 6, perf: 9 },
                { name: 'Asset Maintenance', risk: 28, leakage: 8, load: 42, policy: 3, perf: 4 },
                { name: 'Network Planning', risk: 52, leakage: 24, load: 72, policy: 7, perf: 6 },
                { name: 'Customer Service', risk: 18, leakage: 6, load: 35, policy: 2, perf: 3 },
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
            Objective Consolidation Candidates
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Consider: Merge redundant objectives</div>
              <div className="text-slate-500 text-8px">3 objectives overlap in scope</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Consider: Drop low-impact objectives</div>
              <div className="text-slate-500 text-8px">2 objectives showing minimal returns</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Consider: Elevate critical objectives</div>
              <div className="text-slate-500 text-8px">Infrastructure requires higher priority</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            Policy Mix Rebalancing Suggestions
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Recommend: Add new policy tools</div>
              <div className="text-slate-500 text-8px">Pricing reform could address leakage</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Recommend: Retire ineffective tools</div>
              <div className="text-slate-500 text-8px">2 tools showing no impact</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Recommend: Rebalance tool portfolio</div>
              <div className="text-slate-500 text-8px">Over-reliance on regulatory tools</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            Direction Reset Proposals
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Guidance: Tighten ambitious targets</div>
              <div className="text-slate-500 text-8px">Quality metrics achievable earlier</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Guidance: Relax unrealistic targets</div>
              <div className="text-slate-500 text-8px">Distribution targets unattainable</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Guidance: Realign target timelines</div>
              <div className="text-slate-500 text-8px">Phase infrastructure goals</div>
            </div>
          </div>
        </div>

        <div className="planning-block">
          <div className="block-header-gray">
            Capability Intent Recommendations
          </div>
          <div className="recommendation-list">
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Plant Operations</div>
              <div className="text-slate-500 text-8px">Suggest: BUILD → OPERATE</div>
              <div className="text-slate-500 text-8px mt-1">Rationale: Stabilization achieved</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Distribution Mgmt</div>
              <div className="text-slate-500 text-8px">Suggest: OPERATE → BUILD</div>
              <div className="text-slate-500 text-8px mt-1">Rationale: Chronic underperformance</div>
            </div>
            <div className="recommendation-item">
              <div className="text-slate-200 font-bold mb-1">Legacy Systems</div>
              <div className="text-slate-500 text-8px">Suggest: HOLD → DECOMMISSION</div>
              <div className="text-slate-500 text-8px mt-1">Rationale: Low utilization</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// C) Scenario Simulation (What-If)
function ScenarioSimulation() {
  return (
    <div className="intervention-container">
      <div className="scenario-layout">
        {/* 1. Scenario Controls (left) */}
        <div className="scenario-controls-stack">
          <h3 className="section-title">
            Scenario Controls
          </h3>

          <div className="planning-block">
            <div className="block-header-gray">
              Change Objective Priority
            </div>
            <select className="control-select">
              <option>Water Security (High → Medium)</option>
              <option>Infrastructure (Medium → High)</option>
              <option>Sustainability (Low → Medium)</option>
            </select>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              Add / Remove Policy Tool
            </div>
            <select className="control-select mb-2">
              <option>Add: Water Pricing Reform</option>
              <option>Remove: Legacy Conservation</option>
            </select>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              Shift Capability Maturity
            </div>
            <select className="control-select">
              <option>Plant Ops: 3 → 4</option>
              <option>Distribution: 2 → 3</option>
              <option>Quality Control: 4 → 5</option>
            </select>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              Inject Constraint
            </div>
            <select className="control-select">
              <option>Budget cut: -15%</option>
              <option>Schedule delay: +6 months</option>
              <option>New regulation: Stricter quality</option>
            </select>
          </div>
        </div>

        {/* 2. Impact Diff View (center) */}
        <div className="scenario-controls-stack">
          <h3 className="section-title">
            Impact Diff View
          </h3>

          <div className="impact-table-container">
            <div className="impact-header">
              <div className="impact-col-header impact-col-header-current">
                Current State
              </div>
              <div className="impact-col-header impact-col-header-scenario">
                Scenario State
              </div>
            </div>

            {[
              { metric: 'Risk Exposure', current: 68, scenario: 54, delta: -14 },
              { metric: 'Load Saturation', current: 95, scenario: 78, delta: -17 },
              { metric: 'Leakage %', current: 24, scenario: 32, delta: 8 },
              { metric: 'Capabilities Entering Red', current: 6, scenario: 4, delta: -2 },
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
            Verdict Panel
          </h3>

          <div className="planning-block">
            <div className="block-header-gray">
              New Critical Capabilities
            </div>
            <div className="space-y-1">
              <div className="text-slate-200 text-10px">• Network Planning</div>
              <div className="text-slate-200 text-10px">• Data Analytics</div>
            </div>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              New Broken Chains
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-10px">
                <div className="w-2 h-2 rounded-full bg-red" />
                <span className="text-slate-200">Obj3 → PT5 (32% leakage)</span>
              </div>
            </div>
          </div>

          <div className="planning-block">
            <div className="block-header-gray">
              Execution Feasibility
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green" />
              <span className="text-green text-11px font-bold">YES</span>
            </div>
          </div>

          <div className="verdict-rec">
            <div className="block-header-green">
              Recommendation
            </div>
            <div className="rec-badge">
              VIABLE
            </div>
            <div className="text-slate-300 text-9px mt-2 leading-relaxed">
              Scenario reduces critical risks while maintaining delivery capacity. Minor leakage
              increase is acceptable.
            </div>
          </div>

          <div className="planning-block">
            <div className="text-slate-500 text-8px normal text-center">
              No "approve" button. Scenarios inform, they don't decide.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
