import React, { useState } from 'react';
import { Activity, Server, Database, Cpu, Clock } from 'lucide-react';

const mockMetrics = [
  { id: 'm1', label: 'API Latency', value: '142ms', status: 'healthy' as const, icon: Clock },
  { id: 'm2', label: 'Server Load', value: '34%', status: 'healthy' as const, icon: Server },
  { id: 'm3', label: 'DB Connections', value: '28/50', status: 'warning' as const, icon: Database },
  { id: 'm4', label: 'Memory Usage', value: '67%', status: 'healthy' as const, icon: Cpu },
];

const mockLogs = [
  { id: 'l1', timestamp: '2026-01-12 14:32:15', level: 'INFO', message: 'Graph query completed in 234ms' },
  { id: 'l2', timestamp: '2026-01-12 14:32:10', level: 'WARN', message: 'High latency detected on /api/v1/graph/explorer' },
  { id: 'l3', timestamp: '2026-01-12 14:31:55', level: 'INFO', message: 'User session started: user@example.com' },
  { id: 'l4', timestamp: '2026-01-12 14:31:42', level: 'ERROR', message: 'Failed to connect to external service' },
  { id: 'l5', timestamp: '2026-01-12 14:31:30', level: 'INFO', message: 'Cache refreshed successfully' },
];

export const Observability: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs'>('metrics');

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'var(--component-color-success)';
      case 'warning': return 'var(--component-color-warning)';
      default: return 'var(--component-color-danger)';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'var(--component-color-success)';
      case 'WARN': return 'var(--component-color-warning)';
      case 'ERROR': return 'var(--component-color-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
            Observability
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            System Monitoring & Logs
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.25rem',
          backgroundColor: 'var(--component-bg-secondary)',
          padding: '4px',
          borderRadius: '8px',
        }}>
          {(['metrics', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === tab ? 'var(--color-gold)' : 'transparent',
                color: activeTab === tab ? '#000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: activeTab === tab ? 700 : 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'metrics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {mockMetrics.map(metric => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.id}
                style={{
                  backgroundColor: 'var(--component-panel-bg)',
                  border: '1px solid var(--component-panel-border)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <Icon size={20} color="var(--text-secondary)" />
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(metric.status),
                  }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {metric.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={{
          backgroundColor: 'var(--component-panel-bg)',
          border: '1px solid var(--component-panel-border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--component-panel-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
          }}>
            <Activity size={16} />
            Live Logs
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {mockLogs.map(log => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--component-panel-border)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {log.timestamp}
                </span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: getLevelColor(log.level),
                  color: '#000',
                  minWidth: '50px',
                  textAlign: 'center',
                }}>
                  {log.level}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Observability;
