import type { L3Capability } from '../../data/capabilityData';
import { getL3StatusColor, getStatusLabel } from '../../utils/enterpriseStatusUtils';
import type { OverlayType } from '../../utils/enterpriseOverlayUtils';
import './CapabilityTooltip.css';

interface CapabilityTooltipProps {
  l3: L3Capability;
  x: number;
  y: number;
  selectedOverlay: OverlayType;
}

export function CapabilityTooltip({ l3, x, y, selectedOverlay }: CapabilityTooltipProps) {
  const statusColor = getL3StatusColor(l3);
  const statusLabel = getStatusLabel(l3);
  const maturityGap = l3.target_maturity_level - l3.maturity_level;

  return (
    <div
      className="tooltip-container"
      style={{
        left: `${x + 15}px`,
        top: `${y + 15}px`
      }}
    >
      {/* Header */}
      <div className="tooltip-header">
        <div className="tooltip-header-content">
          <div className="tooltip-id">{l3.id}</div>
          <div className="tooltip-name">{l3.name}</div>
        </div>
        <div
          className="tooltip-status-badge"
          style={{
            backgroundColor: `${statusColor}33`,
            color: statusColor,
            border: `1px solid ${statusColor}`
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Core Info */}
      <div className="tooltip-core-info">
        <div className="tooltip-row">
          <span className="tooltip-label">Mode:</span>
          <span className="tooltip-value">{l3.mode === 'build' ? 'Build' : 'Execute'}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Maturity:</span>
          <span className="tooltip-value">{l3.maturity_level} / {l3.target_maturity_level}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Gap:</span>
          <span className={maturityGap > 2 ? 'tooltip-value-highlight-red' : 'tooltip-value-highlight-green'}>
            {maturityGap} {maturityGap === 1 ? 'level' : 'levels'}
          </span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Timeline:</span>
          <span className="tooltip-value">{l3.year} {l3.quarter}</span>
        </div>
      </div>

      {/* Overlay-specific data */}
      {selectedOverlay === 'risk-exposure' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">Risk Exposure:</div>
          {l3.mode === 'build' ? (
            <>
              <div className="tooltip-row">
                <span className="tooltip-label">Expected Delay:</span>
                <span className="tooltip-value-highlight-amber">+{l3.expected_delay_days || 0} days</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">Exposure:</span>
                <span className="tooltip-value-highlight-red">{l3.exposure_percent || 0}%</span>
              </div>
            </>
          ) : (
            <>
              <div className="tooltip-row">
                <span className="tooltip-label">Exposure:</span>
                <span className="tooltip-value-highlight-red">{l3.exposure_percent || 0}%</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">Trend:</span>
                <span className="tooltip-value">
                  {l3.exposure_trend === 'up' ? '▲ Rising' : l3.exposure_trend === 'down' ? '▼ Falling' : '■ Stable'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {selectedOverlay === 'external-pressure' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">External Pressure:</div>
          {l3.mode === 'build' ? (
            <div className="tooltip-row">
              <span className="tooltip-label">Policy Tools:</span>
              <span className="tooltip-value">{Math.max(1, l3.policy_tool_count || 1)}</span>
            </div>
          ) : (
            <div className="tooltip-row">
              <span className="tooltip-label">Performance Targets:</span>
              <span className="tooltip-value">{Math.max(1, l3.performance_target_count || 1)}</span>
            </div>
          )}
        </div>
      )}

      {selectedOverlay === 'footprint-stress' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">Footprint Stress:</div>
          <div className="tooltip-row">
            <span className="tooltip-label">Org Gap:</span>
            <span className="tooltip-value">{l3.org_gap || 0}%</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Process Gap:</span>
            <span className="tooltip-value">{l3.process_gap || 0}%</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">IT Gap:</span>
            <span className="tooltip-value">{l3.it_gap || 0}%</span>
          </div>
        </div>
      )}

      {selectedOverlay === 'change-saturation' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">Change Saturation:</div>
          <div className="tooltip-row">
            <span className="tooltip-label">Active Projects:</span>
            <span className="tooltip-value">{l3.active_projects_count || 0}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Adoption Load:</span>
            <span className="tooltip-value">{l3.adoption_load || 'Low'} ({l3.adoption_load_percent || 0}%)</span>
          </div>
        </div>
      )}

      {selectedOverlay === 'trend-warning' && l3.health_history && l3.health_history.length >= 3 && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">Health Trend:</div>
          <div className="tooltip-row">
            <span className="tooltip-label">Last 3 Cycles:</span>
            <span className="tooltip-value">{l3.health_history.slice(-3).join(' → ')}</span>
          </div>
          {l3.health_history.slice(-3)[0] > l3.health_history.slice(-3)[1] &&
            l3.health_history.slice(-3)[1] > l3.health_history.slice(-3)[2] && (
              <div className="tooltip-value-highlight-amber mt-1">⚠️ Early warning: 2-cycle decline</div>
            )}
        </div>
      )}
    </div>
  );
}