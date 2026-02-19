import { useTranslation } from 'react-i18next';
import type { L3Capability } from '../../../types/enterprise';
import { getL3StatusColor, getStatusLabel } from '../../../utils/enterpriseStatusUtils';
import type { OverlayType } from '../../../utils/enterpriseOverlayUtils';
import './CapabilityTooltip.css';

interface CapabilityTooltipProps {
  l3: L3Capability;
  x: number;
  y: number;
  selectedOverlay: OverlayType;
}

export function CapabilityTooltip({ l3, x, y, selectedOverlay }: CapabilityTooltipProps) {
  const { t } = useTranslation();
  const statusColor = getL3StatusColor(l3);
  const statusLabel = getStatusLabel(l3);
  const maturityGap = l3.target_maturity_level - l3.maturity_level;

  // Smart positioning to prevent edge cutoff
  const tooltipWidth = 320;
  const tooltipHeight = 400;
  const offsetX = 15;
  const offsetY = 15;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Adjust horizontal position if tooltip would go off right edge
  let tooltipX = x + offsetX;
  if (tooltipX + tooltipWidth > viewportWidth - 20) {
    tooltipX = x - tooltipWidth - offsetX;
  }

  // Adjust vertical position if tooltip would go off bottom edge
  let tooltipY = y + offsetY;
  if (tooltipY + tooltipHeight > viewportHeight - 20) {
    tooltipY = Math.max(20, viewportHeight - tooltipHeight - 20);
  }

  return (
    <div
      className="tooltip-container"
      style={{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`
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
          <span className="tooltip-label">{t('josoor.enterprise.tooltip.mode')}</span>
          <span className="tooltip-value">{l3.mode === 'build' ? t('josoor.enterprise.build') : t('josoor.enterprise.execute')}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">{t('josoor.enterprise.tooltip.maturity')}</span>
          <span className="tooltip-value">{l3.maturity_level} / {l3.target_maturity_level}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">{t('josoor.enterprise.tooltip.gap')}</span>
          <span className={maturityGap > 2 ? 'tooltip-value-highlight-red' : 'tooltip-value-highlight-green'}>
            {t('josoor.enterprise.tooltip.levels', { count: maturityGap })}
          </span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">{t('josoor.enterprise.tooltip.timeline')}</span>
          <span className="tooltip-value">{l3.year} {l3.quarter}</span>
        </div>
      </div>

      {/* Overlay-specific data */}
      {selectedOverlay === 'risk-exposure' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">{t('josoor.enterprise.tooltip.riskExposure')}</div>
          {l3.mode === 'build' ? (
            <>
              <div className="tooltip-row">
                <span className="tooltip-label">{t('josoor.enterprise.tooltip.expectedDelay')}</span>
                <span className="tooltip-value-highlight-amber">+{l3.expected_delay_days || 0} {t('josoor.enterprise.tooltip.days')}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">{t('josoor.enterprise.tooltip.exposure')}</span>
                <span className="tooltip-value-highlight-red">{l3.exposure_percent || 0}%</span>
              </div>
            </>
          ) : (
            <>
              <div className="tooltip-row">
                <span className="tooltip-label">{t('josoor.enterprise.tooltip.exposure')}</span>
                <span className="tooltip-value-highlight-red">{l3.exposure_percent || 0}%</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">{t('josoor.enterprise.tooltip.trend')}</span>
                <span className="tooltip-value">
                  {l3.exposure_trend === 'up' ? t('josoor.enterprise.tooltip.rising') : l3.exposure_trend === 'down' ? t('josoor.enterprise.tooltip.falling') : t('josoor.enterprise.tooltip.stable')}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {selectedOverlay === 'external-pressure' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">{t('josoor.enterprise.tooltip.externalPressure')}</div>
          {l3.mode === 'build' ? (
            <div className="tooltip-row">
              <span className="tooltip-label">{t('josoor.enterprise.tooltip.policyTools')}</span>
              <span className="tooltip-value">{Math.max(1, l3.policy_tool_count || 1)}</span>
            </div>
          ) : (
            <div className="tooltip-row">
              <span className="tooltip-label">{t('josoor.enterprise.tooltip.performanceTargets')}</span>
              <span className="tooltip-value">{Math.max(1, l3.performance_target_count || 1)}</span>
            </div>
          )}
        </div>
      )}

      {selectedOverlay === 'footprint-stress' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">{t('josoor.enterprise.tooltip.footprintStress')}</div>
          <div className="tooltip-row">
            <span className="tooltip-label">{t('josoor.enterprise.tooltip.orgGap')}</span>
            <span className="tooltip-value">{l3.org_gap || 0}%</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">{t('josoor.enterprise.tooltip.processGap')}</span>
            <span className="tooltip-value">{l3.process_gap || 0}%</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">{t('josoor.enterprise.tooltip.itGap')}</span>
            <span className="tooltip-value">{l3.it_gap || 0}%</span>
          </div>
        </div>
      )}

      {selectedOverlay === 'change-saturation' && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">{t('josoor.enterprise.tooltip.changeSaturation')}</div>
          <div className="tooltip-row">
            <span className="tooltip-label">{t('josoor.enterprise.tooltip.activeProjects')}</span>
            <span className="tooltip-value">{l3.active_projects_count || 0}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">{t('josoor.enterprise.tooltip.adoptionLoad')}</span>
            <span className="tooltip-value">{l3.adoption_load || 'Low'} ({l3.adoption_load_percent || 0}%)</span>
          </div>
        </div>
      )}

      {selectedOverlay === 'trend-warning' && l3.health_history && l3.health_history.length >= 3 && (
        <div className="tooltip-overlay-section">
          <div className="tooltip-overlay-title">{t('josoor.enterprise.tooltip.healthTrend')}</div>
          <div className="tooltip-row">
            <span className="tooltip-label">{t('josoor.enterprise.tooltip.last3Cycles')}</span>
            <span className="tooltip-value">{l3.health_history.slice(-3).join(' → ')}</span>
          </div>
          {l3.health_history.slice(-3)[0] > l3.health_history.slice(-3)[1] &&
            l3.health_history.slice(-3)[1] > l3.health_history.slice(-3)[2] && (
              <div className="tooltip-value-highlight-amber mt-1">{t('josoor.enterprise.tooltip.earlyWarning')}</div>
            )}
        </div>
      )}
    </div>
  );
}