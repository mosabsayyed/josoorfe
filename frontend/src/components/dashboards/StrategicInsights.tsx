import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, ScatterChart, XAxis, YAxis, ZAxis, Tooltip,
  CartesianGrid, Bar, Line, Scatter, Cell, Label
} from 'recharts';
import type { DashboardData } from '../../types/dashboard';

interface StrategicInsightsProps {
  data: DashboardData;
  isDark: boolean;
  language: string;
}

// Shared styles - all inline for full control
const styles = {
  section: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' },
  sectionTitle: (isDark: boolean) => ({
    fontSize: '1rem',
    fontWeight: 700,
    color: isDark ? '#F9FAFB' : '#1F2937',
    margin: 0,
    padding: 0,
    marginBottom: '0.25rem'
  }),
  card: (isDark: boolean) => ({
    background: isDark ? '#1F2937' : '#FFFFFF',
    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
    borderRadius: '0.5rem',
    padding: '0.5rem'
  }),
  cardTitle: (isDark: boolean) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    color: isDark ? '#F9FAFB' : '#1F2937',
    margin: 0,
    marginBottom: '0.25rem'
  }),
  chartBox: { height: 100, width: '100%', paddingTop: 5, paddingBottom: 5 }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(31, 41, 55, 0.95)',
        fontSize: '0.75rem',
        border: '1px solid #374151',
        padding: '0.5rem',
        borderRadius: '0.25rem'
      }}>
        <p style={{ fontWeight: 700, color: 'var(--component-text-accent)', margin: 0, marginBottom: '0.25rem' }}>
          {label || payload[0]?.payload?.name}
        </p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StrategicInsights: React.FC<StrategicInsightsProps> = ({ data, isDark, language }) => {
  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280',
    success: '#10B981',
    accent: isDark ? 'var(--component-text-accent)' : '#D97706',
    grid: isDark ? '#374151' : '#D1D5DB',
  };

  const content = {
    title: { en: 'Strategic Insights', ar: 'الرؤى الاستراتيجية' },
    nodeDist: { en: 'Investment Portfolio Health', ar: 'توزيع العقد' },
    growthTrend: { en: 'Projects & Operations Integration', ar: 'اتجاه النمو' },
    netImpact: { en: 'Economic Impact Correlation', ar: 'تأثير الشبكة' },
    risk: { en: 'Risk Level', ar: 'مستوى المخاطر' },
    alignment: { en: 'Alignment', ar: 'المواءمة' },
    efficiency: { en: 'Efficiency', ar: 'الكفاءة' },
    impact: { en: 'Impact', ar: 'التأثير' },
    velocity: { en: 'Project Velocity', ar: 'سرعة المشاريع' },
    opsEff: { en: 'Ops Efficiency', ar: 'الكفاءة التشغيلية' },
    citizenQoL: { en: 'Citizen QoL', ar: 'جودة حياة المواطن' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  const { insight1, insight2, insight3 } = data || {};

  const insight1Data = useMemo(() => 
    insight1?.initiatives?.map(d => ({ x: d.risk, y: d.alignment, z: d.budget, name: d.name })) || [], 
    [insight1]);

  const insight2Data = useMemo(() =>
    insight2?.labels?.map((label, i) => ({
      name: label,
      'Project Velocity': insight2.projectVelocity[i],
      'Ops Efficiency': insight2.operationalEfficiency[i],
    })) || [], [insight2]);

  const insight3Data = useMemo(() => 
    insight3?.labels?.map((label, i) => ({
      name: label,
      'Ops Efficiency': insight3.operationalEfficiency[i],
      'Citizen QoL': insight3.citizenQoL[i],
    })) || [], [insight3]);

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle(isDark)}>{t('title')}</h2>
      
      {/* Card 1: Scatter Chart */}
      <div style={styles.card(isDark)}>
        <h3 style={styles.cardTitle(isDark)}>{insight1?.title || t('nodeDist')}</h3>
        <div style={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 5, bottom: 15, left: 5 }}>
              <CartesianGrid stroke={theme.grid} />
              <XAxis type="number" dataKey="x" domain={[0, 5]} tick={{ fill: theme.muted, fontSize: 10 }}>
                <Label value={t('risk')} position="insideBottom" offset={-5} style={{ fill: theme.muted, fontSize: 9 }} />
              </XAxis>
              <YAxis type="number" dataKey="y" domain={[0, 5]} tick={{ fill: theme.muted, fontSize: 10 }}>
                <Label value={t('alignment')} angle={-90} position="insideLeft" style={{ fill: theme.muted, fontSize: 9 }} />
              </YAxis>
              <ZAxis type="number" dataKey="z" range={[40, 300]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={insight1Data} fillOpacity={0.8}>
                {insight1Data.map((_, index) => <Cell key={`cell-${index}`} fill={theme.accent} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card 2: Bar + Line Chart */}
      <div style={styles.card(isDark)}>
        <h3 style={styles.cardTitle(isDark)}>{insight2?.title || t('growthTrend')}</h3>
        <div style={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={insight2Data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: theme.muted, fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Project Velocity" name={t('velocity')} barSize={16} fill={theme.accent} fillOpacity={0.8} />
              <Line type="monotone" dataKey="Ops Efficiency" name={t('opsEff')} stroke={theme.success} strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card 3: Bar + Line Chart */}
      <div style={styles.card(isDark)}>
        <h3 style={styles.cardTitle(isDark)}>{insight3?.title || t('netImpact')}</h3>
        <div style={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={insight3Data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: theme.muted, fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: theme.muted, fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="Ops Efficiency" name={t('opsEff')} barSize={16} fill={theme.accent} fillOpacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="Citizen QoL" name={t('citizenQoL')} stroke={theme.success} strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StrategicInsights;