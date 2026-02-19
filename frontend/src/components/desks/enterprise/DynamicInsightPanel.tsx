import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { L3Capability } from '../../../types/enterprise';
import type { OverlayType } from '../../../utils/enterpriseOverlayUtils';
import './DynamicInsightPanel.css';

interface DynamicInsightPanelProps {
    selectedOverlay: OverlayType;
    allL3s: L3Capability[];
}

interface InsightData {
    title: string;
    description: string;
    stat: string;
    details: string;
    explanation: string;
}

export function DynamicInsightPanel({ selectedOverlay, allL3s }: DynamicInsightPanelProps) {
    const { t } = useTranslation();
    const insights = useMemo((): InsightData | null => {
        if (selectedOverlay === 'none') {
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
                title: t('josoor.enterprise.insightPanel.capabilityOverview'),
                description: t('josoor.enterprise.insightPanel.baselineHealth'),
                stat: t('josoor.enterprise.insightPanel.capabilitiesTracked', { count: allL3s.length }),
                details: t('josoor.enterprise.insightPanel.statusBreakdown', { ontrack, atRisk, issues }),
                explanation: t('josoor.enterprise.insightPanel.selectOverlay')
            };
        }

        let critical: L3Capability[] = [];
        let worstCase: L3Capability | null = null;
        let title = '';
        let description = '';
        let explanation = '';
        let icon = '📊';

        switch (selectedOverlay) {
            case 'risk-exposure':
                critical = allL3s.filter(l3 => (l3.exposure_percent || 0) >= 15);
                worstCase = allL3s.reduce((worst, l3) => {
                    const exposure = l3.exposure_percent || 0;
                    const worstExposure = worst ? (worst.exposure_percent || 0) : 0;
                    return exposure > worstExposure ? l3 : worst;
                }, null as L3Capability | null);
                title = t('josoor.enterprise.insightPanel.riskExposureAnalysis');
                description = t('josoor.enterprise.insightPanel.riskExposureDesc');
                explanation = t('josoor.enterprise.insightPanel.riskExposureExplanation');
                icon = '⚠️';
                break;

            case 'external-pressure':
                critical = allL3s.filter(l3 => {
                    const total = (l3.policy_tool_count || 0) + (l3.performance_target_count || 0);
                    return total >= 8;
                });
                worstCase = allL3s.reduce((worst, l3) => {
                    const total = (l3.policy_tool_count || 0) + (l3.performance_target_count || 0);
                    const worstTotal = worst ? ((worst.policy_tool_count || 0) + (worst.performance_target_count || 0)) : 0;
                    return total > worstTotal ? l3 : worst;
                }, null as L3Capability | null);
                title = t('josoor.enterprise.insightPanel.externalPressureCheck');
                description = t('josoor.enterprise.insightPanel.externalPressureDesc');
                explanation = t('josoor.enterprise.insightPanel.externalPressureExplanation');
                icon = '🎯';
                break;

            case 'footprint-stress':
                critical = allL3s.filter(l3 => {
                    const maxGap = Math.max(l3.org_gap || 0, l3.process_gap || 0, l3.it_gap || 0);
                    return maxGap >= 15;
                });
                worstCase = allL3s.reduce((worst, l3) => {
                    const maxGap = Math.max(l3.org_gap || 0, l3.process_gap || 0, l3.it_gap || 0);
                    const worstGap = worst ? Math.max(worst.org_gap || 0, worst.process_gap || 0, worst.it_gap || 0) : 0;
                    return maxGap > worstGap ? l3 : worst;
                }, null as L3Capability | null);
                title = t('josoor.enterprise.insightPanel.footprintStressAnalysis');
                description = t('josoor.enterprise.insightPanel.footprintStressDesc');
                explanation = t('josoor.enterprise.insightPanel.footprintStressExplanation');
                icon = '⚖️';
                break;

            case 'change-saturation':
                critical = allL3s.filter(l3 => (l3.adoption_load_percent || 0) >= 66);
                worstCase = allL3s.reduce((worst, l3) => {
                    const load = l3.adoption_load_percent || 0;
                    const worstLoad = worst ? (worst.adoption_load_percent || 0) : 0;
                    return load > worstLoad ? l3 : worst;
                }, null as L3Capability | null);
                title = t('josoor.enterprise.insightPanel.changeSaturationCheck');
                description = t('josoor.enterprise.insightPanel.changeSaturationDesc');
                explanation = t('josoor.enterprise.insightPanel.changeSaturationExplanation');
                icon = '⚡';
                break;

            case 'trend-warning':
                critical = allL3s.filter(l3 => {
                    if (!l3.health_history || l3.health_history.length < 3) return false;
                    const recent = l3.health_history.slice(-3);
                    return recent[0] > recent[1] && recent[1] > recent[2];
                });
                worstCase = critical.length > 0 ? critical[0] : null;
                title = t('josoor.enterprise.insightPanel.trendEarlyWarning');
                description = t('josoor.enterprise.insightPanel.trendEarlyWarningDesc');
                explanation = t('josoor.enterprise.insightPanel.trendEarlyWarningExplanation');
                icon = '📉';
                break;
        }

        return {
            title: `${icon} ${title}`,
            description,
            stat: t('josoor.enterprise.insightPanel.criticalCapabilities', { count: critical.length }),
            details: worstCase ? t('josoor.enterprise.insightPanel.worstCase', { name: worstCase.name }) : t('josoor.enterprise.insightPanel.noCriticalIssues'),
            explanation
        };
    }, [selectedOverlay, allL3s, t]);

    if (!insights) return null;

    return (
        <div className="insight-panel">
            <div className="insight-description">{insights.description}</div>
            <div className="insight-content">
                <div className="insight-stat">{insights.stat}</div>
                <div className="insight-details">{insights.details}</div>
                <div className="insight-explanation">{insights.explanation}</div>
            </div>
        </div>
    );
}
