// Enterprise Desk Type Definitions

export interface L3Capability {
    id: string;
    name: string;
    status: 'active' | 'pending' | 'at-risk';
    maturity_level: number; // 1-5
    target_maturity_level: number; // 1-5

    // Build vs Execute mode
    mode: 'build' | 'execute';
    build_status?: 'not-due' | 'planned' | 'in-progress-ontrack' | 'in-progress-atrisk' | 'in-progress-issues';
    execute_status?: 'not-due' | 'ontrack' | 'at-risk' | 'issues';
    kpi_achievement_pct?: number; // (actual/target)*100, OPERATE mode only
    build_exposure_pct?: number; // 0-100, BUILD mode delay risk
    year: number;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    // ETL-computed fields read from capability node
    exposure_percent?: number;
    dependency_count?: number;
    exposure_normalized?: number; // 0-100, importance for heatmaps
    people_score?: number; // 0-100, staffing health (OPERATE)
    process_score?: number; // 0-100, process maturity (OPERATE)
    tools_score?: number; // 0-100, IT systems health (OPERATE)

    rawRisk?: Record<string, any>;
    rawCapability?: Record<string, any>;
}

export interface L2Capability {
    id: string;
    name: string;
    description: string;
    maturity_level: number;
    target_maturity_level: number;
    kpi_achievement_pct?: number;
    execute_status?: string;
    build_status?: string;
    l3: L3Capability[];
    // R9: Upward chain data
    upwardChain?: {
        policyTools: Array<{ id: string; name: string; level?: string; end_date?: string; status?: string; start_date?: string }>;
        performanceTargets: Array<{ id: string; name: string; level?: string; target?: number; actual_value?: number; unit?: string; status?: string; baseline?: number }>;
        objectives: Array<{ id: string; name: string; level?: string; status?: string }>;
    };
    rawL2Node?: Record<string, any>;
}

export interface L1Capability {
    id: string;
    name: string;
    description: string;
    maturity_level: number;
    target_maturity_level: number;
    l2: L2Capability[];
}
