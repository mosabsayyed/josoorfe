import { Node } from './RiskTopologyMap';

// Interfaces matching Neo4j Schema
export interface EntityRisk extends Node {
    // Common
    id: string;
    name: string;
    risk_description?: string;
    risk_category?: string;
    risk_status?: string;
    mitigation_strategy?: string;
    risk_owner?: string;
    
    // BUILD Mode properties
    likelihood_of_delay?: number; // 0.0-1.0
    delay_days?: number;
    risk_score?: number; // Expected delay days
    project_outputs_risk?: number;
    project_outputs_delay_days?: number;
    project_outputs_persistence?: number;
    role_gaps_risk?: number;
    role_gaps_delay_days?: number;
    role_gaps_persistence?: number;
    it_systems_risk?: number;
    it_systems_delay_days?: number;
    it_systems_persistence?: number;
    threshold_red?: string; // Stored as text e.g. "< 70%" or number

    // OPERATE Mode properties
    people_score?: number; // 1-5
    process_score?: number; // 1-5
    tools_score?: number; // 1-5
    operational_health_score?: number; // 1-5
}

export interface EntityCapability extends Node {
    status?: 'planned' | 'in_progress' | 'active' | 'archived';
}

export interface RiskAgentResult {
    riskId: string;
    mode: 'BUILD' | 'OPERATE' | 'UNKNOWN';
    buildExposurePct: number;
    operateExposurePct: number;
    isOverThreshold: boolean;
    severityBand: 'Green' | 'Amber' | 'Red';
    computedAt: string;
}

// --- Helper: Parse Threshold ---
// Parses "< 70%" or "70" or "70%" into a number
const parseThreshold = (val?: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    // Extract first number found
    const match = val.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
};

// --- Helper: Parse Percentage ---
// Handles 0-1 vs 0-100 normalization
const toPercentage = (val?: number): number => {
    if (val === undefined || val === null) return 0;
    if (val <= 1.0) return val * 100;
    return val;
};

// --- LOGIC: BUILD Mode Exposure ---
export const calculateBuildExposure = (risk: EntityRisk): number => {
    // Formula: build_exposure_pct = clamp01(risk_score / red_delay_tolerance) * 100
    // If threshold_red is missing, assume default 60 days
    
    const expectedDelay = risk.risk_score || 0;
    let tolerance = 60; // Default tolerance in days
    
    // Attempt to parse tolerance from threshold_red (which is distinct from the 50% link threshold)
    // NOTE: In current data, threshold_red is "< 70%" which looks like a completion KPI, not days.
    // So distinct logic is needed: 
    // If risk_score (days) is the metric, we need a DAYS tolerance.
    // Let's use a standard heuristic: 60 days max tolerance for now as per spec placeholder.
    
    const exposure = (expectedDelay / tolerance) * 100;
    return Math.min(Math.max(exposure, 0), 100);
};

// --- LOGIC: OPERATE Mode Exposure ---
export const calculateOperateExposure = (risk: EntityRisk): number => {
    // Formula: operate_exposure_pct = 100 - operational_health_score_normalized
    // Health is 1-5 scale or 0-100.
    
    let healthNormalized = 0;
    const rawHealth = risk.operational_health_score || 0;
    
    if (rawHealth <= 5) {
        // 1-5 scale -> 0-100
        // (1->0%, 5->100%) => (val - 1) * 25
        healthNormalized = (Math.max(rawHealth, 1) - 1) * 25;
    } else {
        // Assume 0-100
        healthNormalized = rawHealth;
    }
    
    const exposure = 100 - healthNormalized;
    return Math.min(Math.max(exposure, 0), 100);
};

// --- LOGIC: Mode Determination ---
export const determineRiskMode = (capStatus?: string): 'BUILD' | 'OPERATE' | 'UNKNOWN' => {
    const s = (capStatus || '').toLowerCase();
    if (['planned', 'in_progress', 'design'].includes(s)) return 'BUILD';
    if (['active', 'operational', 'live'].includes(s)) return 'OPERATE';
    return 'UNKNOWN'; // Default to BUILD if unknown? Or UNKNOWN.
};

// --- MAIN AGENT FUNCTION ---
export const runRiskAgent = (risk: EntityRisk, capability?: EntityCapability): RiskAgentResult => {
    const mode = determineRiskMode(capability?.status || 'in_progress'); // Default to in_progress for simulation if missing
    
    const buildExp = calculateBuildExposure(risk);
    const operateExp = calculateOperateExposure(risk);
    
    let relevantExposure = 0;
    if (mode === 'BUILD') relevantExposure = buildExp;
    else if (mode === 'OPERATE') relevantExposure = operateExp;
    
    // Severity Band (based on 35/65 split from spec)
    let band: 'Green' | 'Amber' | 'Red' = 'Green';
    if (relevantExposure > 65) band = 'Red';
    else if (relevantExposure > 35) band = 'Amber';
    
    return {
        riskId: risk.id,
        mode,
        buildExposurePct: parseFloat(buildExp.toFixed(1)),
        operateExposurePct: parseFloat(operateExp.toFixed(1)),
        isOverThreshold: relevantExposure >= 50,
        severityBand: band,
        computedAt: new Date().toISOString()
    };
};
