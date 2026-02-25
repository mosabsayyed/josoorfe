import type { L3Capability } from '../../../types/enterprise';

export type OverlayType = 'none' | 'risk-exposure' | 'external-pressure' | 'footprint-stress' | 'change-saturation' | 'trend-warning';

// Calculate heatmap color based on overlay type
export function calculateHeatmapColor(l3: L3Capability, overlayType: OverlayType, maxDependencyCount?: number): string {
    if (overlayType === 'none') return 'transparent';

    if (overlayType === 'risk-exposure') {
        // Continuous gradient based on dependency count
        const count = l3.dependency_count || 1;
        const max = Math.max(maxDependencyCount || 1, 1);
        const ratio = Math.min((count - 1) / Math.max(max - 1, 1), 1);

        let r: number, g: number, b: number;
        if (ratio <= 0.5) {
            const t = ratio * 2;
            r = Math.round(16 + (245 - 16) * t);
            g = Math.round(185 + (158 - 185) * t);
            b = Math.round(129 + (11 - 129) * t);
        } else {
            const t = (ratio - 0.5) * 2;
            r = Math.round(245 + (239 - 245) * t);
            g = Math.round(158 + (68 - 158) * t);
            b = Math.round(11 + (68 - 11) * t);
        }
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }

    let deltaPercent = 0;

    switch (overlayType) {
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

    // For other overlays: use deltaPercent with SST default bands
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
        case 'risk-exposure': {
            const deps = l3.dependency_count || 0;
            if (l3.mode === 'build') {
                return `${deps} deps · +${l3.expected_delay_days || 0}d`;
            } else {
                const trend = l3.exposure_trend === 'improving' ? '▲' : l3.exposure_trend === 'declining' ? '▼' : '■';
                return `${deps} deps · ${l3.exposure_percent || 0}% ${trend}`;
            }
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
