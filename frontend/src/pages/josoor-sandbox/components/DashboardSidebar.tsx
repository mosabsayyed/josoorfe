// DEPRECATED: This sandbox component is no longer used.
// The native SectorSidebar in components/desks/sector/SectorSidebar.tsx is the active version.
// Keeping this as a stub to prevent build errors until sandbox is deleted.

import { useState, useEffect } from 'react';
import { Target, Heart } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { GaugeCard } from './GaugeCard';
import {
  getDashboardKPIs,
  getOutcomesData,
  transformToStrategicRadar,
  transformToHealthRadar,
  transformToGaugeData,
  DashboardKPI,
  GaugeData,
  OutcomesData
} from '../../../services/dashboardService';
import './DashboardSidebar.css';

interface DashboardSidebarProps {
  year: string;
  quarter: string;
}

export function DashboardSidebar({ year, quarter }: DashboardSidebarProps) {
  const [activeTab, setActiveTab] = useState<'impact' | 'health'>('impact');
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPI[]>([]);
  const [gaugeData, setGaugeData] = useState<GaugeData[]>([]);
  const [outcomesData, setOutcomesData] = useState<OutcomesData[]>([]);
  const [radarValues, setRadarValues] = useState({ actual: [0, 0, 0, 0, 0], plan: [0, 0, 0, 0, 0], labels: [] as string[] });
  const [healthRadarValues, setHealthRadarValues] = useState({ actual: [0, 0, 0, 0, 0, 0, 0, 0], plan: [0, 0, 0, 0, 0, 0, 0, 0], labels: [] as string[] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [kpis, outcomes] = await Promise.all([
          getDashboardKPIs({ year: parseInt(year), quarter }),
          getOutcomesData({ year: parseInt(year), quarter })
        ]);

        if (outcomes.length > 0) {
          const strategicRadar = transformToStrategicRadar(outcomes);
          setRadarValues({ actual: strategicRadar.actual, plan: strategicRadar.plan, labels: strategicRadar.labels });
          setOutcomesData(outcomes);
        }

        if (kpis.length > 0) {
          const healthRadar = transformToHealthRadar(kpis, quarter, year);
          setHealthRadarValues({ actual: healthRadar.actual, plan: healthRadar.plan, labels: healthRadar.labels });
          const gauges = transformToGaugeData(kpis);
          setGaugeData(gauges);
          setDashboardKPIs(kpis);
        } else {
          setHealthRadarValues({ actual: [], plan: [], labels: [] });
          setGaugeData([]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [year, quarter]);

  const healthRadarOption = {
    backgroundColor: 'transparent',
    radar: {
      indicator: healthRadarValues.labels.map(l => ({ name: l, max: 100 })),
      center: ['50%', '50%'],
      radius: '65%',
    },
    series: [{
      type: 'radar',
      data: [
        { value: healthRadarValues.actual, name: 'Actual' },
        { value: healthRadarValues.plan, name: 'Plan' }
      ]
    }]
  };

  return (
    <div className="dashboard-sidebar-container">
      <div className="dashboard-tab-selector">
        <button onClick={() => setActiveTab('impact')} className={`dashboard-tab-btn ${activeTab === 'impact' ? 'dashboard-tab-btn-impact-active' : ''}`}>
          <Target className="tab-icon" /> Strategic Impact
        </button>
        <button onClick={() => setActiveTab('health')} className={`dashboard-tab-btn ${activeTab === 'health' ? 'dashboard-tab-btn-health-active' : ''}`}>
          <Heart className="tab-icon" /> Transform Health
        </button>
      </div>

      {isLoading && <span className="loading-indicator">Loading data for {year} {quarter}...</span>}

      <div className="dashboard-content">
        {/* Radar Chart */}
        <div className="chart-card chart-card-p-2-5">
          <ReactECharts option={healthRadarOption} style={{ height: '200px' }} />
        </div>

        {/* KPI Gauges */}
        <div className="kpi-cards-container">
          {gaugeData.map((gauge, idx) => (
            <GaugeCard key={idx} {...gauge} />
          ))}
          {gaugeData.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 p-4">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}