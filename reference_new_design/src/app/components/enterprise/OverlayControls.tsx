import { AlertTriangle, Target, Scale, Activity, TrendingUp } from 'lucide-react';
import type { OverlayType } from '../../utils/enterpriseOverlayUtils';
import './OverlayControls.css';

interface OverlayControlsProps {
  selectedOverlay: OverlayType;
  onToggleOverlay: (overlay: OverlayType) => void;
}

export function OverlayControls({ selectedOverlay, onToggleOverlay }: OverlayControlsProps) {
  const overlayButtons = [
    { id: 'none' as OverlayType, label: 'Status Only', icon: null },
    { id: 'risk-exposure' as OverlayType, label: 'Risk Exposure', icon: AlertTriangle },
    { id: 'external-pressure' as OverlayType, label: 'External Pressure', icon: Target },
    { id: 'footprint-stress' as OverlayType, label: 'Footprint Stress', icon: Scale },
    { id: 'change-saturation' as OverlayType, label: 'Change Saturation', icon: Activity },
    { id: 'trend-warning' as OverlayType, label: 'Trend Warning', icon: TrendingUp }
  ];

  return (
    <div className="overlay-controls-container">
      {overlayButtons.map((btn) => {
        const Icon = btn.icon;
        const isActive = selectedOverlay === btn.id;

        return (
          <button
            key={btn.id}
            onClick={() => onToggleOverlay(btn.id)}
            className={`overlay-btn ${isActive
                ? 'overlay-btn-active'
                : 'overlay-btn-inactive'
              }`}
          >
            {Icon && <Icon className="overlay-icon" />}
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}
