import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NeoGraph } from '../dashboards/NeoGraph';
import { ExplorerFilters } from './ExplorerFilters';
import { GraphSankey } from './GraphSankey';
import { GraphDataTable } from './GraphDataTable';
import { CANONICAL_PATHS } from '../../data/canonicalPaths';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { graphService } from '../../services/graphService';
import { GraphData } from '../../types/dashboard';
import './ExplorerDesk.css';

const GRAPH_SERVER_URL = (import.meta as any).env?.VITE_GRAPH_SERVER_URL || (import.meta as any).env?.REACT_APP_GRAPH_SERVER_URL || '';



const CHAIN_MAPPINGS: Record<string, { labels: string[], relationships: string[] }> = {
    'sector_value_chain': {
        labels: ['SectorObjective', 'SectorPolicyTool', 'SectorAdminRecord', 'SectorCitizen', 'SectorGovEntity', 'SectorBusiness', 'SectorDataTransaction', 'SectorPerformance'],
        relationships: ['REALIZED_VIA', 'REFERS_TO', 'APPLIED_ON', 'TRIGGERS_EVENT', 'MEASURED_BY', 'AGGREGATES_TO']
    },
    'setting_strategic_initiatives': {
        labels: ['SectorObjective', 'SectorPolicyTool', 'EntityCapability', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityProject', 'EntityChangeAdoption'],
        relationships: ['REALIZED_VIA', 'SETS_PRIORITIES', 'ROLE_GAPS', 'KNOWLEDGE_GAPS', 'AUTOMATION_GAPS', 'GAPS_SCOPE', 'ADOPTION_RISKS']
    },
    'setting_strategic_priorities': {
        labels: ['SectorObjective', 'SectorPerformance', 'EntityCapability', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem'],
        relationships: ['CASCADED_VIA', 'SETS_TARGETS', 'ROLE_GAPS', 'KNOWLEDGE_GAPS', 'AUTOMATION_GAPS']
    },
    'build_oversight': {
        labels: ['EntityChangeAdoption', 'EntityProject', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityCapability', 'EntityRisk', 'SectorPolicyTool', 'SectorObjective'],
        relationships: ['INCREASE_ADOPTION', 'CLOSE_GAPS', 'ROLE_GAPS', 'MONITORED_BY', 'INFORMS', 'GOVERNED_BY']
    },
    'operate_oversight': {
        labels: ['EntityCapability', 'EntityRisk', 'SectorPerformance', 'SectorObjective'],
        relationships: ['MONITORED_BY', 'INFORMS', 'AGGREGATES_TO']
    },
    'sustainable_operations': {
        labels: ['EntityCultureHealth', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityVendor'],
        relationships: ['MONITORS_FOR', 'APPLY', 'AUTOMATION', 'DEPENDS_ON']
    },
    'integrated_oversight': {
        labels: [],
        relationships: []
    }
};

interface ExplorerDeskProps {
    year?: string;
    quarter?: string;
}

function HealthOverlay({ stats, isLoading }: { stats: any, isLoading: boolean }) {
    if (isLoading) return null;
    // Handle both empty object and documented structure
    const hasData = stats && (stats.nodes > 0 || stats.links > 0 || (stats.node_count !== undefined));
    if (!hasData) return null;

    const nodes = stats.nodes ?? stats.node_count ?? 0;
    const links = stats.links ?? stats.link_count ?? 0;
    const isolated = stats.isolated_nodes ?? 0;

    return (
        <div className="health-overlay animate-fadeIn">
            <div className="health-stat">
                <span className="stat-label">DB Nodes</span>
                <span className="stat-value">{nodes.toLocaleString()}</span>
            </div>
            <div className="health-stat">
                <span className="stat-label">DB Links</span>
                <span className="stat-value">{links.toLocaleString()}</span>
            </div>
            {isolated > 0 && (
                <div className="health-stat warning">
                    <span className="stat-label">Isolated</span>
                    <span className="stat-value">{isolated}</span>
                </div>
            )}
        </div>
    );
}

export function ExplorerDesk({ year = '2025', quarter = 'All' }: ExplorerDeskProps) {
    const { token } = useAuth();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [selectedRelationships, setSelectedRelationships] = useState<string[]>([]);
    const [limit, setLimit] = useState<number>(200);
    const [queryType, setQueryType] = useState<'narrative' | 'diagnostic'>('narrative');
    const [selectedChain, setSelectedChain] = useState<string | null>(null);
    const [vizMode, setVizMode] = useState<'3d' | 'sankey'>('3d');

    const [liveSummary, setLiveSummary] = useState<string | null>(null);

    const [activeFetchParams, setActiveFetchParams] = useState<{
        labels: string[];
        relationships: string[];
        limit: number;
        queryType: 'narrative' | 'diagnostic';
        chain: string | null;
        year: string;
        quarter: string;
    } | null>(null);

    // Read theme from data-theme attribute
    const [isDark, setIsDark] = useState<boolean>(() => {
        const attr = document.documentElement.getAttribute('data-theme');
        return attr === 'dark' || attr === null;
    });

    // Watch for theme changes
    useEffect(() => {
        const updateTheme = () => {
            const attr = document.documentElement.getAttribute('data-theme');
            setIsDark(attr === 'dark' || attr === null);
        };
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Update labels/relationships when chain changes
    const handleChainChange = (chain: string | null) => {
        console.log(`[ExplorerDesk] Chain select changed: ${chain} (Waiting for Fetch click)`);
        setSelectedChain(chain);
        if (chain && CHAIN_MAPPINGS[chain]) {
            setSelectedLabels(CHAIN_MAPPINGS[chain].labels);
            setSelectedRelationships(CHAIN_MAPPINGS[chain].relationships);
        }
    };

    const handleQueryTypeChange = (type: 'narrative' | 'diagnostic') => {
        console.log(`[ExplorerDesk] Query Mode changed: ${type} (Waiting for Fetch click)`);
        setQueryType(type);
    };

    // Dynamic Ontology Fetch
    const { data: schemaData } = useQuery({
        queryKey: ['neo4j-schema'],
        queryFn: () => graphService.getSchema(),
        staleTime: Infinity
    });

    const { data: propertyData } = useQuery({
        queryKey: ['neo4j-properties'],
        queryFn: () => graphService.getProperties(),
        staleTime: Infinity
    });

    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['domain-graph-stats'],
        queryFn: () => graphService.getStats(),
        refetchInterval: 60000
    });



    // Real-time Summary Stream (SSE)
    useEffect(() => {
        if (!GRAPH_SERVER_URL) return;

        const eventSource = new EventSource(`${GRAPH_SERVER_URL}/api/summary-stream`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.summary) {
                    setLiveSummary(data.summary);
                }
            } catch (err) {
                console.warn('[ExplorerDesk] SSE Parse Error:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('[ExplorerDesk] SSE Error:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const buildGraphUrl = (paramsSnapshot: typeof activeFetchParams) => {
        if (!paramsSnapshot) return '';
        const baseUrl = GRAPH_SERVER_URL || '';
        const { chain, labels, relationships, limit, queryType, year: pYear, quarter: pQuarter } = paramsSnapshot;
        const analyzeGaps = queryType === 'diagnostic';

        console.log(`[ExplorerDesk] Building URL: year=${pYear}, quarter=${pQuarter}, chain=${chain}, analyzeGaps=${analyzeGaps}`);

        // If it's a chain call, use the specialized endpoint
        if (chain) {
            const params = new URLSearchParams();
            const yearNum = Number.parseInt(String(pYear), 10);
            const yearParam = Number.isNaN(yearNum) ? '0' : String(yearNum);
            params.append('year', yearParam);
            params.append('analyzeGaps', analyzeGaps.toString());
            params.append('excludeEmbeddings', 'true');
            const url = `${baseUrl}/api/business-chain/${chain}?${params.toString()}`;
            console.log(`[ExplorerDesk] Chain URL: ${url}`);
            return url;
        }

        // Generic graph endpoint
        const params = new URLSearchParams();
        if (labels.length > 0) params.append('nodeLabels', labels.join(','));
        if (relationships.length > 0) params.append('relationships', relationships.join(','));
        params.append('limit', limit.toString());
        // Catalog v1.3 specifies 'years' (plural) for generic graph
        params.append('years', pYear);
        if (pQuarter && pQuarter !== 'All') params.append('quarter', pQuarter);
        params.append('analyzeGaps', analyzeGaps.toString());
        params.append('excludeEmbeddings', 'true');
        const url = `${baseUrl}/api/graph?${params.toString()}`;
        console.log(`[ExplorerDesk] Graph URL: ${url}`);
        return url;
    };

    const { data: graphData, isLoading, error } = useQuery<GraphData>({
        // The query ONLY depends on the activeFetchParams snapshot
        queryKey: ['neo4j-graph', activeFetchParams],
        queryFn: async () => {
            if (!activeFetchParams) return { nodes: [], links: [] };
            const url = buildGraphUrl(activeFetchParams);
            console.log(`[ExplorerDesk] FETCH START (Manual): ${url}`);
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(url, { headers });
            if (!response.ok) {
                console.error(`[ExplorerDesk] FETCH ERROR: ${response.status}`);
                throw new Error(`Failed to fetch graph data: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`[ExplorerDesk] FETCH SUCCESS: ${data.nodes?.length || 0} nodes`);
            return data;
        },
        enabled: !!activeFetchParams,
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity, // Keep the data until explicitly changed via Apply
    });

    const handleApply = () => {
        console.log(`[ExplorerDesk] handleApply triggered: mode=${queryType}, year=${year}, quarter=${quarter}, chain=${selectedChain}`);
        setActiveFetchParams({
            labels: [...selectedLabels],
            relationships: [...selectedRelationships],
            limit,
            queryType,
            chain: selectedChain,
            year: year,
            quarter: quarter
        });
    };

    // Logic for data display
    // Logic for data display with Metadata Injection
    const displayData = useMemo(() => {
        // 1. Determine Base Data
        const baseData: GraphData | null = (graphData as unknown as GraphData);

        if (!baseData) return null;

        // 2. Always enforce SST 6A canonicalPath for rendering
        if (selectedChain && CANONICAL_PATHS[selectedChain]) {
            const def = CANONICAL_PATHS[selectedChain];
            const canonicalPath: any[] = [];

            def.steps.forEach((step, idx) => {
                if (idx === 0) canonicalPath.push({ type: 'node', label: step.sourceLabel, level: step.sourceLevel });
                canonicalPath.push({ type: 'edge', label: step.relationship });
                canonicalPath.push({ type: 'node', label: step.targetLabel, level: step.targetLevel });
            });

            return {
                ...baseData,
                metadata: {
                    ...(baseData.metadata || {}),
                    canonicalPath
                }
            };
        }

        return baseData;
    }, [graphData, selectedChain]);

    // Strict Mode: No automatic fallbacks
    const usingMockFallback = false;

    return (
        <div className="explorer-container">
            <ExplorerFilters
                selectedLabels={selectedLabels}
                selectedRelationships={selectedRelationships}
                limit={limit}
                queryType={queryType}
                selectedChain={selectedChain}
                vizMode={vizMode}
                onLabelsChange={setSelectedLabels}
                onRelationshipsChange={setSelectedRelationships}
                onLimitChange={setLimit}
                onQueryTypeChange={handleQueryTypeChange}
                onChainChange={handleChainChange}
                onVizModeChange={setVizMode}
                onApply={handleApply}
                isDark={isDark}
            />

            <div className="explorer-content custom-scrollbar">
                <div className="viz-wrapper">
                    {/* Status Overlay */}
                    {(isLoading || error || usingMockFallback || !displayData) && (
                        <div className="status-overlay-container">
                            {isLoading && (
                                <div className="status-toast status-toast-loading">
                                    Fetching live graph data...
                                </div>
                            )}
                            {error && !graphData && (
                                <div className="status-toast status-toast-fallback">
                                    <p className="font-bold">❌ Connection Error</p>
                                    <p className="text-xs opacity-80">Failed to reach Graph Server. Check VPN or server status.</p>
                                    <p className="text-xs opacity-50 mt-2">{String(error)}</p>
                                </div>
                            )}
                            {!displayData && !isLoading && !error && (
                                <div className="empty-state-container">
                                    <p className="text-2xl font-light">Graph Explorer</p>
                                    <p className="text-sm">Select a Business Chain or customize Nodes/Relationships</p>
                                    <p className="text-xs opacity-50 mt-2">Click "Fetch Live Graph" to retrieve data from Neo4j</p>
                                </div>
                            )}
                        </div>
                    )}

                    <HealthOverlay stats={statsData} isLoading={isStatsLoading} />

                    {/* Live Insight Panel */}
                    {liveSummary && (
                        <div className="live-insight-panel animate-fadeIn">
                            <p className="insight-title">✨ Live Insight</p>
                            <p className="insight-body">{liveSummary}</p>
                        </div>
                    )}

                    {/* Visualization Switch */}
                    {displayData && (
                        vizMode === 'sankey' ? (
                            <GraphSankey
                                data={displayData}
                                isDark={isDark}
                                chain={selectedChain}
                                metadata={displayData.metadata}
                                isDiagnostic={queryType === 'diagnostic'}
                            />
                        ) : (
                            <NeoGraph
                                data={displayData}
                                isDark={isDark}
                                language="en"
                                year={year}
                                quarter={quarter}
                            />
                        )
                    )}

                    {/* Node Count Badge */}
                    {displayData && (
                        <div className="node-count-badge">
                            {displayData.nodes.length} nodes, {displayData.links.length} edges
                            {selectedChain && <span className="chain-label">[{selectedChain}]</span>}
                        </div>
                    )}
                </div>
                {displayData && <GraphDataTable data={displayData} isDark={isDark} />}
            </div>
        </div>
    );
}
