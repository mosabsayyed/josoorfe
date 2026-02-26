import type { L3Capability } from '../../../types/enterprise';

export type OverlayType = 'none' | 'risk-exposure' | 'external-pressure' | 'footprint-stress' | 'change-saturation' | 'trend-warning';

// Calculate heatmap color based on overlay type
export function calculateHeatmapColor(l3: L3Capability, overlayType: OverlayType, maxDependencyCount?: number): string {
    if (overlayType !== 'risk-exposure') return 'transparent';

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

// Get overlay content to display on L3 cell
export function getOverlayContent(l3: L3Capability, overlayType: OverlayType): string | null {
    if (overlayType !== 'risk-exposure') return null;

    const deps = l3.dependency_count || 0;
    return `${deps} deps`;
}
