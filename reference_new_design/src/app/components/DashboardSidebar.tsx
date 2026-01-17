import { useState, useEffect } from 'react';
import { Target, Heart, Calendar, Filter } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { GaugeCard } from './GaugeCard';
import { getStrategicPriorities, SectorPerformance } from '@/services/sectorService';
import {
  getDashboardKPIs,
  getOutcomesData,
  transformToStrategicRadar,
  transformToHealthRadar,
  transformToGaugeData,
  TimeFilter,
  AVAILABLE_YEARS,
  AVAILABLE_QUARTERS,
  DashboardKPI,
  GaugeData,
  OutcomesData
} from '@/services/dashboardService';
import { AnalyticsService } from '../../services/analyticsService';
import './DashboardSidebar.css';

export function DashboardSidebar() {
  const [activeTab, setActiveTab] = useState<'impact' | 'health'>('impact');

  // Time Filter State
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ year: 2025, quarter: 'Q1' });

  // Data State
  const [kpiData, setKpiData] = useState<SectorPerformance[]>([]);
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPI[]>([]);
  const [gaugeData, setGaugeData] = useState<GaugeData[]>([]);
  const [radarValues, setRadarValues] = useState({
    actual: [0, 0, 0, 0, 0],
    plan: [0, 0, 0, 0, 0]
  });
  const [healthRadarValues, setHealthRadarValues] = useState({
    actual: [0, 0, 0, 0, 0, 0, 0, 0],
    plan: [0, 0, 0, 0, 0, 0, 0, 0]
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data when timeFilter changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch from Supabase (Backend 8008) - temp_quarterly_dashboard_data and temp_quarterly_outcomes_data
        const [kpis, outcomes] = await Promise.all([
          getDashboardKPIs(timeFilter),
          getOutcomesData(timeFilter)
        ]);

        console.log("Dashboard KPIs (Supabase):", kpis);
        console.log("Outcomes Data (Supabase):", outcomes);

        // Strategic Impact Radar <- temp_quarterly_outcomes_data
        if (outcomes.length > 0) {
          const strategicRadar = transformToStrategicRadar(outcomes);
          setRadarValues({
            actual: strategicRadar.actual,
            plan: strategicRadar.plan
          });
        }

        // Transformation Health Radar <- temp_quarterly_dashboard_data
        if (kpis.length > 0) {
          const healthRadar = transformToHealthRadar(kpis);
          setHealthRadarValues({
            actual: healthRadar.actual,
            plan: healthRadar.plan
          });

          // KPI Gauges <- temp_quarterly_dashboard_data
          const gauges = transformToGaugeData(kpis);
          setGaugeData(gauges);
          setDashboardKPIs(kpis);
        }

        // 2. Also fetch from Neo4j for SectorPerformance nodes
        const data = await getStrategicPriorities();
        if (data && data.nodes) {
          const perfNodes = data.nodes
            .filter((n: any) => n.labels && n.labels.includes('SectorPerformance'))
            .map((n: any) => ({
              id: n.id,
              ...n.properties
            })) as SectorPerformance[];
          console.log("Neo4j Performance KPIs:", perfNodes);
          setKpiData(perfNodes);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [timeFilter]);

  // Analytics Service Integration
  useEffect(() => {
    if (kpiData.length > 0 && dashboardData.length > 0) {
      const analytics = new AnalyticsService(kpiData, dashboardData, outcomesData);
      const health = analytics.getDualLayerHealth();

      // Map DualLayerHealth to Radar format
      // Sector Layer (Performance) -> Actual
      // Entity Layer (Capability) -> Plan (Target) 
      // Note: This is an adaptation. Usually Plan is Target. 
      // Here we compare "What we achieved" (Sector) vs "What we are capable of" (Entity)
      // OR we can just use the sector health breakdown.

      // Let's stick to the previous radar metaphor: "Actual" vs "Plan"
      // But using the computed health scores from the service

      // We need to map the "items" from health layers to the specific dimensions of the radar
      // The radar has: Strategy, Ops, Risk, Investment, Investors, Employees, Projects, Tech

      // Since the legacy logic clumps everything into "Sector" and "Entity", we might need to 
      // aggregate based on dimension_id if we want that granularity.

      // For now, let's use the `transformToHealthRadar` which was working well with Supabase data,
      // but enhance it with the "Health Status" logic if needed.

      // Actually, the user wants the "sandbox" logic. 
      // Sandbox Feature 1.2 is "Dual-Layer Health": Sector vs Entity.
      // If we want to replicate that exactly, we should maybe show that instead of the radar?
      // But the UI has a Radar chart.

      // Let's keep the Radar but power it with the AnalyticsService logic if possible.
      // The AnalyticsService calculates "Health".

      console.log('Analytics Health:', health);
    }
  }, [kpiData, dashboardData, outcomesData]);

  // Strategic Impact Radar Chart
  const strategicRadarOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Strategic Impact',
      left: 'center',
      top: 8,
      textStyle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    graphic: [{
      type: 'text',
      right: 5,
      top: 28,
      style: {
        text: '92%', // TODO: Calculate average from radarValues
        fill: '#10b981',
        fontSize: 24,
        fontWeight: 'bold'
      }
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#475569',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 11 },
      padding: [6, 10],
      confine: true,
      position: function (point: number[]) {
        // Keep tooltip on screen
        return [point[0] + 10, point[1] - 10];
      },
      formatter: (params: any) => {
        if (params.componentSubType === 'radar') {
          const dimensionIndex = params.dimensionIndex;
          const indicatorNames = ['FDI', 'Jobs Created', 'Water Coverage', 'Energy Coverage', 'Transport Coverage'];
          const actualValues = radarValues.actual;
          const planValues = radarValues.plan;

          const name = indicatorNames[dimensionIndex];
          const actual = actualValues[dimensionIndex];
          const plan = planValues[dimensionIndex];

          return `<div style="font-size: 11px; line-height: 1.4;">
            <strong style="color: #cbd5e1;">${name}</strong><br/>
            <span style="color: #10b981;">Actual: ${actual}%</span><br/>
            <span style="color: #64748b;">Plan: ${plan}%</span>
          </div>`;
        }
        return '';
      }
    },
    legend: {
      data: ['Actual', 'Plan'],
      bottom: 5,
      textStyle: {
        color: '#94a3b8',
        fontSize: 10
      }
    },
    radar: {
      indicator: [
        { name: 'FDI', max: 100, min: 0 },
        { name: 'Jobs', max: 100, min: 0 },
        { name: 'Water', max: 100, min: 0 },
        { name: 'Energy', max: 100, min: 0 },
        { name: 'Transport', max: 100, min: 0 }
      ],
      center: ['50%', '58%'],
      radius: '60%',
      splitNumber: 4,
      axisName: {
        color: '#cbd5e1',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: 'Plan',
        type: 'radar',
        symbol: 'circle',
        symbolSize: 4,
        data: [{
          value: radarValues.plan,
          name: 'Plan',
          lineStyle: {
            color: '#64748b',
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: '#64748b'
          },
          areaStyle: {
            color: 'rgba(100, 116, 139, 0.1)'
          }
        }]
      },
      {
        name: 'Actual',
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        data: [{
          value: radarValues.actual,
          name: 'Actual',
          lineStyle: {
            color: '#10b981',
            width: 2
          },
          itemStyle: {
            color: '#10b981'
          },
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.4)'
          }
        }]
      }
    ]
  };

  // Transform Health Radar Chart
  const transformRadarOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Transformation Health',
      left: 'center',
      top: 8,
      textStyle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    graphic: [{
      type: 'text',
      right: 5,
      top: 28,
      style: {
        text: '84%',
        fill: '#f59e0b',
        fontSize: 24,
        fontWeight: 'bold'
      }
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#475569',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 11 },
      padding: [6, 10],
      confine: true,
      position: function (point: number[]) {
        // Keep tooltip on screen
        return [point[0] + 10, point[1] - 10];
      },
      formatter: (params: any) => {
        if (params.componentSubType === 'radar') {
          const dimensionIndex = params.dimensionIndex;
          const indicatorNames = ['Strategy', 'Ops', 'Risk', 'Investment', 'Investors', 'Employees', 'Projects', 'Tech'];
          const actualValues = [88, 93, 78, 74, 88, 82, 92, 52];
          const targetValues = [85, 90, 80, 72, 85, 80, 90, 57];

          const name = indicatorNames[dimensionIndex];
          const actual = actualValues[dimensionIndex];
          const target = targetValues[dimensionIndex];

          return `<div style="font-size: 11px; line-height: 1.4;">
            <strong style="color: #cbd5e1;">${name}</strong><br/>
            <span style="color: #f59e0b;">Actual: ${actual}%</span><br/>
            <span style="color: #64748b;">Target: ${target}%</span>
          </div>`;
        }
        return '';
      }
    },
    legend: {
      data: ['Actual', 'Target'],
      bottom: 5,
      textStyle: {
        color: '#94a3b8',
        fontSize: 10
      }
    },
    radar: {
      indicator: [
        { name: 'Strategy', max: 100, min: 0 },
        { name: 'Ops', max: 100, min: 0 },
        { name: 'Risk', max: 100, min: 0 },
        { name: 'Investment', max: 100, min: 0 },
        { name: 'Investors', max: 100, min: 0 },
        { name: 'Employees', max: 100, min: 0 },
        { name: 'Projects', max: 100, min: 0 },
        { name: 'Tech', max: 100, min: 0 }
      ],
      center: ['50%', '52%'],
      radius: '65%',
      splitNumber: 4,
      axisName: {
        color: '#cbd5e1',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: 'Target',
        type: 'radar',
        symbol: 'circle',
        symbolSize: 4,
        data: [{
          value: healthRadarValues.plan,
          name: 'Target',
          lineStyle: {
            color: '#64748b',
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: '#64748b'
          },
          areaStyle: {
            color: 'rgba(100, 116, 139, 0.1)'
          }
        }]
      },
      {
        name: 'Actual',
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        data: [{
          value: healthRadarValues.actual,
          name: 'Actual',
          lineStyle: {
            color: '#f59e0b',
            width: 2
          },
          itemStyle: {
            color: '#f59e0b'
          },
          areaStyle: {
            color: 'rgba(245, 158, 11, 0.4)'
          }
        }]
      }
    ]
  };

  return (
    <div className="dashboard-sidebar-container">
      {/* Tab Selector */}
      <div className="dashboard-tab-selector">
        <button
          onClick={() => setActiveTab('impact')}
          className={`dashboard-tab-btn ${activeTab === 'impact'
            ? 'dashboard-tab-btn-impact-active'
            : ''
            }`}
        >
          <Target className="tab-icon" />
          Strategic Impact
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`dashboard-tab-btn ${activeTab === 'health'
            ? 'dashboard-tab-btn-health-active'
            : ''
            }`}
        >
          <Heart className="tab-icon" />
          Transform Health
        </button>
      </div>

      {/* Time Filter */}
      <div className="dashboard-time-filter">
        <div className="filter-group">
          <Calendar className="filter-icon" />
          <select
            value={timeFilter.year}
            onChange={(e) => setTimeFilter({ ...timeFilter, year: parseInt(e.target.value) })}
            className="filter-select"
          >
            {AVAILABLE_YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={timeFilter.quarter}
            onChange={(e) => setTimeFilter({ ...timeFilter, quarter: e.target.value })}
            className="filter-select"
          >
            {AVAILABLE_QUARTERS.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
            <option value="ALL">All Quarters</option>
          </select>
        </div>
        {isLoading && <span className="loading-indicator">Loading...</span>}
      </div>

      {/* Strategic Impact Tab */}
      {activeTab === 'impact' && (
        <div className="dashboard-content">
          {/* Radar Chart */}
          <div className="chart-card chart-card-p-2-5">
            <ReactECharts option={strategicRadarOption} style={{ height: '200px' }} />
          </div>

          {/* KPI Cards with Gauges */}
          <div className="kpi-cards-container">
            {/* 1.0 Family - Water Sector GDP */}
            <GaugeCard
              label="1.0 Water Sector GDP"
              value={92}
              status="green"
              delta="+16%"
              baseValue={76}
              qMinus1={80}
              qPlus1={95}
              endValue={100}
              family="1.0"
              level={1}
            />

            {/* 1.1 Sub-card - FDI in Water */}
            <GaugeCard
              label="1.1 FDI in Water"
              value={88}
              status="green"
              delta="+8%"
              baseValue={80}
              qMinus1={85}
              qPlus1={90}
              endValue={95}
              family="1.0"
              level={2}
            />

            {/* 1.2 Sub-card - Jobs Created */}
            <GaugeCard
              label="1.2 Jobs Created"
              value={95}
              status="green"
              delta="+5%"
              baseValue={90}
              qMinus1={92}
              qPlus1={97}
              endValue={100}
              family="1.0"
              level={2}
            />

            {/* 2.0 Family - Infrastructure Resilience */}
            <GaugeCard
              label="2.0 Infrastructure Resilience"
              value={75}
              status="amber"
              delta="+5%"
              baseValue={70}
              qMinus1={72}
              qPlus1={78}
              endValue={85}
              family="2.0"
              level={1}
            />

            {/* 2.1 Sub-card - Desalination Capacity */}
            <GaugeCard
              label="2.1 Desalination Capacity"
              value={72}
              status="amber"
              delta="+7%"
              baseValue={65}
              qMinus1={68}
              qPlus1={76}
              endValue={85}
              family="2.0"
              level={2}
            />

            {/* 2.2 Sub-card - Pipeline Network */}
            <GaugeCard
              label="2.2 Pipeline Network"
              value={68}
              status="amber"
              delta="+8%"
              baseValue={60}
              qMinus1={64}
              qPlus1={72}
              endValue={80}
              family="2.0"
              level={2}
            />
          </div>
        </div>
      )}

      {/* Transform Health Tab */}
      {activeTab === 'health' && (
        <div className="dashboard-content">
          {/* Radar Chart */}
          <div className="chart-card chart-card-p-2-5">
            <ReactECharts option={transformRadarOption} style={{ height: '240px' }} />
          </div>

          {/* Infrastructure Coverage Chart */}
          <div className="chart-card chart-card-p-3">
            <h3 className="chart-title">Infrastructure Coverage</h3>
            <ReactECharts
              option={{
                backgroundColor: 'transparent',
                tooltip: {
                  trigger: 'item',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#475569',
                  borderWidth: 1,
                  textStyle: { color: '#fff', fontSize: 11 },
                  padding: [8, 12],
                  formatter: (params: any) => {
                    if (params.name === 'Water') {
                      return `<div style="font-size: 11px; line-height: 1.6;">
                        <strong style="color: #fbbf24;">Water</strong><br/>
                        <span style="color: #fbbf24;">Coverage: 92</span><br/>
                        <span style="color: #14b8a6;">Quality: 84</span>
                      </div>`;
                    }
                    return `${params.name}: ${params.value}`;
                  }
                },
                grid: {
                  left: '12%',
                  right: '8%',
                  top: '10%',
                  bottom: '15%'
                },
                xAxis: {
                  type: 'category',
                  data: ['Water', 'Sewer', 'Transport'],
                  axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 10
                  }
                },
                yAxis: {
                  type: 'value',
                  max: 100,
                  axisLine: { show: false },
                  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 9
                  }
                },
                series: [{
                  type: 'bar',
                  data: [
                    { value: 92, itemStyle: { color: '#fbbf24' } },
                    { value: 0, itemStyle: { color: '#fbbf24' } },
                    { value: 88, itemStyle: { color: '#fbbf24' } }
                  ],
                  barWidth: '35%',
                  itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                  }
                }]
              }}
              style={{ height: '140px' }}
            />
          </div>

          {/* Economic Impact Chart */}
          <div className="chart-card chart-card-p-3">
            <h3 className="chart-title">Economic Impact</h3>
            <ReactECharts
              option={{
                backgroundColor: 'transparent',
                tooltip: {
                  trigger: 'item',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#475569',
                  borderWidth: 1,
                  textStyle: { color: '#fff', fontSize: 11 },
                  padding: [6, 10]
                },
                grid: {
                  left: '12%',
                  right: '8%',
                  top: '10%',
                  bottom: '15%'
                },
                xAxis: {
                  type: 'category',
                  data: ['FDI', 'Trade', 'Jobs'],
                  axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 10
                  }
                },
                yAxis: {
                  type: 'value',
                  max: 24,
                  axisLine: { show: false },
                  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 9
                  }
                },
                series: [{
                  type: 'bar',
                  data: [
                    { value: 4, itemStyle: { color: '#fbbf24' } },
                    { value: 0, itemStyle: { color: '#fbbf24' } },
                    { value: 21, itemStyle: { color: '#fbbf24' } }
                  ],
                  barWidth: '35%',
                  itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                  }
                }]
              }}
              style={{ height: '130px' }}
            />
          </div>

          {/* Economic Impact Correlation Chart */}
          <div className="chart-card chart-card-p-3">
            <h3 className="chart-title">Economic Impact Correlation</h3>
            <ReactECharts
              option={{
                backgroundColor: 'transparent',
                tooltip: {
                  trigger: 'axis',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#475569',
                  borderWidth: 1,
                  textStyle: { color: '#fff', fontSize: 11 },
                  padding: [6, 10]
                },
                grid: {
                  left: '12%',
                  right: '12%',
                  top: '10%',
                  bottom: '15%'
                },
                xAxis: {
                  type: 'category',
                  data: ['Last Q', 'Current Q', 'Next Q'],
                  axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 10
                  }
                },
                yAxis: [
                  {
                    type: 'value',
                    max: 100,
                    position: 'left',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                    axisLabel: {
                      color: '#94a3b8',
                      fontSize: 9
                    }
                  },
                  {
                    type: 'value',
                    max: 16,
                    position: 'right',
                    axisLine: { show: false },
                    splitLine: { show: false },
                    axisLabel: {
                      color: '#94a3b8',
                      fontSize: 9
                    }
                  }
                ],
                series: [
                  {
                    name: 'Bar',
                    type: 'bar',
                    data: [88, 92, 95],
                    barWidth: '35%',
                    itemStyle: {
                      color: '#fbbf24',
                      borderRadius: [4, 4, 0, 0]
                    },
                    yAxisIndex: 0
                  },
                  {
                    name: 'Line',
                    type: 'line',
                    data: [14, 15, 16],
                    lineStyle: {
                      color: '#10b981',
                      width: 2
                    },
                    itemStyle: {
                      color: '#10b981'
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    yAxisIndex: 1
                  }
                ]
              }}
              style={{ height: '130px' }}
            />
          </div>

          {/* Investment Portfolio Health Chart */}
          <div className="chart-card chart-card-p-3">
            <h3 className="chart-title">Investment Portfolio Health</h3>
            <ReactECharts
              option={{
                backgroundColor: 'transparent',
                tooltip: {
                  trigger: 'item',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#475569',
                  borderWidth: 1,
                  textStyle: { color: '#fff', fontSize: 11 },
                  padding: [6, 10],
                  formatter: (params: any) => {
                    return `Risk: ${params.value[0]}<br/>Align: ${params.value[1]}`;
                  }
                },
                grid: {
                  left: '12%',
                  right: '8%',
                  top: '8%',
                  bottom: '15%'
                },
                xAxis: {
                  type: 'value',
                  name: 'Risk Level',
                  nameLocation: 'middle',
                  nameGap: 25,
                  nameTextStyle: {
                    color: '#94a3b8',
                    fontSize: 10
                  },
                  min: 0,
                  max: 5,
                  axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 9
                  }
                },
                yAxis: {
                  type: 'value',
                  name: 'Align',
                  nameLocation: 'middle',
                  nameGap: 30,
                  nameTextStyle: {
                    color: '#94a3b8',
                    fontSize: 10
                  },
                  min: 0,
                  max: 5,
                  axisLine: { show: false },
                  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 9
                  }
                },
                series: [{
                  type: 'scatter',
                  data: [
                    [1, 2],
                    [2, 5],
                    [3, 3],
                    [4, 5],
                    [4.5, 2],
                    [5, 5]
                  ],
                  symbolSize: function (val: number[]) {
                    return val[0] * 8; // Size based on risk level
                  },
                  itemStyle: {
                    color: '#fbbf24',
                    opacity: 0.8
                  },
                  emphasis: {
                    itemStyle: {
                      color: '#fbbf24',
                      opacity: 1
                    }
                  }
                }]
              }}
              style={{ height: '140px' }}
            />
          </div>

          {/* Projects & Operations Integration Chart */}
          <div className="chart-card chart-card-p-3">
            <h3 className="chart-title">Projects & Operations Integration</h3>
            <ReactECharts
              option={{
                backgroundColor: 'transparent',
                tooltip: {
                  trigger: 'item',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#475569',
                  borderWidth: 1,
                  textStyle: { color: '#fff', fontSize: 11 },
                  padding: [6, 10]
                },
                grid: {
                  left: '12%',
                  right: '8%',
                  top: '25%',
                  bottom: '15%'
                },
                graphic: [
                  {
                    type: 'text',
                    left: '15%',
                    top: '12%',
                    style: {
                      text: 'Current Q',
                      fill: '#fbbf24',
                      fontSize: 14,
                      fontWeight: 'bold'
                    }
                  },
                  {
                    type: 'text',
                    left: '15%',
                    top: '22%',
                    style: {
                      text: 'Project Velocity: 88',
                      fill: '#fbbf24',
                      fontSize: 11
                    }
                  },
                  {
                    type: 'text',
                    left: '15%',
                    top: '30%',
                    style: {
                      text: 'Ops Efficiency: 93',
                      fill: '#10b981',
                      fontSize: 11
                    }
                  }
                ],
                xAxis: {
                  type: 'category',
                  data: ['Current Q', 'Next Q'],
                  axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 10
                  }
                },
                yAxis: {
                  type: 'value',
                  max: 100,
                  axisLine: { show: false },
                  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                  axisLabel: {
                    color: '#94a3b8',
                    fontSize: 9
                  }
                },
                series: [{
                  type: 'bar',
                  data: [
                    { value: 88, itemStyle: { color: '#fbbf24' } },
                    { value: 95, itemStyle: { color: '#fbbf24' } }
                  ],
                  barWidth: '35%',
                  itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                  }
                }]
              }}
              style={{ height: '140px' }}
            />
          </div>

          {/* Insight Cards */}
          <div className="insight-cards-container">
            <div className="insight-card">
              <div className="insight-label">Project Velocity</div>
              <div className="insight-value-amber">88%</div>
              <div className="insight-subtext">On-track delivery</div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Operations Efficiency</div>
              <div className="insight-value-green">93%</div>
              <div className="insight-subtext">Above target</div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Partnership Health</div>
              <div className="insight-value-amber">74%</div>
              <div className="insight-subtext">2% above plan</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}