import { useTranslation } from 'react-i18next';
import type { L3Capability, L2Capability } from '../../../types/enterprise';
import { getL3StatusColor, getStatusLabel } from '../../../utils/enterpriseStatusUtils';
import { GaugeCard } from '../sector/GaugeCard';
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

export function CapabilityDetailPanel({ l3, l2, onClose, selectedYear, selectedQuarter, onAIAnalysis }: CapabilityDetailPanelProps) {
  const { t } = useTranslation();

  // R9: L2 view
  if (l2) {
    return <L2DetailView l2={l2} onClose={onClose} selectedYear={selectedYear} selectedQuarter={selectedQuarter} onAIAnalysis={onAIAnalysis} />;
  }

  // L3 view (existing code)
  if (!l3) return null;
  const statusColor = getL3StatusColor(l3);
  const statusLabel = getStatusLabel(l3);
  const cap = l3.rawCapability || {};
  const risk = l3.rawRisk;
  const maturityGap = l3.target_maturity_level - l3.maturity_level;

  // Pre-loaded from initial enterprise query — no extra DB calls
  const projects: any[] = cap.linkedProjects || [];
  const entities: any[] = cap.operatingEntities || [];

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="sector-details-panel drawer visible"
        style={{ width: '420px', maxWidth: '90vw', height: '100vh', position: 'relative', animation: 'slideInRight 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — same as SectorDetailsPanel */}
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

        {/* Scrollable Content */}
        <div className="details-content">

          {/* ════════════════════════════════════════════
              GROUP 1: CAPABILITY IDENTITY
              SST EntityCapability: description, owner, status, level, parent_id
              ════════════════════════════════════════════ */}
          <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.capabilityIdentity')}</h3>

          {/* Description */}
          {cap.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--component-text-secondary)', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                {cap.description}
              </p>
            </div>
          )}

          {/* Identity metrics grid */}
          <div style={gridStyle}>
            {cap.owner && (
              <div>
                <div style={labelStyle}>{t('josoor.enterprise.detailPanel.owner')}</div>
                <div style={valueLargeStyle}>{fmtVal(cap.owner)}</div>
              </div>
            )}
            <div>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.status')}</div>
              <div style={{ ...valueLargeStyle, color: statusColor }}>{capitalize(cap.status)}</div>
            </div>
          </div>

          <div style={gridStyle}>
            <div>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.level')}</div>
              <div style={valueStyle}>{fmtVal(cap.level)}</div>
            </div>
            {cap.parent_id && (
              <div>
                <div style={labelStyle}>{t('josoor.enterprise.detailPanel.parentId')}</div>
                <div style={valueStyle}>{fmtVal(cap.parent_id)}</div>
              </div>
            )}
          </div>

          <div style={gridStyle}>
            <div>
              <div style={labelStyle}>
                {l3.mode === 'build' ? t('josoor.enterprise.detailPanel.startOfBuild') : t('josoor.enterprise.detailPanel.startOfOperate')}
              </div>
              <div style={valueStyle}>Q{fmtVal(cap.quarter)} {fmtVal(cap.year)}</div>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              GROUP 2: MATURITY ASSESSMENT
              SST: maturity_level, target_maturity_level → gap
              ════════════════════════════════════════════ */}
          <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.maturityAssessment')}</h3>

          <div style={gridStyle}>
            <div>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.currentLevel')}</div>
              <div style={valueLargeStyle}>{l3.maturity_level} / 5</div>
            </div>
            <div>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.targetLevel')}</div>
              <div style={valueLargeStyle}>{l3.target_maturity_level} / 5</div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={labelStyle}>{t('josoor.enterprise.tooltip.gap')}</div>
            <div style={{
              ...valueLargeStyle,
              color: maturityGap > 2 ? '#ef4444' : maturityGap > 0 ? '#f59e0b' : '#10b981'
            }}>
              {maturityGap} {maturityGap === 1 ? t('josoor.enterprise.detailPanel.level_one') : t('josoor.enterprise.detailPanel.level_other')}
            </div>
          </div>

          {/* R4: Maturity timeline — due date vs planned date */}
          {l3.mode === 'build' && cap.dueByDate && (
            <div style={{
              background: cap.isLate ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
              border: `1px solid ${cap.isLate ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
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
              {cap.isLate && (
                <div style={{
                  marginTop: '8px', fontSize: '13px', fontWeight: 600,
                  color: cap.delaySeverity === 'significant' ? '#ef4444' : '#f59e0b'
                }}>
                  {t('josoor.enterprise.detailPanel.lateBy', { days: cap.lateByDays })}
                </div>
              )}
              {!cap.isLate && cap.plannedByDate && (
                <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                  {t('josoor.enterprise.detailPanel.onTrack')}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════
              GROUP 3: RISK PROFILE
              SST EntityRisk: risk_category, risk_status, risk_owner, risk_reviewer,
              mitigation_strategy, identified_date, last_review_date
              ════════════════════════════════════════════ */}
          {risk ? (
            <>
              <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.riskProfile')}</h3>

              <div style={{
                background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem'
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

                <div style={gridStyle}>
                  {risk.risk_owner && (
                    <div>
                      <div style={labelStyle}>{t('josoor.enterprise.detailPanel.riskOwner')}</div>
                      <div style={valueStyle}>{fmtVal(risk.risk_owner)}</div>
                    </div>
                  )}
                  {risk.risk_reviewer && (
                    <div>
                      <div style={labelStyle}>{t('josoor.enterprise.detailPanel.riskReviewer')}</div>
                      <div style={valueStyle}>{fmtVal(risk.risk_reviewer)}</div>
                    </div>
                  )}
                </div>

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

              {/* ════════════════════════════════════════════
                  GROUP 4: RISK SCORING (mode-dependent)
                  BUILD: build_band, likelihood_of_delay, delay_days, expected_delay_days, build_exposure_pct
                  EXECUTE: operate_band, people/process/tools scores, operational_health, operate_exposure
                  ════════════════════════════════════════════ */}
              <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.riskAssessment')}</h3>

              {/* BUILD mode */}
              {l3.mode === 'build' && (
                <>
                  {risk.build_band && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={labelStyle}>{t('josoor.enterprise.detailPanel.buildBand')}</div>
                      <div style={{
                        ...valueLargeStyle,
                        color: risk.build_band?.toLowerCase() === 'red' ? '#ef4444'
                          : risk.build_band?.toLowerCase() === 'amber' ? '#f59e0b' : '#10b981'
                      }}>
                        {risk.build_band}
                      </div>
                    </div>
                  )}
                  <div style={gridStyle}>
                    {risk.likelihood_of_delay != null && (
                      <div>
                        <div style={labelStyle}>{t('josoor.enterprise.detailPanel.likelihoodOfDelay')}</div>
                        <div style={valueStyle}>{fmtVal(risk.likelihood_of_delay)}</div>
                      </div>
                    )}
                    {risk.delay_days != null && (
                      <div>
                        <div style={labelStyle}>{t('josoor.enterprise.detailPanel.delayDays')}</div>
                        <div style={valueStyle}>{fmtVal(risk.delay_days)} {t('josoor.enterprise.tooltip.days')}</div>
                      </div>
                    )}
                  </div>
                  <div style={gridStyle}>
                    {risk.expected_delay_days != null && (
                      <div>
                        <div style={labelStyle}>{t('josoor.enterprise.tooltip.expectedDelay')}</div>
                        <div style={{ ...valueStyle, color: '#f59e0b' }}>+{fmtVal(risk.expected_delay_days)} {t('josoor.enterprise.tooltip.days')}</div>
                      </div>
                    )}
                    {risk.build_exposure_pct != null && (
                      <div>
                        <div style={labelStyle}>
                          {t('josoor.enterprise.detailPanel.buildExposure')}
                          <span title={t('josoor.enterprise.detailPanel.buildExposureTooltip')} style={{ cursor: 'help', marginLeft: '4px', opacity: 0.5 }}>ⓘ</span>
                        </div>
                        <div style={{
                          ...valueStyle,
                          color: risk.build_exposure_pct > 65 ? '#ef4444' : risk.build_exposure_pct > 35 ? '#f59e0b' : '#10b981'
                        }}>
                          {Math.round(risk.build_exposure_pct)}%
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* BUILD mode: Project Deliverables grouped by People/Process/Tools (SST §4.5) */}
              {l3.mode === 'build' && (
                <>
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
                            <div style={{ ...labelStyle, marginBottom: '8px' }}>{cat}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {catProjects.map((proj: any) => {
                                const isPlanned = proj.status === 'planned' || proj.status === 'not_started' || proj.status === 'not-started';
                                const rawPct = proj.progress_percentage;
                                const pctRaw = rawPct != null ? (typeof rawPct === 'object' && 'low' in rawPct ? rawPct.low : Number(rawPct)) : null;
                                // If value is <= 1, treat as decimal (0.47 → 47%), otherwise as integer
                                // RULE: When planned → always 0%, discard actual %
                                const pct = isPlanned ? 0 : (pctRaw != null ? (pctRaw <= 1 && pctRaw > 0 ? Math.round(pctRaw * 100) : Math.round(pctRaw)) : null);
                                // Overdue check: end_date exists, status not complete, end_date < today
                                const isOverdue = !isPlanned && proj.end_date && proj.status !== 'complete' && proj.status !== 'completed' && new Date(proj.end_date) < new Date();
                                const projColor = isPlanned ? '#475569' : isOverdue ? '#ef4444' : pct != null && pct >= 100 ? '#10b981' : '#3b82f6';
                                return (
                                  <div key={`${proj.id}-${cat}`} style={{
                                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '6px', padding: '8px 12px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                        <span style={{ opacity: 0.5, marginRight: '6px' }}>{fmtVal(proj.id)}</span>
                                        {proj.name}
                                      </span>
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: projColor }}>
                                        {isOverdue ? t('josoor.enterprise.detailPanel.overdue') : capitalize(proj.status)}
                                      </span>
                                    </div>
                                    {pct != null && !isPlanned && (
                                      <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                          <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>{t('josoor.enterprise.detailPanel.progress')}</span>
                                          <span style={{ fontSize: '11px', color: 'var(--component-text-secondary)' }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: projColor, borderRadius: '2px' }} />
                                        </div>
                                      </div>
                                    )}
                                    {proj.end_date && (
                                      <div style={{ fontSize: '11px', color: 'var(--component-text-muted)', marginTop: '4px' }}>
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
                </>
              )}

              {/* EXECUTE mode */}
              {l3.mode === 'execute' && (
                <>
                  {risk.operate_band && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={labelStyle}>{t('josoor.enterprise.detailPanel.operateBand')}</div>
                      <div style={{
                        ...valueLargeStyle,
                        color: risk.operate_band?.toLowerCase() === 'red' ? '#ef4444'
                          : risk.operate_band?.toLowerCase() === 'amber' ? '#f59e0b' : '#10b981'
                      }}>
                        {risk.operate_band}
                      </div>
                    </div>
                  )}

                  {/* Score bars — show actual entity names when available */}
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
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(s.val / 5) * 100}%`, background: 'var(--component-text-accent)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={gridStyle}>
                    {risk.operational_health_pct != null && (
                      <div>
                        <div style={labelStyle}>{t('josoor.enterprise.detailPanel.operationalHealth')}</div>
                        <div style={{
                          ...valueLargeStyle,
                          color: risk.operational_health_pct >= 70 ? '#10b981' : risk.operational_health_pct >= 40 ? '#f59e0b' : '#ef4444'
                        }}>
                          {Math.round(risk.operational_health_pct)}%
                        </div>
                      </div>
                    )}
                    {risk.operate_exposure_pct_effective != null && (
                      <div>
                        <div style={labelStyle}>
                          {t('josoor.enterprise.detailPanel.operateExposure')}
                          <span title={t('josoor.enterprise.detailPanel.operateExposureTooltip')} style={{ cursor: 'help', marginLeft: '4px', opacity: 0.5 }}>ⓘ</span>
                        </div>
                        <div style={{
                          ...valueLargeStyle,
                          color: risk.operate_exposure_pct_effective > 65 ? '#ef4444' : risk.operate_exposure_pct_effective > 35 ? '#f59e0b' : '#10b981'
                        }}>
                          {Math.round(risk.operate_exposure_pct_effective)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {risk.operate_trend_flag && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '4px', padding: '8px 12px', fontSize: '13px', color: '#f59e0b', fontWeight: 600
                    }}>
                      {t('josoor.enterprise.tooltip.earlyWarning')}
                    </div>
                  )}

                  {/* Operational Footprint — actual entity names (SST §4.4) */}
                  <h3 style={{ ...sectionTitleStyle, marginTop: '1.5rem' }}>{t('josoor.enterprise.detailPanel.operationalFootprint')}</h3>
                  {entities.length === 0 ? (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
                      fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center', marginBottom: '1.5rem'
                    }}>
                      {t('josoor.enterprise.detailPanel.noOperatingEntities')}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                      {entities.map(ent => {
                        const typeKey = ent.type === 'OrgUnit' ? 'orgUnit' : ent.type === 'Process' ? 'processEntity' : 'itSystem';
                        return (
                          <div key={`${ent.type}-${ent.id}`} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '6px', padding: '8px 12px'
                          }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>{ent.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--component-text-muted)', marginTop: '2px' }}>
                                {t(`josoor.enterprise.detailPanel.${typeKey}`)}
                              </div>
                            </div>
                            {ent.status && (
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--component-text-secondary)' }}>
                                {capitalize(ent.status)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* R5: Performance Targets / KPIs linked to capability (SST §4.3) */}
                  {(() => {
                    const perfTargets: any[] = cap.performanceTargets || [];
                    return perfTargets.length > 0 ? (
                      <>
                        <h3 style={{ ...sectionTitleStyle, marginTop: '1.5rem' }}>{t('josoor.enterprise.detailPanel.performanceTargets')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                          {perfTargets.map((perf: any) => {
                            const actual = perf.actual_value != null ? Number(perf.actual_value) : null;
                            const target = perf.target != null ? Number(perf.target) : null;
                            const pct = actual != null && target && target > 0 ? Math.round((actual / target) * 100) : null;
                            const barColor = pct != null ? (pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444') : '#3b82f6';
                            return (
                              <div key={perf.id} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '6px', padding: '10px 14px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>{perf.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--component-text-muted)', marginTop: '2px' }}>
                                      {perf.id} • L{fmtVal(perf.level)}
                                    </div>
                                  </div>
                                  {perf.status && (
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: barColor }}>
                                      {capitalize(perf.status)}
                                    </span>
                                  )}
                                </div>
                                {actual != null && target != null && (
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                      <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>
                                        {actual} / {target} {perf.unit || ''}
                                      </span>
                                      {pct != null && (
                                        <span style={{ fontSize: '11px', color: barColor, fontWeight: 600 }}>{pct}%</span>
                                      )}
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${Math.min(pct || 0, 100)}%`, background: barColor, borderRadius: '2px' }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : null;
                  })()}
                </>
              )}

            </>
          ) : (
            /* No risk data */
            <div style={{
              background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
              fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center'
            }}>
              {t('josoor.enterprise.detailPanel.noRiskData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** R9: L2 Upward Chain Detail View */
function L2DetailView({ l2, onClose, selectedYear, selectedQuarter, onAIAnalysis }: { l2: L2Capability; onClose: () => void; selectedYear?: number | 'all'; selectedQuarter?: number | 'all'; onAIAnalysis?: () => void }) {
  const { t } = useTranslation();
  const chain = l2.upwardChain;

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

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="sector-details-panel drawer visible"
        style={{ width: '420px', maxWidth: '90vw', height: '100vh', position: 'relative', animation: 'slideInRight 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Scrollable Content */}
        <div className="details-content">

          {/* Maturity */}
          <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.maturityAssessment')}</h3>
          <div style={gridStyle}>
            <div>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.currentLevel')}</div>
              <div style={valueLargeStyle}>{l2.maturity_level} / 5</div>
            </div>
            <div>
              <div style={labelStyle}>{t('josoor.enterprise.detailPanel.targetLevel')}</div>
              <div style={valueLargeStyle}>{l2.target_maturity_level} / 5</div>
            </div>
          </div>

          {/* Description */}
          {l2.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--component-text-secondary)', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                {l2.description}
              </p>
            </div>
          )}

          {/* Upward Chain Tree */}
          {chain && (
            <>
              <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.upwardChain')}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                {/* This capability */}
                <div style={{
                  background: 'rgba(244, 187, 48, 0.1)',
                  border: '1px solid rgba(244, 187, 48, 0.3)',
                  borderRadius: '6px', padding: '10px 14px'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-accent)', marginBottom: '2px' }}>
                    {t('josoor.enterprise.detailPanel.capability')}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                    {l2.id} — {l2.name}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ textAlign: 'center', color: 'var(--component-text-muted)', fontSize: '16px' }}>&#x2191;</div>

                {/* PolicyTools */}
                {chain.policyTools.length > 0 && chain.policyTools.map(pol => (
                  <div key={pol.id} style={{
                    background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '6px', padding: '10px 14px'
                  }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#818cf8', marginBottom: '2px' }}>
                      {t('josoor.enterprise.detailPanel.policyTool')}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                      {pol.id} — {pol.name}
                    </div>
                    {pol.end_date && (
                      <div style={{ fontSize: '11px', color: 'var(--component-text-muted)', marginTop: '2px' }}>
                        {t('josoor.enterprise.detailPanel.endDate')}: {pol.end_date}
                      </div>
                    )}
                  </div>
                ))}

                {/* Performance targets */}
                {chain.performanceTargets.length > 0 && chain.performanceTargets.map(perf => (
                  <div key={perf.id} style={{
                    background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '6px', padding: '10px 14px'
                  }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', marginBottom: '2px' }}>
                      {t('josoor.enterprise.detailPanel.performanceTarget')}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                      {perf.id} — {perf.name}
                    </div>
                    {perf.actual_value != null && perf.target != null && (
                      <div style={{ fontSize: '12px', color: 'var(--component-text-secondary)', marginTop: '4px' }}>
                        {perf.actual_value} / {perf.target} {perf.unit || ''}
                      </div>
                    )}
                  </div>
                ))}

                {/* Arrow to objectives */}
                {chain.objectives.length > 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--component-text-muted)', fontSize: '16px' }}>&#x2191;</div>
                )}

                {/* Objectives */}
                {chain.objectives.map(obj => (
                  <div key={obj.id} style={{
                    background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '6px', padding: '10px 14px'
                  }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '2px' }}>
                      {t('josoor.enterprise.detailPanel.objective')}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                      {obj.id} — {obj.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* KPI Gauges */}
          {chain && chain.performanceTargets.length > 0 && (
            <>
              <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.kpiGauges')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                {chain.performanceTargets.map(perf => {
                  const val = perf.actual_value != null && perf.target
                    ? Math.round((perf.actual_value / perf.target) * 100)
                    : 0;
                  const status: 'green' | 'amber' | 'red' = val >= 70 ? 'green' : val >= 40 ? 'amber' : 'red';
                  return (
                    <GaugeCard
                      key={perf.id}
                      label={perf.name}
                      value={val}
                      status={status}
                      delta=""
                      baseValue={0}
                      qMinus1={0}
                      qPlus1={0}
                      endValue={100}
                      level={2}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* Projects & Status */}
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
                const isPlanned = proj.status === 'planned' || proj.status === 'not_started' || proj.status === 'not-started';
                const rawPct = proj.progress_percentage;
                const pctRaw = rawPct != null ? (typeof rawPct === 'object' && 'low' in rawPct ? rawPct.low : Number(rawPct)) : null;
                const pct = isPlanned ? 0 : (pctRaw != null ? (pctRaw <= 1 && pctRaw > 0 ? Math.round(pctRaw * 100) : Math.round(pctRaw)) : null);
                const isOverdue = !isPlanned && proj.end_date && proj.status !== 'complete' && proj.status !== 'completed' && new Date(proj.end_date) < new Date();
                const projColor = isPlanned ? '#475569' : isOverdue ? '#ef4444' : pct != null && pct >= 100 ? '#10b981' : '#3b82f6';
                return (
                  <div key={proj.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px', padding: '8px 12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                        <span style={{ opacity: 0.5, marginRight: '6px' }}>{proj.id}</span>
                        {proj.name}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: projColor }}>
                        {isOverdue ? t('josoor.enterprise.detailPanel.overdue') : capitalize(proj.status)}
                      </span>
                    </div>
                    {pct != null && !isPlanned && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>{t('josoor.enterprise.detailPanel.progress')}</span>
                          <span style={{ fontSize: '11px', color: 'var(--component-text-secondary)' }}>{pct}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: projColor, borderRadius: '2px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* L3 Children summary */}
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
        </div>
      </div>
    </div>
  );
}
