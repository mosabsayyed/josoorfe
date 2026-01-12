import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Calendar, Layout, Clock, Download } from 'lucide-react';

interface OutletContext {
  year: string;
  quarter: string;
}

const mockArchive = [
  { id: 1, name: 'Q4 2025 Sector Performance', date: 'Dec 15, 2025', size: '2.4 MB', type: 'PDF' },
  { id: 2, name: 'Risk Assessment Brief', date: 'Dec 10, 2025', size: '1.1 MB', type: 'PDF' },
  { id: 3, name: 'Strategic Gap Analysis', date: 'Nov 28, 2025', size: '3.8 MB', type: 'PDF' },
];

const mockScheduled = [
  { id: 1, name: 'Weekly Executive Summary', frequency: 'Weekly (Sun)', nextRun: 'Dec 22, 2025', recipients: 'Exec Team' },
  { id: 2, name: 'Monthly KPI Digest', frequency: 'Monthly (1st)', nextRun: 'Jan 1, 2026', recipients: 'All Staff' },
];

export const ReportingDesk: React.FC = () => {
  const { year, quarter } = useOutletContext<OutletContext>();
  const [activeTab, setActiveTab] = useState<'designer' | 'archive' | 'scheduled'>('designer');

  const tabs = [
    { id: 'designer' as const, label: 'Designer', icon: Layout },
    { id: 'archive' as const, label: 'Archive', icon: FileText },
    { id: 'scheduled' as const, label: 'Scheduled', icon: Clock },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
            Report Designer
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            {year} {quarter !== 'All' ? `- ${quarter}` : ''}
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.25rem',
          backgroundColor: 'var(--component-bg-secondary)',
          padding: '4px',
          borderRadius: '8px',
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: activeTab === tab.id ? 'var(--color-gold)' : 'transparent',
                  color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: 'var(--component-panel-bg)',
        border: '1px solid var(--component-panel-border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {activeTab === 'designer' && (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            padding: '2rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <Layout size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Report Designer Canvas</p>
              <p style={{ fontSize: '0.875rem' }}>Drag and drop components to build your report</p>
            </div>
          </div>
        )}

        {activeTab === 'archive' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mockArchive.map(report => (
                <div
                  key={report.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: 'var(--component-bg-secondary)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={20} color="var(--color-gold)" />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{report.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {report.date} - {report.size}
                      </div>
                    </div>
                  </div>
                  <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-gold)',
                    cursor: 'pointer',
                  }}>
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mockScheduled.map(schedule => (
                <div
                  key={schedule.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: 'var(--component-bg-secondary)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={20} color="var(--color-gold)" />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{schedule.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {schedule.frequency} - Next: {schedule.nextRun}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {schedule.recipients}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingDesk;
