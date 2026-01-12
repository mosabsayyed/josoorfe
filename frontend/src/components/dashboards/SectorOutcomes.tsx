import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Bar, Line
} from 'recharts';
import type { OutcomesData } from '../../types/dashboard';

interface SectorOutcomesProps {
  outcomes?: OutcomesData;
  data?: OutcomesData;
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
  chartBox: { height: 100, width: '100%', paddingTop: 5, paddingBottom: 5 },
  doughnutBox: { height: 60, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 5, paddingBottom: 5 }
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
        <p style={{ fontWeight: 700, color: '#FFD700', margin: 0, marginBottom: '0.25rem' }}>
          {label || payload[0]?.name}
        </p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.color || pld.fill }}>
            {`${pld.name}: ${pld.value}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Clean inline doughnut component
const DoughnutWithLabel: React.FC<{
  data: { name: string, value: number }[];
  colors: string[];
  actual: number;
  target: number;
  isDark: boolean;
  language: string;
}> = ({ data, colors, actual, target, isDark, language }) => {
  const vsTarget = language === 'ar' ? `مقابل ${target}% مستهدف` : `vs ${target}% Target`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <PieChart width={50} height={50}>
        <Pie
          data={data}
          cx={25}
          cy={25}
          innerRadius={15}
          outerRadius={22}
          dataKey="value"
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#F9FAFB' : '#1F2937', lineHeight: 1 }}>
          {actual}%
        </div>
        <div style={{ fontSize: '0.625rem', color: isDark ? '#9CA3AF' : '#6B7280' }}>
          {vsTarget}
        </div>
      </div>
    </div>
  );
};

const SectorOutcomes: React.FC<SectorOutcomesProps> = ({ outcomes: outcomesProp, data, isDark, language }) => {
  const outcomes = outcomesProp || data;
  
  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280',
    success: '#10B981',
    accent: isDark ? '#FFD700' : '#D97706',
    grid: isDark ? '#374151' : '#D1D5DB',
  };

  const content = {
    title: { en: 'Sector-Level Outcomes', ar: 'المخرجات القطاعية' },
    netScale: { en: 'Economic Impact', ar: 'التأثير الاقتصادي' },
    connScore: { en: 'Partnerships', ar: 'الشراكات' },
    netCov: { en: 'Infrastructure Coverage', ar: 'تغطية البنية التحتية' },
    intIndex: { en: 'Community Engagement', ar: 'المشاركة المجتمعية' },
    jobs: { en: 'Jobs', ar: 'الوظائف' },
    fdi: { en: 'FDI', ar: 'الاستثمار الأجنبي' },
    cov: { en: 'Coverage', ar: 'التغطية' },
    quality: { en: 'Quality', ar: 'الجودة' },
    ppp: { en: 'PPP', ar: 'شراكة' },
    engaged: { en: 'Engaged', ar: 'متفاعل' },
    rest: { en: 'Rest', ar: 'الباقي' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  // Create separate data points for each economic metric
  const outcome1Data = useMemo(() => {
    const macro = outcomes?.outcome1?.macro;
    if (!macro) return [];
    return [
      { name: 'FDI', value: macro.fdi?.actual?.[0] || 0 },
      { name: 'Trade', value: macro.trade?.actual?.[0] || 0 },
      { name: 'Jobs', value: macro.jobs?.actual?.[0] || 0 }
    ];
  }, [outcomes]);

  const { actual: pppActual = 0, target: pppTarget = 0 } = outcomes?.outcome2?.partnerships || {};
  const outcome2Data = [{ name: t('ppp'), value: pppActual }, { name: t('rest'), value: Math.max(0, 100 - pppActual) }];

  const outcome3Data = useMemo(() => 
    outcomes?.outcome3?.qol?.labels?.map((label, i) => ({
      name: label,
      'Coverage': outcomes.outcome3.qol.coverage.actual[i],
      'Quality': outcomes.outcome3.qol.quality.actual[i] * 10,
    })) || [], [outcomes]);
  
  const { actual: commActual = 0, target: commTarget = 0 } = outcomes?.outcome4?.community || {};
  const outcome4Data = [{ name: t('engaged'), value: commActual }, { name: t('rest'), value: Math.max(0, 100 - commActual) }];

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle(isDark)}>{t('title')}</h2>
      
      {/* Card 1: Bar + Line Chart */}
      <div style={styles.card(isDark)}>
        <h3 style={styles.cardTitle(isDark)}>{outcomes?.outcome1?.title || t('netScale')}</h3>
        <div style={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={outcome1Data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: theme.muted, fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Value" barSize={20} fill={theme.accent} fillOpacity={0.8} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card 2: Doughnut */}
      <div style={styles.card(isDark)}>
        <h3 style={styles.cardTitle(isDark)}>{outcomes?.outcome2?.title || t('connScore')}</h3>
        <div style={styles.doughnutBox}>
          <DoughnutWithLabel 
            data={outcome2Data}
            colors={[theme.accent, theme.grid]}
            actual={pppActual}
            target={pppTarget}
            isDark={isDark}
            language={language}
          />
        </div>
      </div>

      {/* Card 3: Bar + Line Chart */}
      <div style={styles.card(isDark)}>
        <h3 style={styles.cardTitle(isDark)}>{outcomes?.outcome3?.title || t('netCov')}</h3>
        <div style={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={outcome3Data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: theme.muted, fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Coverage" name={t('cov')} barSize={16} fill={theme.accent} fillOpacity={0.8} />
              <Line type="monotone" dataKey="Quality" name={t('quality')} stroke={theme.success} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card 4: Doughnut */}
      <div style={styles.card(isDark)}>
        <h3 style={styles.cardTitle(isDark)}>{outcomes?.outcome4?.title || t('intIndex')}</h3>
        <div style={styles.doughnutBox}>
          <DoughnutWithLabel 
            data={outcome4Data}
            colors={[theme.accent, theme.grid]}
            actual={commActual}
            target={commTarget}
            isDark={isDark}
            language={language}
          />
        </div>
      </div>
    </div>
  );
};

export default SectorOutcomes;