import { useMemo } from 'react';
import type { L3Capability } from '../../data/capabilityData';
import type { OverlayType } from '../../utils/enterpriseOverlayUtils';
import './DynamicInsightPanel.css';

interface DynamicInsightPanelProps {
  selectedOverlay: OverlayType;
  allL3s: L3Capability[];
}

interface InsightData {
  title: string;
  stat: string;
  details: string;
  explanation: string;
}

export function DynamicInsightPanel({ selectedOverlay, allL3s }: DynamicInsightPanelProps) {
  const insights = useMemo((): InsightData | null => {
    if (selectedOverlay === 'none') {
      // No overlay selected - show general status
      const ontrack = allL3s.filter(l3 => {
        const status = l3.mode === 'build' ? l3.build_status : l3.execute_status;
        return status === 'ontrack' || status === 'in-progress-ontrack';
      }).length;
      const atRisk = allL3s.filter(l3 => {
        const status = l3.mode === 'build' ? l3.build_status : l3.execute_status;
        return status === 'at-risk' || status === 'in-progress-atrisk';
      }).length;
      const issues = allL3s.filter(l3 => {
        const status = l3.mode === 'build' ? l3.build_status : l3.execute_status;
        return status === 'issues' || status === 'in-progress-issues';
      }).length;

      return {
        title: '📊 Capability Overview',
        stat: `${allL3s.length} capabilities tracked`,
        details: `${ontrack} ontrack | ${atRisk} at risk | ${issues} issues`,
        explanation: 'Select an overlay to analyze specific capability dimensions.'
      };
    }

    // Single overlay analysis
    let critical: L3Capability[] = [];
    let worstCase: L3Capability | null = null;
    let title = '';
    let explanation = '';
    let icon = '📊';

    switch (selectedOverlay) {
      case 'risk-exposure':
        // Critical if exposure >= 15%
        critical = allL3s.filter(l3 => (l3.exposure_percent || 0) >= 15);
        worstCase = allL3s.reduce((worst, l3) => {
          const exposure = l3.exposure_percent || 0;
          const worstExposure = worst ? (worst.exposure_percent || 0) : 0;
          return exposure > worstExposure ? l3 : worst;
        }, null as L3Capability | null);
        title = 'Risk Exposure Analysis';
        explanation = 'RED = ≥15% exposure. AMBER = 5-15% exposure. GREEN = <5% exposure.';
        icon = '⚠️';
        break;

      case 'external-pressure':
        // Critical if total pressure >= 15 (combined policy + KPI)
        critical = allL3s.filter(l3 => {
          const total = (l3.policy_tool_count || 0) + (l3.performance_target_count || 0);
          return total >= 8; // Threshold for "high pressure"
        });
        worstCase = allL3s.reduce((worst, l3) => {
          const total = (l3.policy_tool_count || 0) + (l3.performance_target_count || 0);
          const worstTotal = worst ? ((worst.policy_tool_count || 0) + (worst.performance_target_count || 0)) : 0;
          return total > worstTotal ? l3 : worst;
        }, null as L3Capability | null);
        title = 'External Pressure Check';
        explanation = 'Capabilities under heavy policy/KPI constraints.';
        icon = '🎯';
        break;

      case 'footprint-stress':
        // Critical if max gap >= 15%
        critical = allL3s.filter(l3 => {
          const maxGap = Math.max(l3.org_gap || 0, l3.process_gap || 0, l3.it_gap || 0);
          return maxGap >= 15;
        });
        worstCase = allL3s.reduce((worst, l3) => {
          const maxGap = Math.max(l3.org_gap || 0, l3.process_gap || 0, l3.it_gap || 0);
          const worstGap = worst ? Math.max(worst.org_gap || 0, worst.process_gap || 0, worst.it_gap || 0) : 0;
          return maxGap > worstGap ? l3 : worst;
        }, null as L3Capability | null);
        title = 'Footprint Stress Analysis';
        explanation = 'Capabilities with imbalanced Org/Process/IT investment.';
        icon = '⚖️';
        break;

      case 'change-saturation':
        // Critical if load >= 66% (High band)
        critical = allL3s.filter(l3 => (l3.adoption_load_percent || 0) >= 66);
        worstCase = allL3s.reduce((worst, l3) => {
          const load = l3.adoption_load_percent || 0;
          const worstLoad = worst ? (worst.adoption_load_percent || 0) : 0;
          return load > worstLoad ? l3 : worst;
        }, null as L3Capability | null);
        title = 'Change Saturation Check';
        explanation = 'Capabilities overwhelmed with too many concurrent projects.';
        icon = '⚡';
        break;

      case 'trend-warning':
        // Critical if health declining (2 consecutive drops)
        critical = allL3s.filter(l3 => {
          if (!l3.health_history || l3.health_history.length < 3) return false;
          const recent = l3.health_history.slice(-3);
          return recent[0] > recent[1] && recent[1] > recent[2];
        });
        worstCase = critical.length > 0 ? critical[0] : null;
        title = 'Trend Early Warning';
        explanation = 'Capabilities showing silent degradation (2-cycle decline).';
        icon = '📉';
        break;
    }

    return {
      title: `${icon} ${title}`,
      stat: `${critical.length} critical ${critical.length === 1 ? 'capability' : 'capabilities'} identified`,
      details: worstCase ? `Worst: ${worstCase.name}` : 'No critical issues',
      explanation
    };
  }, [selectedOverlay, allL3s]);

  if (!insights) return null;

  return (
    <div className="insight-panel">
      <div className="insight-content">
        <div className="insight-title">{insights.title}</div>
        <div className="insight-stat">{insights.stat}</div>
        <div className="insight-details">{insights.details}</div>
        <div className="insight-explanation">{insights.explanation}</div>
      </div>
    </div>
  );
}
