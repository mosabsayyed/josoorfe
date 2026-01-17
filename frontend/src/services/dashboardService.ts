import apiClient from './apiClient';

/**
 * Service to handle Dashboard data fetching from Backend (Supabase).
 * Endpoints: /api/v1/dashboard/* -> Backend (8008) -> Supabase temp_quarterly_* tables
 */

// Types for Dashboard Data
export interface DashboardKPI {
    id: number;
    quarter: string;
    dimension_id: string;
    dimension_title: string;
    kpi_description: string;
    kpi_formula: string;
    kpi_base_value: number;
    kpi_actual: number;
    kpi_planned: number;
    kpi_next_target: number;
    kpi_final_target: number;
    health_score: number;
    health_state: 'green' | 'amber' | 'red';
    trend: 'up' | 'down' | 'stable';
    projections?: any;
}

export interface OutcomesData {
    id: number;
    quarter: string;
    // FDI
    fdi_actual: number;
    fdi_target: number;
    fdi_baseline: number;
    // Trade
    trade_balance_actual: number;
    trade_balance_target?: number;
    trade_balance_baseline?: number;
    // Jobs
    jobs_created_actual: number;
    jobs_created_target?: number;
    jobs_created_baseline?: number;
    // Partnerships
    partnerships_actual: number;
    partnerships_target?: number;
    // Coverage metrics
    water_coverage_actual: number;
    water_coverage_target?: number;
    energy_coverage_actual: number;
    energy_coverage_target?: number;
    transport_coverage_actual: number;
    transport_coverage_target?: number;
    community_engagement_actual: number;
    community_engagement_target?: number;
    // New Quality Metrics
    water_quality_actual?: number;
    energy_quality_actual?: number;
    transport_quality_actual?: number;
    // Final Targets for Radar Normalization
    fdi_final_target?: number;
    trade_balance_final_target?: number;
    jobs_created_final_target?: number;
    community_engagement_final_target?: number;
    infrastructure_final_target?: number;
    // New Quality Metrics

}

export interface DashboardResponse {
    kpis: DashboardKPI[];
    outcomes: OutcomesData[];
}

// Time filter type
export interface TimeFilter {
    year: number;      // 2025-2029
    quarter: string;   // "Q1" | "Q2" | "Q3" | "Q4" | "ALL"
}

// Available years and quarters for dropdowns
export const AVAILABLE_YEARS = [2025, 2026, 2027, 2028, 2029];
export const AVAILABLE_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

/**
 * Fetch Dashboard KPIs (temp_quarterly_dashboard_data)
 * Used for: Transformation Health Radar, KPI Gauges
 * Endpoint: GET /api/v1/dashboard/dashboard-data?quarter_filter=Q4 2025
 */
export const getDashboardKPIs = async (filter: TimeFilter): Promise<DashboardKPI[]> => {
    // Note: Sandbox fetches ALL data and filters client-side. We replicate that here 
    // to bypass potential backend filtering issues or case mismatches.
    const url = `/api/v1/dashboard/dashboard-data`;
    console.log('[dashboardService] Fetching ALL KPIs from:', url);

    try {
        const response = await apiClient.get<DashboardKPI[] | { data: DashboardKPI[] }>(url);
        // Handle both array response and { data: [...] } response
        let data = Array.isArray(response.data) ? response.data : response.data.data || [];

        console.log('[dashboardService] Total KPIs fetched:', data.length);

        // Client-side Filter
        if (filter.quarter && filter.quarter !== 'ALL' && filter.quarter !== 'All') {
            const target = `${filter.quarter} ${filter.year}`;
            data = data.filter(d => d.quarter === target);
            console.log('[dashboardService] Filtered KPIs for', target, ':', data.length);
        }

        return data;
    } catch (error) {
        console.error('[dashboardService] Failed to fetch dashboard KPIs:', error);
        return [];
    }
};

/**
 * Fetch Outcomes Data (temp_quarterly_outcomes_data)
 * Used for: Strategic Impact Radar
 * Endpoint: GET /api/v1/dashboard/outcomes-data?quarter_filter=Q4 2025
 */
