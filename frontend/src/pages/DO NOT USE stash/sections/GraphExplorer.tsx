import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box, FileText, AlertTriangle, ChevronRight } from 'lucide-react';

interface OutletContext {
  year: string;
  quarter: string;
}

const mockNodes = [
  { id: 'n1', label: 'Investor Relations', type: 'capability', health: 78, exposure: 42 },
  { id: 'n2', label: 'Digital Services', type: 'capability', health: 92, exposure: 15 },
  { id: 'n3', label: 'Policy Framework', type: 'initiative', health: 85, exposure: 28 },
  { id: 'n4', label: 'Data Analytics', type: 'capability', health: 45, exposure: 68 },
];

export const GraphExplorer: React.FC = () => {
  const { year, quarter } = useOutletContext<OutletContext>();
  const [selectedNode, setSelectedNode] = useState<typeof mockNodes[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'decisions' | 'state' | 'escalations'>('decisions');

  const getHealthColor = (health: number) => {
    if (health >= 75) return 'var(--component-color-success)';
    if (health >= 50) return 'var(--component-color-warning)';
    return 'var(--component-color-danger)';
  };

  return (
    <div id="graph-explorer-3d" style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 200px)' }}>
      <div style={{
        flex: 2,
        backgroundColor: 'var(--component-panel-bg)',
        border: '1px solid var(--component-panel-border)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--component-panel-border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', margin: 0 }}>
            3D Knowledge Graph
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
            {year} {quarter !== 'All' ? `- ${quarter}` : ''} - Click nodes to explore
          </p>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <Box size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>3D Graph Visualization</p>
            <p style={{ fontSize: '0.875rem' }}>Integrate 3D force graph component here</p>
          </div>
        </div>

        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--component-panel-border)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
        }}>
          {mockNodes.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: selectedNode?.id === node.id ? 'var(--color-gold)' : 'var(--component-bg-secondary)',
                color: selectedNode?.id === node.id ? '#000' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getHealthColor(node.health),
              }} />
              {node.label}
            </button>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div style={{
          width: '350px',
          backgroundColor: 'var(--component-panel-bg)',
          border: '1px solid var(--component-panel-border)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--component-panel-border)' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>
              Governance Log: {selectedNode.label}
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Health</div>
                <div style={{ fontWeight: 700, color: getHealthColor(selectedNode.health) }}>
                  {selectedNode.health}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Exposure</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedNode.exposure}%
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--component-panel-border)' }}>
            {(['decisions', 'state', 'escalations'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: activeTab === tab ? 'var(--component-bg-secondary)' : 'transparent',
                  color: activeTab === tab ? 'var(--color-gold)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: activeTab === tab ? 600 : 400,
                  textTransform: 'capitalize',
                  borderBottom: activeTab === tab ? '2px solid var(--color-gold)' : 'none',
                }}
              >
                {tab}
                {tab === 'escalations' && (
                  <span style={{
                    marginLeft: '4px',
                    backgroundColor: 'var(--component-color-danger)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    padding: '2px 5px',
                    borderRadius: '8px',
                  }}>
                    3
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            {activeTab === 'decisions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--component-bg-secondary)',
                  borderRadius: '6px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-gold)' }}>dec-2024Q4-001</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: 'var(--component-color-success)', color: '#000', borderRadius: '4px' }}>Active</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                    Prioritize manufacturing FDI
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    Owner: Board of Directors
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'state' && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', paddingTop: '2rem' }}>
                No state reports for this node
              </div>
            )}

            {activeTab === 'escalations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--component-color-danger)',
                  borderRadius: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} color="var(--component-color-danger)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--component-color-danger)', fontWeight: 600 }}>
                      Critical
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    Capability degradation detected
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--component-panel-border)' }}>
            <button style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--color-gold)',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}>
              + Add Decision
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphExplorer;
