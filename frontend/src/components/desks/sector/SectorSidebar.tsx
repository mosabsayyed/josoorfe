import { useState, useEffect, useRef } from 'react';
import { Target, Heart, Calendar, Filter } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { GaugeCard } from '@/components/desks/sector/GaugeCard';
// import { getStrategicPriorities, SectorPerformance } from '@/services/sectorService'; // Commented: Neo4j not ready
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
    OutcomesData,
    InvestmentInitiative,
    getInvestmentInitiatives
} from '@/services/dashboardService';
// import { AnalyticsService } from '@/services/analyticsService'; // Commented: Requires Neo4j data
import './SectorSidebar.css';

interface SectorSidebarProps {
    year?: string;
    quarter?: string;
}

export function SectorSidebar({ year, quarter }: SectorSidebarProps) {
    const [activeTab, setActiveTab] = useState<'impact' | 'health'>('impact');

    // Time Filter State
    const [timeFilter, setTimeFilter] = useState<TimeFilter>({ year: 2025, quarter: 'Q1' });

    // Data State
    // const [kpiData, setKpiData] = useState<SectorPerformance[]>([]); // Commented: For Neo4j data
    const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPI[]>([]);
    const [outcomesDataList, setOutcomesDataList] = useState<OutcomesData[]>([]);
    const [initiativesData, setInitiativesData] = useState<InvestmentInitiative[]>([]);
    const [gaugeData, setGaugeData] = useState<GaugeData[]>([]);
    // Chart Refs
    const strategicRef = useRef<any>(null);
    const healthRef = useRef<any>(null);

    const [radarValues, setRadarValues] = useState<{
        actual: number[];
        plan: number[];
        metrics?: any[]; // Allow metrics object
        rawActual?: number[];
        rawPlan?: number[];
    }>({
        actual: [0, 0, 0, 0, 0],
        plan: [0, 0, 0, 0, 0],
        metrics: []
    });
    const [healthRadarValues, setHealthRadarValues] = useState<{
        actual: number[];
        plan: number[];
        metrics?: any[];
        rawActual?: number[];
        rawPlan?: number[];
    }>({
        actual: [0, 0, 0, 0, 0, 0, 0, 0],
        plan: [0, 0, 0, 0, 0, 0, 0, 0],
        metrics: []
    });

    // Trend Data - Initialized to empty state
    const [trendData, setTrendData] = useState({
        labels: ['Last Q', 'Current Q', 'Next Q'],
        projectVelocity: [0, 0, 0],
        operationalEfficiency: [0, 0, 0],
        citizenQoL: [0, 0, 0]
    });

    const [radarTooltip, setRadarTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        label: string;
        value: number;
        target: number;
    }>({ visible: false, x: 0, y: 0, label: '', value: 0, target: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Sync props with state when they change
    useEffect(() => {
        if (year || quarter) {
            setTimeFilter(prev => ({
                year: year ? parseInt(year) : prev.year,
                quarter: quarter || prev.quarter
            }));
        }
    }, [year, quarter]);

    // === FULL TABLE LOAD STRATEGY ===
    // Load full Supabase tables once on mount, then filter client-side for instant response
    const [allKPIs, setAllKPIs] = useState<DashboardKPI[]>([]);
    const [allOutcomes, setAllOutcomes] = useState<OutcomesData[]>([]);
    const [allInitiatives, setAllInitiatives] = useState<InvestmentInitiative[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Load full tables once on mount
    useEffect(() => {
        const loadFullTables = async () => {
            setIsLoading(true);
            try {
                // Fetch ALL data from Supabase without filters
                const noFilter: TimeFilter = { year: 0, quarter: 'All' };
                const [kpis, outcomes, initiatives] = await Promise.all([
                    getDashboardKPIs(noFilter),
                    getOutcomesData(noFilter),
                    getInvestmentInitiatives(noFilter)
                ]);

                console.log("[SectorSidebar] Loaded full tables - KPIs:", kpis.length, "Outcomes:", outcomes.length, "Initiatives:", initiatives.length);
                setAllKPIs(kpis);
                setAllOutcomes(outcomes);
                setAllInitiatives(initiatives);
                setDataLoaded(true);
            } catch (error) {
                console.error("[SectorSidebar] Failed to load tables:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadFullTables();
    }, []);

    // Filter from loaded data when timeFilter changes (instant, no API call)
    useEffect(() => {
        if (!dataLoaded) return;

        let filteredKPIs: DashboardKPI[] = [];
        let filteredOutcomes: OutcomesData[] = [];
        let filteredInitiatives: InvestmentInitiative[] = [];

        if (timeFilter.quarter && timeFilter.quarter !== 'ALL' && timeFilter.quarter !== 'All') {
            const target = `${timeFilter.quarter} ${timeFilter.year}`.trim();
            console.log(`[SectorSidebar] Filter Target: "${target}"`);

            // 1. Try Exact Match (Robust)
            const exactMatchOutcomes = allOutcomes.filter(d => d.quarter.trim() === target);

            if (exactMatchOutcomes.length > 0) {
                console.log(`[SectorSidebar] Exact Match Found for Outcomes: ${exactMatchOutcomes.length} records`);
                filteredOutcomes = exactMatchOutcomes;
            } else {
                console.warn(`[SectorSidebar] No exact match for "${target}" in Outcomes. Checking available quarters:`, allOutcomes.map(d => d.quarter));

                // 2. Fallback: Try Case-Insensitive / Fuzzy Match
                const fuzzyMatchOutcomes = allOutcomes.filter(d => d.quarter.toLowerCase().includes(target.toLowerCase()));
                if (fuzzyMatchOutcomes.length > 0) {
                    console.log(`[SectorSidebar] Fuzzy Match Found for Outcomes using "${target}"`);
                    filteredOutcomes = fuzzyMatchOutcomes;
                } else {
                    // 3. Fallback to Latest if user selected a future date that doesn't exist yet? 
                    // Or keep empty to show "No Data" correctly.
                    // User says: "Quarter year format... saved as Q1 2026".
                    // ControlTower falls back to LATEST if specific not found. We should optionally do that or validly show 0.
                    // For now, let's stick to empty to avoid showing WRONG quarter data, unless user explicitly requested fallback.
                    console.error(`[SectorSidebar] FILTER FAILED for Outcomes. Target: "${target}" vs Available:`, allOutcomes.map(d => d.quarter));
                    filteredOutcomes = [];
                }
            }

            // Filter KPIs similarly
            const exactMatchKPIs = allKPIs.filter(d => d.quarter.trim() === target);
            if (exactMatchKPIs.length > 0) {
                console.log(`[SectorSidebar] Exact Match Found for KPIs: ${exactMatchKPIs.length} records`);
                filteredKPIs = exactMatchKPIs;
            } else {
                console.warn(`[SectorSidebar] No exact match for "${target}" in KPIs. Checking available quarters:`, allKPIs.map(d => d.quarter));
                const fuzzyMatchKPIs = allKPIs.filter(d => d.quarter.toLowerCase().includes(target.toLowerCase()));
                if (fuzzyMatchKPIs.length > 0) {
                    console.log(`[SectorSidebar] Fuzzy Match Found for KPIs using "${target}"`);
                    filteredKPIs = fuzzyMatchKPIs;
                } else {
                    console.error(`[SectorSidebar] FILTER FAILED for KPIs. Target: "${target}" vs Available:`, allKPIs.map(d => d.quarter));
                    filteredKPIs = [];
                }
            }

            // Filter Initiatives
            const exactMatchInitiatives = allInitiatives.filter(d => d.quarter.trim() === target);
            if (exactMatchInitiatives.length > 0) {
                filteredInitiatives = exactMatchInitiatives;
            } else {
                filteredInitiatives = allInitiatives.filter(d => d.quarter.toLowerCase().includes(target.toLowerCase()));
            }
        } else {
            // If ALL selected, maybe we want the LATEST one for specific charts?
            // Existing logic was 'latest = outcomesDataList[0]'. If list is full, [0] is latest (descending).
            // Ensure sorting.
            filteredOutcomes = [...allOutcomes].sort((a, b) => b.id - a.id);
            filteredKPIs = [...allKPIs].sort((a, b) => b.id - a.id); // Assuming KPIs also have an 'id' for sorting
            filteredInitiatives = [...allInitiatives];
            console.log("[SectorSidebar] 'All' quarter selected. Using all available data, sorted by ID (descending).");
        }

        console.log("[SectorSidebar] Filtered for", timeFilter.quarter, timeFilter.year, "- KPIs:", filteredKPIs.length, "Outcomes:", filteredOutcomes.length);

        // Update display state
        setOutcomesDataList(filteredOutcomes);
        setDashboardKPIs(filteredKPIs);
        setInitiativesData(filteredInitiatives);

        // Strategic Impact Radar (from Supabase outcomes)
        if (filteredOutcomes.length > 0) {
            const strategicRadar = transformToStrategicRadar(filteredOutcomes, allOutcomes);
            setRadarValues({
                actual: strategicRadar.actual,
                plan: strategicRadar.plan,
                metrics: strategicRadar.metrics,
                // rawActual: strategicRadar.rawActual, // Deprecated by metrics
                // rawPlan: strategicRadar.rawPlan    // Deprecated by metrics
            });
        }

        // Transformation Health Radar & Gauges (from Supabase KPIs)
        // Transformation Health Radar & Gauges (from Supabase KPIs)
        if (filteredKPIs.length > 0) {
            const quarterStr = timeFilter.quarter === 'All' ? 'Q1' : timeFilter.quarter;
            const healthRadar = transformToHealthRadar(filteredKPIs, quarterStr, timeFilter.year.toString());
            setHealthRadarValues({
                actual: healthRadar.actual,
                plan: healthRadar.plan,
                metrics: healthRadar.metrics,
            });

            const t = transformToGaugeData(filteredKPIs);
            // Ensure 8 items for layout consistency
            const filled = [...t];
            while (filled.length < 8) {
                filled.push({
                    label: 'N/A', value: 0, status: 'green', delta: '0%',
                    baseValue: 0, qMinus1: 0, qPlus1: 0, endValue: 100,
                    family: '0.0', level: 1
                });
            }
            setGaugeData(filled.slice(0, 8));

            // --- DYNAMIC TREND DATA POPULATION ---
            // Helper to get logic for Previous/Next Quarters
            const getRelativeQuarter = (y: number, q: string, offset: number): string => {
                if (q === 'All' || q === 'ALL') return `${q} ${y}`;
                const qNum = parseInt(q.replace('Q', ''));
                let newQ = qNum + offset;
                let newY = y;
                // Handle year rollover
                while (newQ > 4) { newQ -= 4; newY++; }
                while (newQ < 1) { newQ += 4; newY--; }
                return `Q${newQ} ${newY}`;
            };

            const qCurrent = `${timeFilter.quarter} ${timeFilter.year}`;
            const qPrev = getRelativeQuarter(timeFilter.year, timeFilter.quarter, -1);
            const qNext = getRelativeQuarter(timeFilter.year, timeFilter.quarter, 1);
            const quarters = [qPrev, qCurrent, qNext];

            // Helper to find KPI Value
            const getKPIVal = (q: string, title: string) => {
                const k = allKPIs.find(d => d.quarter === q && d.dimension_title === title);
                return k ? Number(k.kpi_actual || 0) : 0;
            };

            // Helper to calculate QoL (Avg Infrastructure Quality)
            const getQoLVal = (q: string) => {
                const o = allOutcomes.find(d => d.quarter === q);
                if (!o) return 0;
                // Use Energy as Sewer fact
                const w = o.water_quality_actual || 0;
                const e = o.energy_quality_actual || 0;
                const t = o.transport_quality_actual || 0;
                let count = 0;
                if (o.water_quality_actual !== undefined) count++;
                if (o.energy_quality_actual !== undefined) count++;
                if (o.transport_quality_actual !== undefined) count++;
                if (count === 0) return 0;
                return (w + e + t) / count;
            };

            setTrendData({
                labels: ['Last Q', 'Current Q', 'Next Q'],
                projectVelocity: quarters.map(q => getKPIVal(q, 'Project Delivery Velocity')),
                operationalEfficiency: quarters.map(q => getKPIVal(q, 'Operational Efficiency')),
                citizenQoL: quarters.map(q => getQoLVal(q))
            });

        } else {
            // EMPTY STATE: Set 8 Zero-Gauges
            setGaugeData(Array(8).fill(null).map((_, i) => ({
                label: `KPI ${i + 1}`,
                value: 0,
                status: 'green',
                delta: '0%',
                baseValue: 0,
                qMinus1: 0,
                qPlus1: 0,
                endValue: 100,
                family: `${i + 1}.0`,
                level: 1
            })));
            // Reset Trends to Zero
            setTrendData({
                labels: ['Last Q', 'Current Q', 'Next Q'],
                projectVelocity: [0, 0, 0],
                operationalEfficiency: [0, 0, 0],
                citizenQoL: [0, 0, 0]
            });
        }
    }, [timeFilter, dataLoaded, allKPIs, allOutcomes]);

    // Helper to calculate hovered index based on angle
    // ECharts Radar default: Starts 12 o'clock (North), distributes Clockwise? 
    // Actually ECharts default is Counter-Clockwise from North? Or Clockwise? 
    // User says mismatch. Let's assume one is opposite.
    // If indices are FDI(0), Trade(1)... and they appear Clockwise on screen.
    // atan2 is Counter-Clockwise.
    // So if we move mouse Right (Index 1?), angle goes 0->negative?
    const getHoveredIndex = (e: any, centerRatio: number, count: number) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height * centerRatio;

        // Calculate standard angle (radians) from center
        const dx = x - cx;
        const dy = y - cy;
        // atan2 returns angle in radians from positive x-axis (-PI to PI)
        let angle = Math.atan2(dy, dx);

        // Convert to degrees
        let degrees = angle * (180 / Math.PI);

        // ECharts Radar: Index 0 is usually at 90 degrees (North)
        // Adjust so North is 0
        // Standard geometric angle: East=0, South=90, West=180, North=-90
        // We want North=0, East=90, South=180, West=270 (Clockwise)

        // Transform: 
        // 1. Shift origin (North is -90 in standard, we want 0) -> +90
        let effectiveAngle = degrees + 90;

        // 2. This makes North=0, East=90... BUT atan2 increases Counter-Clockwise!
        // So East would be negative? No, Y is down in screen coords.
        // dy > 0 is South.
        // Screen Coords:
        // Right (+x, 0y) -> 0 rad (0 deg)
        // Down (0x, +y) -> PI/2 rad (90 deg)
        // Left (-x, 0y) -> PI rad (180 deg)
        // Up (0x, -y) -> -PI/2 rad (-90 deg)

        // We want North (Up) to be 0 for Index 0.
        // North is -90 deg. +90 = 0.
        // East (Right) is 0 deg. +90 = 90.
        // South (Down) is 90 deg. +90 = 180.
        // West (Left) is 180 deg. +90 = 270.

        // This is CLOCKWISE increasing from North!
        // (0 at North, 90 at East, 180 at South...)
        // ECharts is COUNTER-CLOCKWISE.

        if (effectiveAngle < 0) effectiveAngle += 360; // Normalize 0-360

        const sectorSize = 360 / count;
        // Round to nearest sector index (Clockwise approximation)
        let clockwiseIndex = Math.round(effectiveAngle / sectorSize) % count;

        // Invert for CCW: 0->0, 1->4, 2->3...
        if (clockwiseIndex === 0) return 0;
        return count - clockwiseIndex;
    };

    /*
    useEffect(() => {
        if (kpiData.length > 0 && dashboardKPIs.length > 0) {
            const analytics = new AnalyticsService(kpiData, dashboardKPIs, outcomesDataList);
            const health = analytics.getDualLayerHealth();
            console.log('Analytics Health:', health);
        }
    }, [kpiData, dashboardKPIs, outcomesDataList]);
    */

    // Strategic Impact Radar Chart
    const strategicRadarOption = {
        backgroundColor: 'transparent',
        graphic: [{
            type: 'text',
            right: 5,
            top: 28,
            style: {
                text: `${Math.round(radarValues.actual.reduce((a, b) => a + b, 0) / 5)}%`,
                fill: '#d4af37',
                fontSize: 24,
                fontWeight: 'bold'
            }
        }],
        tooltip: { show: false },
        legend: {
            data: ['Actual', 'Plan'],
            left: 0,
            top: 0,
            orient: 'vertical',
            itemWidth: 10,
            itemHeight: 10,
            textStyle: {
                color: '#94a3b8',
                fontSize: 10
            }
        },
        radar: {
            indicator: [
                { name: 'FDI', max: 100, min: 0 },
                { name: 'Trade', max: 100, min: 0 },
                { name: 'Jobs', max: 100, min: 0 },
                { name: 'Community', max: 100, min: 0 },
                { name: 'Infrastructure', max: 100, min: 0 }
            ],
            center: ['50%', '58%'],
            radius: '55%',
            splitNumber: 4,
            axisName: {
                color: '#cbd5e1',
                fontSize: 10
            },
            splitLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            splitArea: { show: false },
            axisLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
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
                    lineStyle: { color: '#64748b', width: 2, type: 'dashed' },
                    itemStyle: { color: '#64748b' },
                    areaStyle: { color: 'rgba(100, 116, 139, 0.1)' }
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
                    lineStyle: { color: '#d4af37', width: 2 },
                    itemStyle: { color: '#d4af37' },
                    areaStyle: { color: 'rgba(212, 175, 55, 0.4)' }
                }]
            }
        ]
    };

    // Transform Health Radar Chart
    const transformRadarOption = {
        backgroundColor: 'transparent',
        graphic: [{
            type: 'text',
            right: 5,
            top: 28,
            style: {
                text: `${Math.round(healthRadarValues.actual.reduce((a, b) => a + b, 0) / 8)}%`,
                fill: '#10b981',
                fontSize: 24,
                fontWeight: 'bold'
            }
        }],
        tooltip: { show: false },
        legend: {
            data: ['Actual', 'Target'],
            left: 0,
            top: 0,
            orient: 'vertical',
            itemWidth: 10,
            itemHeight: 10,
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
            radius: '55%',
            splitNumber: 4,
            axisName: {
                color: '#cbd5e1',
                fontSize: 9
            },
            splitLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            splitArea: { show: false },
            axisLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
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
                        color: '#d4af37', // Gold
                        width: 2
                    },
                    itemStyle: {
                        color: '#d4af37' // Gold
                    },
                    areaStyle: {
                        color: 'rgba(212, 175, 55, 0.4)' // Gold with opacity
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

            {/* Strategic Impact Tab */}
            {activeTab === 'impact' && (
                <div className="dashboard-content">
                    {/* Radar Chart with Custom Tooltip */}
                    <div className="chart-card chart-card-p-2-5" style={{ position: 'relative' }}>
                        <div onMouseMove={(e) => {
                            // Using a div wrapper to capture mouse for simpler rect checks
                        }}>
                            <ReactECharts
                                ref={strategicRef}
                                option={strategicRadarOption}
                                style={{ height: '240px' }}
                                onEvents={{
                                    mouseover: (params: any) => {
                                        if (params.componentType === 'series') {
                                            const idx = getHoveredIndex(params.event.event, 0.58, 5);
                                            // metrics fallback for safety
                                            const m = radarValues.metrics?.[idx] || {
                                                label: 'Unknown',
                                                formattedActual: '0',
                                                formattedTarget: '0'
                                            };

                                            setRadarTooltip({
                                                visible: true,
                                                x: params.event.event.offsetX,
                                                y: params.event.event.offsetY,
                                                label: m.label,
                                                value: m.formattedActual,  // Pre-formatted string
                                                target: m.formattedTarget  // Pre-formatted string
                                            });
                                        }
                                    },
                                    mouseout: () => setRadarTooltip(prev => ({ ...prev, visible: false }))
                                }}
                            />
                        </div>
                        {radarTooltip.visible && (
                            <div style={{
                                position: 'absolute',
                                left: radarTooltip.x + 10,
                                top: radarTooltip.y - 10,
                                background: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid #475569',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#fff',
                                zIndex: 1000,
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                            }}>
                                {/* Label removed from inside tooltip as requested (redundant) or kept minimal? 
                                    User: "no need to mention the label again". 
                                    But we need context? Let's keep it minimal tiny header or remove.
                                    User said: "showing -3% while it should be showing normalized %"
                                    Actually I am showing FORMATTED value now (e.g. 1.2B) which is better.
                                    Let's honor "no label again" if referring to tooltip title vs axis label.
                                */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div>
                                        <span style={{ color: '#d4af37', fontWeight: 600 }}>Actual:</span>
                                        {` ${Math.round(radarValues.actual[radarValues.metrics?.findIndex(m => m.label === radarTooltip.label) || 0])}% (${radarTooltip.value})`}
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b' }}>Plan:</span>
                                        {` ${Math.round(radarValues.plan[radarValues.metrics?.findIndex(m => m.label === radarTooltip.label) || 0])}% (${radarTooltip.target})`}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginTop: '16px' }}>

                        {/* Growth & Stability */}

                        {/* Growth & Stability (Economic Impact) */}
                        <div className="chart-card chart-card-p-3">
                            <h3 className="chart-title">Growth & Stability</h3>
                            <ReactECharts
                                option={(() => {
                                    // 1. Dynamic Annual Aggregation
                                    const annualData: Record<string, { fdi_act: number; fdi_tgt: number; trade_act: number; trade_tgt: number }> = {};
                                    allOutcomes.forEach(d => {
                                        if (!d.quarter) return;
                                        const year = d.quarter.split(' ')[1];
                                        if (year) {
                                            if (!annualData[year]) annualData[year] = { fdi_act: 0, fdi_tgt: 0, trade_act: 0, trade_tgt: 0 };
                                            annualData[year].fdi_act += Number(d.fdi_actual || 0);
                                            annualData[year].fdi_tgt += Number(d.fdi_target || 0);
                                            annualData[year].trade_act += Number(d.trade_balance_actual || 0);
                                            annualData[year].trade_tgt += Number(d.trade_balance_target || 0);
                                        }
                                    });
                                    let years = Object.keys(annualData).sort((a, b) => parseInt(a) - parseInt(b));
                                    if (years.length === 0) years = ['2025', '2026', '2027', '2028', '2029'];

                                    const selectedYear = timeFilter.year;

                                    return {
                                        backgroundColor: 'transparent',
                                        tooltip: {
                                            trigger: 'axis',
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: '#475569',
                                            textStyle: { color: '#fff', fontSize: 11 },
                                            formatter: (params: any[]) => {
                                                let res = `<div style="font-size: 11px; margin-bottom: 4px; color: #94a3b8;">${params[0].name}</div>`;
                                                params.forEach(p => {
                                                    res += `<div style="display:flex; justify-content:space-between; width:120px;">
                                                        <span style="color:${p.color}">${p.marker} ${p.seriesName}</span>
                                                        <strong style="color:#e2e8f0">${p.value.toLocaleString()} B</strong>
                                                    </div>`;
                                                });
                                                return res;
                                            }
                                        },
                                        legend: { show: true, bottom: 0, textStyle: { color: '#94a3b8', fontSize: 10 } },
                                        grid: { left: '12%', right: '8%', top: '15%', bottom: '20%' },
                                        xAxis: {
                                            type: 'category',
                                            data: years,
                                            axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                                            axisLabel: { color: '#94a3b8', fontSize: 10 }
                                        },
                                        yAxis: {
                                            type: 'value',
                                            name: 'B SAR',
                                            nameTextStyle: { color: '#64748b', fontSize: 9, padding: [0, 0, 0, 0] },
                                            splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                                            axisLabel: { color: '#64748b', fontSize: 9 }
                                        },
                                        series: [
                                            {
                                                name: 'FDI',
                                                type: 'bar',
                                                data: years.map(y => {
                                                    const isFuture = parseInt(y) >= selectedYear;
                                                    const val = isFuture ? (annualData[y]?.fdi_tgt || 0) : (annualData[y]?.fdi_act || 0);
                                                    return {
                                                        value: val,
                                                        itemStyle: {
                                                            color: isFuture ? '#FCD34D' : '#d4af37', // Lighter Gold for Plan
                                                            opacity: isFuture ? 0.6 : 1
                                                        }
                                                    };
                                                }),
                                                barMaxWidth: 20
                                            },
                                            {
                                                name: 'Trade Balance',
                                                type: 'line',
                                                data: years.map(y => {
                                                    const isFuture = parseInt(y) >= selectedYear;
                                                    const val = isFuture ? (annualData[y]?.trade_tgt || 0) : (annualData[y]?.trade_act || 0);
                                                    return {
                                                        value: val,
                                                        itemStyle: {
                                                            color: isFuture ? '#94a3b8' : '#64748b' // Light Slate for Plan
                                                        }
                                                    };
                                                }),
                                                itemStyle: { color: '#64748b' },
                                                symbol: 'circle',
                                                symbolSize: 6,
                                                lineStyle: { width: 2 }
                                            }
                                        ]
                                    };
                                })()}
                                style={{ height: '180px' }}
                            />
                        </div>

                        {/* Socio-Economic Impact */}
                        <div className="chart-card chart-card-p-3">
                            <h3 className="chart-title">Socio-Economic Impact</h3>
                            <ReactECharts
                                option={(() => {
                                    // 1. Dynamic Annual Aggregation
                                    const annualData: Record<string, { jobs_act: number; jobs_tgt: number; comm_act: number; comm_tgt: number; count: number }> = {};
                                    allOutcomes.forEach(d => {
                                        if (!d.quarter) return;
                                        const year = d.quarter.split(' ')[1];
                                        if (year) {
                                            if (!annualData[year]) annualData[year] = { jobs_act: 0, jobs_tgt: 0, comm_act: 0, comm_tgt: 0, count: 0 };
                                            annualData[year].jobs_act += Number(d.jobs_created_actual || 0);
                                            annualData[year].jobs_tgt += Number(d.jobs_created_target || 0);

                                            // Avg for Community
                                            if (d.community_engagement_actual) {
                                                annualData[year].comm_act += Number(d.community_engagement_actual);
                                                annualData[year].comm_tgt += Number(d.community_engagement_target || 0);
                                                annualData[year].count++;
                                            }
                                        }
                                    });
                                    let years = Object.keys(annualData).sort((a, b) => parseInt(a) - parseInt(b));
                                    if (years.length === 0) years = ['2025', '2026', '2027', '2028', '2029'];

                                    const selectedYear = timeFilter.year;

                                    return {
                                        backgroundColor: 'transparent',
                                        tooltip: {
                                            trigger: 'axis',
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: '#475569',
                                            textStyle: { color: '#fff', fontSize: 11 }
                                        },
                                        legend: { show: true, bottom: 0, textStyle: { color: '#94a3b8', fontSize: 10 } },
                                        grid: { left: '12%', right: '12%', top: '15%', bottom: '20%' },
                                        xAxis: {
                                            type: 'category',
                                            data: years,
                                            axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                                            axisLabel: { color: '#94a3b8', fontSize: 10 }
                                        },
                                        yAxis: [
                                            {
                                                type: 'value',
                                                name: 'Jobs',
                                                position: 'left',
                                                splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
                                                axisLabel: {
                                                    color: '#64748b', fontSize: 9,
                                                    formatter: (val: number) => val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val
                                                }
                                            },
                                            {
                                                type: 'value',
                                                name: 'Comm %',
                                                position: 'right',
                                                min: 0, max: 100,
                                                splitLine: { show: false },
                                                axisLabel: { color: '#64748b', fontSize: 9, formatter: '{value}%' }
                                            }
                                        ],
                                        series: [
                                            {
                                                name: 'Jobs',
                                                type: 'bar',
                                                yAxisIndex: 0,
                                                data: years.map(y => {
                                                    const isFuture = parseInt(y) >= selectedYear;
                                                    const val = isFuture ? (annualData[y]?.jobs_tgt || 0) : (annualData[y]?.jobs_act || 0);
                                                    return {
                                                        value: val,
                                                        itemStyle: {
                                                            color: isFuture ? '#34D399' : '#10B981', // Lighter Green for Plan
                                                            opacity: isFuture ? 0.6 : 1
                                                        }
                                                    };
                                                }),
                                                barMaxWidth: 20
                                            },
                                            {
                                                name: 'Community',
                                                type: 'line',
                                                yAxisIndex: 1,
                                                data: years.map(y => {
                                                    const isFuture = parseInt(y) >= selectedYear;
                                                    const count = annualData[y]?.count || 1;
                                                    const val = isFuture
                                                        ? Math.round((annualData[y]?.comm_tgt || 0) / count)
                                                        : Math.round((annualData[y]?.comm_act || 0) / count);
                                                    return {
                                                        value: val,
                                                        itemStyle: {
                                                            color: isFuture ? '#FCD34D' : '#d4af37', // Lighter Gold for Plan
                                                        }
                                                    };
                                                }),
                                                itemStyle: { color: '#d4af37' },
                                                symbol: 'circle',
                                                symbolSize: 6
                                            }
                                        ]
                                    };
                                })()}
                                style={{ height: '180px' }}
                            />
                        </div>


                        {/* Investment Portfolio Health (SCATTER) */}
                        <div className="chart-card chart-card-p-3">
                            <h3 className="chart-title">Investment Portfolio Health</h3>
                            <ReactECharts
                                option={(() => {
                                    const validItems = initiativesData.filter(i => i.risk_score && i.alignment_score);
                                    const budgets = validItems.map(i => i.budget || 0);
                                    const minB = Math.min(...budgets);
                                    const maxB = Math.max(...budgets);
                                    const range = maxB - minB;

                                    return {
                                        backgroundColor: 'transparent',
                                        tooltip: {
                                            trigger: 'item',
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: '#475569',
                                            textStyle: { color: '#fff', fontSize: 11 },
                                            formatter: (params: any) => {
                                                const d = params.data;
                                                return `<div style="font-size: 11px;">
                                                <strong style="color: #d4af37">${d[3]}</strong><br/>
                                                Risk: ${d[0]} | Alignment: ${d[1]}<br/>
                                                Budget: ${d[2].toLocaleString()} SAR
                                            </div>`;
                                            }
                                        },
                                        grid: { left: '12%', right: '12%', top: '15%', bottom: '20%' },
                                        xAxis: { name: 'Risk', type: 'value', min: 0, max: 5, splitLine: { show: false }, axisLine: { lineStyle: { color: '#64748b' } }, axisLabel: { fontSize: 9 } },
                                        yAxis: { name: 'Align', type: 'value', min: 0, max: 5, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }, axisLine: { show: false }, axisLabel: { fontSize: 9 } },
                                        series: [{
                                            type: 'scatter',
                                            symbolSize: (val: any[]) => {
                                                const b = val[2] || 0;
                                                if (range === 0) return 15; // Uniform size if no variance
                                                // Normalize 0-1
                                                const normalized = (b - minB) / range;
                                                // Map to 8px - 35px
                                                return 8 + (normalized * 27);
                                            },
                                            data: validItems.map(i => [i.risk_score, i.alignment_score, i.budget, i.initiative_name]),
                                            itemStyle: { color: 'rgba(212, 175, 55, 0.7)', borderColor: '#d4af37' }
                                        }]
                                    };
                                })()}
                                style={{ height: '200px' }}
                            />
                        </div>

                        {/* Projects & Operations Integration (COMBO) - RECOVERED SPECS */}
                        <div className="chart-card chart-card-p-3">
                            <h3 className="chart-title" style={{ marginBottom: '2px' }}>Projects & Ops Integration</h3>
                            <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px' }}>Velocity Trends</div>
                            <ReactECharts
                                option={{
                                    backgroundColor: 'transparent',
                                    tooltip: {
                                        trigger: 'axis',
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        borderColor: '#475569',
                                        textStyle: { color: '#fff', fontSize: 11 }
                                    },
                                    grid: { left: '15%', right: '15%', top: '20%', bottom: '25%' },
                                    legend: { show: true, top: 0, textStyle: { color: '#94a3b8', fontSize: 9 }, itemWidth: 8, itemHeight: 8 },
                                    xAxis: {
                                        type: 'category',
                                        data: trendData.labels,
                                        axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                                        axisLabel: { color: '#94a3b8', fontSize: 9, interval: 0 }
                                    },
                                    yAxis: [
                                        { type: 'value', name: 'Vel', show: false },
                                        { type: 'value', name: 'Eff', show: false }
                                    ],
                                    series: [
                                        {
                                            name: 'Velocity', type: 'bar',
                                            data: trendData.projectVelocity,
                                            itemStyle: { color: '#d4af37' }, barWidth: '30%'
                                        },
                                        {
                                            name: 'Efficiency', type: 'line', yAxisIndex: 1,
                                            data: trendData.operationalEfficiency,
                                            itemStyle: { color: '#10B981' }, // RECOVERED: Success Green
                                            symbol: 'circle', symbolSize: 6
                                        }
                                    ]
                                }}
                                style={{ height: '160px' }}
                            />
                        </div>
                    </div>


                    {/* Economic Impact Correlation (COMBO) - RECOVERED SPECS */}
                    <div className="chart-card chart-card-p-3" style={{ marginTop: '16px' }}>
                        <h3 className="chart-title" style={{ marginBottom: '2px' }}>Economic Impact Correlation</h3>
                        <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px' }}>QoL & Jobs Trends</div>
                        <ReactECharts
                            option={{
                                backgroundColor: 'transparent',
                                tooltip: {
                                    trigger: 'axis',
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    borderColor: '#475569',
                                    textStyle: { color: '#fff', fontSize: 11 }
                                },
                                grid: { left: '12%', right: '8%', top: '25%', bottom: '15%' },
                                legend: { data: ['Efficiency', 'Citizen QoL'], top: 0, textStyle: { color: '#94a3b8', fontSize: 10 } },
                                xAxis: {
                                    type: 'category',
                                    data: trendData.labels,
                                    axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                                    axisLabel: { color: '#94a3b8', fontSize: 10 }
                                },
                                yAxis: [
                                    { type: 'value', name: 'Eff', axisLabel: { color: '#64748b', fontSize: 9 }, splitLine: { show: false } },
                                    { type: 'value', name: 'QoL', axisLabel: { color: '#64748b', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } } }
                                ],
                                series: [
                                    {
                                        name: 'Efficiency',
                                        type: 'bar',
                                        data: trendData.operationalEfficiency,
                                        itemStyle: { color: '#d4af37' },
                                        barWidth: '30%'
                                    },
                                    {
                                        name: 'Citizen QoL',
                                        type: 'line',
                                        yAxisIndex: 1,
                                        data: trendData.citizenQoL,
                                        itemStyle: { color: '#10B981' }, // RECOVERED: Success Green
                                        symbol: 'circle', symbolSize: 6, lineStyle: { width: 2 }
                                    }
                                ]
                            }}
                            style={{ height: '180px' }}
                        />
                    </div>


                    {/* Infrastructure Health Chart (Full Width) */}
                    <div className="chart-card chart-card-p-3" style={{ marginTop: '16px' }}>
                        <h3 className="chart-title">Infrastructure Health</h3>
                        <ReactECharts
                            option={{
                                backgroundColor: 'transparent',
                                tooltip: {
                                    trigger: 'axis',
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    borderColor: '#475569',
                                    borderWidth: 1,
                                    textStyle: { color: '#fff', fontSize: 11 },
                                    formatter: (params: any[]) => {
                                        let res = `<div style="font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">${params[0].name}</div>`;
                                        params.forEach(p => {
                                            const val = p.seriesName === 'Quality' ? p.value : `${Math.round(p.value)}%`;
                                            res += `<div style="display: flex; justify-content: space-between; gap: 10px;">
                                                <span style="color: ${p.color};">${p.seriesName}:</span>
                                                <strong style="color: #fff;">${val}</strong>
                                            </div>`;
                                        });
                                        return res;
                                    }
                                },
                                legend: { show: true, top: 0, textStyle: { color: '#94a3b8', fontSize: 10 } },
                                grid: { left: '12%', right: '12%', top: '25%', bottom: '15%' },
                                xAxis: {
                                    type: 'category',
                                    data: ['Water', 'Energy', 'Transport'],
                                    axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
                                    axisLabel: { color: '#94a3b8', fontSize: 10 }
                                },
                                yAxis: [
                                    {
                                        type: 'value',
                                        name: 'Coverage',
                                        min: 0, max: 100,
                                        position: 'left',
                                        axisLine: { show: true, lineStyle: { color: '#64748b' } },
                                        nameTextStyle: { color: '#d4af37', fontSize: 9 }, // Gold for Cov
                                        axisLabel: { color: '#64748b', fontSize: 9 },
                                        splitLine: { show: false }
                                    },
                                    {
                                        type: 'value',
                                        name: 'Quality',
                                        min: 0, max: 10,
                                        position: 'right',
                                        axisLine: { show: true, lineStyle: { color: '#10B981' } }, // Green for Qual
                                        nameTextStyle: { color: '#10B981', fontSize: 9 },
                                        axisLabel: { color: '#10B981', fontSize: 9 },
                                        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }
                                    }
                                ],
                                series: [{
                                    name: 'Coverage',
                                    type: 'bar',
                                    data: (() => {
                                        const latest = outcomesDataList[0] || ({} as OutcomesData);
                                        return [
                                            latest.water_coverage_actual || 0,
                                            latest.energy_coverage_actual || 0,
                                            latest.transport_coverage_actual || 0
                                        ];
                                    })(),
                                    itemStyle: { color: '#d4af37' },
                                    barWidth: '30%'
                                },
                                {
                                    name: 'Quality',
                                    type: 'bar',
                                    yAxisIndex: 1,
                                    data: (() => {
                                        const latest = outcomesDataList[0] || ({} as OutcomesData);
                                        return [
                                            latest.water_quality_actual || 0,
                                            latest.energy_quality_actual || 0,
                                            latest.transport_quality_actual || 0
                                        ];
                                    })(),
                                    itemStyle: { color: '#10B981' },
                                    barWidth: '30%'
                                }]
                            }}
                            style={{ height: '180px' }}
                        />
                    </div>
                </div >
            )
            }

            {/* Transform Health Tab */}
            {
                activeTab === 'health' && (
                    <div className="dashboard-content">
                        {/* Radar Chart 8pt */}
                        <div className="chart-card chart-card-p-2-5" style={{ position: 'relative' }}>
                            <ReactECharts
                                ref={healthRef}
                                option={transformRadarOption}
                                style={{ height: '240px' }}
                                onEvents={{
                                    mouseover: (params: any) => {
                                        if (params.componentType === 'series') {
                                            // Calculate index manually since trigger: item gives whole series
                                            // Center is 52%
                                            const idx = getHoveredIndex(params.event.event, 0.52, 8);
                                            // metrics fallback for safety
                                            const m = healthRadarValues.metrics?.[idx] || {
                                                label: 'Unknown',
                                                formattedActual: '0%',
                                                formattedTarget: '0%'
                                            };

                                            setRadarTooltip({
                                                visible: true,
                                                x: params.event.event.offsetX,
                                                y: params.event.event.offsetY,
                                                label: m.label,
                                                value: m.formattedActual,
                                                target: m.formattedTarget
                                            });
                                        }
                                    },
                                    mouseout: () => setRadarTooltip(prev => ({ ...prev, visible: false }))
                                }}
                            />
                            {radarTooltip.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: radarTooltip.x + 10,
                                    top: radarTooltip.y - 10,
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid #475569',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    color: '#fff',
                                    zIndex: 1000,
                                    pointerEvents: 'none',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div>
                                            <span style={{ color: '#d4af37', fontWeight: 600 }}>Actual:</span>
                                            {` ${Math.round(healthRadarValues.actual[healthRadarValues.metrics?.findIndex(m => m.label === radarTooltip.label) || 0])}% (${radarTooltip.value})`}
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b' }}>Plan:</span>
                                            {` ${Math.round(healthRadarValues.plan[healthRadarValues.metrics?.findIndex(m => m.label === radarTooltip.label) || 0])}% (${radarTooltip.target})`}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* KPI Cards with Gauges */}
                        <div className="kpi-cards-container">
                            {gaugeData.map((gauge, idx) => (
                                <GaugeCard
                                    key={idx}
                                    {...gauge}
                                    level={gauge.level || 1}
                                />
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default SectorSidebar;
