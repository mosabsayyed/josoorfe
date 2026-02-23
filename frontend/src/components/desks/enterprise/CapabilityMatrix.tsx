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

  const getL3KpiPct = (l3: L3Capability): number | null => {
    const rawCap: any = l3.rawCapability || {};
    const kpis: any[] = rawCap.l2Kpis || [];
    if (!kpis.length) return null;

    const matched = kpis.find((entry: any) => (entry?.inputs || []).some((inp: any) => String(inp?.cap_id || '') === String(l3.id))) || kpis[0];
    const actual = matched?.kpi?.actual_value != null ? Number(matched.kpi.actual_value) : null;
    const target = matched?.kpi?.target != null ? Number(matched.kpi.target) : null;
    if (actual == null || target == null || Number.isNaN(actual) || Number.isNaN(target) || target <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
  };

  const getL2RollupPct = (l2: L2Capability): number | null => {
    const values = l2.l3
      .filter(l3 => !isL3Dimmed(l3))
      .map(getL3KpiPct)
      .filter((v): v is number => v != null);
    if (!values.length) return null;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  };

  const getL1RollupPct = (l1: L1Capability): number | null => {
    const values = l1.l2
      .map(getL2RollupPct)
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
              <div className="capability-grid" style={{ gridTemplateColumns: '10% 14% 1fr', gridTemplateRows: `repeat(${totalL2Count}, 100px)` }}>
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
                    <div className="cell-kpi-rollup">
                      <span className="kpi-rollup-label">KPI</span>
                      <span className="kpi-rollup-value">{l1Rollup != null ? `${l1Rollup}%` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* L2 and L3 cells */}
                {l1.l2.map((l2) => {
                  const l2Dimmed = l1Dimmed || isL2Dimmed(l2);
                  const l2Rollup = getL2RollupPct(l2);

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
                          <div className="cell-description">{l2.description}</div>
                          <div className="cell-maturity">
                            <span className="maturity-label">{t('josoor.enterprise.maturityLabel')} </span>
                            <span className="maturity-value">{l2.maturity_level}</span>
                            <span className="maturity-slash">/</span>
                            <span className="maturity-target">{l2.target_maturity_level}</span>
                          </div>
                          <div className="cell-kpi-rollup">
                            <span className="kpi-rollup-label">KPI</span>
                            <span className="kpi-rollup-value">{l2Rollup != null ? `${l2Rollup}%` : '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* L3 Container */}
                      <div className="l3-container-cell">
                        <div className="l3-flex-wrapper">
                          {l2.l3.map((l3) => {
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
                                      backgroundColor: calculateHeatmapColor(l3, selectedOverlay)
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