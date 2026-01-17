/**
 * Command Center Analytics Engine
 * Implements Features 1.1-1.4 from CORRECTED-REQUIREMENTS-v2.md
 * 
 * Feature 1.1: Cross-Domain Integration Matrix (PerfL2 × CapL2)
 * Feature 1.2: Dual-Layer Health Status
 * Feature 1.3: Level Flow Diagram (Sankey)
 * Feature 1.4: Critical Jeopardy Alerts
 */

class CommandCenterAnalytics {
    constructor(waterData, capabilities, performance, objectives, policyTools) {
        this.waterData = waterData;
        this.capabilities = capabilities;
        this.performance = performance;
        this.objectives = objectives;
        this.policyTools = policyTools;
        this.currentYear = 2025;
    }

    // ============================================
    // Feature 1.1: Cross-Domain Integration Matrix
    // PerfL2 × CapL2 showing connection strength
    // ============================================
    
    getIntegrationMatrix() {
        // Get L2 Performance KPIs
        const perfL2 = this.performance
            .filter(p => p.level === 'L2' && p.year === this.currentYear)
            .map(p => ({
                id: p.id,
                name: p.name,
                actual: parseFloat(p.actual) || 0,
                target: parseFloat(p.target) || 0,
                achievement: this.calculateAchievement(p.actual, p.target),
                status: this.getPerformanceStatus(p.actual, p.target)
            }));

        // Get L2 Capabilities
        const capL2 = this.capabilities
            .filter(c => c.level === 'L2' && c.year === this.currentYear)
            .map(c => ({
                id: c.id,
                name: c.name,
                maturity: parseFloat(c.maturity_level) || 0,
                target: parseFloat(c.target_maturity_level) || 5,
                maturityPct: this.calculateMaturity(c.maturity_level, c.target_maturity_level),
                status: this.getCapabilityStatus(c.maturity_level, c.target_maturity_level)
            }));

        // Build matrix: rows = PerfL2, columns = CapL2
        const matrix = perfL2.map(perf => {
            const row = {
                perf: perf,
                cells: capL2.map(cap => {
                    const strength = this.calculateConnectionStrength(perf, cap);
                    const connected = strength > 0;
                    
                    return {
                        cap: cap,
                        strength: strength,
                        connected: connected,
                        color: this.getStrengthColor(strength),
                        risk: this.assessCellRisk(perf, cap, strength)
                    };
                })
            };
            return row;
        });

        return {
            perfL2,
            capL2,
            matrix,
            summary: this.getMatrixSummary(matrix)
        };
    }

    calculateConnectionStrength(perf, cap) {
        // For MVP: Connect ALL PerfL2 to ALL CapL2
        // Strength = average of performance achievement and capability maturity
        const strength = Math.round((perf.achievement + cap.maturityPct) / 2);
        return Math.max(0, Math.min(100, strength));
    }

    calculateAchievement(actual, target) {
        if (!target || target === 0) return 0;
        return Math.round((actual / target) * 100);
    }

    calculateMaturity(current, target) {
        if (!target || target === 0) return 0;
        return Math.round((current / target) * 100);
    }

    getPerformanceStatus(actual, target) {
        const achievement = this.calculateAchievement(actual, target);
        if (achievement >= 90) return 'green';
        if (achievement >= 70) return 'amber';
        return 'red';
    }

    getCapabilityStatus(maturity, target) {
        const maturityPct = this.calculateMaturity(maturity, target);
        if (maturityPct >= 80) return 'green';
        if (maturityPct >= 60) return 'amber';
        return 'red';
    }

    getStrengthColor(strength) {
        if (strength >= 75) return 'green';
        if (strength >= 50) return 'amber';
        if (strength > 0) return 'red';
        return 'gray';
    }

    assessCellRisk(perf, cap, strength) {
        // Identify integration risks
        if (perf.status === 'red' && cap.status === 'green' && strength > 50) {
            return { level: 'high', type: 'execution_failure', message: 'Capable but not delivering' };
        }
        if (perf.status === 'green' && cap.status === 'red' && strength > 50) {
            return { level: 'high', type: 'hollow_victory', message: 'Green KPI without capability support' };
        }
        if (strength > 0 && strength < 50) {
            return { level: 'medium', type: 'weak_link', message: 'Weak connection needs strengthening' };
        }
        return { level: 'low', type: 'normal', message: 'Connection healthy' };
    }

