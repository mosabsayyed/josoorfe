import type { L3Capability } from '../data/capabilityData';

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
      // High pressure (3+) + low maturity = RED (urgent build)
      // High pressure (3+) + declining health = RED (urgent operate fix)
      const policyCount = Math.max(1, l3.policy_tool_count || 1);
      const targetCount = Math.max(1, l3.performance_target_count || 1);
      const totalPressure = l3.mode === 'build' ? policyCount : targetCount;
      
      // Check for urgency
      const highPressure = totalPressure >= 3;
      let isUrgent = false;
      
      if (l3.mode === 'build') {
        // Build: High pressure + low maturity (less than target)
        const lowMaturity = l3.maturity_level < l3.target_maturity_level;
        isUrgent = highPressure && lowMaturity;
      } else {
        // Execute: High pressure + declining health
        if (l3.health_history && l3.health_history.length >= 3) {
          const recent = l3.health_history.slice(-3);
          const isDeclining = recent[0] > recent[1] && recent[1] > recent[2];
          isUrgent = highPressure && isDeclining;
        }
      }
      
      // Return color directly - no delta calculation needed
      if (isUrgent) {
        return 'rgba(239, 68, 68, 0.6)'; // RED
      } else {
        return 'rgba(16, 185, 129, 0.6)'; // GREEN
      }
      break;
      
    case 'footprint-stress':
      // Max of org/process/IT gaps
      const maxGap = Math.max(l3.org_gap || 0, l3.process_gap || 0, l3.it_gap || 0);
      deltaPercent = maxGap;
      break;
      
    case 'change-saturation':
      // Use adoption_load_percent
      deltaPercent = l3.adoption_load_percent || 0;
      break;
      
    case 'trend-warning':
      // Check if health is declining (health_history array)
      if (l3.health_history && l3.health_history.length >= 3) {
        const recent = l3.health_history.slice(-3);
        const isDeclining = recent[0] > recent[1] && recent[1] > recent[2];
        deltaPercent = isDeclining ? 50 : 0; // Amber warning if declining
      }
      break;
  }

  // Convert delta percentage to intensity (0-1 scale)
  // < 5% = 0 (green), 5-15% = 0.5 (amber), >= 15% = 1 (red)
  let intensity = 0;
  if (deltaPercent < 5) {
    intensity = 0; // Green
  } else if (deltaPercent < 15) {
    intensity = (deltaPercent - 5) / 10 * 0.5 + 0.25; // Gradient from green to amber
  } else {
    intensity = Math.min((deltaPercent - 15) / 35 * 0.5 + 0.75, 1); // Gradient from amber to red
  }

  // Convert intensity to RAG color
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
        // BUILD: "+45d / 63%"
        return `+${l3.expected_delay_days || 0}d / ${l3.exposure_percent || 0}%`;
      } else {
        // EXECUTE: "42% ▼" or "42% ▲" or "42% ■"
        const trend = l3.exposure_trend === 'up' ? '▲' : l3.exposure_trend === 'down' ? '▼' : '■';
        return `${l3.exposure_percent || 0}% ${trend}`;
      }
      
    case 'external-pressure':
      // No cell display - only show in tooltip
      return null;
      
    case 'footprint-stress':
      // Dominant gap letter + severity: "O2", "P3", "T1"
      const org = l3.org_gap || 0;
      const process = l3.process_gap || 0;
      const it = l3.it_gap || 0;
      let dominant = '';
      let severity = 0;
      
      if (org >= process && org >= it) {
        dominant = 'O';
        severity = Math.floor(org / 25); // 0-25% = 1, 26-50% = 2, etc.
      } else if (process >= org && process >= it) {
        dominant = 'P';
        severity = Math.floor(process / 25);
      } else {
        dominant = 'T';
        severity = Math.floor(it / 25);
      }
      
      return `${dominant}${Math.max(1, severity)}`;
      
    case 'change-saturation':
      // "Proj: 4 / Load: Med"
      const loadBand = 
        (l3.adoption_load_percent || 0) < 33 ? 'Low' :
        (l3.adoption_load_percent || 0) < 66 ? 'Med' : 'High';
      return `Proj: ${l3.active_projects_count || 0} / ${loadBand}`;
      
    case 'trend-warning':
      // EXECUTE mode only: Show "!" if declining trend
      if (l3.mode === 'execute' && l3.health_history && l3.health_history.length >= 3) {
        const recent = l3.health_history.slice(-3);
        const isDecining = recent[0] > recent[1] && recent[1] > recent[2];
        return isDecining ? '!' : null;
      }
      return null;
  }

  return null;
}