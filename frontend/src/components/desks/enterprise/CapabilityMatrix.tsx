import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { L1Capability, L2Capability, L3Capability } from '../../../types/enterprise';
import { getL1StatusColor, getL2StatusColor, getL3StatusColor } from '../../../utils/enterpriseStatusUtils';
import { calculateHeatmapColor, getOverlayContent, type OverlayType } from '../../../utils/enterpriseOverlayUtils';
import './CapabilityMatrix.css';

interface CapabilityMatrixProps {
  capabilityMatrix: L1Capability[];
  selectedOverlay: OverlayType;
  isL3Dimmed: (l3: L3Capability) => boolean;
  onL3Hover: (l3: L3Capability, event: React.MouseEvent) => void;
  onL3Leave: () => void;
  onL3Click: (l3: L3Capability) => void;
  onL2Click?: (l2: L2Capability) => void;
  highPriorityCapIds?: Set<string>;
}

export function CapabilityMatrix({
  capabilityMatrix,
  selectedOverlay,
  isL3Dimmed,
  onL3Hover,
  onL3Leave,
  onL3Click,
  onL2Click,
  highPriorityCapIds
}: CapabilityMatrixProps) {
  const { t } = useTranslation();

  // L3 KPI: from EntityProcess matched to same-level cap (operate mode only)
  const getL3Process = (l3: L3Capability): any | null => {
    if (l3.mode === 'build') return null;
    const metrics: any[] = (l3.rawCapability || {} as any).processMetrics || [];
    return metrics.find((m: any) => m.metric_name && m.target != null) || metrics.find((m: any) => m.metric_name) || null;
  };

  const getL3KpiPct = (l3: L3Capability): number | null => {
    const proc = getL3Process(l3);
    if (!proc) return null;
    const actual = proc.actual != null ? Number(proc.actual) : null;
    const target = proc.target != null ? Number(proc.target) : null;
    if (actual == null || target == null || target <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
  };

  // L2 KPI: from SectorPerformance via upwardChain.performanceTargets
  const getL2Perf = (l2: L2Capability): any | null => {
    const pts = l2.upwardChain?.performanceTargets || [];
    // Prefer one with actual_value and target
    return pts.find((p: any) => p.actual_value != null && p.target != null) || pts[0] || null;
  };

  const getL2KpiPct = (l2: L2Capability): number | null => {
    const perf = getL2Perf(l2);
    if (!perf) return null;
    const actual = perf.actual_value != null ? Number(perf.actual_value) : null;
    const target = perf.target != null ? Number(perf.target) : null;
    if (actual == null || target == null || target <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
  };

  const getL2KpiName = (l2: L2Capability): string | null => {
    const perf = getL2Perf(l2);
    return perf?.name || null;
  };

  const isL2Operate = (l2: L2Capability): boolean =>
    l2.l3.some(l3 => l3.mode === 'execute');

  const isL1Operate = (l1: L1Capability): boolean =>
    l1.l2.some(l2 => isL2Operate(l2));

  const getL1RollupPct = (l1: L1Capability): number | null => {
    const values = l1.l2
      .map(getL2KpiPct)
      .filter((v): v is number => v != null);
    if (!values.length) return null;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  };
  // Calculate max L3 count across all L2s to determine fixed cell width
  const maxL3Count = useMemo(() => {
    let max = 0;
    capabilityMatrix.forEach(l1 => {
      l1.l2.forEach(l2 => {
        if (l2.l3.length > max) {
          max = l2.l3.length;
        }
      });
    });
    return max;
  }, [capabilityMatrix]);

  const maxDependencyCount = useMemo(() => {
    let max = 1;
    capabilityMatrix.forEach(l1 => {
      l1.l2.forEach(l2 => {
        l2.l3.forEach(l3 => {
          if ((l3.dependency_count || 0) > max) max = l3.dependency_count!;
        });
      });
    });
    return max;
  }, [capabilityMatrix]);

  // Fixed L3 cell width - all cells same width
  const l3CellWidth = `${100 / maxL3Count}%`;

  // Helper to check if L2 is dimmed (all L3s are dimmed)
  // Empty L2s (no L3 children) are NOT dimmed - they show with red status borders
  const isL2Dimmed = (l2: L2Capability): boolean => {
    if (l2.l3.length === 0) return false; // Show empty L2s (red border = incomplete)
    return l2.l3.every(l3 => isL3Dimmed(l3));
  };

  // Helper to check if L1 is dimmed (all L2s are dimmed)
  // Empty L1s (no L2 children) are NOT dimmed - they show with red status borders
  const isL1Dimmed = (l1: L1Capability): boolean => {
    if (l1.l2.length === 0) return false; // Show empty L1s (red border = incomplete)
    return l1.l2.every(l2 => isL2Dimmed(l2));
  };

  return (
    <div className="capability-container">
      <div className="capability-wrapper">
        {capabilityMatrix.map((l1) => {
          const totalL2Count = l1.l2.length;
          const l1Dimmed = isL1Dimmed(l1);
          const l1Rollup = getL1RollupPct(l1);

          return (
            <div key={l1.id} className="capability-row-l1">
              <div className="capability-grid" style={{ gridTemplateColumns: '10% 14% 1fr', gridTemplateRows: `repeat(${totalL2Count}, minmax(100px, auto))` }}>
                {/* L1 Cell - Spans all rows */}
                <div
                  className="capability-cell-l1"
                  style={{
                    gridRow: `1 / span ${totalL2Count}`,
                    borderLeft: `3px solid ${l1Dimmed ? '#cbd5e1' : getL1StatusColor(l1, isL3Dimmed)}`
                  }}
                >
                  {/* Grey out overlay for L1 (when dimmed) */}
                  {l1Dimmed && (
                    <div className="dimmed-overlay" />
                  )}

                  {/* Content */}
                  <div className="cell-content-wrapper">
                    <div className="cell-id">{l1.id}</div>
                    <div className="cell-name-l1">{l1.name}</div>
                    <div className="cell-description">{l1.description}</div>
                    <div className="cell-maturity">
                      <span className="maturity-label">{t('josoor.enterprise.maturityLabel')} </span>
                      <span className="maturity-value">{l1.maturity_level}</span>
                      <span className="maturity-slash">/</span>
                      <span className="maturity-target">{l1.target_maturity_level}</span>
                    </div>
                    {isL1Operate(l1) && (
                      <div className="cell-kpi-rollup">
                        <span className="kpi-rollup-label">KPI</span>
                        <span className="kpi-rollup-value">{l1Rollup != null ? `${l1Rollup}%` : '—'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* L2 and L3 cells */}
                {[...l1.l2].sort((a, b) => {
                  const pa = a.id.split('.').map(Number);
                  const pb = b.id.split('.').map(Number);
                  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
                    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
                  }
                  return 0;
                }).map((l2) => {
                  const l2Dimmed = l1Dimmed || isL2Dimmed(l2);
                  const l2Kpi = getL2KpiPct(l2);
                  const l2KpiName = getL2KpiName(l2);

                  return (
                    <div key={`l2-row-${l2.id}`} className="l2-row-contents">
                      {/* L2 Cell */}
                      <div
                        className={`capability-cell-l2${onL2Click ? ' l2-clickable' : ''}`}
                        style={{
                          borderLeft: `3px solid ${l2Dimmed ? '#cbd5e1' : getL2StatusColor(l2, isL3Dimmed)}`,
                          cursor: onL2Click ? 'pointer' : 'default'
                        }}
                        onClick={() => onL2Click && onL2Click(l2)}
                      >
                        {/* Grey out overlay for L2 (when dimmed) */}
                        {l2Dimmed && (
                          <div className="dimmed-overlay" />
                        )}

                        {/* Content */}
                        <div className="cell-content-wrapper">
                          <div className="cell-id">{l2.id}</div>
                          <div className="cell-name-l2">{l2.name}</div>
                          <div className="cell-maturity">
                            <span className="maturity-label">{t('josoor.enterprise.maturityLabel')} </span>
                            <span className="maturity-value">{l2.maturity_level}</span>
                            <span className="maturity-slash">/</span>
                            <span className="maturity-target">{l2.target_maturity_level}</span>
                          </div>
                          {isL2Operate(l2) && (
                            <div className="cell-kpi-rollup">
                              <span className="kpi-rollup-label">{l2KpiName || 'KPI'}</span>
                              <span className="kpi-rollup-value">{l2Kpi != null ? `${l2Kpi}%` : '—'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* L3 Container */}
                      <div className="l3-container-cell">
                        <div className="l3-flex-wrapper">
                          {[...l2.l3].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })).map((l3) => {
                            const statusColor = getL3StatusColor(l3);
                            const l3Dimmed = l1Dimmed || l2Dimmed || isL3Dimmed(l3);
                            const overlayContent = getOverlayContent(l3, selectedOverlay);

                            return (
                              <div
                                key={l3.id}
                                className={`l3-cell${highPriorityCapIds?.has(l3.id) ? ' high-priority-glow' : ''}`}
                                style={{
                                  borderRight: '1px solid rgba(148, 163, 184, 0.3)',
                                  borderLeft: l3Dimmed ? '3px solid #cbd5e1' : `3px solid ${statusColor}`,
                                  width: l3CellWidth
                                }}
                                onMouseEnter={(e) => onL3Hover(l3, e)}
                                onMouseLeave={onL3Leave}
                                onClick={() => onL3Click(l3)}
                              >
                                {/* Grey out overlay (when dimmed) - overrides everything */}
                                {l3Dimmed && (
                                  <div
                                    className="dimmed-overlay-l3"
                                  />
                                )}

                                {/* Heatmap Overlay (only when NOT dimmed) */}
                                {!l3Dimmed && selectedOverlay !== 'none' && (
                                  <div
                                    className="heatmap-overlay"
                                    style={{
                                      backgroundColor: calculateHeatmapColor(l3, selectedOverlay, maxDependencyCount)
                                    }}
                                  />
                                )}

                                {/* Content */}
                                <div className="l3-cell-content">
                                  <div className="l3-id">{l3.id}</div>
                                  <div className="l3-name">{l3.name}</div>
                                  <div className="l3-maturity">
                                    {l3.maturity_level}/{l3.target_maturity_level}
                                  </div>

                                  {/* KPI for operate-mode L3 */}
                                  {l3.mode === 'execute' && (() => {
                                    const proc = getL3Process(l3);
                                    if (!proc) return null;
                                    const pct = getL3KpiPct(l3);
                                    return (
                                      <div className="cell-kpi-rollup l3-kpi">
                                        <span className="kpi-rollup-label">{proc.metric_name}</span>
                                        <span className="kpi-rollup-value">{pct != null ? `${pct}%` : '—'}</span>
                                      </div>
                                    );
                                  })()}

                                  {/* Overlay Content Display (only when NOT dimmed) */}
                                  {!l3Dimmed && overlayContent && (
                                    <div className="l3-overlay-tag">
                                      {overlayContent}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}