    getMatrixSummary(matrix) {
        let totalConnections = 0;
        let strongConnections = 0;
        let weakConnections = 0;
        let risks = { hollow_victory: 0, execution_failure: 0, weak_link: 0 };

        matrix.forEach(row => {
            row.cells.forEach(cell => {
                if (cell.connected) {
                    totalConnections++;
                    if (cell.strength >= 75) strongConnections++;
                    if (cell.strength < 50) weakConnections++;
                    if (cell.risk.level === 'high') {
                        risks[cell.risk.type]++;
                    }
                }
            });
        });

        return {
            totalConnections,
            strongConnections,
            weakConnections,
            risks,
            health: totalConnections > 0 ? Math.round((strongConnections / totalConnections) * 100) : 0
        };
    }

    // ============================================
    // Feature 1.2: Dual-Layer Health Status
    // ============================================
    
    getDualLayerHealth() {
        // Sector Layer Health: based on SectorPerformance L1 actual vs target
        const perfL1 = this.performance.filter(p => p.level === 'L1' && p.year === this.currentYear);
        const sectorHealth = this.calculateLayerHealth(perfL1, 'performance');

        // Entity Layer Health: based on EntityCapability L2 maturity
        const capL2 = this.capabilities.filter(c => c.level === 'L2' && c.year === this.currentYear);
        const entityHealth = this.calculateLayerHealth(capL2, 'capability');

        // Integration indicators
        const indicators = this.detectIntegrationAnomalies(sectorHealth, entityHealth);

        return {
            sector: sectorHealth,
            entity: entityHealth,
            indicators: indicators,
            overall: Math.round((sectorHealth.percentage + entityHealth.percentage) / 2)
        };
    }

