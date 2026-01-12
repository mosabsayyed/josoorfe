import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Navigation, AlertTriangle, Activity, Link } from 'lucide-react';

interface OutletContext {
  year: string;
  quarter: string;
}

const ribbonData = {
  steering: {
    title: 'Steering',
    subtitle: 'Direction Signals',
    icon: Navigation,
    nodes: [
      { id: 's1', label: 'Strategy Alignment', status: 'green' as const },
      { id: 's2', label: 'Goal Cascading', status: 'amber' as const },
      { id: 's3', label: 'Initiative Tracking', status: 'green' as const },
    ],
  },
  riskBuild: {
    title: 'Risk BUILD',
    subtitle: 'Obstacle Signals',
    icon: AlertTriangle,
    nodes: [
      { id: 'rb1', label: 'Capability Gaps', status: 'red' as const },
      { id: 'rb2', label: 'Resource Constraints', status: 'amber' as const },
      { id: 'rb3', label: 'Dependency Delays', status: 'green' as const },
    ],
  },
  riskOperate: {
    title: 'Risk OPERATE',
    subtitle: 'Flow Signals',
    icon: Activity,
    nodes: [
      { id: 'ro1', label: 'Process Efficiency', status: 'green' as const },
      { id: 'ro2', label: 'Service Quality', status: 'amber' as const },
      { id: 'ro3', label: 'Incident Rate', status: 'green' as const },
    ],
  },
  delivery: {
    title: 'Delivery',
    subtitle: 'Integration Signals',
    icon: Link,
    nodes: [
      { id: 'd1', label: 'System Integration', status: 'amber' as const },
      { id: 'd2', label: 'Data Flow', status: 'green' as const },
      { id: 'd3', label: 'Partner Alignment', status: 'red' as const },
    ],
  },
};

export const ControlsDesk: React.FC = () => {
  const { year, quarter } = useOutletContext<OutletContext>();
  const [selectedRibbon, setSelectedRibbon] = useState<string | null>(null);

  const getStatusColor = (status: 'green' | 'amber' | 'red') => {
    if (status === 'green') return 'var(--component-color-success)';
    if (status === 'amber') return 'var(--component-color-warning)';
    return 'var(--component-color-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
          Signal Ribbons
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          {year} {quarter !== 'All' ? `- ${quarter}` : ''} - Deviation Detection
        </p>
      </div>

      <div id="controls-desk-ribbons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(ribbonData).map(([key, ribbon]) => {
          const Icon = ribbon.icon;
          const isSelected = selectedRibbon === key;

          return (
            <div
              key={key}
              onClick={() => setSelectedRibbon(isSelected ? null : key)}
              style={{
                backgroundColor: 'var(--component-panel-bg)',
                border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--component-panel-border)',
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                      {ribbon.title}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {ribbon.subtitle}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {ribbon.nodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: 'var(--component-bg-secondary)',
                      borderRadius: '16px',
                      borderLeft: `3px solid ${getStatusColor(node.status)}`,
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(node.status),
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {node.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ControlsDesk;
