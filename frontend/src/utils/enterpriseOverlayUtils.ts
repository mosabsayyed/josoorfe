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

    // Thresholds represent achievement % (actual/target):
    //   threshold_green=85 → achievement ≥85% of target = green
    //   threshold_amber=70 → achievement ≥70% of target = amber
    //   below amber threshold = red
    // 
    // For risk-exposure overlay: use maturity achievement % against thresholds
    // For other overlays: use the computed deltaPercent against spec bands
    const thresholdGreen = (l3 as any)._threshold_green ?? 85;
    const thresholdAmber = (l3 as any)._threshold_amber ?? 70;

    // Achievement = maturity_level / target_maturity_level * 100
    const achievement = l3.target_maturity_level > 0
        ? (l3.maturity_level / l3.target_maturity_level) * 100
        : 0;

    if (overlayType === 'risk-exposure') {
        // Use achievement vs thresholds
        if (achievement >= thresholdGreen) {
            return 'rgba(16, 185, 129, 0.6)';  // GREEN
        } else if (achievement >= thresholdAmber) {
            return 'rgba(245, 158, 11, 0.6)';  // AMBER
        } else {
            return 'rgba(239, 68, 68, 0.6)';   // RED
        }
    }

    // For other overlays: use deltaPercent with spec default bands
    // band_green_max_pct: 35, band_amber_max_pct: 65
    if (deltaPercent < 35) {
        return 'rgba(16, 185, 129, 0.6)';  // GREEN
    } else if (deltaPercent < 65) {
        return 'rgba(245, 158, 11, 0.6)';  // AMBER
    } else {
        return 'rgba(239, 68, 68, 0.6)';   // RED
    }
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
            // Use pre-calculated dominant dimension and severity from enterpriseService
            const dominant = (l3 as any)._stress_dominant || '';
            const severity = (l3 as any)._stress_severity || 0;
            if (!dominant || severity === 0) return null;
            return `${dominant}${severity}`;

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