    calculateLayerHealth(items, type) {
        if (!items.length) return { percentage: 0, green: 0, amber: 0, red: 0, total: 0 };

        let green = 0, amber = 0, red = 0;

        items.forEach(item => {
            let status;
            if (type === 'performance') {
                const achievement = this.calculateAchievement(item.actual, item.target);
                status = this.getPerformanceStatus(item.actual, item.target);
            } else {
                const maturity = this.calculateMaturity(item.maturity_level, item.target_maturity_level);
                status = this.getCapabilityStatus(item.maturity_level, item.target_maturity_level);
            }

            if (status === 'green') green++;
            else if (status === 'amber') amber++;
            else red++;
        });

        const total = items.length;
        const percentage = Math.round(((green + amber * 0.5) / total) * 100);

        return {
            percentage,
            green,
            amber,
            red,
            total,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                status: type === 'performance' 
                    ? this.getPerformanceStatus(item.actual, item.target)
                    : this.getCapabilityStatus(item.maturity_level, item.target_maturity_level)
            }))
        };
    }

    detectIntegrationAnomalies(sectorHealth, entityHealth) {
        const anomalies = [];

        // Safety check
        if (!sectorHealth.items || !entityHealth.items) {
            return anomalies;
        }

        // Check for Hollow Victory: Sector Green + Entity Red
        const greenSector = sectorHealth.items.filter(i => i.status === 'green');
        const redEntity = entityHealth.items.filter(i => i.status === 'red');

        if (greenSector.length > 0 && redEntity.length > 0) {
            anomalies.push({
                type: 'hollow_victory',
                severity: 'high',
                message: `${greenSector.length} strategic KPIs are green but ${redEntity.length} capabilities are red`,
                detail: 'Performance may not be sustainable without capability foundation'
            });
        }

        // Check for Execution Failure: Sector Red + Entity Green
        const redSector = sectorHealth.items.filter(i => i.status === 'red');
        const greenEntity = entityHealth.items.filter(i => i.status === 'green');

        if (redSector.length > 0 && greenEntity.length > 0) {
            anomalies.push({
                type: 'execution_failure',
                severity: 'high',
                message: `${redSector.length} strategic KPIs are red despite ${greenEntity.length} mature capabilities`,
                detail: 'Check policy tool execution or external factors blocking delivery'
            });
        }

        return anomalies;
    }

    // ============================================
    // Feature 1.3: Level Flow Diagram (Sankey)
    // ============================================
    
    getLevelFlowData() {
        // 5 Integration Paths from ontology:
        // Path 1: Objectives → Performance → Capabilities (Strategy-to-Execution)
        // Path 2: Objectives → PolicyTools → Capabilities (Policy-to-Execution)
        // Path 3: Capabilities → Performance (Direct Reporting)
        // Path 4: Capabilities → Risks → Performance (Risk Propagation)
        // Path 5: Risks → PolicyTools (Risk Mitigation)

        const nodes = [];
        const links = [];

        // Define nodes for each level
        const objL1 = this.objectives.filter(o => o.level === 'L1' && o.year === this.currentYear);
        const perfL1 = this.performance.filter(p => p.level === 'L1' && p.year === this.currentYear);
        const perfL2 = this.performance.filter(p => p.level === 'L2' && p.year === this.currentYear);
        const capL2 = this.capabilities.filter(c => c.level === 'L2' && c.year === this.currentYear);
        const policyL1 = this.policyTools.filter(pt => pt.level === 'L1' && pt.year === this.currentYear);

        // Add nodes
        nodes.push({ name: 'Objectives L1', value: objL1.length, layer: 'sector' });
        nodes.push({ name: 'Performance L1', value: perfL1.length, layer: 'sector' });
        nodes.push({ name: 'Performance L2', value: perfL2.length, layer: 'sector' });
        nodes.push({ name: 'Capabilities L2', value: capL2.length, layer: 'entity' });
        nodes.push({ name: 'PolicyTools L1', value: policyL1.length, layer: 'sector' });

        // Path 1: Obj L1 → Perf L1 → Perf L2 → Cap L2
        links.push({ source: 'Objectives L1', target: 'Performance L1', value: objL1.length, path: 1 });
        links.push({ source: 'Performance L1', target: 'Performance L2', value: perfL2.length, path: 1 });
        links.push({ source: 'Performance L2', target: 'Capabilities L2', value: Math.min(perfL2.length, capL2.length), path: 1 });

        // Path 2: Obj L1 → Policy L1 → Cap L2
        links.push({ source: 'Objectives L1', target: 'PolicyTools L1', value: Math.min(objL1.length, policyL1.length), path: 2 });
        links.push({ source: 'PolicyTools L1', target: 'Capabilities L2', value: Math.min(policyL1.length, capL2.length), path: 2 });

        // Path 3: Cap L2 → Perf L2 (reporting)
        links.push({ source: 'Capabilities L2', target: 'Performance L2', value: capL2.length, path: 3 });

        return { nodes, links };
    }

    // ============================================
    // Feature 1.4: Critical Jeopardy Alerts
    // ============================================
    
    getCriticalJeopardyAlerts() {
        const alerts = [];

        // Identify Red Performance L1 items (Sector problems)
        const redPerfL1 = this.performance
            .filter(p => p.level === 'L1' && p.year === this.currentYear)
            .filter(p => this.getPerformanceStatus(p.actual, p.target) === 'red');

        // For each Red Performance, trace back to Entity issues
        redPerfL1.forEach(perf => {
            // Get child L2 performance
            const childPerfL2 = this.performance
                .filter(p => p.level === 'L2' && p.parent_id === perf.id && p.year === this.currentYear);

            childPerfL2.forEach(perfL2 => {
                // Find connected L2 capabilities
                const connectedCaps = this.capabilities
                    .filter(c => c.level === 'L2' && c.year === this.currentYear)
                    .filter(c => {
                        // Simulate connection check
                        const strength = this.calculateConnectionStrength(
                            { id: perfL2.id, actual: perfL2.actual, target: perfL2.target, achievement: this.calculateAchievement(perfL2.actual, perfL2.target) },
                            { id: c.id, maturity: c.maturity_level, target: c.target_maturity_level, maturityPct: this.calculateMaturity(c.maturity_level, c.target_maturity_level) }
                        );
                        return strength > 0;
                    });

                // Check if any connected capability has low maturity
                connectedCaps.forEach(cap => {
                    const maturity = this.calculateMaturity(cap.maturity_level, cap.target_maturity_level);
                    
                    if (maturity < 60) {
                        alerts.push({
                            severity: 'critical',
                            type: 'capability_gap',
                            objectiveL1: perf.name,
                            objectiveStatus: 'red',
                            performanceL2: perfL2.name,
                            performanceActual: perfL2.actual,
                            performanceTarget: perfL2.target,
                            capabilityL2: cap.name,
                            capabilityMaturity: cap.maturity_level,
                            capabilityTarget: cap.target_maturity_level,
                            rootCause: `Low capability maturity (${cap.maturity_level}/${cap.target_maturity_level})`,
                            impact: `Threatens "${perf.name}" strategic objective`,
                            recommendation: `Accelerate "${cap.name}" capability development`
                        });
                    }
                });
            });
        });

        // Sort by severity and limit to top 5
        return alerts.slice(0, 5);
    }
}

// Export for use in command-center.html
if (typeof window !== 'undefined') {
    window.CommandCenterAnalytics = CommandCenterAnalytics;
}
