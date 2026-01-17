export interface NeoGraphData {
    nodes: any[];
    links: any[];
}

export interface SchemaInfo {
    labels: string[];
    relationshipTypes: string[];
}

export interface YearInfo {
    years: number[];
}

export interface PropertyInfo {
    properties: string[];
}

const GRAPH_URL = import.meta.env.VITE_GRAPH_SERVER_URL || 'https://betaBE.aitwintech.com/api';
const API_URL = import.meta.env.VITE_API_URL || 'https://betaBE.aitwintech.com/api/v1';

export const graphService = {
    async getHealth() {
        const res = await fetch(`${GRAPH_URL}/neo4j/health`);
        return res.json();
    },

    async getYears(): Promise<YearInfo> {
        const res = await fetch(`${GRAPH_URL}/neo4j/years`);
        if (!res.ok) throw new Error('Failed to fetch years');
        return res.json();
    },

    async getSchema(): Promise<SchemaInfo> {
        // Schema is typically Graph-related, but v1 API puts generic tables on API_URL. 
        // Sankey Filters need ontology. Usually this is Graph Metadata. 
        // User said: "v1 for Tables/KPIs/Auth". 
        // Ontology Schema is Graph metadata, so likely GRAPH_URL? 
        // Actually, user said "/api/v1/ for Tables". 
        // "Use /api/ for all Graph/Sankey". 
        // Schema is used for filters for Graph. So GRAPH_URL.
        const res = await fetch(`${GRAPH_URL}/neo4j/schema`);
        if (!res.ok) throw new Error('Failed to fetch schema');
        return res.json();
    },

    async getProperties(): Promise<PropertyInfo> {
        const res = await fetch(`${GRAPH_URL}/neo4j/properties`);
        if (!res.ok) throw new Error('Failed to fetch properties');
        return res.json();
    },

    async getGraph(params: Record<string, any>): Promise<NeoGraphData> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        
        const url = `${GRAPH_URL}/graph?${searchParams.toString()}`;
        console.log('[GraphService] 🌐 Fetching from:', url, 'at', new Date().toISOString());
        
        const res = await fetch(url);
        
        console.log('[GraphService] 📡 Response status:', res.status, res.statusText);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('[GraphService] ❌ Error response:', errorText);
            throw new Error(`Failed to fetch graph data: ${res.status} ${errorText}`);
        }
        
        const data = await res.json();
        console.log('[GraphService] ✅ Response data structure:', {
            hasNodes: !!data.nodes,
            hasLinks: !!data.links,
            nodeCount: data.nodes?.length || 0,
            linkCount: data.links?.length || 0
        });
        
        return data;
    },

    async getBusinessChain(chainKey: string, params: Record<string, any>): Promise<NeoGraphData> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        const res = await fetch(`${GRAPH_URL}/business-chain/${chainKey}?${searchParams.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch business chain: ${chainKey}`);
        return res.json();
    },

    async getStats() {
        const res = await fetch(`${GRAPH_URL}/domain-graph/stats`);
        if (!res.ok) throw new Error('Failed to fetch graph stats');
        return res.json();
    },



    async getIntegrity() {
        // Integrity check usually graph logic
        const res = await fetch(`${GRAPH_URL}/business-chain/integrity`);
        if (!res.ok) throw new Error('Failed to fetch integrity');
        return res.json();
    }
};
