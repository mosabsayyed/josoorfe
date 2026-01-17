import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, ChevronRight } from 'lucide-react';

const mockPhases = [
  {
    id: 'p1',
    title: 'Foundation',
    status: 'completed' as const,
    items: [
      { id: 'p1-1', title: 'Core Architecture Setup', status: 'completed' as const },
      { id: 'p1-2', title: 'Knowledge Graph Integration', status: 'completed' as const },
      { id: 'p1-3', title: 'Basic Dashboards', status: 'completed' as const },
    ],
  },
  {
    id: 'p2',
    title: 'Enterprise Features',
    status: 'in-progress' as const,
    items: [
      { id: 'p2-1', title: 'Controls Desk', status: 'completed' as const },
      { id: 'p2-2', title: 'Planning Integration', status: 'in-progress' as const },
      { id: 'p2-3', title: 'Reporting Designer', status: 'pending' as const },
    ],
  },
  {
    id: 'p3',
    title: 'AI Enhancement',
    status: 'pending' as const,
    items: [
      { id: 'p3-1', title: 'Graph Chat Agent', status: 'pending' as const },
      { id: 'p3-2', title: 'Predictive Analytics', status: 'pending' as const },
      { id: 'p3-3', title: 'Automated Insights', status: 'pending' as const },
    ],
  },
];

export const Roadmap: React.FC = () => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('p2');

  const getStatusIcon = (status: 'completed' | 'in-progress' | 'pending') => {
    switch (status) {
      case 'completed': return <CheckCircle size={18} color="var(--component-color-success)" />;
      case 'in-progress': return <Clock size={18} color="var(--component-color-warning)" />;
      default: return <Circle size={18} color="var(--text-secondary)" />;
    }
  };

  const getStatusColor = (status: 'completed' | 'in-progress' | 'pending') => {
    switch (status) {
      case 'completed': return 'var(--component-color-success)';
      case 'in-progress': return 'var(--component-color-warning)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
          Product Roadmap
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          Architecture & Features Development Plan
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mockPhases.map((phase, index) => (
          <div
            key={phase.id}
            style={{
              backgroundColor: 'var(--component-panel-bg)',
              border: `1px solid ${expandedPhase === phase.id ? 'var(--color-gold)' : 'var(--component-panel-border)'}`,
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                cursor: 'pointer',
                borderLeft: `4px solid ${getStatusColor(phase.status)}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getStatusIcon(phase.status)}
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    Phase {index + 1}: {phase.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {phase.status.replace('-', ' ')}
                  </div>
                </div>
              </div>
              <ChevronRight
                size={20}
                color="var(--text-secondary)"
                style={{
                  transform: expandedPhase === phase.id ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>

            {expandedPhase === phase.id && (
              <div style={{
                borderTop: '1px solid var(--component-panel-border)',
                padding: '1rem',
                backgroundColor: 'var(--component-bg-secondary)',
              }}>
                {phase.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'var(--component-panel-bg)',
                      borderRadius: '6px',
                    }}
                  >
                    {getStatusIcon(item.status)}
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;
