import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building, Users, Cog, Wrench } from 'lucide-react';

interface OutletContext {
  year: string;
  quarter: string;
}

const mockCapabilities = [
  { id: 'cap-1', category: 'People', title: 'Digital Skills Development', health: 85, status: 'healthy' as const },
  { id: 'cap-2', category: 'People', title: 'Leadership Pipeline', health: 72, status: 'warning' as const },
  { id: 'cap-3', category: 'Process', title: 'Service Integration', health: 45, status: 'critical' as const },
  { id: 'cap-4', category: 'Process', title: 'Quality Assurance', health: 88, status: 'healthy' as const },
  { id: 'cap-5', category: 'Tools', title: 'Cloud Infrastructure', health: 92, status: 'healthy' as const },
  { id: 'cap-6', category: 'Tools', title: 'Data Analytics Platform', health: 68, status: 'warning' as const },
];

export const EnterpriseDesk: React.FC = () => {
  const { year, quarter } = useOutletContext<OutletContext>();

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    if (status === 'healthy') return 'var(--component-color-success)';
    if (status === 'warning') return 'var(--component-color-warning)';
    return 'var(--component-color-danger)';
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'People') return <Users size={16} />;
    if (category === 'Process') return <Cog size={16} />;
    return <Wrench size={16} />;
  };

  const groupedCapabilities = mockCapabilities.reduce((acc, cap) => {
    if (!acc[cap.category]) acc[cap.category] = [];
    acc[cap.category].push(cap);
    return acc;
  }, {} as Record<string, typeof mockCapabilities>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
          Capability Health
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          {year} {quarter !== 'All' ? `- ${quarter}` : ''} - People / Process / Tools
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {Object.entries(groupedCapabilities).map(([category, capabilities]) => (
          <div
            key={category}
            style={{
              backgroundColor: 'var(--component-panel-bg)',
              border: '1px solid var(--component-panel-border)',
              borderRadius: '8px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--component-panel-border)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'var(--color-gold)' }}>{getCategoryIcon(category)}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{category}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {capabilities.map(cap => (
                <div
                  key={cap.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'var(--component-bg-secondary)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {cap.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {cap.health}%
                    </span>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(cap.status),
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
  );
};

export default EnterpriseDesk;
