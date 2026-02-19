import { useTranslation } from 'react-i18next';
import type { OverlayType } from '../../../utils/enterpriseOverlayUtils';

interface DynamicInsightTitleProps {
    selectedOverlay: OverlayType;
}

export function DynamicInsightTitle({ selectedOverlay }: DynamicInsightTitleProps) {
    const { t } = useTranslation();
    let title = '';

    switch (selectedOverlay) {
        case 'none':
            title = t('josoor.enterprise.insight.capabilityOverview');
            break;
        case 'risk-exposure':
            title = t('josoor.enterprise.insight.riskExposureAnalysis');
            break;
        case 'external-pressure':
            title = t('josoor.enterprise.insight.externalPressureCheck');
            break;
        case 'footprint-stress':
            title = t('josoor.enterprise.insight.footprintStressAnalysis');
            break;
        case 'change-saturation':
            title = t('josoor.enterprise.insight.changeSaturationCheck');
            break;
        case 'trend-warning':
            title = t('josoor.enterprise.insight.trendEarlyWarning');
            break;
    }

    return <span>{title}</span>;
}
