export interface CanonicalStep {
    sourceLabel: string | string[];
    relationship: string;
    targetLabel: string | string[];
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
            {
                sourceLabel: 'EntityCapability',
                relationship: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS',
                targetLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem']
            },
            {
                sourceLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'],
                relationship: 'GAPS_SCOPE',
                targetLabel: 'EntityProject'
            },
            { sourceLabel: 'EntityProject', relationship: 'ADOPTION_RISKS', targetLabel: 'EntityChangeAdoption' }
        ]
    },
    'setting_strategic_priorities': {
        name: 'Setting Strategic Priorities',
        steps: [
            { sourceLabel: 'SectorObjective', relationship: 'AGGREGATES_TO', targetLabel: 'SectorPerformance' }, // Reverse direction in canonical? Doc says Aggregates To, but flow is Objective <- Performance? 
            // Doc says: SectorObjective <-AGGREGATES_TO- SectorPerformance
            // But Sankey flows L->R. So we should list Source as Performance? 
            // Wait, the doc Canonical Path says: "SectorObjective <-AGGREGATES_TO- SectorPerformance".
            // If the Sankey starts at SectorObjective, this step goes backwards? 
            // "Start anchors: SectorPerformance (preferred)".
            // If we start at Objective, we might need to invert for visualization if the user wants L->R.
            // However, the text says "Operate target cascade: objectives/performance targets cascade to capabilities".
            // So Objective -> Performance -> Capability.
            // Relation is (Performance)-[AGGREGATES_TO]->(Objective).
            // So flow is Objective <-(AGGREGATES_TO)- Performance.
            // Let's assume for visual flow we want Objective -> Performance?
            // User Ex: "SectorObjective -[:REALIZED_VIA]-> ...".
            // Let's stick to the doc's "Canonical Path" text order.
            // Doc: "SectorObjective <-AGGREGATES_TO- SectorPerformance". 
            // This is slightly confusing for a L->R Sankey if we start at Objective.
            // But let's encode the RELATIONSHIP. If we want Visual Flow A->B, and Relation is B->A, we might need to annotate direction.
            // For now, I will implement as defined in the text sequence, assuming the visual flow follows the text line order.

            // Actually, for 'setting_strategic_priorities', the "canonical path" text in doc (346) starts with SectorObjective.
            // "SectorObjective <-[:AGGREGATES_TO]- SectorPerformance"
            // Then "-[:SETS_TARGETS]-> EntityCapability"
            // So it visually goes Objective -> Performance -> Capability.
            // Even though the relation AGGREGATES_TO points Perf->Obj.
            // I will encode it as: Source=Objective, Rel=AGGREGATES_TO (INCOMING), Target=Performance.
            // But my simple schema above assumes Source->Rel->Target.
            // I will add 'direction' field later if needed. For now simple.

            // Wait, if I use the "Visual Source" and "Visual Target", I can just say:
            // Source: SectorObjective, Target: SectorPerformance, Rel: "AGGREGATES_TO (Rev)"?
            // Or just "AGGREGATES_TO" and handle direction lookup in the matcher.

            // Let's assume standard direction for now, but careful.
            // Actually, Recharts Sankey is purely visual. If I say A links to B, it draws A->B.
            // I just need to find the link in the data.
            // If data has (Perf)-[AGG]->(Obj), but I want to draw Obj->Perf, I need to find the incoming link.

            // I'll stick to 'setting_strategic_initiatives' and 'sector_value_chain' first as primary examples which are mostly forward.
            // For 'setting_strategic_priorities':
            { sourceLabel: 'SectorObjective', relationship: 'AGGREGATES_TO', targetLabel: 'SectorPerformance' }, // Implies Incoming
            { sourceLabel: 'SectorPerformance', relationship: 'SETS_TARGETS', targetLabel: 'EntityCapability' },
            { sourceLabel: 'EntityCapability', relationship: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', targetLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'] },
            { sourceLabel: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'], relationship: 'GAPS_SCOPE', targetLabel: 'EntityProject' },
            { sourceLabel: 'EntityProject', relationship: 'ADOPTION_RISKS', targetLabel: 'EntityChangeAdoption' }
        ]
    },
    'build_oversight': {
        name: 'Build Oversight',
        steps: [
            { sourceLabel: 'EntityCapability', relationship: 'MONITORED_BY', targetLabel: 'EntityRisk' },
            { sourceLabel: 'EntityRisk', relationship: 'INFORMS', targetLabel: 'SectorPolicyTool' }
        ]
    },
    'operate_oversight': {
        name: 'Operate Oversight',
        steps: [
            { sourceLabel: 'EntityCapability', relationship: 'MONITORED_BY', targetLabel: 'EntityRisk' },
            { sourceLabel: 'EntityRisk', relationship: 'INFORMS', targetLabel: 'SectorPerformance' }
        ]
    }
};
