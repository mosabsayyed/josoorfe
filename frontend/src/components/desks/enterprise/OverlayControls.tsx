import { AlertTriangle, Target, Scale, Activity, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OverlayType } from '../../../utils/enterpriseOverlayUtils';
import './OverlayControls.css';

interface OverlayControlsProps {
    selectedOverlay: OverlayType;
    onToggleOverlay: (overlay: OverlayType) => void;
}

export function OverlayControls({ selectedOverlay, onToggleOverlay }: OverlayControlsProps) {
    const { t } = useTranslation();
    const overlayButtons = [
        { id: 'none' as OverlayType, label: t('josoor.enterprise.statusOnly'), icon: null },
        { id: 'risk-exposure' as OverlayType, label: t('josoor.enterprise.riskExposure'), icon: AlertTriangle },
        { id: 'external-pressure' as OverlayType, label: t('josoor.enterprise.externalPressure'), icon: Target },
        { id: 'footprint-stress' as OverlayType, label: t('josoor.enterprise.footprintStress'), icon: Scale },
        { id: 'change-saturation' as OverlayType, label: t('josoor.enterprise.changeSaturation'), icon: Activity },
        { id: 'trend-warning' as OverlayType, label: t('josoor.enterprise.trendWarning'), icon: TrendingUp }
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
                        className={`overlay-btn ${isActive ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
                    >
                        {Icon && <Icon className="overlay-icon" />}
                        {btn.label}
                    </button>
                );
            })}
        </div>
    );
}
