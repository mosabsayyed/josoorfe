import type { OverlayType } from '../../../utils/enterpriseOverlayUtils';

interface DynamicInsightTitleProps {
    selectedOverlay: OverlayType;
}

export function DynamicInsightTitle({ selectedOverlay }: DynamicInsightTitleProps) {
    let title = '';

    switch (selectedOverlay) {
        case 'none':
            title = 'Capability Overview';
            break;
        case 'risk-exposure':
            title = 'Risk Exposure Analysis';
            break;
        case 'external-pressure':
            title = 'External Pressure Check';
            break;
        case 'footprint-stress':
            title = 'Footprint Stress Analysis';
            break;
        case 'change-saturation':
            title = 'Change Saturation Check';
            break;
        case 'trend-warning':
            title = 'Trend Early Warning';
            break;
    }

    return <span>{title}</span>;
}
