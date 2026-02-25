// Enterprise Desk Type Definitions

export interface L3Capability {
    id: string;
    name: string;
    status: 'active' | 'pending' | 'at-risk';
    maturity_level: number; // 1-5
    target_maturity_level: number; // 1-5
    staff_gap: number;
    tools_gap: number;
    docs_complete: number; // 0-100
    team_health: number; // 0-100
    change_adoption: number; // 0-100

    // Build vs Execute mode
    mode: 'build' | 'execute';
    build_status?: 'not-due' | 'planned' | 'in-progress-ontrack' | 'in-progress-atrisk' | 'in-progress-issues';
    execute_status?: 'ontrack' | 'at-risk' | 'issues';
    year: number;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    // Overlay fields
    expected_delay_days?: number;
    exposure_percent?: number;
    exposure_trend?: 'improving' | 'stable' | 'declining';
    dependency_count?: number;
    
    // Overlay 1: Risk Exposure Fields
    operational_health_score?: number; // 0-100, EXECUTE mode only
    people_score?: number; // 1-5 scale, EXECUTE mode
    process_score?: number; // 1-5 scale, EXECUTE mode
    tools_score?: number; // 1-5 scale, EXECUTE mode
    likelihood_of_delay?: number; // 0-100, BUILD mode only
    
    policy_tool_count?: number;
    performance_target_count?: number;
    org_gap?: number;
    process_gap?: number;
    it_gap?: number;
    active_projects_count?: number;
    adoption_load?: 'low' | 'medium' | 'high';
    adoption_load_percent?: number;
    health_history?: number[];
    rawRisk?: Record<string, any>;
    rawCapability?: Record<string, any>;
}

export interface L2Capability {
    id: string;
    name: string;
    description: string;
    maturity_level: number;
    target_maturity_level: number;
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
