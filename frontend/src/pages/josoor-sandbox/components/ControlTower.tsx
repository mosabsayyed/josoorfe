import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LensARadar, transformToLensA } from './LensARadar';
import { LensBRadar, transformToLensB } from './LensBRadar';
import { TrendsChart, transformToTrend } from './TrendsChart';
import { CombinedScore } from './CombinedScore';
import { InternalOutputs } from './InternalOutputs';
import { CardActionIcons } from './CardActionIcons';
// Rich chart-based components from graphv001
import StrategicInsights from '../../../components/graphv001/components/StrategicInsights';
import SectorOutcomes from '../../../components/graphv001/components/SectorOutcomes';
import type { DashboardData, OutcomesData } from '../../../components/graphv001/types';

import './ControlTower.css'; // Keep existing styles for now, but will override with simpler grid
import '../../../components/graphv001/GraphDashboard.css'; // Import for CSS variables (--component-panel-bg, etc.)

interface JosoorContext {
    year: string;
    quarter: string;
}

export const ControlTower: React.FC = () => {
  const { year, quarter } = useOutletContext<JosoorContext>();
  
  const [dashboardData, setDashboardData] = useState<any[] | null>(null);
  const [insightsData, setInsightsData] = useState<DashboardData | null>(null);
  const [outcomesData, setOutcomesData] = useState<OutcomesData | null>(null);
  
  // Lens Data State
  const [lensA, setLensA] = useState<any>(null);
  const [lensB, setLensB] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Theme detection
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  // FETCH DATA
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Fetch all dashboard data in parallel
        const [dashboardRes, outcomesRes, initiativesRes] = await Promise.all([
          fetch('/api/v1/dashboard/dashboard-data'),
          fetch('/api/v1/dashboard/outcomes-data').catch(() => null),
          fetch('/api/v1/dashboard/investment-initiatives').catch(() => null)
        ]);
        
        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          setDashboardData(dashboardJson);
        }
        
        // Transform raw outcomes data into OutcomesData format
        if (outcomesRes?.ok) {
          const rawOutcomes = await outcomesRes.json();
          // Handle 'All' values - find latest quarter if not specific
          let latestQuarter = null;
          if (quarter !== 'All' && year !== 'All') {
            const quarterStr = `${quarter} ${year}`;
            latestQuarter = rawOutcomes.find((r: any) => r.quarter === quarterStr);
          }
          // Fallback: get the most recent quarter from data
          if (!latestQuarter && rawOutcomes.length > 0) {
            const sorted = [...rawOutcomes].sort((a: any, b: any) => {
              const [qA, yA] = a.quarter.split(' ');
              const [qB, yB] = b.quarter.split(' ');
              if (yA !== yB) return parseInt(yB) - parseInt(yA);
              return parseInt(qB.replace('Q', '')) - parseInt(qA.replace('Q', ''));
            });
            latestQuarter = sorted[0];
          }
          
          if (latestQuarter) {
            const transformed: OutcomesData = {
              outcome1: {
                title: 'Economic Impact',
                macro: {
                  labels: ['FDI', 'Trade Balance', 'Jobs Created'],
                  fdi: { actual: [latestQuarter.fdi_actual], target: [latestQuarter.fdi_target], baseline: [latestQuarter.fdi_baseline] },
                  trade: { actual: [latestQuarter.trade_balance_actual], target: [latestQuarter.trade_balance_target], baseline: [latestQuarter.trade_balance_baseline] },
                  jobs: { actual: [latestQuarter.jobs_created_actual], target: [latestQuarter.jobs_created_target], baseline: [latestQuarter.jobs_created_baseline] }
                }
              },
              outcome2: {
                title: 'Partnerships',
                partnerships: { actual: latestQuarter.partnerships_actual, target: latestQuarter.partnerships_target, baseline: latestQuarter.partnerships_baseline }
              },
              outcome3: {
                title: 'Infrastructure Coverage',
                qol: {
                  labels: ['Water', 'Energy', 'Transport'],
                  coverage: { 
                    actual: [latestQuarter.water_coverage_actual, latestQuarter.energy_coverage_actual, latestQuarter.transport_coverage_actual], 
                    target: [latestQuarter.water_coverage_target, latestQuarter.energy_coverage_target, latestQuarter.transport_coverage_target], 
                    baseline: [latestQuarter.water_coverage_baseline, latestQuarter.energy_coverage_baseline, latestQuarter.transport_coverage_baseline] 
                  },
                  quality: { 
                    actual: [latestQuarter.water_quality_actual, latestQuarter.energy_quality_actual, latestQuarter.transport_quality_actual], 
                    target: [latestQuarter.water_quality_target, latestQuarter.energy_quality_target, latestQuarter.transport_quality_target], 
                    baseline: [latestQuarter.water_quality_baseline, latestQuarter.energy_quality_baseline, latestQuarter.transport_quality_baseline] 
                  }
                }
              },
              outcome4: {
                title: 'Community Engagement',
                community: { actual: latestQuarter.community_engagement_actual, target: latestQuarter.community_engagement_target, baseline: latestQuarter.community_engagement_baseline }
              }
            };
            setOutcomesData(transformed);
          }
        }
        
        // Transform raw initiatives data into DashboardData format
        if (initiativesRes?.ok) {
          const rawInitiatives = await initiativesRes.json();
          // Handle 'All' values - filter by specific quarter or get latest
          let filteredInitiatives = [];
          if (quarter !== 'All' && year !== 'All') {
            const quarterStr = `${quarter} ${year}`;
            filteredInitiatives = rawInitiatives.filter((r: any) => r.quarter === quarterStr);
          }
          // Fallback: get the most recent quarter's initiatives
          if (filteredInitiatives.length === 0 && rawInitiatives.length > 0) {
            const quarters = [...new Set(rawInitiatives.map((r: any) => r.quarter))] as string[];
            quarters.sort((a, b) => {
              const [qA, yA] = a.split(' ');
              const [qB, yB] = b.split(' ');
              if (yA !== yB) return parseInt(yB) - parseInt(yA);
              return parseInt(qB.replace('Q', '')) - parseInt(qA.replace('Q', ''));
            });
            const latestQ = quarters[0];
            filteredInitiatives = rawInitiatives.filter((r: any) => r.quarter === latestQ);
          }
          
          setInsightsData({
            dimensions: [],
            insight1: { 
              title: 'Investment Portfolio Health', 
              subtitle: 'Risk vs Alignment Analysis',
              initiatives: filteredInitiatives.map((i: any) => ({
                name: i.initiative_name,
                budget: i.budget,
                risk: i.risk_score,
                alignment: i.alignment_score
              }))
            },
            insight2: { 
              title: 'Projects & Operations Integration', 
              subtitle: 'Velocity Trends',
              labels: ['Last Q', 'Current Q', 'Next Q'], 
              projectVelocity: [85, 88, 90], 
              operationalEfficiency: [92, 93, 94] 
            },
            insight3: { 
              title: 'Economic Impact Correlation', 
              subtitle: 'QoL & Jobs Trends',
              labels: ['Last Q', 'Current Q', 'Next Q'], 
              operationalEfficiency: [92, 93, 94], 
              citizenQoL: [11, 12, 13], 
              jobsCreated: [30, 32, 35] 
            },
            outcomes: {} as OutcomesData
          });
        }
      } catch (e) {
        console.error('Dashboard fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [quarter, year]);

  // TRANSFORM DATA
  useEffect(() => {
      if (!dashboardData) return;
      
      const la = transformToLensA(dashboardData, quarter, year);
      const lb = transformToLensB(quarter, year);
      const tr = transformToTrend(dashboardData, quarter, year);
      
      setLensA(la);
      setLensB(lb);
      setTrends(tr);

  }, [dashboardData, quarter, year]);

  // Scores
  const scoreA = lensA?.axes ? Math.round(lensA.axes.reduce((acc: any, curr: any) => acc + curr.value, 0) / lensA.axes.length) : 0;
  const scoreB = lensB?.axes ? Math.round(lensB.axes.reduce((acc: any, curr: any) => acc + curr.value, 0) / lensB.axes.length) : 0;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ROW 1: RADARS & SCORE - Equal column widths */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', height: '380px' }}>
            {/* Col 1: Lens A */}
            <LensARadar data={lensA} loading={loading} />
            
            {/* Col 2: Score */}
            <CombinedScore lensAScore={scoreA} lensBScore={scoreB} />
            
            {/* Col 3: Lens B */}
            <LensBRadar data={lensB} loading={loading} />
        </div>

        {/* ROW 2: MAIN CONTENT - Equal column widths, matching heights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            
            {/* Col 1: Internal Outputs - styled consistently */}
            <div style={{ 
                background: 'var(--component-panel-bg)', 
                borderRadius: '8px', 
                padding: '12px', 
                border: '1px solid var(--component-panel-border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                <CardActionIcons 
                  contextId="internalOutputs"
                  contextTitle="Internal Transformation Outputs"
                  contextData={dashboardData}
                  isDark={isDark}
                  actions={[
                    { id: '1', type: 'decision', title: 'Review Q4 KPI targets', description: 'Strategic alignment score needs attention', severity: 'medium' },
                    { id: '2', type: 'missing', title: 'Missing employee survey data', severity: 'high' }
                  ]}
                />
                <InternalOutputs quarter={quarter} year={year} dashboardData={dashboardData || undefined} columns={2} />
            </div>

            {/* Col 2: Trends + Strategic Insights (combined elements) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Trends */}
                <div style={{ 
                    background: 'var(--component-panel-bg)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    border: '1px solid var(--component-panel-border)',
                    flex: '0 0 auto'
                }}>
                    <TrendsChart data={trends} loading={loading} />
                </div>
                
                {/* Strategic Insights */}
                <div style={{ 
                    background: 'var(--component-panel-bg)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    border: '1px solid var(--component-panel-border)',
                    flex: 1,
                    position: 'relative'
                }}>
                    <CardActionIcons 
                      contextId="strategicInsights"
                      contextTitle="Strategic Insights"
                      contextData={insightsData}
                      isDark={isDark}
                      actions={[
                        { id: '3', type: 'signal', title: 'Risk alignment trending down', severity: 'medium' }
                      ]}
                    />
                    {insightsData ? (
                        <StrategicInsights data={insightsData} isDark={isDark} language="en" />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--component-text-muted)' }}>Loading insights...</div>
                    )}
                </div>
            </div>

            {/* Col 3: Sector Outcomes - styled to match Internal Outputs */}
            <div style={{ 
                background: 'var(--component-panel-bg)', 
                borderRadius: '8px', 
                padding: '12px', 
                border: '1px solid var(--component-panel-border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                <CardActionIcons 
                  contextId="sectorOutcomes"
                  contextTitle="Sector-Level Outcomes"
                  contextData={outcomesData}
                  isDark={isDark}
                  actions={[
                    { id: '4', type: 'signal', title: 'FDI below target', description: 'Q4 FDI numbers require attention', severity: 'high' },
                    { id: '5', type: 'decision', title: 'Partnership expansion review', severity: 'low' }
                  ]}
                />
                {outcomesData ? (
                    <SectorOutcomes outcomes={outcomesData} isDark={isDark} language="en" />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--component-text-muted)' }}>Loading outcomes...</div>
                )}
            </div>
            
        </div>

    </div>
  );
};
