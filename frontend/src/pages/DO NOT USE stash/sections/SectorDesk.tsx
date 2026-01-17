import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OutletContext {
  year: string;
  quarter: string;
}

const mockKPIs = [
  { id: 'kpi-1', title: 'Digital GDP Contribution', value: 78, target: 85, trend: 'up' as const },
  { id: 'kpi-2', title: 'Citizen Trust Index', value: 92, target: 95, trend: 'steady' as const },
  { id: 'kpi-3', title: 'Carbon Neutrality Progress', value: 45, target: 60, trend: 'down' as const },
  { id: 'kpi-4', title: 'SME Digitization Rate', value: 67, target: 75, trend: 'up' as const },
];

export const SectorDesk: React.FC = () => {
  const { year, quarter } = useOutletContext<OutletContext>();

  const getTrendIcon = (trend: 'up' | 'down' | 'steady') => {
    if (trend === 'up') return <TrendingUp size={16} color="var(--component-color-success)" />;
    if (trend === 'down') return <TrendingDown size={16} color="var(--component-color-danger)" />;
    return <Minus size={16} color="var(--component-text-muted)" />;
  };

  const getProgressColor = (value: number, target: number) => {
    const ratio = value / target;
    if (ratio >= 0.9) return 'var(--component-color-success)';
    if (ratio >= 0.7) return 'var(--component-color-warning)';
    return 'var(--component-color-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
            Sector Outcomes
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            {year} {quarter !== 'All' ? `- ${quarter}` : ''}
          </p>
        </div>
      </div>

      <div id="sector-desk-gauges" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '1rem' 
      }}>
        {mockKPIs.map(kpi => (
          <div
            key={kpi.id}
            style={{
              backgroundColor: 'var(--component-panel-bg)',
              border: '1px solid var(--component-panel-border)',
              borderRadius: '8px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="var(--color-gold)" />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                  {kpi.title}
                </span>
              </div>
              {getTrendIcon(kpi.trend)}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {kpi.value}%
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                / {kpi.target}%
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--component-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(kpi.value / kpi.target) * 100}%`,
                  height: '100%',
                  backgroundColor: getProgressColor(kpi.value, kpi.target),
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: 'var(--component-panel-bg)',
        border: '1px solid var(--component-panel-border)',
        borderRadius: '8px',
        padding: '1.5rem',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
      }}>
        Map visualization placeholder - integrate sector map component here
      </div>
    </div>
  );
};

export default SectorDesk;
