export interface CanonicalStep {
    sourceLabel: string | string[];
    relationship: string;
    targetLabel: string | string[];
    // Optional: Specify hierarchy levels (L1, L2, L3) to distinguish same-label nodes at different levels
    // When a node type appears at different levels in the flow, use level to disambiguate columns
    sourceLevel?: string;
    targetLevel?: string;
}

export interface CanonicalPathDef {
    name: string;
    steps: CanonicalStep[];
}

export const CANONICAL_PATHS: Record<string, CanonicalPathDef> = {
    'sector_value_chain': {
        name: 'Sector Value Chain',
        steps: [
            { sourceLabel: 'SectorObjective', relationship: 'REALIZED_VIA', targetLabel: 'SectorPolicyTool' },
            { sourceLabel: 'SectorPolicyTool', relationship: 'REFERS_TO', targetLabel: 'SectorAdminRecord' },
            { sourceLabel: 'SectorAdminRecord', relationship: 'APPLIED_ON', targetLabel: ['SectorCitizen', 'SectorGovEntity', 'SectorBusiness'] },
            { sourceLabel: ['SectorCitizen', 'SectorGovEntity', 'SectorBusiness'], relationship: 'TRIGGERS_EVENT', targetLabel: 'SectorDataTransaction' },
            { sourceLabel: 'SectorDataTransaction', relationship: 'MEASURED_BY', targetLabel: 'SectorPerformance' },
            { sourceLabel: 'SectorPerformance', relationship: 'AGGREGATES_TO', targetLabel: 'SectorObjective' }
        ]
    },
    'setting_strategic_initiatives': {
        name: 'Setting Strategic Initiatives',
        steps: [
            { sourceLabel: 'SectorObjective', relationship: 'REALIZED_VIA', targetLabel: 'SectorPolicyTool' },
            { sourceLabel: 'SectorPolicyTool', relationship: 'SETS_PRIORITIES', targetLabel: 'EntityCapability' },
            { sourceLabel: 'EntityCapability', relationship: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', targetLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'] },
            { sourceLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'], relationship: 'GAPS_SCOPE', targetLabel: 'EntityProject' },
            { sourceLabel: 'EntityProject', relationship: 'ADOPTION_RISKS', targetLabel: 'EntityChangeAdoption' }
        ]
    },
    'setting_strategic_priorities': {
        name: 'Setting Strategic Priorities',
        steps: [
            { sourceLabel: 'SectorObjective', sourceLevel: 'L1', relationship: 'CASCADED_VIA', targetLabel: 'SectorPerformance', targetLevel: 'L1' },
            { sourceLabel: 'SectorPerformance', sourceLevel: 'L1', relationship: 'PARENT_OF', targetLabel: 'SectorPerformance', targetLevel: 'L2' },
            { sourceLabel: 'SectorPerformance', sourceLevel: 'L2', relationship: 'SETS_TARGETS', targetLabel: 'EntityCapability', targetLevel: 'L2' },
            { sourceLabel: 'EntityCapability', sourceLevel: 'L2', relationship: 'PARENT_OF', targetLabel: 'EntityCapability', targetLevel: 'L3' },
            { sourceLabel: 'EntityCapability', sourceLevel: 'L3', relationship: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', targetLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'], targetLevel: 'L3' }
        ]
    },
    'build_oversight': {
        name: 'Build Oversight',
        steps: [
            { sourceLabel: 'EntityChangeAdoption', sourceLevel: 'L3', relationship: 'INCREASE_ADOPTION', targetLabel: 'EntityProject', targetLevel: 'L3' },
            { sourceLabel: 'EntityProject', sourceLevel: 'L3', relationship: 'CLOSE_GAPS', targetLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'], targetLevel: 'L3' },
            { sourceLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'], sourceLevel: 'L3', relationship: 'ROLE_GAPS', targetLabel: 'EntityCapability', targetLevel: 'L3' },
            { sourceLabel: 'EntityCapability', sourceLevel: 'L3', relationship: 'MONITORED_BY', targetLabel: 'EntityRisk', targetLevel: 'L3' },
            { sourceLabel: 'EntityRisk', sourceLevel: 'L3', relationship: 'PARENT_OF', targetLabel: 'EntityRisk', targetLevel: 'L2' },
            { sourceLabel: 'EntityRisk', sourceLevel: 'L2', relationship: 'INFORMS', targetLabel: 'SectorPolicyTool', targetLevel: 'L2' },
            { sourceLabel: 'SectorPolicyTool', sourceLevel: 'L2', relationship: 'GOVERNED_BY', targetLabel: 'SectorObjective', targetLevel: 'L1' }
        ]
    },
    'operate_oversight': {
        name: 'Operate Oversight',
        steps: [
            { sourceLabel: 'EntityCapability', sourceLevel: 'L3', relationship: 'MONITORED_BY', targetLabel: 'EntityRisk', targetLevel: 'L3' },
            { sourceLabel: 'EntityRisk', sourceLevel: 'L3', relationship: 'PARENT_OF', targetLabel: 'EntityRisk', targetLevel: 'L2' },
            { sourceLabel: 'EntityRisk', sourceLevel: 'L2', relationship: 'INFORMS', targetLabel: 'SectorPerformance', targetLevel: 'L2' },
            { sourceLabel: 'SectorPerformance', sourceLevel: 'L2', relationship: 'AGGREGATES_TO', targetLabel: 'SectorObjective', targetLevel: 'L1' }
        ]
    },
    'sustainable_operations': {
        name: 'Sustainable Operations',
        steps: [
            { sourceLabel: 'EntityCultureHealth', relationship: 'MONITORS_FOR', targetLabel: 'EntityOrgUnit' },
            { sourceLabel: 'EntityOrgUnit', relationship: 'APPLY', targetLabel: 'EntityProcess' },
            { sourceLabel: 'EntityProcess', relationship: 'AUTOMATION', targetLabel: 'EntityITSystem' },
            { sourceLabel: 'EntityITSystem', relationship: 'DEPENDS_ON', targetLabel: 'EntityVendor' }
        ]
    },
    'integrated_oversight': {
        name: 'Integrated Oversight',
        steps: []
    }
};
