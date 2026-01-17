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
    energy_coverage_actual: number;
    transport_coverage_actual: number;
    community_engagement_actual: number;
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
    const params = new URLSearchParams();
    // Backend expects quarter_filter like "Q1 2025"
    if (filter.quarter && filter.quarter !== 'ALL') {
        params.append('quarter_filter', `${filter.quarter} ${filter.year}`);
    }

    const url = `/api/v1/dashboard/dashboard-data?${params.toString()}`;
    console.log('[dashboardService] Fetching KPIs from:', url);

    try {
        const response = await apiClient.get<DashboardKPI[] | { data: DashboardKPI[] }>(url);
        // Handle both array response and { data: [...] } response
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        console.log('[dashboardService] KPIs response:', data.length, 'items');
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
    const params = new URLSearchParams();
    // Backend expects quarter_filter like "Q1 2025"
    if (filter.quarter && filter.quarter !== 'ALL') {
        params.append('quarter_filter', `${filter.quarter} ${filter.year}`);
    }

    try {
        const response = await apiClient.get<OutcomesData[] | { data: OutcomesData[] }>(
            `/api/v1/dashboard/outcomes-data?${params.toString()}`
        );
        // Handle both array response and { data: [...] } response
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
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
    level: number;
}

export const transformToGaugeData = (kpis: DashboardKPI[]): GaugeData[] => {
    return kpis.map((kpi, index) => {
        const delta = kpi.kpi_actual - kpi.kpi_base_value;
        const deltaStr = delta >= 0 ? `+${delta}%` : `${delta}%`;

        // Derive family from dimension_id (e.g., "1.0", "2.0")
        const family = kpi.dimension_id?.split('.')[0] + '.0' || '1.0';
        const level = kpi.dimension_id?.includes('.') ? 2 : 1;

        return {
            label: `${kpi.dimension_id} ${kpi.dimension_title}`,
            value: kpi.kpi_actual,
            status: kpi.health_state || 'green',
            delta: deltaStr,
            baseValue: kpi.kpi_base_value,
            qMinus1: kpi.kpi_base_value, // TODO: Need previous quarter data
            qPlus1: kpi.kpi_next_target,
            endValue: kpi.kpi_final_target,
            family,
            level
        };
    });
};

/**
 * Transform Outcomes to Radar Chart format (Strategic Impact)
 */
export interface RadarValues {
    actual: number[];
    plan: number[];
    labels: string[];
}

export const transformToStrategicRadar = (outcomes: OutcomesData[]): RadarValues => {
    if (!outcomes.length) {
        return { actual: [0, 0, 0, 0, 0], plan: [0, 0, 0, 0, 0], labels: [] };
    }

    const latest = outcomes[0]; // Assume sorted by quarter desc

    console.log('[transformToStrategicRadar] latest outcome:', latest);
    const result = {
        actual: [
            latest.fdi_actual || 0,
            latest.jobs_created_actual || 0,
            latest.water_coverage_actual || 0,
            latest.energy_coverage_actual || 0,
            latest.transport_coverage_actual || 0
        ],
        plan: [
            latest.fdi_target || 0,
            latest.jobs_created_target || 0,
            100, // Coverage targets typically 100%
            100,
            100
        ],
        labels: ['FDI', 'Jobs Created', 'Water Coverage', 'Energy Coverage', 'Transport Coverage']
    };
    console.log('[transformToStrategicRadar] result:', result);
    return result;
};

/**
 * Transform Dashboard KPIs to Transformation Health Radar format
 * Data has dimension_id: dim1, dim2, ... dim8
 * Order: Strategic Plan Alignment, Operational Efficiency, Risk Mitigation Rate,
 *        Investment Portfolio ROI, Active Investor Rate, Employee Engagement Score,
 *        Project Delivery Velocity, Tech Stack SLA Compliance
 */
export const transformToHealthRadar = (kpis: DashboardKPI[]): RadarValues => {
    // Sort by dimension_id to ensure consistent order
    const sortedKpis = [...kpis].sort((a, b) => {
        const aNum = parseInt(a.dimension_id?.replace('dim', '') || '0');
        const bNum = parseInt(b.dimension_id?.replace('dim', '') || '0');
        return aNum - bNum;
    });

    const actual = sortedKpis.map(k => k.kpi_actual || 0);
    const plan = sortedKpis.map(k => k.kpi_planned || 0);
    const labels = sortedKpis.map(k => {
        // Shorten labels for radar chart
        const title = k.dimension_title || k.dimension_id || '';
        if (title.includes('Strategic')) return 'Strategy';
        if (title.includes('Operational')) return 'Ops';
        if (title.includes('Risk')) return 'Risk';
        if (title.includes('Investment')) return 'Investment';
        if (title.includes('Investor')) return 'Investors';
        if (title.includes('Employee')) return 'Employees';
        if (title.includes('Project')) return 'Projects';
        if (title.includes('Tech')) return 'Tech';
        return title.substring(0, 10);
    });

    console.log('[transformToHealthRadar] actual:', actual, 'plan:', plan, 'labels:', labels);
    return { actual, plan, labels };
};
