import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { L3Capability, L2Capability } from '../../../types/enterprise';
import { getL3StatusColor, getStatusLabel } from '../../../utils/enterpriseStatusUtils';
import './CapabilityDetailPanel.css';

interface CapabilityDetailPanelProps {
  l3?: L3Capability;
  l2?: L2Capability;
  onClose: () => void;
  selectedYear?: number | 'all';
  selectedQuarter?: number | 'all';
  onAIAnalysis?: () => void;
}

/** Format Neo4j integer objects {low, high} to plain number */
function fmtVal(val: any): string {
  if (val == null) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object' && 'low' in val) return String(val.low);
  return String(val);
}

/** Capitalize first letter of each word */
function capitalize(val: any): string {
  const s = fmtVal(val);
  if (s === '—') return s;
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

// Inline style constants (matching SectorDetailsPanel)
const labelStyle: React.CSSProperties = {
  fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)',
  marginBottom: '4px', letterSpacing: '0.5px'
};
const valueStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' };
const valueLargeStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: 'var(--component-text-primary)' };
const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--component-text-accent)', margin: '0 0 1rem 0', paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--component-panel-border)'
};
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' };

/** Get band color from band string */
function bandColor(band?: string): string {
  if (!band) return '#475569';
  const b = band.toLowerCase();
  return b === 'red' ? '#ef4444' : b === 'amber' ? '#f59e0b' : '#10b981';
}

/** Get band background tint */
function bandBg(band?: string): string {
  const c = bandColor(band);
  return c === '#ef4444' ? 'rgba(239,68,68,0.1)' : c === '#f59e0b' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
}

/** Get band border */
function bandBorder(band?: string): string {
  const c = bandColor(band);
  return c === '#ef4444' ? 'rgba(239,68,68,0.2)' : c === '#f59e0b' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)';
}

/** Exposure color by threshold */
function exposureColor(pct: number): string {
  return pct > 65 ? '#ef4444' : pct > 35 ? '#f59e0b' : '#10b981';
}

/** Achievement color by threshold */
function achievementColor(pct: number): string {
  return pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
}

/** Project helper: compute display values */
function projectDisplayValues(proj: any) {
  const isPlanned = proj.status === 'planned' || proj.status === 'not_started' || proj.status === 'not-started';
  const rawPct = proj.progress_percentage;
  const pctRaw = rawPct != null ? (typeof rawPct === 'object' && 'low' in rawPct ? rawPct.low : Number(rawPct)) : null;
  const pct = isPlanned ? 0 : (pctRaw != null ? (pctRaw <= 1 && pctRaw > 0 ? Math.round(pctRaw * 100) : Math.round(pctRaw)) : null);
  const isOverdue = !isPlanned && proj.end_date && proj.status !== 'complete' && proj.status !== 'completed' && new Date(proj.end_date) < new Date();
  const color = isPlanned ? '#475569' : isOverdue ? '#ef4444' : pct != null && pct >= 100 ? '#10b981' : '#3b82f6';
  return { isPlanned, pct, isOverdue, color };
}

export function CapabilityDetailPanel({ l3, l2, onClose, selectedYear, selectedQuarter, onAIAnalysis }: CapabilityDetailPanelProps) {
  const { t } = useTranslation();

  // R9: L2 view
  if (l2) {
    return <L2DetailView l2={l2} onClose={onClose} selectedYear={selectedYear} selectedQuarter={selectedQuarter} onAIAnalysis={onAIAnalysis} />;
  }

  // L3 view
  if (!l3) return null;
  return <L3DetailView l3={l3} onClose={onClose} onAIAnalysis={onAIAnalysis} />;
}

/** ═══════════════════════════════════════════════════════════
 *  L3 DETAIL VIEW — Organized by executive decision flow
 *  ═══════════════════════════════════════════════════════════ */
