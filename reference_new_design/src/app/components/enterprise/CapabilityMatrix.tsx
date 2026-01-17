import { useMemo } from 'react';
import type { L1Capability, L2Capability, L3Capability } from '../../data/capabilityData';
import { getL1StatusColor, getL2StatusColor, getL3StatusColor } from '../../utils/enterpriseStatusUtils';
import { calculateHeatmapColor, getOverlayContent, type OverlayType } from '../../utils/enterpriseOverlayUtils';
import './CapabilityMatrix.css';

interface CapabilityMatrixProps {
  capabilityMatrix: L1Capability[];
  selectedOverlay: OverlayType;
  isL3Dimmed: (l3: L3Capability) => boolean;
  onL3Hover: (l3: L3Capability, event: React.MouseEvent) => void;
  onL3Leave: () => void;
}

export function CapabilityMatrix({
  capabilityMatrix,
  selectedOverlay,
  isL3Dimmed,
  onL3Hover,
  onL3Leave
}: CapabilityMatrixProps) {
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
  const isL2Dimmed = (l2: L2Capability): boolean => {
    return l2.l3.every(l3 => isL3Dimmed(l3));
  };

  // Helper to check if L1 is dimmed (all L2s are dimmed)
  const isL1Dimmed = (l1: L1Capability): boolean => {
    return l1.l2.every(l2 => isL2Dimmed(l2));
  };

  return (
    <div className="capability-container">
      <div className="capability-wrapper">
        {capabilityMatrix.map((l1) => {
          const totalL2Count = l1.l2.length;
          const l1Dimmed = isL1Dimmed(l1);

          return (
            <div key={l1.id} className="capability-row-l1">
              <div className="capability-grid" style={{ gridTemplateColumns: '15% 20% 1fr', gridTemplateRows: `repeat(${totalL2Count}, 80px)` }}>
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
                      <span className="maturity-label">Maturity: </span>
                      <span className="maturity-value">{l1.maturity_level}</span>
                      <span className="maturity-slash">/</span>
                      <span className="maturity-target">{l1.target_maturity_level}</span>
                    </div>
                  </div>
                </div>

                {/* L2 and L3 cells */}
                {l1.l2.map((l2) => {
                  const l2Dimmed = l1Dimmed || isL2Dimmed(l2);

                  return (
                    <div key={`l2-row-${l2.id}`} className="l2-row-contents">
                      {/* L2 Cell */}
                      <div
                        className="capability-cell-l2"
                        style={{
                          borderLeft: `3px solid ${l2Dimmed ? '#cbd5e1' : getL2StatusColor(l2, isL3Dimmed)}`
                        }}
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
                            <span className="maturity-label">Maturity: </span>
                            <span className="maturity-value">{l2.maturity_level}</span>
                            <span className="maturity-slash">/</span>
                            <span className="maturity-target">{l2.target_maturity_level}</span>
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
                                className="l3-cell"
                                style={{
                                  borderRight: '1px solid rgba(148, 163, 184, 0.3)',
                                  borderLeft: l3Dimmed ? '3px solid #cbd5e1' : `3px solid ${statusColor}`,
                                  width: l3CellWidth
                                }}
                                onMouseEnter={(e) => onL3Hover(l3, e)}
                                onMouseLeave={onL3Leave}
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