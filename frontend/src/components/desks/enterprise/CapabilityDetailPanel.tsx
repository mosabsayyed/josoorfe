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
  onSelectL3?: (l3: L3Capability) => void;
}

/** Format Neo4j integer objects {low, high} to plain number */
function fmtVal(val: any): string {
  if (val == null) return '\u2014';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object' && 'low' in val) return String(val.low);
  return String(val);
}

/** Capitalize first letter of each word */
function capitalize(val: any): string {
  const s = fmtVal(val);
  if (s === '\u2014') return s;
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

// Inline style constants
const labelStyle: React.CSSProperties = {
  fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)',
  marginBottom: '4px', letterSpacing: '0.5px'
};
const valueStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' };
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

/** Achievement color by threshold */
function achievementColor(pct: number): string {
  return pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#ef4444';
}

function computeKpiPct(actualVal: any, targetVal: any): number | null {
  const actual = actualVal != null ? Number(actualVal) : null;
  const target = targetVal != null ? Number(targetVal) : null;
  if (actual == null || target == null || Number.isNaN(actual) || Number.isNaN(target) || target <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
}

/** Project display values — directly from status field, no computation */
function projectDisplayValues(proj: any) {
  const status = String(proj.status || '').toLowerCase();
  const rawPct = proj.progress_percentage;
  const pctRaw = rawPct != null ? (typeof rawPct === 'object' && 'low' in rawPct ? rawPct.low : Number(rawPct)) : null;
  const pct = pctRaw != null ? (pctRaw <= 1 && pctRaw >= 0 ? Math.round(pctRaw * 100) : Math.round(pctRaw)) : null;
  const isPlanned = status === 'planned' || status === 'not_started' || status === 'not-started';
  const isOverdue = false;

  const color = status === 'late' ? '#ef4444'
    : status === 'complete' || status === 'completed' ? '#10b981'
    : status === 'active' ? '#10b981'
    : '#475569';

  return { isPlanned, pct, isOverdue, color, statusLabel: capitalize(status) };
}

// ═══════════════════════════════════════════════════════════
// SEMI-CIRCULAR GAUGE — inline SVG
// ═══════════════════════════════════════════════════════════

function SemiGauge({ value, band, subtitle, centerLabel, statusLabel }: { value: number; band?: string; subtitle?: string; centerLabel?: string; statusLabel?: string }) {
  const width = 180;
  const height = 105;
  const strokeW = 14;
  const radius = 70;
  const cx = width / 2;
  const cy = 90;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dashOffset = circumference - (clamped / 100) * circumference;
  const color = bandColor(band);

  // Arc from left to right (semi-circle)
  const x1 = cx - radius;
  const x2 = cx + radius;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0 1rem' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background track */}
        <path
          d={`M ${x1} ${cy} A ${radius} ${radius} 0 0 1 ${x2} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${x1} ${cy} A ${radius} ${radius} 0 0 1 ${x2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Center value */}
        <text x={cx} y={cy - 20} textAnchor="middle" fill="var(--component-text-primary)" fontSize="28" fontWeight="700">
          {centerLabel || `${Math.round(value)}%`}
        </text>
        {/* Status label */}
        {(statusLabel || band) && (
          <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize="12" fontWeight="600"
            style={{ textTransform: 'uppercase' } as any}>
            {(statusLabel || band || '').toUpperCase()}
          </text>
        )}
      </svg>
      {subtitle && (
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--component-text-secondary)', marginTop: '2px', textAlign: 'center' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION — reusable collapse/expand wrapper
// ═══════════════════════════════════════════════════════════

function CollapsibleSection({ title, count, defaultOpen = false, children }: {
  title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', padding: '6px 0', userSelect: 'none'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-muted)' }}>
          {title} {count != null && <span style={{ color: 'var(--component-text-secondary)' }}>({count})</span>} {open ? '\u25BE' : '\u25B8'}
        </span>
      </div>
      {open && children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MATURITY BLOCKS — visual 1-5 scale
// ═══════════════════════════════════════════════════════════

function MaturityBlocks({ current, target }: { current: number; target: number }) {
  const gap = target - current;
  const gapColor = gap > 2 ? '#ef4444' : gap > 0 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={labelStyle}>MATURITY</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: gapColor }}>
          {current} &rarr; {target} {gap > 0 && <span style={{ opacity: 0.7 }}>(gap: {gap})</span>}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: '8px', borderRadius: '2px',
            background: i <= current
              ? 'var(--component-text-accent)'
              : i <= target
                ? 'rgba(244,187,48,0.2)'
                : 'rgba(255,255,255,0.06)'
          }} />
        ))}
      </div>
    </div>
  );
}

/** Stage Gate Progress — shows S1–S5 boxes per dimension */
function StageGateProgress({ dimensions, target, diagnostics }: {
  dimensions: Array<{ label: string; level: number; isWeakest: boolean; key?: string }>;
  target: number;
  diagnostics?: Map<string, { coveringProject: any; dimRisk: number | null; dimDelay: number | null; dimPersistence: number | null; linkedEntity: any }>;
}) {
  const stageNames = ['S1', 'S2', 'S3', 'S4', 'S5'];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {dimensions.map(dim => {
        const diag = diagnostics?.get(dim.key || dim.label.toLowerCase());
        const isRegressed = dim.level < 3 && diag;
        const isBarRaised = isRegressed && diag?.coveringProject;

        return (
          <div key={dim.label} style={{ marginBottom: isRegressed ? '16px' : '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                color: dim.isWeakest ? '#f59e0b' : 'var(--component-text-muted)'
              }}>
                {dim.label} {dim.isWeakest && '\u26A0'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                S{Math.round(dim.level)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {stageNames.map((name, idx) => {
                const stageNum = idx + 1;
                const currentLevel = Math.round(dim.level);
                const isAchieved = stageNum <= currentLevel;
                const isTarget = stageNum === target;
                const isWithinTarget = stageNum <= target && stageNum > currentLevel;

                return (
                  <div key={name} style={{
                    flex: 1, height: '24px', borderRadius: '3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 600,
                    background: isAchieved
                      ? 'var(--component-text-accent)'
                      : isWithinTarget
                        ? 'rgba(244,187,48,0.15)'
                        : 'rgba(255,255,255,0.04)',
                    color: isAchieved
                      ? 'var(--component-text-on-accent, #000)'
                      : isWithinTarget
                        ? 'var(--component-text-accent)'
                        : 'rgba(255,255,255,0.2)',
                    border: isTarget ? '2px solid var(--component-text-accent)' : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.3s ease'
                  }}>
                    {name}
                  </div>
                );
              })}
            </div>

            {/* Inline diagnostic for regressed dimensions */}
            {isRegressed && (
              <div style={{
                marginTop: '6px', padding: '8px 10px', borderRadius: '4px',
                background: isBarRaised ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                borderLeft: `3px solid ${isBarRaised ? '#f59e0b' : '#ef4444'}`,
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: 600, color: isBarRaised ? '#f59e0b' : '#ef4444', marginBottom: '3px' }}>
                  {isBarRaised ? 'Transformation Gap — Project' : 'Operational Regression'}
                </div>

                {isBarRaised ? (
                  <>
                    <div style={{ color: 'var(--component-text-primary)', fontWeight: 600 }}>
                      <span style={{ opacity: 0.6, marginRight: '6px' }}>{diag.coveringProject.domain_id}</span>
                      {diag.coveringProject.name}
                      <span style={{ fontWeight: 400, color: 'var(--component-text-muted)', marginLeft: '6px' }}>· {capitalize(diag.coveringProject.status)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--component-text-secondary)', fontSize: '12px' }}>
                    {dim.key === 'people' && diag.linkedEntity?.cultureHealth && (
                      <span>
                        <span style={{ opacity: 0.6, marginRight: '4px' }}>{diag.linkedEntity.cultureHealth.domain_id}</span>
                        {diag.linkedEntity.cultureHealth.name} — Survey: {diag.linkedEntity.cultureHealth.survey_score ?? '—'}/{diag.linkedEntity.cultureHealth.target ?? '—'} · Trend: {diag.linkedEntity.cultureHealth.trend ?? '—'}
                      </span>
                    )}
                    {dim.key === 'people' && !diag.linkedEntity?.cultureHealth && (
                      <span style={{ color: 'var(--component-text-muted)' }}>No Culture Health survey data linked</span>
                    )}
                    {dim.key === 'tools' && diag.linkedEntity?.vendor && (
                      <span>
                        <span style={{ opacity: 0.6, marginRight: '4px' }}>{diag.linkedEntity.vendor.domain_id}</span>
                        {diag.linkedEntity.vendor.name} — Rating: {diag.linkedEntity.vendor.performance_rating ?? '—'}/5{diag.linkedEntity.vendor.sla_compliance != null ? ` · SLA: ${diag.linkedEntity.vendor.sla_compliance}%` : ''}
                      </span>
                    )}
                    {dim.key === 'tools' && !diag.linkedEntity?.vendor && (
                      <span style={{ color: 'var(--component-text-muted)' }}>No Vendor performance data linked</span>
                    )}
                    {dim.key === 'process' && (
                      <span style={{ color: 'var(--component-text-muted)' }}>No covering project — new knowledge or training required</span>
                    )}
                  </div>
                )}

                {(diag.dimRisk != null || diag.dimDelay != null) && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px', color: 'var(--component-text-muted)' }}>
                    {diag.dimRisk != null && (
                      <span>Risk: <span style={{ fontWeight: 600, color: diag.dimRisk > 0.6 ? '#ef4444' : diag.dimRisk > 0.3 ? '#f59e0b' : '#10b981' }}>{(diag.dimRisk * 100).toFixed(0)}%</span></span>
                    )}
                    {diag.dimDelay != null && <span>Delay: <span style={{ fontWeight: 600 }}>{diag.dimDelay}d</span></span>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PANEL WRAPPER — shared shell for header, close, AI button
// ═══════════════════════════════════════════════════════════

function PanelShell({ title, subtitle, subtitleColor, onClose, onAIAnalysis, children }: {
  title: React.ReactNode;
  subtitle: string;
  subtitleColor?: string;
  onClose: () => void;
  onAIAnalysis?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="sector-details-panel drawer visible"
        style={{ width: '420px', maxWidth: '90vw', height: '100vh', position: 'relative', animation: 'slideInRight 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="details-header">
          <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="header-text">
              <h2 className="details-title" style={{ textTransform: 'none' }}>{title}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span className="details-subtitle" style={{ color: subtitleColor || 'var(--component-text-muted)' }}>
                  {subtitle}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="back-button">&#x2715;</button>
          </div>
          {onAIAnalysis && (
            <button
              onClick={(e) => { e.stopPropagation(); onAIAnalysis(); }}
              title={t('josoor.enterprise.detailPanel.aiAnalysis')}
              style={{
                background: 'var(--component-text-accent)',
                color: 'var(--component-text-on-accent)',
                border: 'none', padding: '6px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                height: '36px', transition: 'all 0.2s ease', cursor: 'pointer',
                marginTop: '10px', width: '100%', borderRadius: '4px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'scale(1.01)'; }}
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
        </div>
        <div className="details-content">
          {children}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COLLAPSIBLE RISK DETAILS
// ═══════════════════════════════════════════════════════════

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
          {t('josoor.enterprise.detailPanel.riskProfile')} {isOpen ? '\u25BE' : '\u25B8'}
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

// ═══════════════════════════════════════════════════════════
// PROJECTS SECTION — grouped by People/Process/Tools
// ═══════════════════════════════════════════════════════════

function ProjectsSection({ projects }: { projects: any[] }) {
  const { t } = useTranslation();

  if (projects.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
        fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center', marginBottom: '1.5rem'
      }}>
        {t('josoor.enterprise.detailPanel.noLinkedProjects')}
      </div>
    );
  }

  // Group by pillar (People/Process/Tools) — derived from relationship path, not a property
  const pillars = ['People', 'Process', 'Tools'];
  const hasPillars = projects.some((p: any) => p._pillar);

  if (!hasPillars) {
    // Fallback: flat list if pillar info not available
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.5rem' }}>
        {projects.map((proj: any, idx: number) => (
          <ProjectCard key={proj.domain_id || proj.id || idx} proj={proj} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
      {pillars.map(pillar => {
        const pillarProjects = projects.filter((p: any) => p._pillar === pillar);
        if (pillarProjects.length === 0) return null;
        return (
          <div key={pillar}>
            <div style={{ ...labelStyle, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{pillar}</span>
              <span style={{ color: 'var(--component-text-secondary)' }}>{pillarProjects.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pillarProjects.map((proj: any, idx: number) => (
                <ProjectCard key={proj.domain_id || proj.id || idx} proj={proj} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectCard({ proj }: { proj: any }) {
  const { t } = useTranslation();
  const d = projectDisplayValues(proj);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${d.isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '6px', padding: '8px 12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
          <span style={{ opacity: 0.5, marginRight: '6px' }}>{proj.domain_id}</span>{proj.name}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: d.color }}>
          {d.statusLabel}
        </span>
      </div>
      {d.pct != null && !d.isPlanned && (
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(d.pct, 100)}%`, background: d.color, borderRadius: '2px' }} />
        </div>
      )}
      {proj.end_date && (
        <div style={{ fontSize: '11px', color: 'var(--component-text-muted)', marginTop: '4px' }}>
          {proj.end_date}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════

export function CapabilityDetailPanel({ l3, l2, onClose, selectedYear, selectedQuarter, onAIAnalysis, onSelectL3 }: CapabilityDetailPanelProps) {
  if (l2) {
    return <L2DetailView l2={l2} onClose={onClose} selectedYear={selectedYear} selectedQuarter={selectedQuarter} onAIAnalysis={onAIAnalysis} onSelectL3={onSelectL3} />;
  }
  if (!l3) return null;
  return <L3DetailView l3={l3} onClose={onClose} onAIAnalysis={onAIAnalysis} />;
}

// ═══════════════════════════════════════════════════════════
// L3 DETAIL VIEW — BUILD + OPERATE modes
// ═══════════════════════════════════════════════════════════

function L3DetailView({ l3, onClose, onAIAnalysis }: { l3: L3Capability; onClose: () => void; onAIAnalysis?: () => void }) {
  const { t } = useTranslation();
  const [riskDetailsOpen, setRiskDetailsOpen] = useState(false);

  const statusColor = getL3StatusColor(l3);
  const statusLabel = getStatusLabel(l3);
  const cap = l3.rawCapability || {};
  const risk = l3.rawRisk;
  const projects: any[] = cap.linkedProjects || [];
  const entities: any[] = cap.operatingEntities || [];
  const isBuild = l3.mode === 'build';
  // L3 KPI gauge: from execute_status (operate) or build_status (build) — same source as strip
  const processMetrics: any[] = cap.processMetrics || [];
  const primaryProcessMetric = processMetrics[0];
  const l3StatusField = isBuild ? l3.build_status : l3.execute_status;
  const l3KpiBand = l3StatusField === 'issues' || l3StatusField === 'in-progress-issues' ? 'red'
    : l3StatusField === 'at-risk' || l3StatusField === 'in-progress-atrisk' ? 'amber'
    : l3StatusField === 'ontrack' || l3StatusField === 'in-progress-ontrack' ? 'green'
    : undefined;
  // L3 KPI % from Process L3 actual/target (same source as matrix)
  const l3KpiPct = (() => {
    const pm = processMetrics.find((m: any) => m.metric_name && m.target != null) || processMetrics.find((m: any) => m.metric_name) || null;
    if (!pm) return null;
    const actual = pm.actual != null ? Number(pm.actual) : null;
    const target = pm.target != null ? Number(pm.target) : null;
    if (actual == null || target == null || target <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
  })();
  const l3KpiCenterLabel = l3KpiPct != null ? `${l3KpiPct}%` : (l3KpiBand ? capitalize(l3StatusField || '') : undefined);

  const headerTitle = (
    <>
      <span style={{ opacity: 0.6, marginRight: '8px' }}>{l3.id}</span>
      {l3.name}
    </>
  );

  const modeLabel = isBuild ? t('josoor.enterprise.build') : t('josoor.enterprise.operate');
  const subtitle = `${modeLabel} \u00B7 ${capitalize(statusLabel)}`;

  const L3KpiSection = (
    <>
      {(l3KpiPct != null || l3KpiBand) ? (
        <>
          <SemiGauge
            value={l3KpiPct ?? (l3KpiBand === 'green' ? 90 : l3KpiBand === 'amber' ? 70 : 30)}
            band={l3KpiBand}
            centerLabel={l3KpiCenterLabel}
            subtitle={primaryProcessMetric?.metric_name || 'KPI'}
            statusLabel={l3StatusField || undefined}
          />

          {/* Process metric actual/target values under gauge */}
          {processMetrics.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              marginBottom: '1.25rem'
            }}>
              {processMetrics.map((pm: any, idx: number) => {
                const trendIcon = pm.trend === 'improving' ? '\u2191' : pm.trend === 'declining' ? '\u2193' : pm.trend ? '\u2192' : '';
                const trendColor = pm.trend === 'improving' ? '#10b981' : pm.trend === 'declining' ? '#ef4444' : '#f59e0b';
                return (
                  <div key={`${pm.metric_name || idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                    <span style={{ color: 'var(--component-text-primary)', fontWeight: 700 }}>
                      {pm.actual ?? '\u2014'} / {pm.target ?? '\u2014'} {pm.unit || ''}
                    </span>
                    {trendIcon && <span style={{ color: trendColor, fontWeight: 700, fontSize: '20px' }}>{trendIcon}</span>}
                    {pm.indicator_type && (
                      <span style={{ color: 'var(--component-text-muted)', fontStyle: 'italic', fontSize: '14px' }}>{pm.indicator_type}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px',
          fontSize: '13px', color: 'var(--component-text-muted)', textAlign: 'center', marginBottom: '1.5rem'
        }}>
          No linked KPI data found for this capability.
        </div>
      )}
    </>
  );

  return (
    <PanelShell
      title={headerTitle}
      subtitle={subtitle}
      subtitleColor={statusColor}
      onClose={onClose}
      onAIAnalysis={onAIAnalysis}
    >
      {/* ════════════ BUILD MODE ════════════ */}
      {isBuild && (
        <>
          {/* 1. Build mode focus: delivery timeline + projects (no running KPI gauge) */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '6px', padding: '10px', marginBottom: '1rem'
          }}>
            <div style={{ ...labelStyle, marginBottom: '4px' }}>Build Mode</div>
            <div style={{ fontSize: '13px', color: 'var(--component-text-secondary)' }}>
              This capability is in build track. Delivery projects and timeline are the primary signal.
            </div>
          </div>

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
                  {cap.delaySeverity && (
                    <span style={{ opacity: 0.7, marginLeft: '6px' }}>({capitalize(cap.delaySeverity)})</span>
                  )}
                </div>
              ) : cap.plannedByDate ? (
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                  {t('josoor.enterprise.detailPanel.onTrack')}
                </div>
              ) : null}
            </div>
          )}

          {/* 3. Maturity */}
          <MaturityBlocks current={l3.maturity_level} target={l3.target_maturity_level} />

          {/* 3b. Stage Gate Progress — 3 dimensions toward target
           *
           * DIMENSION MATURITY LOGIC (SST Stage Gate Model):
           * - people_score, process_score, tools_score = maturity level (1-5) per dimension
           * - Capability maturity_level = MIN of the 3 dimension levels
           * - To activate (move to operate): ALL 3 dimensions must reach target (min S3)
           * - BUILD mode: dimensions < target → projects exist to close the gap
           *
           * DATA SOURCE ISSUE (2026-03-07):
           * - Currently ETL (run_risk_agent.py) writes FAKE random-seeded values (0-100 scale)
           * - These should be actual maturity levels (1-5) stored on EntityCapability
           * - Real source: OrgUnit(People), Process(Process), ITSystem(Tools) linked via gap relations
           * - Until ETL is fixed, values here may be incorrect
           */}
          {(l3.people_score != null || l3.process_score != null || l3.tools_score != null) && (() => {
            const dims = [
              { label: t('josoor.enterprise.detailPanel.people', 'People'), level: l3.people_score || 1 },
              { label: t('josoor.enterprise.detailPanel.process', 'Process'), level: l3.process_score || 1 },
              { label: t('josoor.enterprise.detailPanel.tools', 'Tools'), level: l3.tools_score || 1 }
            ].filter(d => d.level != null);
            const minLevel = Math.min(...dims.map(d => d.level));
            const allSame = dims.every(d => d.level === dims[0].level);
            const dimensionsWithWeakest = dims.map(d => ({
              ...d,
              isWeakest: !allSame && d.level === minLevel
            }));

            return (
              <>
                <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.stageGateProgress', 'Stage Gate Progress')}</h3>
                <div style={{ fontSize: '12px', color: 'var(--component-text-muted)', marginBottom: '12px' }}>
                  {t('josoor.enterprise.detailPanel.stageGateDesc', 'All 3 dimensions must reach the target stage for activation.')}
                </div>
                <StageGateProgress dimensions={dimensionsWithWeakest} target={l3.target_maturity_level} />
              </>
            );
          })()}

          {/* 4. Projects (collapsible) */}
          <CollapsibleSection title={t('josoor.enterprise.detailPanel.projectDeliverables')} count={projects.length} defaultOpen={false}>
            <ProjectsSection projects={projects} />
          </CollapsibleSection>

          {/* 5. Risk Details (collapsible) */}
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
      {!isBuild && (
        <>
          {/* 1. KPI Achievement Gauge + explicit KPI connectivity */}
          {L3KpiSection}

          {/* 2. Regression Risk Dimensions
           *
           * OPERATE MODE INVARIANT:
           * - Cap is operational (status='active') → all 3 dimensions were at maturity >= S3
           * - If any dimension < S3 now, two scenarios:
           *   A) BAR RAISED: transformation raised the bar, project exists to close gap
           *   B) REGRESSION: conditions that achieved S3 failed (culture drop, vendor SLA, knowledge loss)
           * - Weakest dimension = primary regression risk driver
           *
           * DATA SOURCE: EntityRisk people_score/process_score/tools_score (1-5 scale)
           * WHY DATA:
           *   People: role_gaps_risk, role_gaps_delay_days, role_gaps_persistence
           *          + OrgUnit → MONITORS_FOR → CultureHealth (survey_score, trend)
           *   Tools:  it_systems_risk, it_systems_delay_days, it_systems_persistence
           *          + ITSystem → DEPENDS_ON → Vendor (performance_rating, SLA)
           *   Process: project_outputs_risk, project_outputs_delay_days, project_outputs_persistence
           */}
          {(l3.people_score != null || l3.process_score != null || l3.tools_score != null) && (() => {
            const dims = [
              { key: 'people', label: t('josoor.enterprise.detailPanel.people', 'People'), level: l3.people_score || 1 },
              { key: 'process', label: t('josoor.enterprise.detailPanel.process', 'Process'), level: l3.process_score || 1 },
              { key: 'tools', label: t('josoor.enterprise.detailPanel.tools', 'Tools'), level: l3.tools_score || 1 }
            ].filter(d => d.level != null);
            const minLevel = Math.min(...dims.map(d => d.level));
            const allSame = dims.every(d => d.level === dims[0].level);
            const dimensionsWithWeakest = dims.map(d => ({
              ...d,
              isWeakest: !allSame && d.level === minLevel
            }));

            // Build diagnostics map for dimensions < S3
            const diagMap = new Map<string, any>();
            for (const dim of dims) {
              if (dim.level >= 3) continue;
              const gapType = dim.key === 'people' ? 'People' : dim.key === 'tools' ? 'Tools' : 'Process';
              const coveringProject = projects.find((p: any) => p._pillar === gapType && p.status === 'active');
              const riskPrefix = dim.key === 'people' ? 'role_gaps' : dim.key === 'tools' ? 'it_systems' : 'project_outputs';
              const entityType = dim.key === 'people' ? 'OrgUnit' : dim.key === 'tools' ? 'ITSystem' : 'Process';
              diagMap.set(dim.key, {
                coveringProject,
                dimRisk: risk?.[`${riskPrefix}_risk`] ?? null,
                dimDelay: risk?.[`${riskPrefix}_delay_days`] ?? null,
                dimPersistence: risk?.[`${riskPrefix}_persistence`] ?? null,
                linkedEntity: entities.find((e: any) => e.type === entityType) || null,
              });
            }

            return (
              <>
                <h3 style={sectionTitleStyle}>{t('josoor.enterprise.detailPanel.regressionDimensions', 'Regression Risk Dimensions')}</h3>
                <div style={{ fontSize: '12px', color: 'var(--component-text-muted)', marginBottom: '12px' }}>
                  {t('josoor.enterprise.detailPanel.regressionDimensionsDesc', 'Health of the 3 operational dimensions. Weakest dimension drives regression risk.')}
                </div>
                <StageGateProgress dimensions={dimensionsWithWeakest} target={l3.target_maturity_level} diagnostics={diagMap} />
              </>
            );
          })()}

          {/* 3. Operating Entities (collapsible) */}
          {entities.length > 0 && (
            <CollapsibleSection title={t('josoor.enterprise.detailPanel.operationalFootprint')} count={entities.length} defaultOpen={false}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '0.5rem' }}>
                {entities.map(ent => {
                  const typeKey = ent.type === 'OrgUnit' ? 'orgUnit' : ent.type === 'Process' ? 'processEntity' : 'itSystem';
                  return (
                    <div key={`${ent.type}-${ent.id}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0'
                    }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}><span style={{ opacity: 0.5, marginRight: '6px' }}>{ent.domain_id}</span>{ent.name}</span>
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
            </CollapsibleSection>
          )}

          {/* 5. Risk Details (collapsible) */}
          {risk && (
            <CollapsibleRiskDetails
              risk={risk}
              isOpen={riskDetailsOpen}
              onToggle={() => setRiskDetailsOpen(!riskDetailsOpen)}
            />
          )}
        </>
      )}
    </PanelShell>
  );
}

// ═══════════════════════════════════════════════════════════
// L2 DETAIL VIEW — Group-level capability panel
// ═══════════════════════════════════════════════════════════

function L2DetailView({ l2, onClose, selectedYear, selectedQuarter, onAIAnalysis, onSelectL3 }: {
  l2: L2Capability; onClose: () => void;
  selectedYear?: number | 'all'; selectedQuarter?: number | 'all';
  onAIAnalysis?: () => void;
  onSelectL3?: (l3: L3Capability) => void;
}) {
  const { t } = useTranslation();

  // Aggregate projects from all L3 children (deduped)
  const allProjects: any[] = [];
  (l2.l3 || []).forEach(l3 => {
    const projects = l3.rawCapability?.linkedProjects || [];
    projects.forEach((p: any) => {
      if (!allProjects.find(ep => ep.id === p.id)) allProjects.push(p);
    });
  });

  // L2 KPI gauge: from execute_status (operate) or build_status (build) — same source as strip
  const primaryPerf = l2.upwardChain?.performanceTargets?.[0] || null;
  const l2Mode = l2.l3.some((c: any) => c.mode === 'execute') ? 'execute' : 'build';
  const l2StatusField = l2Mode === 'build' ? l2.build_status : l2.execute_status;
  const gaugeBand = l2StatusField === 'issues' || l2StatusField === 'in-progress-issues' ? 'red'
    : l2StatusField === 'at-risk' || l2StatusField === 'in-progress-atrisk' ? 'amber'
    : l2StatusField === 'ontrack' || l2StatusField === 'in-progress-ontrack' ? 'green'
    : undefined;
  // L2 KPI % from SectorPerformance L2 actual_value/target (same source as matrix)
  const kpiPct = (() => {
    if (!primaryPerf) return null;
    const actual = primaryPerf.actual_value != null ? Number(primaryPerf.actual_value) : null;
    const target = primaryPerf.target != null ? Number(primaryPerf.target) : null;
    if (actual == null || target == null || target <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
  })();
  const kpiCenterLabel = kpiPct != null ? `${kpiPct}%` : (gaugeBand ? capitalize(l2StatusField || '') : undefined);
  // Collect L3 process metric inputs (Process L3 → Cap L3 → this Cap L2)
  const l2ProcessInputs: any[] = [];
  (l2.l3 || []).forEach((l3: any) => {
    const pm = l3.rawCapability?.processMetrics || [];
    pm.forEach((m: any) => l2ProcessInputs.push({ ...m, cap_id: l3.id, cap_name: l3.name }));
  });
  const sectorPerfCount = l2.upwardChain?.performanceTargets?.length || 0;
  const objectiveCount = l2.upwardChain?.objectives?.length || 0;

  const openL3ById = (capId?: string) => {
    if (!capId) return;
    const target = l2.l3.find((entry) => String(entry.id) === String(capId));
    if (target && onSelectL3) onSelectL3(target);
  };

  const headerTitle = (
    <>
      <span style={{ opacity: 0.6, marginRight: '8px' }}>{l2.id}</span>
      {l2.name}
    </>
  );

  return (
    <PanelShell
      title={headerTitle}
      subtitle={t('josoor.enterprise.detailPanel.l2Capability')}
      onClose={onClose}
      onAIAnalysis={onAIAnalysis}
    >
      {/* 1. L3 Children — split into Operational vs Under Construction */}
      {(() => {
        const operationalL3s = (l2.l3 || []).filter(l3 => l3.mode === 'execute');
        const buildingL3s = (l2.l3 || []).filter(l3 => l3.mode === 'build');

        const renderL3Card = (l3: L3Capability) => {
          const rawStatus = String(l3.rawCapability?.status || '').toLowerCase();
          const isNotDue = l3.mode === 'build' && (
            l3.build_status === 'not-due' ||
            rawStatus === 'planned' || rawStatus === 'not_started' || rawStatus === 'not-started' || rawStatus === 'future' || rawStatus === 'pipeline'
          );
          const l3StatusColor = l3.mode === 'execute'
            ? (l3.execute_status === 'issues' ? '#ef4444' : l3.execute_status === 'at-risk' ? '#f59e0b' : l3.execute_status === 'ontrack' ? '#10b981' : '#475569')
            : (l3.build_status?.includes('issues') ? '#ef4444' : l3.build_status?.includes('atrisk') ? '#f59e0b' : l3.build_status === 'in-progress-ontrack' ? '#10b981' : '#475569');

          return (
            <div key={l3.id}
              onClick={() => onSelectL3 && onSelectL3(l3)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: isNotDue ? 'rgba(148,163,184,0.10)' : 'rgba(255,255,255,0.03)',
                border: isNotDue ? '1px solid rgba(148,163,184,0.30)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px', padding: '8px 12px', opacity: isNotDue ? 0.72 : 1,
                cursor: onSelectL3 ? 'pointer' : 'default'
              }}>
              <div>
                <span style={{ opacity: 0.5, marginRight: '6px', fontSize: '12px' }}>{l3.id}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: isNotDue ? 'var(--component-text-muted)' : 'var(--component-text-primary)' }}>
                  {l3.name}
                </span>
                {isNotDue && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--component-text-muted)' }}>
                    ({t('josoor.enterprise.detailPanel.notDue')})
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>
                  {l3.mode === 'execute'
                    ? (() => {
                        const kpis: any[] = l3.rawCapability?.l2Kpis || [];
                        const matched = kpis.find((e: any) => (e?.inputs || []).some((inp: any) => String(inp?.cap_id || '') === String(l3.id))) || kpis[0];
                        const actual = matched?.kpi?.actual_value != null ? Number(matched.kpi.actual_value) : null;
                        const target = matched?.kpi?.target != null ? Number(matched.kpi.target) : null;
                        if (actual == null || target == null || target <= 0) return '—';
                        return `${Math.round((actual / target) * 100)}%`;
                      })()
                    : `${l3.maturity_level}/${l3.target_maturity_level}`}
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isNotDue ? '#64748b' : l3StatusColor }} />
              </div>
            </div>
          );
        };

        return (
          <>
            {/* Block 1: Operational Capabilities (collapsible) */}
            {operationalL3s.length > 0 && (
              <CollapsibleSection title={t('josoor.enterprise.detailPanel.operationalCapabilities')} count={operationalL3s.length} defaultOpen={true}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '0.5rem' }}>
                  {operationalL3s.map(renderL3Card)}
                </div>
              </CollapsibleSection>
            )}

            {/* Block 2: Under Construction (collapsible) */}
            {buildingL3s.length > 0 && (
              <CollapsibleSection title={t('josoor.enterprise.detailPanel.underConstruction')} count={buildingL3s.length} defaultOpen={true}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '0.5rem' }}>
                  {buildingL3s.map(renderL3Card)}
                </div>
              </CollapsibleSection>
            )}
          </>
        );
      })()}

      {/* 1. KPI Achievement Gauge — from SectorPerformance L2 actual_value/target */}
      {(kpiPct != null || gaugeBand) ? (
        <>
          <SemiGauge
            value={kpiPct ?? (gaugeBand === 'green' ? 90 : gaugeBand === 'amber' ? 70 : 30)}
            band={gaugeBand}
            centerLabel={kpiCenterLabel}
            subtitle={primaryPerf?.name || l2.name}
            statusLabel={l2StatusField || undefined}
          />
          {primaryPerf && (
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'var(--component-text-primary)', marginBottom: '1rem' }}>
              {`${primaryPerf.actual_value ?? '\u2014'} / ${primaryPerf.target ?? '\u2014'} ${primaryPerf.unit || ''}`}
            </div>
          )}
        </>
      ) : null}

      {/* 2. Maturity */}
      <MaturityBlocks current={l2.maturity_level} target={l2.target_maturity_level} />

      {/* 3. L2 KPI Formula & Inputs — Path: Process L3 → Cap L3 → Cap L2 → Perf L2 */}
      {primaryPerf && (() => {
        const contributorCaps = Array.from(new Set(l2ProcessInputs.map((inp: any) => inp.cap_id).filter(Boolean)));
        const lowerBetterCount = l2ProcessInputs.filter((inp: any) => inp.metric_type === 'cycle_time' || inp.metric_type === 'cost').length;
        const businessLogicShort = l2ProcessInputs.length > 0
          ? `${primaryPerf.name} is driven by ${l2ProcessInputs.length} L3 process metric${l2ProcessInputs.length > 1 ? 's' : ''} from ${contributorCaps.length || 1} contributing capability${(contributorCaps.length || 1) > 1 ? 'ies' : 'y'}. ${lowerBetterCount > 0 ? `${lowerBetterCount} metric${lowerBetterCount > 1 ? 's use' : ' uses'} lower-is-better scoring.` : 'Higher achievement on these metrics improves the KPI.'}`
          : `${primaryPerf.name} is calculated from linked L3 process metrics.`;

        return (
          <div key={`${primaryPerf.id || (primaryPerf as any).domain_id}_${primaryPerf.target || ''}`} style={{ marginBottom: '1.5rem' }}>
            <h3 style={sectionTitleStyle}>L2 Formula & Inputs</h3>

            {/* L3 Input metrics */}
            {l2ProcessInputs.length > 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.5rem',
                background: 'rgba(255,255,255,0.02)', borderRadius: '6px', padding: '8px 10px'
              }}>
                <div style={{ ...labelStyle, marginBottom: '4px' }}>L3 Inputs</div>
                {l2ProcessInputs.map((inp: any, idx: number) => {
                  const inpActual = inp.actual != null ? Number(inp.actual) : null;
                  const inpTarget = inp.target != null ? Number(inp.target) : null;
                  const isLowerBetter = inp.metric_type === 'cycle_time' || inp.metric_type === 'cost';
                  let inpPct = 0;
                  if (inpActual != null && inpTarget != null && inpTarget > 0) {
                    inpPct = isLowerBetter ? Math.round((inpTarget / inpActual) * 100) : Math.round((inpActual / inpTarget) * 100);
                    inpPct = Math.max(0, Math.min(inpPct, 100));
                  }
                  const inpColor = achievementColor(inpPct);
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
                      <span style={{ fontSize: '12px', color: 'var(--component-text-secondary)', flex: 1, minWidth: 0 }}>
                        {inp.metric_name || inp.name}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--component-text-muted)', whiteSpace: 'nowrap' }}>
                        {inpActual} &rarr; {inpTarget} {inp.unit}
                      </span>
                      <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', width: `${Math.min(inpPct, 100)}%`, background: inpColor, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: inpColor, width: '32px', textAlign: 'right', flexShrink: 0 }}>
                        {inpPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', padding: '10px', marginTop: '8px'
            }}>
              <div style={{ ...labelStyle, marginBottom: '6px' }}>Business Logic (Short)</div>
              <div style={{ fontSize: '13px', color: 'var(--component-text-primary)', marginBottom: '6px', lineHeight: 1.5 }}>
                {businessLogicShort}
              </div>
              {(primaryPerf as any).formula_description && (
                <div style={{ fontSize: '12px', color: 'var(--component-text-muted)', fontStyle: 'italic', marginBottom: '8px', lineHeight: 1.5 }}>
                  {(primaryPerf as any).formula_description}
                </div>
              )}

              {l2ProcessInputs.length > 0 && (
                <div>
                  <div style={{ ...labelStyle, marginBottom: '6px' }}>L3 References</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {l2ProcessInputs.map((inp: any, idx: number) => (
                      <button
                        key={`formula-ref-${idx}`}
                        type="button"
                        onClick={() => openL3ById(inp.cap_id)}
                        style={{
                          fontSize: '12px', color: 'var(--component-text-secondary)', lineHeight: 1.5,
                          background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
                          cursor: onSelectL3 && inp.cap_id ? 'pointer' : 'default',
                          textDecoration: onSelectL3 && inp.cap_id ? 'underline' : 'none'
                        }}
                      >
                        {`${inp.cap_id || 'L3'} · ${inp.metric_name || inp.name || inp.id} (${inp.actual ?? '—'} / ${inp.target ?? '—'} ${inp.unit || ''})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 4. Upward chain links: L3 metrics -> L2 KPI -> Sector Performance -> Objective */}
      {primaryPerf && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={sectionTitleStyle}>Upward Links</h3>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '12px', marginBottom: '10px'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--component-text-primary)', lineHeight: 1.5 }}>
              {`L3 Process Metrics (${l2ProcessInputs.length}) \u2192 L2 KPI (${primaryPerf.name || '\u2014'}) \u2192 Sector Performance (${sectorPerfCount}) \u2192 Sector Objectives (${objectiveCount})`}
            </div>
          </div>

          {(l2.upwardChain?.performanceTargets?.length || 0) > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {l2.upwardChain?.performanceTargets.map((perf: any, idx: number) => (
                <div key={`${perf.id || perf.domain_id || idx}`} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px', padding: '8px 10px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                    {`${perf.domain_id || '\u2014'} \u00B7 ${perf.name || 'Sector Performance'}`}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--component-text-secondary)' }}>
                    {`Actual ${perf.actual_value ?? '\u2014'} / Target ${perf.target ?? '\u2014'} ${perf.unit || ''}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--component-text-muted)' }}>
              No Sector Performance link found for this L2 in current data window.
            </div>
          )}
        </div>
      )}

      {/* 6. Projects (collapsible, aggregated from L3 children) */}
      <CollapsibleSection title={t('josoor.enterprise.detailPanel.projectsStatus')} count={allProjects.length} defaultOpen={false}>
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
              <div key={proj.domain_id || proj.id} style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${d.isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '6px', padding: '8px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                    <span style={{ opacity: 0.5, marginRight: '6px' }}>{proj.domain_id}</span>{proj.name}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: d.color }}>
                    {d.statusLabel}
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
      </CollapsibleSection>
    </PanelShell>
  );
}