function L3DetailView({ l3, onClose, onAIAnalysis }: { l3: L3Capability; onClose: () => void; onAIAnalysis?: () => void }) {
  const { t } = useTranslation();
  const [riskDetailsOpen, setRiskDetailsOpen] = useState<boolean>(false);

  const statusColor = getL3StatusColor(l3);
  const statusLabel = getStatusLabel(l3);
  const cap = l3.rawCapability || {};
  const risk = l3.rawRisk;
  const maturityGap = l3.target_maturity_level - l3.maturity_level;
  const projects: any[] = cap.linkedProjects || [];
  const entities: any[] = cap.operatingEntities || [];

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="sector-details-panel drawer visible"
        style={{ width: '420px', maxWidth: '90vw', height: '100vh', position: 'relative', animation: 'slideInRight 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER (unchanged) ── */}
        <div className="details-header">
          <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="header-text">
              <h2 className="details-title" style={{ textTransform: 'none' }}>
                <span style={{ opacity: 0.6, marginRight: '8px' }}>{l3.id}</span>
                {l3.name}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span className="details-subtitle" style={{ color: statusColor, fontWeight: 600 }}>
                  {capitalize(statusLabel)}
                </span>
                <span style={{ color: 'var(--component-text-muted)' }}>•</span>
                <span className="details-subtitle" style={{ color: 'var(--component-text-muted)' }}>
                  {l3.mode === 'build' ? t('josoor.enterprise.build') : t('josoor.enterprise.operate')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {onAIAnalysis && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAIAnalysis(); }}
                  title={t('josoor.enterprise.detailPanel.aiAnalysis')}
                  style={{
                    background: 'var(--component-text-accent)',
                    color: 'var(--component-text-on-accent)',
                    border: 'none',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '36px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.02em', lineHeight: 1 }}>
                    {t('josoor.enterprise.detailPanel.aiAnalysis')}
                  </span>
                </button>
              )}
              <button onClick={onClose} className="back-button">&#x2715;</button>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="details-content">

          {/* ════════════ BUILD MODE ════════════ */}
          {l3.mode === 'build' && (
            <>
              {/* 1. Verdict Card */}
              {risk ? (
                <div style={{
                  background: bandBg(risk.build_band),
                  border: `1px solid ${bandBorder(risk.build_band)}`,
                  borderRadius: '6px', padding: '14px 16px', marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: bandColor(risk.build_band) }}>
                      {risk.build_band || '—'}
                    </span>
                    {risk.build_exposure_pct != null && (
                      <span style={{ fontSize: '16px', fontWeight: 700, color: bandColor(risk.build_band) }}>
                        {Math.round(risk.build_exposure_pct)}%
                      </span>
                    )}
                  </div>
                  {cap.isLate && (
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                      {t('josoor.enterprise.detailPanel.lateBy', { days: cap.lateByDays })}
                      {cap.delaySeverity && (
                        <span style={{ opacity: 0.7, marginLeft: '6px' }}>({capitalize(cap.delaySeverity)})</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
                  fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center', marginBottom: '1.5rem'
                }}>
                  {t('josoor.enterprise.detailPanel.noRiskData')}
                </div>
              )}

              {/* 2. Timeline */}
              {cap.dueByDate && (
                <div style={{
                  background: cap.isLate ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                  border: `1px solid ${cap.isLate ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
                  borderRadius: '6px', padding: '12px', marginBottom: '1.5rem'
                }}>
                  <div style={gridStyle}>
                    <div>
                      <div style={labelStyle}>{t('josoor.enterprise.detailPanel.dueBy')}</div>
                      <div style={valueStyle}>{cap.dueByDate}</div>
                    </div>
                    {cap.plannedByDate && (
                      <div>
                        <div style={labelStyle}>{t('josoor.enterprise.detailPanel.plannedCompletion')}</div>
                        <div style={valueStyle}>{cap.plannedByDate}</div>
                      </div>
                    )}
                  </div>
                  {cap.isLate ? (
                    <div style={{ fontSize: '13px', fontWeight: 600, color: cap.delaySeverity === 'significant' ? '#ef4444' : '#f59e0b' }}>
                      {t('josoor.enterprise.detailPanel.lateBy', { days: cap.lateByDays })}
                    </div>
                  ) : cap.plannedByDate ? (
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                      {t('josoor.enterprise.detailPanel.onTrack')}
                    </div>
                  ) : null}
                </div>
              )}

              {/* 3. Maturity */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={labelStyle}>{t('josoor.enterprise.detailPanel.maturityAssessment')}</span>
                  <span style={{
                    fontSize: '14px', fontWeight: 600,
                    color: maturityGap > 2 ? '#ef4444' : maturityGap > 0 ? '#f59e0b' : '#10b981'
                  }}>
                    {l3.maturity_level} → {l3.target_maturity_level}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(l3.maturity_level / 5) * 100}%`, background: 'var(--component-text-accent)', borderRadius: '2px' }} />
                </div>
              </div>

              {/* 4. Description */}
              {cap.description && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--component-text-secondary)', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                    {cap.description}
                  </p>
                </div>
              )}

              {/* 5. Projects by Domain */}
              <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.projectDeliverables')}</h3>
              {projects.length === 0 ? (
                <div style={{
                  background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
                  fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center', marginBottom: '1.5rem'
                }}>
                  {t('josoor.enterprise.detailPanel.noLinkedProjects')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                  {['People', 'Process', 'Tools'].map(cat => {
                    const catProjects = projects.filter((p: any) => p.category === cat);
                    if (catProjects.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div style={{ ...labelStyle, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{cat}</span>
                          <span style={{ color: 'var(--component-text-secondary)' }}>{catProjects.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {catProjects.map((proj: any) => {
                            const d = projectDisplayValues(proj);
                            return (
                              <div key={`${proj.id}-${cat}`} style={{
                                background: 'rgba(255,255,255,0.03)', border: `1px solid ${d.isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: '6px', padding: '8px 12px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                    {proj.name}
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: d.color }}>
                                    {d.isOverdue ? t('josoor.enterprise.detailPanel.overdue') : capitalize(proj.status)}
                                  </span>
                                </div>
                                {d.pct != null && !d.isPlanned && (
                                  <div style={{ marginBottom: '2px' }}>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${Math.min(d.pct, 100)}%`, background: d.color, borderRadius: '2px' }} />
                                    </div>
                                  </div>
                                )}
                                {proj.end_date && (
                                  <div style={{ fontSize: '11px', color: 'var(--component-text-muted)', marginTop: '2px' }}>
                                    {t('josoor.enterprise.detailPanel.endDate')}: {proj.end_date}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5b. Process Metrics */}
              {(() => {
                const processMetrics: any[] = cap.processMetrics || [];
                return processMetrics.length > 0 ? (
                  <>
                    <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.processMetrics')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                      {processMetrics.map((pm: any) => {
                        const actual = pm.actual != null ? Number(pm.actual) : null;
                        const target = pm.target != null ? Number(pm.target) : null;
                        const baseline = pm.baseline != null ? Number(pm.baseline) : null;
                        const isLowerBetter = pm.metric_type === 'cycle_time' || pm.metric_type === 'cost';
                        let pct: number | null = null;
                        if (actual != null && target != null && baseline != null && baseline !== target) {
                          if (isLowerBetter) {
                            pct = Math.round(((baseline - actual) / (baseline - target)) * 100);
                          } else {
                            pct = Math.round(((actual - (baseline || 0)) / (target - (baseline || 0))) * 100);
                          }
                          pct = Math.max(0, Math.min(pct, 100));
                        } else if (actual != null && target != null && target > 0) {
                          pct = isLowerBetter ? Math.round((target / actual) * 100) : Math.round((actual / target) * 100);
                          pct = Math.max(0, Math.min(pct, 100));
                        }
                        const barColor = pct != null ? (pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444') : '#3b82f6';
                        const trendIcon = pm.trend === 'improving' ? '\u2191' : pm.trend === 'declining' ? '\u2193' : '\u2192';
                        const trendColor = pm.trend === 'improving' ? '#10b981' : pm.trend === 'declining' ? '#ef4444' : '#f59e0b';
                        return (
                          <div key={pm.id} style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '6px', padding: '10px 14px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--component-text-primary)' }}>
                                {pm.metric_name || pm.name}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: trendColor }}>{trendIcon}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--component-text-primary)' }}>
                                {actual != null ? actual : '\u2014'}
                              </span>
                              <span style={{ fontSize: '13px', color: 'var(--component-text-muted)' }}>
                                {t('josoor.enterprise.detailPanel.target')}: {target != null ? target : '\u2014'} {pm.unit || ''}
                              </span>
                            </div>
                            {pct != null && (
                              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '4px' }} />
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>
                                {pm.metric_type ? pm.metric_type.replace('_', ' ') : ''}
                              </span>
                              {pm.indicator_type && (
                                <span style={{ fontSize: '11px', color: 'var(--component-text-muted)', fontStyle: 'italic' }}>
                                  {pm.indicator_type}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null;
              })()}

              {/* 6. Strategic Context */}
              <StrategicContextSection cap={cap} />

              {/* Risk Details (collapsible) */}
              {risk && (
                <CollapsibleRiskDetails
                  risk={risk}
                  isOpen={riskDetailsOpen}
                  onToggle={() => setRiskDetailsOpen(!riskDetailsOpen)}
                />
              )}
            </>
          )}

          {/* ════════════ OPERATE MODE ════════════ */}
          {l3.mode === 'execute' && (
            <>
              {/* 1. Verdict Card */}
              {risk ? (
                <div style={{
                  background: bandBg(risk.operate_band),
                  border: `1px solid ${bandBorder(risk.operate_band)}`,
                  borderRadius: '6px', padding: '14px 16px', marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {risk.operational_health_pct != null && (
                        <>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--component-text-primary)' }}>
                            {Math.round(risk.operational_health_pct)}%
                          </div>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>
                            {t('josoor.enterprise.detailPanel.operationalHealth')}
                          </div>
                        </>
                      )}
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: bandColor(risk.operate_band) }}>
                      {risk.operate_band || '—'}
                    </span>
                  </div>
                  {risk.operate_trend_flag && (
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>
                      {t('josoor.enterprise.tooltip.earlyWarning')}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
                  fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center', marginBottom: '1.5rem'
                }}>
                  {t('josoor.enterprise.detailPanel.noRiskData')}
                </div>
              )}

              {/* 2. Scorecard — 3 full-width rows */}
              {risk && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                  {[
                    { key: 'people', val: risk.people_score, entityType: 'OrgUnit' as const },
                    { key: 'process', val: risk.process_score, entityType: 'Process' as const },
                    { key: 'tools', val: risk.tools_score, entityType: 'ITSystem' as const }
                  ].filter(s => s.val != null).map(s => {
                    const matched = entities.find(e => e.type === s.entityType);
                    const label = matched ? matched.name : t(`josoor.enterprise.detailPanel.${s.key}`);
                    return (
                      <div key={s.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={labelStyle}>{label}</span>
                          <span style={valueStyle}>{s.val}/5</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(s.val / 5) * 100}%`, background: 'var(--component-text-accent)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Exposure */}
              {risk && risk.operate_exposure_pct_effective != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span style={labelStyle}>
                    {t('josoor.enterprise.detailPanel.operateExposure')}
                    <span title={t('josoor.enterprise.detailPanel.operateExposureTooltip')} style={{ cursor: 'help', marginLeft: '4px', opacity: 0.5 }}>ⓘ</span>
                  </span>
                  <span style={{
                    fontSize: '16px', fontWeight: 700,
                    color: exposureColor(risk.operate_exposure_pct_effective)
                  }}>
                    {Math.round(risk.operate_exposure_pct_effective)}%
                  </span>
                </div>
              )}

              {/* 4. Performance KPIs */}
              {(() => {
                const perfTargets: any[] = cap.performanceTargets || [];
                return perfTargets.length > 0 ? (
                  <>
                    <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.performanceTargets')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                      {perfTargets.map((perf: any) => {
                        const actual = perf.actual_value != null ? Number(perf.actual_value) : null;
                        const target = perf.target != null ? Number(perf.target) : null;
                        const pct = actual != null && target && target > 0 ? Math.round((actual / target) * 100) : null;
                        const barColor = pct != null ? achievementColor(pct) : '#3b82f6';
                        return (
                          <div key={perf.id} style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '6px', padding: '10px 14px'
                          }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--component-text-primary)', marginBottom: '4px' }}>
                              {perf.name}
                            </div>
                            {actual != null && target != null && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '13px', color: 'var(--component-text-secondary)' }}>
                                    {actual} / {target} {perf.unit || ''}
                                  </span>
                                  {pct != null && (
                                    <span style={{ fontSize: '13px', color: barColor, fontWeight: 600 }}>{pct}%</span>
                                  )}
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(pct || 0, 100)}%`, background: barColor, borderRadius: '4px' }} />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null;
              })()}

              {/* 4b. Process Metrics */}
              {(() => {
                const processMetrics: any[] = cap.processMetrics || [];
                return processMetrics.length > 0 ? (
                  <>
                    <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.processMetrics')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                      {processMetrics.map((pm: any) => {
                        const actual = pm.actual != null ? Number(pm.actual) : null;
                        const target = pm.target != null ? Number(pm.target) : null;
                        const baseline = pm.baseline != null ? Number(pm.baseline) : null;
                        const isLowerBetter = pm.metric_type === 'cycle_time' || pm.metric_type === 'cost';
                        let pct: number | null = null;
                        if (actual != null && target != null && baseline != null && baseline !== target) {
                          if (isLowerBetter) {
                            pct = Math.round(((baseline - actual) / (baseline - target)) * 100);
                          } else {
                            pct = Math.round(((actual - (baseline || 0)) / (target - (baseline || 0))) * 100);
                          }
                          pct = Math.max(0, Math.min(pct, 100));
                        } else if (actual != null && target != null && target > 0) {
                          pct = isLowerBetter ? Math.round((target / actual) * 100) : Math.round((actual / target) * 100);
                          pct = Math.max(0, Math.min(pct, 100));
                        }
                        const barColor = pct != null ? (pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444') : '#3b82f6';
                        const trendIcon = pm.trend === 'improving' ? '\u2191' : pm.trend === 'declining' ? '\u2193' : '\u2192';
                        const trendColor = pm.trend === 'improving' ? '#10b981' : pm.trend === 'declining' ? '#ef4444' : '#f59e0b';
                        return (
                          <div key={pm.id} style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '6px', padding: '10px 14px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--component-text-primary)' }}>
                                {pm.metric_name || pm.name}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: trendColor }}>{trendIcon}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--component-text-primary)' }}>
                                {actual != null ? actual : '\u2014'}
                              </span>
                              <span style={{ fontSize: '13px', color: 'var(--component-text-muted)' }}>
                                {t('josoor.enterprise.detailPanel.target')}: {target != null ? target : '\u2014'} {pm.unit || ''}
                              </span>
                            </div>
                            {pct != null && (
                              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '4px' }} />
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>
                                {pm.metric_type ? pm.metric_type.replace('_', ' ') : ''}
                              </span>
                              {pm.indicator_type && (
                                <span style={{ fontSize: '11px', color: 'var(--component-text-muted)', fontStyle: 'italic' }}>
                                  {pm.indicator_type}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null;
              })()}

              {/* 5. Operating Entities */}
              {entities.length > 0 && (
                <>
                  <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.operationalFootprint')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.5rem' }}>
                    {entities.map(ent => {
                      const typeKey = ent.type === 'OrgUnit' ? 'orgUnit' : ent.type === 'Process' ? 'processEntity' : 'itSystem';
                      return (
                        <div key={`${ent.type}-${ent.id}`} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 0'
                        }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>{ent.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--component-text-muted)', marginLeft: '8px' }}>
                              {t(`josoor.enterprise.detailPanel.${typeKey}`)}
                            </span>
                          </div>
                          {ent.status && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--component-text-secondary)' }}>
                              {capitalize(ent.status)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 6. Strategic Context */}
              <StrategicContextSection cap={cap} />

              {/* Risk Details (collapsible) */}
              {risk && (
                <CollapsibleRiskDetails
                  risk={risk}
                  isOpen={riskDetailsOpen}
                  onToggle={() => setRiskDetailsOpen(!riskDetailsOpen)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** ═══════════════════════════════════════════════════════════
 *  STRATEGIC CONTEXT — Shared between build & operate
 *  ═══════════════════════════════════════════════════════════ */
function StrategicContextSection({ cap }: { cap: Record<string, any> }) {
  const { t } = useTranslation();
  const objectives: any[] = cap.objectives || [];
  const policyTools: any[] = cap.policyTools || [];

  if (objectives.length === 0 && policyTools.length === 0) return null;

  return (
    <>
      <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.upwardChain')}</h3>
      <div style={{ marginBottom: '1.5rem' }}>
        {objectives.length > 0 && (
          <div style={{ marginBottom: policyTools.length > 0 ? '8px' : 0 }}>
            {objectives.map((obj: any, i: number) => (
              <div key={obj.id || i} style={{ fontSize: '13px', color: 'var(--component-text-secondary)', lineHeight: '1.8' }}>
                • {obj.name}
              </div>
            ))}
          </div>
        )}
        {policyTools.length > 0 && (
          <div>
            {policyTools.map((pol: any, i: number) => (
              <div key={pol.id || i} style={{ fontSize: '13px', color: 'var(--component-text-secondary)', lineHeight: '1.8' }}>
                • {pol.name}{pol.end_date ? ` — ${pol.end_date}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** ═══════════════════════════════════════════════════════════
 *  COLLAPSIBLE RISK DETAILS — Shared between build & operate
 *  ═══════════════════════════════════════════════════════════ */
function CollapsibleRiskDetails({ risk, isOpen, onToggle }: { risk: Record<string, any>; isOpen: boolean; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', padding: '8px 0', userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-muted)' }}>
          {t('josoor.enterprise.detailPanel.riskProfile')} {isOpen ? '▾' : '▸'}
        </span>
      </div>
      {isOpen && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '6px', padding: '12px', marginTop: '4px'
        }}>
          <div style={gridStyle}>
            {risk.risk_category && (
              <div>
                <div style={labelStyle}>{t('josoor.enterprise.detailPanel.riskCategory')}</div>
                <div style={valueStyle}>{capitalize(risk.risk_category)}</div>
              </div>
            )}
            {risk.risk_status && (
              <div>
                <div style={labelStyle}>{t('josoor.enterprise.detailPanel.riskStatus')}</div>
                <div style={valueStyle}>{capitalize(risk.risk_status)}</div>
              </div>
            )}
          </div>
          {risk.risk_owner && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.riskOwner')}</div>
              <div style={valueStyle}>{fmtVal(risk.risk_owner)}</div>
            </div>
          )}
          {risk.mitigation_strategy && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.mitigation')}</div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--component-text-secondary)', margin: '4px 0 0 0' }}>
                {risk.mitigation_strategy}
              </p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {risk.identified_date && (
              <div>
                <div style={labelStyle}>{t('josoor.enterprise.detailPanel.identifiedDate')}</div>
                <div style={valueStyle}>{fmtVal(risk.identified_date)}</div>
              </div>
            )}
            {risk.last_review_date && (
              <div>
                <div style={labelStyle}>{t('josoor.enterprise.detailPanel.lastReview')}</div>
                <div style={valueStyle}>{fmtVal(risk.last_review_date)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** ═══════════════════════════════════════════════════════════
 *  L2 DETAIL VIEW — Group-level capability panel
 *  ═══════════════════════════════════════════════════════════ */
function L2DetailView({ l2, onClose, selectedYear, selectedQuarter, onAIAnalysis }: { l2: L2Capability; onClose: () => void; selectedYear?: number | 'all'; selectedQuarter?: number | 'all'; onAIAnalysis?: () => void }) {
  const { t } = useTranslation();
  const chain = l2.upwardChain;
  const maturityGap = l2.target_maturity_level - l2.maturity_level;

  // Aggregate projects from all L3 children
  const allProjects: any[] = [];
  l2.l3.forEach(l3 => {
    const projects = l3.rawCapability?.linkedProjects || [];
    projects.forEach((p: any) => {
      if (!allProjects.find(ep => ep.id === p.id)) {
        allProjects.push(p);
      }
    });
  });

  // Aggregate process metrics from all L3 children
  const allProcessMetrics: any[] = [];
  l2.l3.forEach(l3 => {
    const metrics = l3.rawCapability?.processMetrics || [];
    metrics.forEach((pm: any) => {
      if (!allProcessMetrics.find(m => m.id === pm.id)) {
        allProcessMetrics.push(pm);
      }
    });
  });

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="sector-details-panel drawer visible"
        style={{ width: '420px', maxWidth: '90vw', height: '100vh', position: 'relative', animation: 'slideInRight 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER (unchanged) ── */}
        <div className="details-header">
          <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="header-text">
              <h2 className="details-title" style={{ textTransform: 'none' }}>
                <span style={{ opacity: 0.6, marginRight: '8px' }}>{l2.id}</span>
                {l2.name}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span className="details-subtitle" style={{ color: 'var(--component-text-muted)' }}>
                  {t('josoor.enterprise.detailPanel.l2Capability')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {onAIAnalysis && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAIAnalysis(); }}
                  title={t('josoor.enterprise.detailPanel.aiAnalysis')}
                  style={{
                    background: 'var(--component-text-accent)',
                    color: 'var(--component-text-on-accent)',
                    border: 'none',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '36px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.02em', lineHeight: 1 }}>
                    {t('josoor.enterprise.detailPanel.aiAnalysis')}
                  </span>
                </button>
              )}
              <button onClick={onClose} className="back-button">&#x2715;</button>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="details-content">

          {/* 1. Maturity — compact row */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={labelStyle}>{t('josoor.enterprise.detailPanel.maturityAssessment')}</span>
              <span style={{
                fontSize: '14px', fontWeight: 600,
                color: maturityGap > 2 ? '#ef4444' : maturityGap > 0 ? '#f59e0b' : '#10b981'
              }}>
                {l2.maturity_level} → {l2.target_maturity_level}
              </span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(l2.maturity_level / 5) * 100}%`, background: 'var(--component-text-accent)', borderRadius: '2px' }} />
            </div>
          </div>

          {/* 2. Description */}
          {l2.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--component-text-secondary)', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                {l2.description}
              </p>
            </div>
          )}

          {/* 2b. Process Metrics — L2 Composite Aggregation from L3 children */}
          {allProcessMetrics.length > 0 && (() => {
            // --- Compute per-metric achievement percentages ---
            const metricAchievements: { metric: any; pct: number; isLowerBetter: boolean }[] = [];
            allProcessMetrics.forEach(pm => {
              const actual = pm.actual != null ? Number(pm.actual) : null;
              const target = pm.target != null ? Number(pm.target) : null;
              const isLowerBetter = pm.metric_type === 'cycle_time' || pm.metric_type === 'cost';
              if (actual != null && target != null && target > 0) {
                const raw = isLowerBetter ? (target / actual) * 100 : (actual / target) * 100;
                metricAchievements.push({ metric: pm, pct: Math.max(0, Math.min(Math.round(raw), 100)), isLowerBetter });
              }
            });

            // --- Group by metric_type and compute per-type scores ---
            const typeWeights: Record<string, number> = { quality: 35, throughput: 25, cycle_time: 25, volume: 10, cost: 5 };
            const typeLabels: Record<string, string> = { quality: 'Quality', throughput: 'Throughput', cycle_time: 'Efficiency', volume: 'Volume', cost: 'Cost' };
            const grouped: Record<string, { pcts: number[]; metrics: any[] }> = {};
            metricAchievements.forEach(({ metric, pct }) => {
              const mType = metric.metric_type || 'other';
              if (!grouped[mType]) grouped[mType] = { pcts: [], metrics: [] };
              grouped[mType].pcts.push(pct);
              grouped[mType].metrics.push({ ...metric, _pct: pct });
            });

            const typeSummaries = Object.entries(grouped).map(([mType, { pcts, metrics }]) => {
              const avg = Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length);
              return { type: mType, label: typeLabels[mType] || mType, score: avg, weight: typeWeights[mType] || 5, metrics };
            });

            // --- Compute weighted composite score ---
            let totalWeight = 0;
            let weightedSum = 0;
            typeSummaries.forEach(ts => { weightedSum += ts.score * ts.weight; totalWeight += ts.weight; });
            const compositeScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
            const compositeColor = compositeScore >= 70 ? '#10b981' : compositeScore >= 40 ? '#f59e0b' : '#ef4444';

            return (
              <>
                <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.compositeScore')}</h3>

                {/* --- Prominent composite score --- */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${compositeColor}33`,
                  borderRadius: '8px', padding: '16px', marginBottom: '16px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: compositeColor, lineHeight: 1.1 }}>
                    {compositeScore}%
                  </div>
                  <div style={{
                    height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px',
                    overflow: 'hidden', marginTop: '10px'
                  }}>
                    <div style={{ height: '100%', width: `${compositeScore}%`, background: compositeColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* --- Breakdown by metric type --- */}
                <h4 style={{ ...sectionTitleStyle, fontSize: '13px', marginBottom: '8px', marginTop: '0' }}>
                  {t('josoor.enterprise.detailPanel.breakdown')}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  {typeSummaries.map(ts => {
                    const clr = ts.score >= 70 ? '#10b981' : ts.score >= 40 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={ts.type} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px',
                        background: 'rgba(255,255,255,0.02)', borderRadius: '4px'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-secondary)', width: '80px', flexShrink: 0 }}>
                          {ts.label}
                        </span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${ts.score}%`, background: clr, borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: clr, width: '36px', textAlign: 'right', flexShrink: 0 }}>
                          {ts.score}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* --- Compact contributing metrics list --- */}
                <h4 style={{ ...sectionTitleStyle, fontSize: '13px', marginBottom: '6px', marginTop: '0' }}>
                  {t('josoor.enterprise.detailPanel.contributingMetrics')} ({allProcessMetrics.length})
                </h4>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '1.5rem',
                  background: 'rgba(255,255,255,0.02)', borderRadius: '6px', padding: '8px 10px'
                }}>
                  {metricAchievements.map(({ metric: pm, pct }) => (
                    <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                      <span style={{ fontSize: '12px', color: 'var(--component-text-secondary)', flex: 1 }}>
                        {pm.metric_name || pm.name}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--component-text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                        {pm.actual != null ? pm.actual : '\u2014'} → {pm.target != null ? pm.target : '\u2014'} {pm.unit || ''}
                      </span>
                    </div>
                  ))}
                  {/* Show metrics that couldn't compute a percentage */}
                  {allProcessMetrics.filter(pm => !metricAchievements.find(ma => ma.metric.id === pm.id)).map(pm => (
                    <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                      <span style={{ fontSize: '12px', color: 'var(--component-text-muted)', flex: 1 }}>
                        {pm.metric_name || pm.name}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--component-text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                        {pm.actual != null ? pm.actual : '\u2014'} {pm.unit || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* 3. KPI Dashboard — full-width cards with bars (NOT GaugeCard) */}
          {chain && chain.performanceTargets.length > 0 && (
            <>
              <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.performanceTargets')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                {chain.performanceTargets.map(perf => {
                  const actual = perf.actual_value != null ? Number(perf.actual_value) : null;
                  const target = perf.target != null ? Number(perf.target) : null;
                  const pct = actual != null && target && target > 0 ? Math.round((actual / target) * 100) : null;
                  const barColor = pct != null ? achievementColor(pct) : '#3b82f6';
                  return (
                    <div key={perf.id} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '6px', padding: '12px 14px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--component-text-primary)', marginBottom: '6px' }}>
                        {perf.name}
                      </div>
                      {actual != null && target != null && (
                        <>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--component-text-primary)', marginBottom: '6px' }}>
                            {actual} / {target} {perf.unit || ''}
                          </div>
                          <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', marginBottom: '4px' }}>
                            <div style={{ height: '100%', width: `${Math.min(pct || 0, 100)}%`, background: barColor, borderRadius: '5px' }} />
                          </div>
                          {pct != null && (
                            <div style={{ fontSize: '13px', fontWeight: 600, color: barColor, textAlign: 'right' }}>
                              {pct}%
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 4. Upward Chain — compact breadcrumb pills */}
          {chain && (chain.objectives.length > 0 || chain.policyTools.length > 0) && (
            <>
              <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.upwardChain')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                {/* Build paths: each objective → each policy tool → this capability */}
                {chain.objectives.length > 0 ? (
                  chain.objectives.map(obj => (
                    <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Objective pill */}
                      <span style={{
                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                        fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap'
                      }}>
                        {obj.name}
                      </span>
                      <span style={{ color: 'var(--component-text-muted)', fontSize: '12px' }}>→</span>
                      {/* Policy tool pills (if any) */}
                      {chain.policyTools.length > 0 ? chain.policyTools.map(pol => (
                        <span key={pol.id} style={{ display: 'contents' }}>
                          <span style={{
                            background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                            fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap'
                          }}>
                            {pol.name}
                          </span>
                          <span style={{ color: 'var(--component-text-muted)', fontSize: '12px' }}>→</span>
                        </span>
                      )) : null}
                      {/* This capability pill */}
                      <span style={{
                        background: 'rgba(244,187,48,0.15)', color: 'var(--component-text-accent)',
                        fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap'
                      }}>
                        {l2.name}
                      </span>
                    </div>
                  ))
                ) : (
                  /* No objectives, just show policy tools → capability */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {chain.policyTools.map(pol => (
                      <span key={pol.id} style={{ display: 'contents' }}>
                        <span style={{
                          background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                          fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap'
                        }}>
                          {pol.name}
                        </span>
                        <span style={{ color: 'var(--component-text-muted)', fontSize: '12px' }}>→</span>
                      </span>
                    ))}
                    <span style={{
                      background: 'rgba(244,187,48,0.15)', color: 'var(--component-text-accent)',
                      fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap'
                    }}>
                      {l2.name}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 5. L3 Children (kept as-is from original) */}
          <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.l3Capabilities')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.5rem' }}>
            {l2.l3.map(l3 => {
              const l3StatusColor = l3.mode === 'execute'
                ? (l3.execute_status === 'issues' ? '#ef4444' : l3.execute_status === 'at-risk' ? '#f59e0b' : l3.execute_status === 'ontrack' ? '#10b981' : '#475569')
                : (l3.build_status?.includes('issues') ? '#ef4444' : l3.build_status?.includes('atrisk') ? '#f59e0b' : l3.build_status === 'in-progress-ontrack' ? '#10b981' : l3.build_status === 'planned' ? '#10b981' : '#475569');
              return (
                <div key={l3.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px', padding: '8px 12px'
                }}>
                  <div>
                    <span style={{ opacity: 0.5, marginRight: '6px', fontSize: '12px' }}>{l3.id}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>{l3.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>{l3.maturity_level}/{l3.target_maturity_level}</span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l3StatusColor }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Projects (kept as-is from original) */}
          <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.projectsStatus')}</h3>
          {allProjects.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
              fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center', marginBottom: '1.5rem'
            }}>
              {t('josoor.enterprise.detailPanel.noLinkedProjects')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.5rem' }}>
              {allProjects.map((proj: any) => {
                const d = projectDisplayValues(proj);
                return (
                  <div key={proj.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${d.isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px', padding: '8px 12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                        <span style={{ opacity: 0.5, marginRight: '6px' }}>{proj.id}</span>
                        {proj.name}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: d.color }}>
                        {d.isOverdue ? t('josoor.enterprise.detailPanel.overdue') : capitalize(proj.status)}
                      </span>
                    </div>
                    {d.pct != null && !d.isPlanned && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>{t('josoor.enterprise.detailPanel.progress')}</span>
                          <span style={{ fontSize: '11px', color: 'var(--component-text-secondary)' }}>{d.pct}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(d.pct, 100)}%`, background: d.color, borderRadius: '2px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
