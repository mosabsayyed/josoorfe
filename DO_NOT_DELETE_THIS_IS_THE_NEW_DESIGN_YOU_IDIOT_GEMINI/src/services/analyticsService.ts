import { SectorPerformance, SectorChainData } from './sectorService';
import { DashboardKPI, OutcomesData } from './dashboardService';

/**
 * Analytics Service
 * Ported from js/command-center-analytics.js
 * Implements Executive features:
 * 1. Cross-Domain Integration Matrix
 * 2. Dual-Layer Health Status
 * 3. Level Flow Diagram
 * 4. Critical Jeopardy Alerts
 */

export interface AnalyticsSummary {
    totalConnections: number;
    strongConnections: number;
    weakConnections: number;
    health: number;
    risks: {
        hollow_victory: number;
        execution_failure: number;
        weak_link: number;
    };
}

export interface HealthLayer {
    percentage: number;
    green: number;
    amber: number;
    red: number;
    total: number;
    items: any[];
}

export interface DualLayerHealth {
    sector: HealthLayer;
    entity: HealthLayer;
    indicators: any[];
    overall: number;
}

export class AnalyticsService {
    private currentYear = 2025;

    constructor(
        private performanceNodes: SectorPerformance[], // From Neo4j
        private dashboardKPIs: DashboardKPI[],         // From Supabase
        private outcomes: OutcomesData[]               // From Supabase
    ) { }

    /**
     * Feature 1.2: Dual-Layer Health Status
     * Combines Sector Performance (L1) with Entity Capabilities (L2)
     */
    getDualLayerHealth(): DualLayerHealth {
        // Sector Layer: Based on DashboardKPIs (Transformation Health)
        // We treat the "Dimensions" as the Sector Layer for this port
        const sectorHealth = this.calculateSectorHealth(this.dashboardKPIs);

        // Entity Layer: Based on Neo4j Performance Nodes (as proxy for capabilities until we have full cap nodes)
        // Or if we have capability nodes from Neo4j, use those.
        // Currently generating mock capability health from Performance nodes for demonstration if needed.
        const entityHealth = this.calculateEntityHealth(this.performanceNodes);

        // Integration indicators
        const indicators = this.detectIntegrationAnomalies(sectorHealth, entityHealth);

        return {
            sector: sectorHealth,
            entity: entityHealth,
            indicators: indicators,
            overall: Math.round((sectorHealth.percentage + entityHealth.percentage) / 2)
        };
    }

    private calculateSectorHealth(kpis: DashboardKPI[]): HealthLayer {
        if (!kpis.length) return this.emptyLayer();

        let green = 0, amber = 0, red = 0;

        kpis.forEach(kpi => {
            if (kpi.health_state === 'green') green++;
            else if (kpi.health_state === 'amber') amber++;
            else red++;
        });

        const total = kpis.length;
        // Weighted score: Green=1, Amber=0.5, Red=0
        const percentage = Math.round(((green + amber * 0.5) / total) * 100);

        return {
            percentage,
            green,
            amber,
            red,
            total,
            items: kpis
        };
    }

    private calculateEntityHealth(nodes: SectorPerformance[]): HealthLayer {
        if (!nodes.length) return this.emptyLayer();

        let green = 0, amber = 0, red = 0;

        nodes.forEach(node => {
            const achievement = this.calculateAchievement(node.actual_value, node.target);
            if (achievement >= 90) green++;
            else if (achievement >= 70) amber++;
            else red++;
        });

        const total = nodes.length;
        const percentage = Math.round(((green + amber * 0.5) / total) * 100);

        return {
            percentage,
            green,
            amber,
            red,
            total,
            items: nodes
        };
    }

    private detectIntegrationAnomalies(sector: HealthLayer, entity: HealthLayer) {
        const anomalies = [];

        // Check for Hollow Victory: Sector Green + Entity Red
        // (High sector score but low entity score)
        if (sector.percentage > 70 && entity.percentage < 40) {
            anomalies.push({
                type: 'hollow_victory',
                severity: 'high',
                message: `Sector Health (${sector.percentage}%) is strong but Entity Capability (${entity.percentage}%) is critical`,
                detail: 'Performance may not be sustainable without capability foundation'
            });
        }

        // Check for Execution Failure: Sector Red + Entity Green
        if (sector.percentage < 40 && entity.percentage > 70) {
            anomalies.push({
                type: 'execution_failure',
                severity: 'high',
                message: `Sector Health (${sector.percentage}%) is critical despite mature capabilities (${entity.percentage}%)`,
                detail: 'Check policy tool execution or external factors blocking delivery'
            });
        }

        return anomalies;
    }

    private calculateAchievement(actual: number = 0, target: number = 0): number {
        if (!target || target === 0) return 0;
        return Math.round((actual / target) * 100);
    }

    private emptyLayer(): HealthLayer {
        return { percentage: 0, green: 0, amber: 0, red: 0, total: 0, items: [] };
    }
}
