import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

interface OutletContext {
  year: string;
  quarter: string;
}

const mockCapabilities = [
  {
    id: 'cap_1',
    title: 'Strategy & Governance',
    children: [
      { id: 'c1_1', title: 'Startups Policy Framework', score: 3, maturity: 'High' },
      { id: 'c1_2', title: 'Digital Regulations', score: 2, maturity: 'Medium' },
      { id: 'c1_3', title: 'Investment Strategy', score: 3, maturity: 'High' },
    ],
  },
  {
    id: 'cap_2',
    title: 'Operational Excellence',
    children: [
      { id: 'c2_1', title: 'Process Automation', score: 2, maturity: 'Medium' },
      { id: 'c2_2', title: 'Service Integration', score: 1, maturity: 'Low' },
      { id: 'c2_3', title: 'Quality Assurance', score: 2, maturity: 'Medium' },
    ],
  },
  {
    id: 'cap_3',
    title: 'Technology & Data',
    children: [
      { id: 'c3_1', title: 'Cloud Infrastructure', score: 3, maturity: 'High' },
      { id: 'c3_2', title: 'Data Analytics', score: 1, maturity: 'Low' },
      { id: 'c3_3', title: 'Cybersecurity', score: 2, maturity: 'Medium' },
    ],
  },
];

export const PlanningDesk: React.FC = () => {
  const { year, quarter } = useOutletContext<OutletContext>();
  const [selectedCap, setSelectedCap] = useState<any | null>(null);

  const getScoreColor = (score: number) => {
    if (score === 3) return 'var(--component-color-success)';
    if (score === 2) return 'var(--component-color-warning)';
    return 'var(--component-color-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
          Capability Matrix
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          {year} {quarter !== 'All' ? `- ${quarter}` : ''} - Resource Allocation & Gap Analysis
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 2, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {mockCapabilities.map(l1 => (
              <div
                key={l1.id}
                style={{
                  backgroundColor: 'var(--component-panel-bg)',
                  border: '1px solid var(--component-panel-border)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <h3 style={{
                  color: 'var(--color-gold)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--component-panel-border)',
                  paddingBottom: '0.5rem',
                }}>
                  {l1.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {l1.children.map(l2 => (
                    <div
                      key={l2.id}
                      onClick={() => setSelectedCap(l2)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: selectedCap?.id === l2.id ? 'rgba(212, 175, 55, 0.15)' : 'var(--component-bg-secondary)',
                        borderRadius: '6px',
                        border: selectedCap?.id === l2.id ? '1px solid var(--color-gold)' : '1px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{l2.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{l2.maturity}</span>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: getScoreColor(l2.score),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1,
          backgroundColor: 'var(--component-panel-bg)',
          border: '1px solid var(--component-panel-border)',
          borderRadius: '8px',
          padding: '1.5rem',
          borderLeft: '3px solid var(--color-gold)',
        }}>
          {selectedCap ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: getScoreColor(selectedCap.score),
                  color: '#000',
                }}>
                  MATURITY: {selectedCap.score}/3
                </span>
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {selectedCap.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Select a capability to view gap analysis and resource recommendations.
              </p>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '2rem' }}>
              Select a capability to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningDesk;