export const getOutcomesData = async (filter: TimeFilter): Promise<OutcomesData[]> => {
    // Note: Sandbox fetches ALL data and filters client-side.
    const url = `/api/v1/dashboard/outcomes-data`;
    console.log('[dashboardService] Fetching ALL Outcomes from:', url);

    try {
        const response = await apiClient.get<OutcomesData[] | { data: OutcomesData[] }>(url);
        // Handle both array response and { data: [...] } response
        let data = Array.isArray(response.data) ? response.data : response.data.data || [];

        console.log('[dashboardService] Total Outcomes fetched:', data.length);

        // Client-side Filter
        if (filter.quarter && filter.quarter !== 'ALL' && filter.quarter !== 'All') {
            const target = `${filter.quarter} ${filter.year}`;
            data = data.filter(d => d.quarter === target);
            console.log('[dashboardService] Filtered Outcomes for', target, ':', data.length);
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch outcomes data:', error);
        return [];
    }
};

/**
 * Transform Dashboard KPIs to Gauge format
 */
export interface GaugeData {
    label: string;
    value: number;
    status: 'green' | 'amber' | 'red';
    delta: string;
    baseValue: number;
    qMinus1: number;
    qPlus1: number;
    endValue: number;
    family: string;
    level: 1 | 2;
}

export const transformToGaugeData = (kpis: DashboardKPI[]): GaugeData[] => {
    // Fixed list of expected dimensions to guarantee UI consistency
    // The UI expects these 8 specific cards in this order.
    const EXPECTED_DIMENSIONS = [
        { id: '1.0', title: 'Strategic Alignment', match: 'Strategic Plan Alignment' },
        { id: '2.0', title: 'Operational Efficiency' },
        { id: '3.0', title: 'Risk Mitigation Rate' },
        { id: '4.0', title: 'Investment ROI', match: 'Investment Portfolio ROI' },
        { id: '5.0', title: 'Active Investor Rate' },
        { id: '6.0', title: 'Employee Voice', match: 'Employee Engagement Score' },
        { id: '7.0', title: 'Delivery Velocity', match: 'Project Delivery Velocity' },
        { id: '8.0', title: 'Tech Compliance', match: 'Tech Stack SLA Compliance' }
    ];

    return EXPECTED_DIMENSIONS.map((dim: any) => {
        // Robust fuzzy match using explicit match key or title
        const searchTitle = dim.match || dim.title;
        const kpi = kpis.find(k =>
            k.dimension_title &&
            k.dimension_title.trim().toLowerCase() === searchTitle.trim().toLowerCase()
        );

        if (kpi) {
            const delta = kpi.kpi_actual - kpi.kpi_base_value;
            const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;

            // Normalization Logic for specific KPIs (ROI & Employee Voice)
            const shouldNormalize = dim.id === '4.0' || dim.id === '6.0';
            let finalValue = kpi.kpi_actual;
            let finalBase = kpi.kpi_base_value;
            let finalNext = kpi.kpi_next_target;
            let finalEnd = kpi.kpi_final_target;

            if (shouldNormalize && kpi.kpi_final_target > 0) {
                // Formula: (Value / Final Target) * 100
                // Reduced to one decimal place as per requirements
                finalValue = parseFloat(((kpi.kpi_actual / kpi.kpi_final_target) * 100).toFixed(1));
                finalBase = parseFloat(((kpi.kpi_base_value / kpi.kpi_final_target) * 100).toFixed(1));
                finalNext = parseFloat(((kpi.kpi_next_target / kpi.kpi_final_target) * 100).toFixed(1));
                finalEnd = 100; // Normalized scale always ends at 100
            }

            // Calculate Status based on deviation from Planned (Quarterly Target)
            // Formula: Deficit % = ((Planned - Actual) / Planned) * 100
            // Thresholds: < 5% (Green), < 15% (Amber), >= 15% (Red)
            const quarterTarget = kpi.kpi_planned || kpi.kpi_final_target || 1;
            const deficitPct = ((quarterTarget - kpi.kpi_actual) / quarterTarget) * 100;

            let calculatedStatus: 'green' | 'amber' | 'red' = 'green';

            // Note: Negative deficit means Surplus (Actual > Planned), which is good (Green)
            if (deficitPct < 5) {
                calculatedStatus = 'green';
            } else if (deficitPct < 15) {
                calculatedStatus = 'amber';
            } else {
                calculatedStatus = 'red';
            }

            return {
                label: `${dim.id} ${dim.title}`, // Force use of local ID (1.0) to ensure consistent formatting
                value: finalValue,
                status: calculatedStatus, // Use calculated status instead of backend health_state
                delta: deltaStr, // Delta remains raw/absolute per user preference? Or should also be normalized? Usually delta is absolute difference. Keeping as is unless requested.
                baseValue: finalBase,
                qMinus1: finalBase, // Placeholder for actual history
                qPlus1: finalNext,
                endValue: finalEnd,
                family: dim.id,
                level: 1
            };
        } else {
            // Return "Empty" Zero-State Gauge
            return {
                label: `${dim.id} ${dim.title}`,
                value: 0,
                status: 'green',
                delta: '0%',
                baseValue: 0,
                qMinus1: 0,
                qPlus1: 0,
                endValue: 100,
                family: dim.id,
                level: 1
            } as GaugeData;
        }
    });
};

/**
 * Transform Outcomes to Radar Chart format (Strategic Impact)
 */
export interface RadarMetric {
    id: string;
    label: string;
    actualRaw: number;
    targetRaw: number;
    finalTargetRaw: number;
    actualNormalized: number;  // 0-100%
    planNormalized: number;    // 0-100%
    unit: string;
    formattedActual: string;
    formattedTarget: string;
    formattedFinal: string;
}

export interface RadarValues {
    actual: number[];
    plan: number[];
    labels: string[];
    // Standardized details for tooltips/other charts
    metrics: RadarMetric[];
}

// Transform Outcomes to Radar Chart format (Strategic Impact)
export const transformToStrategicRadar = (currentOutcomes: OutcomesData[], allOutcomes: OutcomesData[] = []): RadarValues => {
    if (!currentOutcomes.length) {
        return {
            actual: [0, 0, 0, 0, 0],
            plan: [0, 0, 0, 0, 0],
            labels: ['FDI', 'Trade', 'Jobs', 'Community', 'Infrastructure'],
            metrics: []
        };
    }

    const latest = currentOutcomes[0];

    // Find Final Record (Q4 2029)
    let finalRecord = latest;
    if (allOutcomes.length > 0) {
        const sorted = [...allOutcomes].sort((a, b) => {
            if (!a.quarter || !b.quarter) return 0;
            const partsA = a.quarter.trim().split(' ');
            const partsB = b.quarter.trim().split(' ');
            if (partsA.length < 2 || partsB.length < 2) return 0;
            const yA = parseInt(partsA[1]);
            const yB = parseInt(partsB[1]);
            const qA = parseInt(partsA[0].replace('Q', ''));
            const qB = parseInt(partsB[0].replace('Q', ''));
            if (yA !== yB) return yB - yA;
            return qB - qA;
        });
        finalRecord = sorted[0];
    }

    // Helper: Normalize (Value / Final * 100)
    const normalize = (val: number, final: number) => {
        const v = val || 0;
        const f = final || 1;
        if (f === 0) return 0;
        return Math.min(100, Math.round((v / f) * 100));
    };

    // Helper: Format Currency/Number
    const fmt = (val: number, unit: string) => {
        if (unit === 'B SAR') return `${val.toFixed(1)}B`;
        if (unit === 'Jobs') return val.toLocaleString();
        if (unit === '%') return `${Math.round(val)}%`;
        return `${val}`;
    };

    // Define Metric Configs
    const metricsConfig = [
        {
            id: 'fdi', label: 'FDI', unit: 'B SAR',
            act: Number(latest.fdi_actual),
            tgt: Number(latest.fdi_target),
            final: Number(finalRecord.fdi_target) || 30
        },
        {
            id: 'trade', label: 'Trade', unit: 'B SAR',
            act: Math.abs(Number(latest.trade_balance_actual)), // ABS for Trade
            tgt: Math.abs(Number(latest.trade_balance_target)),
            final: Math.abs(Number(finalRecord.trade_balance_target)) || 600
        },
        {
            id: 'jobs', label: 'Jobs', unit: 'Jobs',
            act: Number(latest.jobs_created_actual),
            tgt: Number(latest.jobs_created_target),
            final: Number(finalRecord.jobs_created_target) || 10000
        },
        {
            id: 'community', label: 'Community', unit: '%',
            act: Number(latest.community_engagement_actual),
            tgt: Number(latest.community_engagement_target),
            final: Number(finalRecord.community_engagement_target) || 50
        },
        {
            id: 'infra', label: 'Infrastructure', unit: '%', // Composite
            act: (Number(latest.water_coverage_actual) + Number(latest.energy_coverage_actual) + Number(latest.transport_coverage_actual)) / 3,
            tgt: (Number(latest.water_coverage_target) + Number(latest.energy_coverage_target) + Number(latest.transport_coverage_target)) / 3, // Avg Target
            final: (Number(finalRecord.water_coverage_target) + Number(finalRecord.energy_coverage_target) + Number(finalRecord.transport_coverage_target)) / 3 || 100
        }
    ];

    // Build Standardized Metrics Array
    const metrics: RadarMetric[] = metricsConfig.map(m => ({
        id: m.id,
        label: m.label,
        actualRaw: m.act,
        targetRaw: m.tgt,
        finalTargetRaw: m.final,
        actualNormalized: normalize(m.act, m.final),
        planNormalized: normalize(m.tgt, m.final),
        unit: m.unit,
        formattedActual: fmt(m.act, m.unit),
        formattedTarget: fmt(m.tgt, m.unit),
        formattedFinal: fmt(m.final, m.unit)
    }));

    // Extract Arrays for ECharts
    const actual = metrics.map(m => m.actualNormalized);
    const plan = metrics.map(m => m.planNormalized);
    const labels = metrics.map(m => m.label);

    const result = { actual, plan, labels, metrics }; // Single source of truth

    console.log('[transformToStrategicRadar] Standardized Metrics:', result);
    return result;
};

/**
 * Transform Dashboard KPIs to Transformation Health Radar format
 * Data has dimension_id: dim1, dim2, ... dim8
 * Order: Strategic Plan Alignment, Operational Efficiency, Risk Mitigation Rate,
 *        Investment Portfolio ROI, Active Investor Rate, Employee Engagement Score,
 *        Project Delivery Velocity, Tech Stack SLA Compliance
 */
export const transformToHealthRadar = (kpis: DashboardKPI[], quarter: string, year: string): RadarValues => {
    // API already returns filtered data, use directly
    // API matches fuzzy, or we default to 0. 
    // We proceed even if kpis is empty to ensure the Radar Grid renders with labels.

    // Use the data as-is (already filtered by getDashboardKPIs)
    const currentData = kpis || [];

    // 2. Map Dimensions
    const shortNameMap: Record<string, string> = {
        'Strategic Plan Alignment': 'Strategy',
        'Operational Efficiency': 'Ops',
        'Risk Mitigation Rate': 'Risk',
        'Investment Portfolio ROI': 'Investments',
        'Active Investor Rate': 'Investors',
        'Employee Engagement Score': 'Employees',
        'Project Delivery Velocity': 'Projects',
        'Tech Stack SLA Compliance': 'Tech'
    };

    const metrics: RadarMetric[] = [];

    // 3. Calculate Values
    for (const [dimName, label] of Object.entries(shortNameMap)) {
        let val = 0;
        let planVal = 100;

        const row = currentData.find((r: any) =>
            r.dimension_title &&
            r.dimension_title.trim().toLowerCase() === dimName.trim().toLowerCase()
        );

        const kpiActual = row ? Number(row.kpi_actual) : 0;
        const target = row?.kpi_final_target ? Number(row.kpi_final_target) : 100;
        const planned = row?.kpi_planned ? Number(row.kpi_planned) : 0; // Default to 0 if missing

        if (target > 0) {
            val = (kpiActual / target) * 100;
            planVal = (planned / target) * 100;
        }

        // Add to standardized metrics
        metrics.push({
            id: label.toLowerCase(),
            label: label,
            actualRaw: kpiActual,
            targetRaw: planned,
            finalTargetRaw: target,
            actualNormalized: Math.min(100, Math.max(0, Math.round(val))),
            planNormalized: Math.min(100, Math.max(0, Math.round(planVal))),
            unit: '%', // Default assumption for Health KPIs
            formattedActual: `${Math.round(kpiActual)}%`,
            formattedTarget: `${Math.round(planned)}%`,
            formattedFinal: `${Math.round(target)}%`
        });
    }

    const actual = metrics.map(m => m.actualNormalized);
    const plan = metrics.map(m => m.planNormalized);
    const labels = metrics.map(m => m.label);

    console.log('[transformToHealthRadar] Standardized Metrics:', { actual, plan });
    return { actual, plan, labels, metrics }; // Comply with RadarValues interface
};

/**
 * Investment Initiatives Data
 * Used for: Investment Portfolio Health (Scatter Chart)
 */
export interface InvestmentInitiative {
    initiative_name: string;
    budget: number;
    risk_score: number; // 1-5
    alignment_score: number; // 1-5
    quarter: string;
}

export const getInvestmentInitiatives = async (filter: TimeFilter): Promise<InvestmentInitiative[]> => {
    const url = `/api/v1/dashboard/investment-initiatives`;
    console.log('[dashboardService] Fetching Investment Initiatives from:', url);

    try {
        const response = await apiClient.get<InvestmentInitiative[] | { data: InvestmentInitiative[] }>(url);
        let data = Array.isArray(response.data) ? response.data : response.data.data || [];

        // Client-side Filter
        if (filter.quarter && filter.quarter !== 'ALL' && filter.quarter !== 'All') {
            const target = `${filter.quarter} ${filter.year}`;
            data = data.filter(d => d.quarter === target);
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch investment initiatives:', error);
        return [];
    }
};
