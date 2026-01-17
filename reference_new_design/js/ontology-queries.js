/**
 * ONTOLOGY QUERY HELPERS v2.0
 * Implements approved requirements with correct level connections
 * 
 * ID Pattern Recognition:
 * - L1: x.0 (1.0, 2.0, 3.0)
 * - L2: x.y (1.1, 2.3, 4.5)
 * - L3: x.y.z (1.1.1, 3.2.4, 2.5.2)
 */

const OntologyQueries = {
    
    /**
     * Get node level from ID pattern
     */
    getLevel(id) {
        const parts = id.split('.');
        if (parts.length === 2 && parts[1] === '0') return 'L1';
        if (parts.length === 2) return 'L2';
        if (parts.length === 3) return 'L3';
        return 'Unknown';
    },
    
    // ========================================
    // COMMAND CENTER QUERIES
    // ========================================
    
    /**
     * Feature 1.1: Cross-Domain Integration Matrix (PerfL2 × CapL2)
     * Approved: Q1 Answer - Show PerfL2 × CapL2
     */
    getCommandCenterMatrix() {
        // Get all L2 Performance KPIs
        const perfL2 = ontologyData.sectorPerformance.filter(p => 
            this.getLevel(p.id) === 'L2'
        );
        
        // Get all L2 Capabilities
        const capL2 = ontologyData.entityCapabilities.filter(c => 
            this.getLevel(c.id) === 'L2'
        );
        
        // Build matrix: each cell shows connection strength
        const matrix = perfL2.map(perf => {
            const row = {
                perfId: perf.id,
                perfName: perf.name,
                perfStatus: perf.status,
                perfActual: perf.actual,
                perfTarget: perf.target,
                capabilities: []
            };
            
            capL2.forEach(cap => {
                // Check if they're connected via Sets_Targets or Reports
                const setsTargetsRel = ontologyData.relationships.sets_targets
                    .find(r => r.source === perf.id && r.target === cap.id);
                
                const reportsRel = ontologyData.relationships.reports
                    .find(r => r.source === cap.id && r.target === perf.id);
                
                const isConnected = setsTargetsRel || reportsRel;
                
                row.capabilities.push({
                    capId: cap.id,
                    capName: cap.name,
                    capMaturity: cap.maturity_level,
                    capTarget: cap.target_maturity_level,
                    connected: isConnected,
                    strength: isConnected ? this.calculateConnectionStrength(perf, cap) : 0
                });
            });
            
            return row;
        });
        
        return {
            matrix: matrix,
            perfL2: perfL2,
            capL2: capL2
        };
    },
    
    /**
     * Calculate connection strength between PerfL2 and CapL2
     */
    calculateConnectionStrength(perf, cap) {
        // Strength based on:
        // - Performance achievement (closer to target = stronger)
        // - Capability maturity (higher = stronger)
        const perfAchievement = (perf.actual / perf.target);
        const capMaturity = (cap.maturity_level / cap.target_maturity_level);
        
        return Math.round((perfAchievement + capMaturity) / 2 * 100);
    },
    
    /**
     * Get drill paths for a matrix cell
     * Approved: Q1 Answer - Mouse over shows paths up (North Star) and down (Engine Room)
     */
    getMatrixCellPaths(perfL2Id, capL2Id) {
        const perf = ontologyData.sectorPerformance.find(p => p.id === perfL2Id);
        const cap = ontologyData.entityCapabilities.find(c => c.id === capL2Id);
        
        if (!perf || !cap) return null;
        
        // Path UP: PerfL2 → PerfL1 → ObjL1 (to North Star)
        const pathUp = this.getPathUp(perfL2Id);
        
        // Path DOWN: CapL2 → CapL3 → Projects (to Engine Room)
        const pathDown = this.getPathDown(capL2Id);
        
        return {
            perf: perf,
            cap: cap,
            pathUp: pathUp,
            pathDown: pathDown
        };
    },
    
    /**
     * Get path UP from PerfL2 to ObjL1
     */
    getPathUp(perfL2Id) {
        const path = [];
        
        // Step 1: PerfL2
        const perfL2 = ontologyData.sectorPerformance.find(p => p.id === perfL2Id);
        path.push({ level: 'L2', type: 'SectorPerformance', node: perfL2 });
        
        // Step 2: PerfL2 → PerfL1 (via PARENT_OF)
        const perfL1Rel = ontologyData.relationships.parent_of
            .find(r => r.target === perfL2Id && r.type === 'SectorPerformance');
        
        if (perfL1Rel) {
            const perfL1 = ontologyData.sectorPerformance.find(p => p.id === perfL1Rel.source);
            path.push({ level: 'L1', type: 'SectorPerformance', node: perfL1 });
            
            // Step 3: PerfL1 → ObjL1 (via Aggregates_To)
            const objRel = ontologyData.relationships.aggregates_to
                .find(r => r.source === perfL1.id);
            
            if (objRel) {
                const obj = ontologyData.sectorObjectives.find(o => o.id === objRel.target);
                path.push({ level: 'L1', type: 'SectorObjective', node: obj });
            }
        }
        
        return path;
    },
    
    /**
     * Get path DOWN from CapL2 to CapL3 and Projects
     */
    getPathDown(capL2Id) {
        const path = [];
        
        // Step 1: CapL2
        const capL2 = ontologyData.entityCapabilities.find(c => c.id === capL2Id);
        path.push({ level: 'L2', type: 'EntityCapability', node: capL2 });
        
        // Step 2: CapL2 → CapL3 (via PARENT_OF children)
        const capL3Rels = ontologyData.relationships.parent_of
            .filter(r => r.source === capL2Id && r.type === 'EntityCapability');
        
        const capL3Nodes = capL3Rels.map(rel => {
            const capL3 = ontologyData.entityCapabilities.find(c => c.id === rel.target);
            return { level: 'L3', type: 'EntityCapability', node: capL3 };
        });
        
        path.push(...capL3Nodes);
        
        // Step 3: CapL2 → Projects (via Gaps_Scope)
        const projectRels = ontologyData.relationships.gaps_scope
            .filter(r => r.source === capL2Id);
        
        const projects = projectRels.map(rel => {
            const proj = ontologyData.entityProjects.find(p => p.id === rel.target);
            return { level: 'L3', type: 'EntityProject', node: proj };
        });
        
        path.push(...projects);
        
        return path;
    },
    
    /**
     * Feature 1.2: Dual-Layer Heat Map (Risk Toggle)
     * Approved: Q2 Answer - Two layers on same matrix
     * Layer A: Operational Risks (Cap in OPERATE mode)
     * Layer B: Project Risks (Cap in BUILD mode)
     */
    getLayeredHeatMap() {
        const capL2 = ontologyData.entityCapabilities.filter(c => 
            this.getLevel(c.id) === 'L2'
        );
        
        const layerA = []; // Operational Risks
        const layerB = []; // Project Risks
        
        capL2.forEach(cap => {
            // Determine capability state
            const hasActiveProjects = ontologyData.relationships.gaps_scope
                .some(r => {
                    if (r.source !== cap.id) return false;
                    const proj = ontologyData.entityProjects.find(p => p.id === r.target);
                    return proj && proj.status === 'Active';
                });
            
            const isOperational = cap.maturity_level >= cap.target_maturity_level && !hasActiveProjects;
            const isBuilding = hasActiveProjects;
            
            if (isOperational) {
                // Layer A: Cap → Risk → Performance
                const riskImpact = this.getOperationalRiskImpact(cap.id);
                layerA.push({
                    capId: cap.id,
                    capName: cap.name,
                    state: 'OPERATE',
                    risks: riskImpact.risks,
                    affectedPerformance: riskImpact.performance
                });
            }
            
            if (isBuilding) {
                // Layer B: Cap → Risk → Policy
                const riskImpact = this.getProjectRiskImpact(cap.id);
                layerB.push({
                    capId: cap.id,
                    capName: cap.name,
                    state: 'BUILD',
                    risks: riskImpact.risks,
                    affectedPolicies: riskImpact.policies
                });
            }
        });
        
        return {
            layerA: layerA,  // Operational risks
            layerB: layerB   // Project risks
        };
    },
    
    /**
     * Get operational risk impact (Path A: Cap → Risk → Performance)
     */
    getOperationalRiskImpact(capL2Id) {
        // Get CapL3 children
        const capL3Rels = ontologyData.relationships.parent_of
            .filter(r => r.source === capL2Id && r.type === 'EntityCapability');
        
        const risks = [];
        const performance = [];
        
        capL3Rels.forEach(rel => {
            // CapL3 → RiskL3
            const riskRels = ontologyData.relationships.monitored_by
                .filter(r => r.source === rel.target);
            
            riskRels.forEach(riskRel => {
                const riskL3 = ontologyData.entityRisks.find(r => r.id === riskRel.target);
                if (!riskL3 || riskL3.risk_status !== 'Active') return;
                
                risks.push(riskL3);
                
                // RiskL3 → RiskL2 (via PARENT_OF)
                const riskL2Rel = ontologyData.relationships.parent_of
                    .find(r => r.target === riskL3.id && r.type === 'EntityRisk');
                
                if (riskL2Rel) {
                    // RiskL2 → PerfL2 (via Informs)
                    const perfRels = ontologyData.relationships.informs
                        .filter(r => r.source === riskL2Rel.source);
                    
                    perfRels.forEach(perfRel => {
                        const perf = ontologyData.sectorPerformance.find(p => p.id === perfRel.target);
                        if (perf) performance.push(perf);
                    });
                }
            });
        });
        
        return { risks, performance };
    },
    
    /**
     * Get project risk impact (Path B: Cap → Risk → Policy)
     */
    getProjectRiskImpact(capL2Id) {
        // Get CapL3 children
        const capL3Rels = ontologyData.relationships.parent_of
            .filter(r => r.source === capL2Id && r.type === 'EntityCapability');
        
        const risks = [];
        const policies = [];
        
        capL3Rels.forEach(rel => {
            // CapL3 → RiskL3
            const riskRels = ontologyData.relationships.monitored_by
                .filter(r => r.source === rel.target);
            
            riskRels.forEach(riskRel => {
                const riskL3 = ontologyData.entityRisks.find(r => r.id === riskRel.target);
                if (!riskL3 || riskL3.risk_status !== 'Active') return;
                
                risks.push(riskL3);
                
                // RiskL3 → RiskL2 (via PARENT_OF)
                const riskL2Rel = ontologyData.relationships.parent_of
                    .find(r => r.target === riskL3.id && r.type === 'EntityRisk');
                
                if (riskL2Rel) {
                    // RiskL2 → PolicyL2 (via Informs)
                    const policyRels = ontologyData.relationships.informs
                        .filter(r => r.source === riskL2Rel.source);
                    
                    policyRels.forEach(policyRel => {
                        const policy = ontologyData.sectorPolicyTools.find(p => p.id === policyRel.target);
                        if (policy) policies.push(policy);
                    });
                }
            });
        });
        
        return { risks, policies };
    },
    
    /**
     * Feature 1.4: Critical Jeopardy Alerts (Cross-Domain Impact)
     * Shows Entity risks impacting Sector objectives
     */
    getCriticalJeopardyAlerts() {
        const alerts = [];
        
        // Find all active high-score risks
        const highRisks = ontologyData.entityRisks.filter(r => 
            r.risk_status === 'Active' && r.risk_score >= 7.0 && this.getLevel(r.id) === 'L3'
        );
        
        highRisks.forEach(riskL3 => {
            // Trace impact: RiskL3 → RiskL2 → PerfL2 → PerfL1 → ObjL1
            const alert = this.traceRiskToObjective(riskL3.id);
            if (alert) alerts.push(alert);
        });
        
        return alerts.sort((a, b) => b.jeopardyScore - a.jeopardyScore);
    },
    
    /**
     * Trace risk impact to strategic objective
     */
    traceRiskToObjective(riskL3Id) {
        const riskL3 = ontologyData.entityRisks.find(r => r.id === riskL3Id);
        if (!riskL3) return null;
        
        // Step 1: RiskL3 → CapL3 (via MONITORED_BY reverse)
        const capL3Rel = ontologyData.relationships.monitored_by
            .find(r => r.target === riskL3Id);
        if (!capL3Rel) return null;
        
        const capL3 = ontologyData.entityCapabilities.find(c => c.id === capL3Rel.source);
        
        // Step 2: CapL3 → CapL2 (via PARENT_OF reverse)
        const capL2Rel = ontologyData.relationships.parent_of
            .find(r => r.target === capL3.id && r.type === 'EntityCapability');
        if (!capL2Rel) return null;
        
        const capL2 = ontologyData.entityCapabilities.find(c => c.id === capL2Rel.source);
        
        // Step 3: RiskL3 → RiskL2 (via PARENT_OF)
        const riskL2Rel = ontologyData.relationships.parent_of
            .find(r => r.target === riskL3Id && r.type === 'EntityRisk');
        if (!riskL2Rel) return null;
        
        // Step 4: RiskL2 → PerfL2 (via Informs)
        const perfL2Rel = ontologyData.relationships.informs
            .find(r => r.source === riskL2Rel.source);
        if (!perfL2Rel) return null;
        
        const perfL2 = ontologyData.sectorPerformance.find(p => p.id === perfL2Rel.target);
        
        // Step 5: PerfL2 → PerfL1 (via PARENT_OF reverse)
        const perfL1Rel = ontologyData.relationships.parent_of
            .find(r => r.target === perfL2.id && r.type === 'SectorPerformance');
        if (!perfL1Rel) return null;
        
        const perfL1 = ontologyData.sectorPerformance.find(p => p.id === perfL1Rel.source);
        
        // Step 6: PerfL1 → ObjL1 (via Aggregates_To)
        const objRel = ontologyData.relationships.aggregates_to
            .find(r => r.source === perfL1.id);
        if (!objRel) return null;
        
        const obj = ontologyData.sectorObjectives.find(o => o.id === objRel.target);
        
        // Calculate jeopardy score
        const priorityWeight = obj.priority_level === 'Critical' ? 10 :
                              obj.priority_level === 'High' ? 7 : 5;
        const jeopardyScore = riskL3.risk_score * priorityWeight;
        
        return {
            risk: riskL3,
            capability: capL2,
            performance: perfL1,
            objective: obj,
            jeopardyScore: jeopardyScore,
            chain: [
                { type: 'EntityRisk', id: riskL3.id, name: riskL3.name },
                { type: 'EntityCapability', id: capL2.id, name: capL2.name },
                { type: 'SectorPerformance', id: perfL1.id, name: perfL1.name },
                { type: 'SectorObjective', id: obj.id, name: obj.name }
            ]
        };
    },
    
    // ========================================
    // NORTH STAR QUERIES (Sector Deep Dive)
    // ========================================
    
    /**
     * Get strategic objectives hierarchy (L1→L2→L3)
     */
    getObjectivesHierarchy() {
        const objL1 = ontologyData.sectorObjectives.filter(o => 
            this.getLevel(o.id) === 'L1'
        );
        
        return objL1.map(obj => {
            const children = this.getObjectiveChildren(obj.id);
            return {
                ...obj,
                children: children
            };
        });
    },
    
    /**
     * Get children of an objective
     */
    getObjectiveChildren(objId) {
        const childRels = ontologyData.relationships.parent_of
            .filter(r => r.source === objId && !r.type);  // No type means SectorObjective
        
        return childRels.map(rel => {
            const child = ontologyData.sectorObjectives.find(o => o.id === rel.target);
            const grandchildren = this.getObjectiveChildren(child.id);
            return {
                ...child,
                children: grandchildren
            };
        });
    },
    
    /**
     * "Hollow Victory" Detection
     * SectorOps chain: Obj → Perf → Transaction
     */
    getHollowVictories() {
        const greenObjectives = ontologyData.sectorObjectives.filter(o => 
            o.status === 'Green'
        );
        
        const hollowVictories = [];
        
        greenObjectives.forEach(obj => {
            const hasTransactionBacking = this.checkTransactionBacking(obj.id);
            
            if (!hasTransactionBacking) {
                hollowVictories.push({
                    objective: obj,
                    issue: 'Green status but no transaction backing'
                });
            }
        });
        
        return hollowVictories;
    },
    
    /**
     * Check if objective has transaction backing
     */
    checkTransactionBacking(objId) {
        // Trace: Obj → Perf → Transaction
        const perfRels = ontologyData.relationships.cascaded_via
            .filter(r => r.source === objId);
        
        for (const perfRel of perfRels) {
            const transRels = ontologyData.relationships.measured_by
                .filter(r => r.target === perfRel.target);
            
            if (transRels.length > 0) return true;
        }
        
        return false;
    },
    
    // ========================================
    // ENGINE ROOM QUERIES (Entity Deep Dive)
    // ========================================
    
    /**
     * Get capabilities hierarchy (L1→L2→L3)
     */
    getCapabilitiesHierarchy() {
        const capL1 = ontologyData.entityCapabilities.filter(c => 
            this.getLevel(c.id) === 'L1'
        );
        
        return capL1.map(cap => {
            const children = this.getCapabilityChildren(cap.id);
            return {
                ...cap,
                children: children
            };
        });
    },
    
    /**
     * Get children of a capability
     */
    getCapabilityChildren(capId) {
        const childRels = ontologyData.relationships.parent_of
            .filter(r => r.source === capId && r.type === 'EntityCapability');
        
        return childRels.map(rel => {
            const child = ontologyData.entityCapabilities.find(c => c.id === rel.target);
            const grandchildren = this.getCapabilityChildren(child.id);
            return {
                ...child,
                children: grandchildren
            };
        });
    },
    
    /**
     * Three Horizons View
     */
    getThreeHorizons() {
        const capL2 = ontologyData.entityCapabilities.filter(c => 
            this.getLevel(c.id) === 'L2'
        );
        
        const horizonA = []; // Build
        const horizonB = []; // Transition
        const horizonC = []; // Operate
        
        capL2.forEach(cap => {
            const state = this.getCapabilityState(cap.id);
            
            if (state.mode === 'BUILD') {
                horizonA.push({
                    capability: cap,
                    activeProjects: state.projects,
                    avgProgress: state.avgProgress
                });
            } else if (state.mode === 'TRANSITION') {
                horizonB.push({
                    capability: cap,
                    completedProjects: state.projects,
                    adoptionGap: state.adoptionGap
                });
            } else if (state.mode === 'OPERATE') {
                horizonC.push({
                    capability: cap,
                    activeRisks: state.risks,
                    healthStatus: state.healthStatus
                });
            }
        });
        
        return { horizonA, horizonB, horizonC };
    },
    
    /**
     * Get capability state (Build/Transition/Operate)
     */
    getCapabilityState(capL2Id) {
        const cap = ontologyData.entityCapabilities.find(c => c.id === capL2Id);
        
        // Check for active projects
        const projectRels = ontologyData.relationships.gaps_scope
            .filter(r => r.source === capL2Id);
        
        const projects = projectRels.map(rel => 
            ontologyData.entityProjects.find(p => p.id === rel.target)
        ).filter(p => p);
        
        const activeProjects = projects.filter(p => p.status === 'Active');
        
        if (activeProjects.length > 0) {
            // BUILD MODE
            const avgProgress = activeProjects.reduce((sum, p) => sum + p.progress_percentage, 0) / activeProjects.length;
            return {
                mode: 'BUILD',
                projects: activeProjects,
                avgProgress: avgProgress
            };
        }
        
        // Check maturity
        if (cap.maturity_level >= cap.target_maturity_level) {
            // OPERATE MODE
            const risks = this.getCapabilityRisks(capL2Id);
            const healthStatus = risks.length === 0 ? 'Healthy' :
                                risks.length <= 2 ? 'Monitored' :
                                'Degrading';
            
            return {
                mode: 'OPERATE',
                risks: risks,
                healthStatus: healthStatus
            };
        }
        
        // TRANSITION MODE (projects complete but not mature yet)
        const adoptionGap = this.checkAdoptionGap(capL2Id);
        return {
            mode: 'TRANSITION',
            projects: projects,
            adoptionGap: adoptionGap
        };
    },
    
    /**
     * Get risks for a capability
     */
    getCapabilityRisks(capL2Id) {
        // Get CapL3 children
        const capL3Rels = ontologyData.relationships.parent_of
            .filter(r => r.source === capL2Id && r.type === 'EntityCapability');
        
        const risks = [];
        
        capL3Rels.forEach(rel => {
            const riskRels = ontologyData.relationships.monitored_by
                .filter(r => r.source === rel.target);
            
            riskRels.forEach(riskRel => {
                const risk = ontologyData.entityRisks.find(r => r.id === riskRel.target);
                if (risk && risk.risk_status === 'Active') {
                    risks.push(risk);
                }
            });
        });
        
        return risks;
    },
    
    /**
     * Check adoption gap for capability
     */
    checkAdoptionGap(capL2Id) {
        const projectRels = ontologyData.relationships.gaps_scope
            .filter(r => r.source === capL2Id);
        
        for (const projRel of projectRels) {
            const proj = ontologyData.entityProjects.find(p => p.id === projRel.target);
            if (!proj || proj.progress_percentage < 80) continue;
            
            // Check adoption
            const adoptRels = ontologyData.relationships.adoption_risks
                .filter(r => r.source === proj.id);
            
            if (adoptRels.length === 0) {
                return { hasGap: true, reason: 'No adoption plan' };
            }
            
            const adoptions = adoptRels.map(r => 
                ontologyData.entityChangeAdoption.find(a => a.id === r.target)
            );
            
            if (adoptions.some(a => a && a.status !== 'Completed')) {
                return { hasGap: true, reason: 'Adoption incomplete' };
            }
        }
        
        return { hasGap: false };
    },
    
    // ========================================
    // DIAGNOSTICS LAB QUERIES
    // ========================================
    
    /**
     * Root Cause Chain Explorer
     * Trace from Red objective back to root cause
     */
    getRootCauseChain(objId) {
        const obj = ontologyData.sectorObjectives.find(o => o.id === objId);
        if (!obj || obj.status !== 'Red') return null;
        
        const chain = [];
        chain.push({ type: 'SectorObjective', node: obj, issue: `Status: ${obj.status}` });
        
        // Trace: Obj → Perf → Cap → Project → Risk
        const perfRels = ontologyData.relationships.cascaded_via
            .filter(r => r.source === objId);
        
        perfRels.forEach(perfRel => {
            const perf = ontologyData.sectorPerformance.find(p => p.id === perfRel.target);
            if (!perf || (perf.status !== 'Red' && perf.status !== 'Amber')) return;
            
            chain.push({ 
                type: 'SectorPerformance', 
                node: perf, 
                issue: `Actual: ${perf.actual} vs Target: ${perf.target}` 
            });
            
            // Perf → Cap (via Reports reverse or Sets_Targets reverse)
            const capRels = ontologyData.relationships.reports
                .filter(r => r.target === perf.id);
            
            capRels.forEach(capRel => {
                const cap = ontologyData.entityCapabilities.find(c => c.id === capRel.source);
                if (!cap || cap.maturity_level >= cap.target_maturity_level) return;
                
                chain.push({ 
                    type: 'EntityCapability', 
                    node: cap, 
                    issue: `Maturity: ${cap.maturity_level}/${cap.target_maturity_level}` 
                });
                
                // Cap → Projects
                const projRels = ontologyData.relationships.gaps_scope
                    .filter(r => r.source === cap.id);
                
                projRels.forEach(projRel => {
                    const proj = ontologyData.entityProjects.find(p => p.id === projRel.target);
                    if (!proj || (proj.status !== 'Delayed' && proj.status !== 'Blocked')) return;
                    
                    chain.push({ 
                        type: 'EntityProject', 
                        node: proj, 
                        issue: `Status: ${proj.status}, Progress: ${proj.progress_percentage}%` 
                    });
                    
                    // Find risks
                    const risks = this.getCapabilityRisks(cap.id);
                    risks.forEach(risk => {
                        if (risk.risk_status === 'Active') {
                            chain.push({ 
                                type: 'EntityRisk', 
                                node: risk, 
                                issue: `Risk Score: ${risk.risk_score}, Delay: ${risk.delay_days} days` 
                            });
                        }
                    });
                });
            });
        });
        
        return chain;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.OntologyQueries = OntologyQueries;
}
