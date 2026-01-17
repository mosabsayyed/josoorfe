import apiClient from './apiClient';

/**
 * Service to handle Sector Desk data fetching from Graph Server.
 * Endpoints are proxies via /api -> :3001
 */

export interface SectorChainData {
    nodes: any[];
    edges: any[];
    // Graph Server might return meta stats too
}

// Types matching SaudiMap expectations
// --- SST v1.1 NODE TAXONOMY ---

export interface SectorNode {
    id: string;
    labels: string[];
    properties: Record<string, any>;
}

// L1/L2/L3 Hierarchy: Category -> KPI -> Metric
export interface SectorPerformance {
    id: string;
    name: string;
    year: number;
    level: string; // 'L1' | 'L2' | 'L3'
    status: string;
    actual_value: number;
    target: number;
    unit: string;
    // ... other SST properties
}

// Stakeholder for Map
export interface SectorBusiness {
    id: string;
    name: string;
    operating_sector: string;
    // Note: SST v1.1 does NOT define 'coords'. 
    // Map rendering will require either custom properties on nodes 
    // or a client-side lookup. 
    // For now: We map 'coords' if present in properties, else null.
    coords?: number[];
}

export interface MapEntity extends SectorBusiness {
    type: string; // Mapped from label
}

// Adapter: Transform raw Graph Nodes -> UI Map Entities
export const transformToMapEntities = (nodes: any[]): MapEntity[] => {
    return nodes
        .filter(n => {
            const labels = n.labels || [];
            // Filter for Stakeholders defined in Chain 1
            return labels.includes('SectorBusiness') ||
                labels.includes('SectorGovEntity') ||
                labels.includes('SectorCitizen');
        })
        .map(n => ({
            id: n.id || elementId(n), // Support Neo4j 5 elementId if needed
            name: n.properties?.name || n.id,
            operating_sector: n.properties?.operating_sector || 'Unknown',
            type: (n.labels || [])[0], // Primary label as type
            coords: n.properties?.coords || null, // STRICT: No mock fallback
            // Pass through other props for tooltip
            ...n.properties
        }));
};

// Helper to extract id (handles Neo4j 4 vs 5 diffs if needed)
const elementId = (n: any) => n.elementId || n.id;


// 1. Sector Value Chain (Map Flows & External Interactions)
export const getSectorValueChain = async (year: number | string = '0', id: string | null = null) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (id) params.append('id', id);

    const response = await apiClient.get<SectorChainData>(`/api/business-chain/sector_value_chain?${params.toString()}`);
    return response.data;
};

// 2. Strategic Priorities (KPIs / Targets)
export const getStrategicPriorities = async (year: number | string = '0') => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await apiClient.get<SectorChainData>(`/api/business-chain/setting_strategic_priorities?${params.toString()}`);
    return response.data;
};
