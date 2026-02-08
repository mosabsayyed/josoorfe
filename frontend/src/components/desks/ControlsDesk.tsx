import { useState, useEffect } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import './ControlsDesk.css';

type SankeyChart = 'steering' | 'risk' | 'delivery' | 'integrity';
type RiskMode = 'build' | 'operate';

// Helper function to get node color based on exposure
const getNodeColor = (exposure: number, missing?: boolean): string => {
  if (missing) return '#64748b'; // gray
  if (exposure < 35) return '#10b981'; // green
  if (exposure <= 65) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

// Mock data for Sankey 1 - Steering Signals
const steeringData = {
  nodes: [
    // Column 1: SectorObjective (L2) - 5 nodes
    { name: 'Obj1: Water Security', exposure: 25 },
    { name: 'Obj2: Infrastructure Resilience', exposure: 45 },
    { name: 'Obj3: Service Quality', exposure: 30 },
    { name: 'Obj4: Sustainability', exposure: 70 },
    { name: 'Obj5: Economic Impact', exposure: 20 },

    // Column 2: PolicyTools + Performance (8 each, top 8 shown)
    { name: 'PT1: Desalination Policy', exposure: 40 },
    { name: 'PT2: Water Conservation', exposure: 25 },
    { name: 'PT3: Pricing Framework', exposure: 55 },
    { name: 'PT4: Quality Standards', exposure: 75, overload: true },
    { name: 'PT5: Asset Management', exposure: 30 },
    { name: 'KPI1: Coverage Rate', exposure: 35 },
    { name: 'KPI2: Uptime Target', exposure: 20 },
    { name: 'KPI3: Quality Index', exposure: 70 },

    // Column 3: EntityCapability (L2) - 12 capabilities (top 8)
    { name: 'Cap1: Plant Operations', exposure: 65 },
    { name: 'Cap2: Distribution Mgmt', exposure: 45 },
    { name: 'Cap3: Quality Control', exposure: 75, overload: true },
    { name: 'Cap4: Asset Maintenance', exposure: 30 },
    { name: 'Cap5: Network Planning', exposure: 40 },
    { name: 'Cap6: Customer Service', exposure: 25 },
    { name: 'Cap7: Data Analytics', exposure: 55 },
    { name: 'Other Capabilities', exposure: 35 },
  ],
  links: [
    // Objectives to PolicyTools
    { source: 0, target: 5, value: 20 },
    { source: 0, target: 6, value: 15 },
    { source: 1, target: 7, value: 25 },
    { source: 1, target: 8, value: 20 },
    { source: 2, target: 9, value: 18 },
    { source: 3, target: 10, value: 22 },
    { source: 4, target: 11, value: 30 },

    // PolicyTools/KPIs to Capabilities
    { source: 5, target: 13, value: 25 },
    { source: 6, target: 14, value: 20 },
    { source: 7, target: 15, value: 30 },
    { source: 8, target: 16, value: 22 },
    { source: 9, target: 17, value: 18 },
    { source: 10, target: 18, value: 25 },
    { source: 11, target: 19, value: 28 },
    { source: 12, target: 20, value: 20 },
  ],
};

// Mock data for Sankey 2 - Risk Signals (BUILD mode)
const riskDataBuild = {
  nodes: [
    // Column 1: EntityCapability (L2)
    { name: 'Cap1: Plant Operations', exposure: 65 },
    { name: 'Cap2: Distribution Mgmt', exposure: 45 },
    { name: 'Cap3: Quality Control', exposure: 75 },
    { name: 'Cap4: Asset Maintenance', exposure: 30 },
    { name: 'Cap5: Network Planning', exposure: 40 },
    { name: 'Cap6: Customer Service', exposure: 25 },

    // Column 2: EntityRisk (L2)
    { name: 'Risk1: Delay - Design', exposure: 70 },
    { name: 'Risk2: Delay - Procurement', exposure: 55 },
    { name: 'Risk3: Budget Overrun', exposure: 45 },
    { name: 'Risk4: Skill Shortage', exposure: 80 },
    { name: 'Risk5: Tech Complexity', exposure: 35 },
    { name: 'Risk6: Regulatory', exposure: 25 },

    // Column 3: SectorPolicyTool (L2)
    { name: 'PT1: Desalination Policy', exposure: 70, broken: true },
    { name: 'PT2: Water Conservation', exposure: 25 },
    { name: 'PT3: Pricing Framework', exposure: 80, concentration: true },
    { name: 'PT4: Quality Standards', exposure: 45 },
    { name: 'PT5: Asset Management', exposure: 35 },
  ],
  links: [
    // Capabilities to Risks
    { source: 0, target: 6, value: 65 },
    { source: 1, target: 7, value: 45 },
    { source: 2, target: 8, value: 75 },
    { source: 3, target: 9, value: 30 },
    { source: 4, target: 10, value: 40 },

    // Risks to PolicyTools (some inactive/broken)
    { source: 6, target: 12, value: 70, broken: true },
    { source: 7, target: 13, value: 55 },
    { source: 8, target: 14, value: 45 },
    { source: 9, target: 14, value: 80 }, // concentration
    { source: 10, target: 15, value: 35 },
  ],
};

// Mock data for Sankey 3 - Delivery Signals
const deliveryData = {
  nodes: [
    // Column 1: EntityCapability (L2)
    { name: 'Cap1: Plant Operations', exposure: 65, saturation: true },
    { name: 'Cap2: Distribution Mgmt', exposure: 45 },
    { name: 'Cap3: Quality Control', exposure: 75 },
    { name: 'Cap4: Asset Maintenance', exposure: 30 },

    // Column 2: Footprint (Org/Process/IT lanes)
    { name: 'Org: Plant Team', exposure: 40 },
    { name: 'Org: Dist Team', exposure: 35 },
    { name: 'Proc: Ops SOP', exposure: 50 },
    { name: 'Proc: Maint SOP', exposure: 30 },
    { name: 'IT: SCADA', exposure: 60 },
    { name: 'IT: ERP', exposure: 45 },

    // Column 3: EntityProject (L3)
    { name: 'Proj1: Plant Upgrade', lateness: 45 },
    { name: 'Proj2: Network Expansion', lateness: 20 },
    { name: 'Proj3: QC Automation', lateness: 70 },
    { name: 'Proj4: CMMS Deploy', lateness: 10 },

    // Column 4: EntityChangeAdoption (L3)
    { name: 'Adopt1: Ops Training', resistance: 35 },
    { name: 'Adopt2: Dist Rollout', resistance: 55 },
    { name: 'Adopt3: QC Change', resistance: 70, bottleneck: true },
  ],
  links: [
    // Capabilities to Footprint
    { source: 0, target: 4, value: 30 },
    { source: 0, target: 6, value: 25 },
    { source: 0, target: 8, value: 35 },
    { source: 1, target: 5, value: 28 },
    { source: 2, target: 7, value: 32 },
    { source: 3, target: 9, value: 22 },

    // Footprint to Projects
    { source: 4, target: 10, value: 30 },
    { source: 6, target: 11, value: 25 },
    { source: 8, target: 12, value: 35 },
    { source: 9, target: 13, value: 22 },

    // Projects to Adoption
    { source: 10, target: 14, value: 28 },
    { source: 11, target: 15, value: 23 },
    { source: 12, target: 16, value: 32 },
  ],
};

// Mock data for Sankey 4 - Integrity Signals (with leakage)
const integrityData = {
  nodes: [
    // Objectives
    { name: 'Obj1: Water Security', leakage: 8 },
    { name: 'Obj2: Infrastructure', leakage: 15 },
    { name: 'Obj3: Service Quality', leakage: 30, broken: true },

    // PolicyTools
    { name: 'PT1: Desal Policy', leakage: 5 },
    { name: 'PT2: Conservation', leakage: 12 },
    { name: 'PT3: Pricing', leakage: 28, broken: true },

    // Capabilities
    { name: 'Cap1: Plant Ops', leakage: 22 },
    { name: 'Cap2: Distribution', leakage: 35, sink: true },
    { name: 'Cap3: Quality Control', leakage: 8 },

    // Leak node (dummy)
    { name: 'Leakage', isLeak: true },
  ],
  links: [
    // Objectives to PolicyTools (with some leakage)
    { source: 0, target: 3, value: 23 },
    { source: 1, target: 4, value: 20 },
    { source: 2, target: 5, value: 15 }, // high leakage objective

    // PolicyTools to Capabilities
    { source: 3, target: 6, value: 22 },
    { source: 4, target: 7, value: 18 },
    { source: 5, target: 8, value: 10 }, // low outflow

    // Leakage flows to dummy
    { source: 0, target: 9, value: 2 },
    { source: 1, target: 9, value: 3 },
    { source: 2, target: 9, value: 9 },
    { source: 3, target: 9, value: 1 },
    { source: 4, target: 9, value: 2 },
    { source: 5, target: 9, value: 5 },
    { source: 6, target: 9, value: 5 },
    { source: 7, target: 9, value: 13 }, // sink capability
    { source: 8, target: 9, value: 2 },
  ],
};

export function ControlsDesk() {
  const [selectedChart, setSelectedChart] = useState<SankeyChart>('steering');
  const [riskMode, setRiskMode] = useState<RiskMode>('build');

  // API State - Using static mock data for now
  const [controlStats, setControlStats] = useState<any>(null);

  // TODO: Wire to real API later
  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const { getControlStats } = await import('@/services/controlsService');
  //       const data = await getControlStats();
  //       setControlStats(data);
  //     } catch (e) {
  //       console.error('Failed to fetch control stats', e);
  //     }
  //   };
  //   fetchStats();
  // }, []);

  const chartButtons: { id: SankeyChart; label: string }[] = [
    { id: 'steering', label: '1. Steering Signals' },
    { id: 'risk', label: '2. Risk Signals' },
    { id: 'delivery', label: '3. Delivery Signals' },
    { id: 'integrity', label: '4. Integrity Signals' },
  ];

  const renderSankeyChart = () => {
    let data;
    let title = '';
    let subtitle = '';

    switch (selectedChart) {
      case 'steering':
        data = steeringData;
        title = 'Steering Signals';
        subtitle = 'Where governance pressure concentrates from Policy/Performance into Capabilities';
        break;
      case 'risk':
        data = riskDataBuild;
        title = `Risk Signals (${riskMode.toUpperCase()} mode)`;
        subtitle = `Which PolicyTools or KPIs are threatened by ${riskMode.toUpperCase()} risk`;
        break;
      case 'delivery':
        data = deliveryData;
        title = 'Delivery Signals';
        subtitle = 'Build demand feasibility: where load accumulates across Org/Process/IT → Projects → Adoption';
        break;
      case 'integrity':
        data = integrityData;
        title = 'Integrity Signals';
        subtitle = 'Where intent or control "dies" by measuring leakage at each node';
        break;
    }

    // Transform data for recharts Sankey
    const sankeyData = {
      nodes: data.nodes.map((node: any) => ({
        name: node.name,
        ...node,
      })),
      links: data.links.map((link: any) => ({
        source: link.source,
        target: link.target,
        value: link.value,
        ...link,
      })),
    };

    return (
      <div className="sankey-container">
        <div className="sankey-header">
          <h3 className="sankey-title">{title}</h3>
          <p className="sankey-subtitle">{subtitle}</p>

          {selectedChart === 'risk' && (
            <div className="sankey-controls">
              <button
                onClick={() => setRiskMode('build')}
                className={`risk-mode-btn ${riskMode === 'build' ? 'active' : ''}`}
              >
                BUILD Mode
              </button>
              <button
                onClick={() => setRiskMode('operate')}
                className={`risk-mode-btn ${riskMode === 'operate' ? 'active' : ''}`}
              >
                OPERATE Mode
              </button>
            </div>
          )}
        </div>

        {/* Sankey Chart */}
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={sankeyData}
              node={(props: any) => {
                const { x, y, width, height, index, payload } = props;
                const nodeData = data.nodes[index];
                const exposure = nodeData.exposure || 0;
                const fillColor = getNodeColor(exposure, nodeData.missing);

                return (
                  <g>
                    {/* Node rectangle */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fillColor}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      rx={4}
                    />
                    {/* Node label */}
                    <text
                      x={x + width / 2}
                      y={y + height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="600"
                    >
                      {payload.name.length > 20 ? payload.name.substring(0, 18) + '...' : payload.name}
                    </text>
                  </g>
                );
              }}
              link={{
                stroke: '#64748b',
                strokeOpacity: 0.3,
                fill: 'none',
              }}
              nodePadding={30}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <Tooltip
                content={({ payload }: any) => {
                  if (!payload || !payload.length) return null;
                  const data = payload[0];
                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-title">
                        {data.name || 'Node'}
                      </div>
                      {data.payload && (
                        <>
                          {data.payload.exposure !== undefined && (
                            <div className="tooltip-row">
                              Exposure: <span className="tooltip-value-green">{data.payload.exposure}%</span>
                            </div>
                          )}
                          {data.payload.leakage !== undefined && (
                            <div className="tooltip-row">
                              Leakage: <span className="tooltip-value-amber">{data.payload.leakage}%</span>
                            </div>
                          )}
                          {data.payload.lateness !== undefined && (
                            <div className="tooltip-row">
                              Lateness: <span className="tooltip-value-red">{data.payload.lateness} days</span>
                            </div>
                          )}
                          {data.payload.resistance !== undefined && (
                            <div className="tooltip-row">
                              Resistance: <span className="tooltip-value-amber">{data.payload.resistance}%</span>
                            </div>
                          )}
                          {data.value !== undefined && (
                            <div className="tooltip-flow">
                              Flow: <span className="tooltip-flow-value">{data.value}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                }}
              />
            </Sankey>
          </ResponsiveContainer>
        </div>

        {/* Flags/Alerts */}
        {renderFlags()}
      </div>
    );
  };

  const renderFlags = () => {
    const flags: { icon: any; message: string; severity: 'warning' | 'error' }[] = [];

    switch (selectedChart) {
      case 'steering':
        flags.push(
          { icon: AlertTriangle, message: 'Cap3: Quality Control - OVERLOADED (P90+ inflow)', severity: 'error' },
          { icon: AlertCircle, message: 'Obj4: Sustainability - UNDER-INSTRUMENTED (<2 links)', severity: 'warning' }
        );
        break;
      case 'risk':
        flags.push(
          { icon: AlertTriangle, message: 'PT3: Pricing Framework - RISK CONCENTRATION (3+ risks >50%)', severity: 'error' },
          { icon: AlertCircle, message: 'PT1: Desalination Policy - BROKEN GOVERNANCE (exposure 70%, inactive link)', severity: 'error' }
        );
        break;
      case 'delivery':
        flags.push(
          { icon: AlertTriangle, message: 'Cap1: Plant Operations - SATURATION (5+ active projects)', severity: 'warning' },
          { icon: AlertCircle, message: 'Adopt3: QC Change - ADOPTION BOTTLENECK (3+ projects, <1 adoption)', severity: 'error' }
        );
        break;
      case 'integrity':
        flags.push(
          { icon: AlertTriangle, message: 'Obj3: Service Quality - BROKEN CHAIN (30% leakage)', severity: 'error' },
          { icon: AlertCircle, message: 'Cap2: Distribution - SINK CAPABILITY (35% leakage, high inflow, low outflow)', severity: 'error' }
        );
        break;
    }

    if (flags.length === 0) return null;

    return (
      <div className="flags-container">
        <h4 className="flags-title">Detected Issues</h4>
        {flags.map((flag, idx) => {
          const Icon = flag.icon;
          return (
            <div
              key={idx}
              className={`flag-item ${flag.severity}`}
            >
              <Icon
                className={`flag-icon ${flag.severity}`}
              />
              <p className="flag-message">{flag.message}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="controls-desk-container">
      {/* Header */}
      <div className="controls-header">
        <h1 className="controls-title">Control Signals</h1>
        <p className="controls-subtitle">System integration — is intent flowing end-to-end?</p>
      </div>

      {/* Chart Selection Buttons */}
      <div className="controls-toolbar">
        <div className="controls-toolbar-inner">
          {chartButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedChart(btn.id)}
              className={`controls-tab-btn ${selectedChart === btn.id ? 'active' : ''}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Display Area */}
      <div className="controls-content">
        {renderSankeyChart()}
      </div>

      {/* Legend */}
      <div className="controls-legend">
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color legend-color-green" />
            <span className="legend-text">Green: &lt;35% exposure</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-color-amber" />
            <span className="legend-text">Amber: 35-65%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-color-red" />
            <span className="legend-text">Red: &gt;65%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-color-gray" />
            <span className="legend-text">Gray: missing data</span>
          </div>
        </div>
      </div>
    </div>
  );
}