import type { L3Capability } from '../../../types/enterprise';

export type OverlayType = 'none' | 'risk-exposure' | 'external-pressure' | 'footprint-stress' | 'change-saturation' | 'trend-warning';

// Calculate heatmap color based on overlay type
export function calculateHeatmapColor(l3: L3Capability, overlayType: OverlayType): string {
    if (overlayType === 'none') return 'transparent';

    let deltaPercent = 0;

    switch (overlayType) {
        case 'risk-exposure':
            // Use exposure_percent directly
            deltaPercent = l3.exposure_percent || 0;
            break;

        case 'external-pressure':
            // Green or Red based on urgency logic
            const policyCount = Math.max(1, l3.policy_tool_count || 1);
            const targetCount = Math.max(1, l3.performance_target_count || 1);
            const totalPressure = l3.mode === 'build' ? policyCount : targetCount;

            const highPressure = totalPressure >= 3;
            let isUrgent = false;

            if (l3.mode === 'build') {
                const lowMaturity = l3.maturity_level < l3.target_maturity_level;
                isUrgent = highPressure && lowMaturity;
            } else {
                if (l3.health_history && l3.health_history.length >= 3) {
                    const recent = l3.health_history.slice(-3);
                    const isDeclining = recent[0] > recent[1] && recent[1] > recent[2];
                    isUrgent = highPressure && isDeclining;
                }
            }

            if (isUrgent) {
                return 'rgba(239, 68, 68, 0.6)'; // RED
            } else {
                return 'rgba(16, 185, 129, 0.6)'; // GREEN
            }

        case 'footprint-stress':
            const maxGap = Math.max(l3.org_gap || 0, l3.process_gap || 0, l3.it_gap || 0);
            deltaPercent = maxGap;
            break;

        case 'change-saturation':
            deltaPercent = l3.adoption_load_percent || 0;
            break;

        case 'trend-warning':
            if (l3.health_history && l3.health_history.length >= 3) {
                const recent = l3.health_history.slice(-3);
                const isDeclining = recent[0] > recent[1] && recent[1] > recent[2];
                deltaPercent = isDeclining ? 50 : 0;
            }
            break;
    }

    // Convert delta percentage to intensity (0-1 scale)
    let intensity = 0;
    if (deltaPercent < 5) {
        intensity = 0; // Green
    } else if (deltaPercent < 15) {
        intensity = (deltaPercent - 5) / 10 * 0.5 + 0.25;
    } else {
        intensity = Math.min((deltaPercent - 15) / 35 * 0.5 + 0.75, 1);
    }

    const red = Math.round(intensity * 239);
    const green = Math.round((1 - intensity) * 185);
    return `rgba(${red}, ${green}, 68, 0.6)`;
}

// Get overlay content to display on L3 cell
export function getOverlayContent(l3: L3Capability, overlayType: OverlayType): string | null {
    if (overlayType === 'none') return null;

    switch (overlayType) {
        case 'risk-exposure':
            if (l3.mode === 'build') {
                return `+${l3.expected_delay_days || 0}d / ${l3.exposure_percent || 0}%`;
            } else {
                const trend = l3.exposure_trend === 'improving' ? '▲' : l3.exposure_trend === 'declining' ? '▼' : '■';
                return `${l3.exposure_percent || 0}% ${trend}`;
            }

        case 'external-pressure':
            return null;

        case 'footprint-stress':
            const org = l3.org_gap || 0;
            const process = l3.process_gap || 0;
            const it = l3.it_gap || 0;
            let dominant = '';
            let severity = 0;

            if (org >= process && org >= it) {
                dominant = 'O';
                severity = Math.floor(org / 25);
            } else if (process >= org && process >= it) {
                dominant = 'P';
                severity = Math.floor(process / 25);
            } else {
                dominant = 'T';
                severity = Math.floor(it / 25);
            }

            return `${dominant}${Math.max(1, severity)}`;

        case 'change-saturation':
            const loadBand =
                (l3.adoption_load_percent || 0) < 33 ? 'Low' :
                    (l3.adoption_load_percent || 0) < 66 ? 'Med' : 'High';
            return `Proj: ${l3.active_projects_count || 0} / ${loadBand}`;

        case 'trend-warning':
            if (l3.mode === 'execute' && l3.health_history && l3.health_history.length >= 3) {
                const recent = l3.health_history.slice(-3);
                const isDecining = recent[0] > recent[1] && recent[1] > recent[2];
                return isDecining ? '!' : null;
            }
            return null;
    }

    return null;
}
