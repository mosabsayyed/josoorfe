import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

const LABEL_COLORS: Record<string, string> = {
    SectorObjective: '#3b82f6', SectorPolicyTool: '#8b5cf6', SectorAdminRecord: '#06b6d4',
    SectorBusiness: '#f59e0b', SectorCitizen: '#10b981', SectorGovEntity: '#ef4444',
    SectorDataTransaction: '#ec4899', SectorPerformance: '#f97316',
    EntityCapability: '#6366f1', EntityOrgUnit: '#14b8a6', EntityProcess: '#a855f7',
    EntityITSystem: '#0ea5e9', EntityProject: '#84cc16', EntityChangeAdoption: '#e879f9',
    EntityRisk: '#f43f5e', EntityCultureHealth: '#22d3ee', EntityVendor: '#fb923c',
};

const LEGEND_CONFIG = { colors: LABEL_COLORS };

const CHAIN_MAPPINGS: Record<string, { name: string, labels: string[], relationships: string[], startLabels: string[], endLabels: string[] }> = {
    'sector_value_chain': {
        name: 'Sector Value Chain',
        labels: ['SectorObjective', 'SectorPolicyTool', 'SectorAdminRecord', 'SectorBusiness', 'SectorCitizen', 'SectorGovEntity', 'SectorDataTransaction', 'SectorPerformance'],
        relationships: ['REALIZED_VIA', 'REFERS_TO', 'APPLIED_ON', 'TRIGGERS_EVENT', 'MEASURED_BY', 'AGGREGATES_TO'],
        startLabels: ['SectorObjective'], endLabels: ['SectorPerformance']
    },
    'setting_strategic_initiatives': {
        name: 'Strategic Initiatives',
        labels: ['SectorObjective', 'SectorPolicyTool', 'EntityCapability', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityProject', 'EntityChangeAdoption'],
        relationships: ['REALIZED_VIA', 'PARENT_OF', 'SETS_PRIORITIES', 'ROLE_GAPS', 'KNOWLEDGE_GAPS', 'AUTOMATION_GAPS', 'GAPS_SCOPE', 'ADOPTION_RISKS'],
        startLabels: ['SectorObjective'], endLabels: ['EntityChangeAdoption']
    },
    'setting_strategic_priorities': {
        name: 'Strategic Priorities',
        labels: ['SectorObjective', 'SectorPerformance', 'EntityCapability', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem'],
        relationships: ['CASCADED_VIA', 'PARENT_OF', 'SETS_TARGETS', 'ROLE_GAPS', 'KNOWLEDGE_GAPS', 'AUTOMATION_GAPS'],
        startLabels: ['SectorObjective'], endLabels: ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem']
    },
    'build_oversight': {
        name: 'Build Oversight',
        labels: ['EntityChangeAdoption', 'EntityProject', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityCapability', 'EntityRisk', 'SectorPolicyTool', 'SectorObjective'],
        relationships: ['INCREASE_ADOPTION', 'CLOSE_GAPS', 'GAP_STATUS', 'MONITORED_BY', 'PARENT_OF', 'INFORMS', 'GOVERNED_BY'],
        startLabels: ['EntityChangeAdoption'], endLabels: ['SectorObjective']
    },
    'operate_oversight': {
        name: 'Operate Oversight',
        labels: ['EntityCapability', 'EntityRisk', 'SectorPerformance', 'SectorObjective'],
        relationships: ['MONITORED_BY', 'PARENT_OF', 'INFORMS', 'AGGREGATES_TO'],
        startLabels: ['EntityCapability'], endLabels: ['SectorObjective']
    },
    'sustainable_operations': {
        name: 'Sustainable Operations',
        labels: ['EntityCultureHealth', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityVendor'],
        relationships: ['MONITORS_FOR', 'APPLY', 'AUTOMATION', 'DEPENDS_ON'],
        startLabels: ['EntityCultureHealth'], endLabels: ['EntityVendor']
    },
    'integrated_oversight': {
        name: 'Integrated Oversight',
        labels: ['SectorPolicyTool', 'EntityCapability', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityRisk', 'SectorPerformance'],
        relationships: ['SETS_PRIORITIES', 'PARENT_OF', 'ROLE_GAPS', 'KNOWLEDGE_GAPS', 'AUTOMATION_GAPS', 'MONITORED_BY', 'INFORMS'],
        startLabels: ['SectorPolicyTool'], endLabels: ['SectorPerformance']
    }
};

interface ExplorerDeskProps {
    year?: string;
    quarter?: string;
}

/**
 * Normalize API {nodes, links} into ForceGraph-compatible shape.
 * API node.id is non-unique (domain ID like "1.0" shared across types).
 * We use node.elementId (unique Neo4j internal ID) as the graph key.
 * Link.id = "srcElementId-RELTYPE-tgtElementId" — parsed to resolve source/target.
 */
const NODE_COLOR_MAP: Record<string, string> = {
    'SectorObjective': '#F4BB30',
    'SectorPolicyTool': '#D4A017',
    'SectorAdminRecord': '#B8860B',
    'SectorDataTransaction': '#DAA520',
    'SectorCitizen': '#C49102',
    'SectorBusiness': '#E6A817',
    'SectorGovEntity': '#A67B00',
    'SectorPerformance': '#CF9B1D',
    'EntityCapability': '#F0C040',
    'EntityRisk': '#D4920A',
    'EntityProject': '#BFA14A',
    'EntityChangeAdoption': '#9C7A1E',
    'EntityITSystem': '#E8B828',
    'EntityOrgUnit': '#C8A22C',
    'EntityProcess': '#A08520',
    'EntityVendor': '#D4AF37',
    'EntityCultureHealth': '#B59410',
};

const getNodeColor = (labels: string[]): string => {
    for (const label of labels) {
        if (NODE_COLOR_MAP[label]) return NODE_COLOR_MAP[label];
    }
    // Hash first label to palette for unknown types
    const label = labels[0] || '';
    const FALLBACK = ['#F4BB30', '#D4A017', '#B8860B', '#DAA520', '#C49102', '#E6A817', '#A67B00', '#CF9B1D', '#8B6914', '#F0C040'];
    let hash = 0;
    for (let i = 0; i < label.length; i++) hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
    return FALLBACK[Math.abs(hash) % FALLBACK.length];
};

// Internal keys to exclude from the "properties" bag shown in tooltip
const INTERNAL_KEYS = new Set(['id', 'elementId', 'color', 'val', 'value', 'group', 'label', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', '__indexColor']);

const normalizeGraphData = (data: { nodes: any[], links: any[] }) => {
    const nodes = data.nodes.map((n: any) => {
        const eid = n.elementId || n.id;

        // Backend returns props FLAT on the node (label, group, year, level, etc.)
        // NOT nested in n.properties or n.labels
        const nodeLabel = n.label || '';                       // e.g. "Enhance Regulatory Efficiency"
        const nodeGroup = n.group || '';                       // e.g. "SectorObjective"
        const labels = n.labels || (nodeGroup ? [nodeGroup] : []);

        // Collect all flat fields (minus internal keys) as the properties bag
        const props: Record<string, any> = n.properties || {};
        // If props is empty, scrape flat fields from the node itself
        if (Object.keys(props).length === 0) {
            for (const [k, v] of Object.entries(n)) {
                if (!INTERNAL_KEYS.has(k) && v !== undefined && v !== null) {
                    props[k] = v;
                }
            }
        }

        const domainId = n.domain_id || props.domain_id || '';

        return {
            id: eid, elementId: eid, labels, label: labels[0] || nodeGroup || 'Unknown',
            domain_id: domainId,
            name: nodeLabel || props.name || props.title || eid,
            color: n.color || getNodeColor(labels),
            properties: props, nProps: props, val: n.val || 1,
        };
    });

    const nodeSet = new Set(nodes.map((n: any) => n.id));
    const seen = new Set<string>();
    const links: any[] = [];

    for (const l of data.links) {
        const relType = l.type || '';
        const parts = l.id ? String(l.id).split(`-${relType}-`) : [];
        const src = parts.length === 2 ? parts[0] : l.source;
        const tgt = parts.length === 2 ? parts[1] : l.target;
        const key = `${src}-${relType}-${tgt}`;
        if (!seen.has(key) && nodeSet.has(src) && nodeSet.has(tgt)) {
            seen.add(key);
            links.push({ source: src, sourceId: src, target: tgt, targetId: tgt, type: relType, rType: relType, value: 1 });
        }
    }

    return { nodes, links };
};

function HealthOverlay({ stats, isLoading }: { stats: any, isLoading: boolean }) {
    const { t } = useTranslation();
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
                <span className="stat-label">{t('josoor.explorer.dbNodes')}</span>
                <span className="stat-value">{nodes.toLocaleString()}</span>
            </div>
            <div className="health-stat">
                <span className="stat-label">{t('josoor.explorer.dbLinks')}</span>
                <span className="stat-value">{links.toLocaleString()}</span>
            </div>
            {isolated > 0 && (
                <div className="health-stat warning">
                    <span className="stat-label">{t('josoor.explorer.isolated')}</span>
                    <span className="stat-value">{isolated}</span>
                </div>
            )}
        </div>
    );
}

export function ExplorerDesk({ year = '2025', quarter = 'All' }: ExplorerDeskProps) {
    const { t } = useTranslation();
    const { token } = useAuth();
    const contentRef = useRef<HTMLDivElement>(null);
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [selectedRelationships, setSelectedRelationships] = useState<string[]>([]);
    const [limit, setLimit] = useState<number>(200);
    const [queryType, setQueryType] = useState<'narrative' | 'diagnostic'>('narrative');
    const [selectedChain, setSelectedChain] = useState<string | null>(null);
    const [vizMode, setVizMode] = useState<'3d' | 'sankey'>('3d');

    const [liveSummary, setLiveSummary] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);

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
            params.append('limit', limit.toString());
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
            if (!data.nodes || !data.links) {
                console.warn(`[ExplorerDesk] Unexpected response shape`, Object.keys(data));
                return { nodes: [], links: [] };
            }
            const result = normalizeGraphData(data);
            console.log(`[ExplorerDesk] ${result.nodes.length} nodes, ${result.links.length} links`);
            return result;
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

    // Scroll chart into view whenever new data arrives
    useEffect(() => {
        if (graphData) {
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [graphData]);

    // Inject canonical path metadata for Sankey rendering
    const displayData = useMemo(() => {
        const baseData: GraphData | null = (graphData as unknown as GraphData);
        if (!baseData || !baseData.nodes) return null;

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

        return { ...baseData, metadata: baseData.metadata || {} };
    }, [graphData, selectedChain]);

    const hasCanonicalPath = selectedChain ? (CANONICAL_PATHS[selectedChain]?.steps?.length > 0) : false;

    // Active label colors for current chain (for legend)
    const activeLabelColors = useMemo(() => {
        if (!selectedChain || !CHAIN_MAPPINGS[selectedChain]) return LABEL_COLORS;
        const active: Record<string, string> = {};
        for (const l of CHAIN_MAPPINGS[selectedChain].labels) {
            if (LABEL_COLORS[l]) active[l] = LABEL_COLORS[l];
        }
        return active;
    }, [selectedChain]);

    // Node color function matching test page: diagnostic status > label color > palette hash
    const getNodeColor = useCallback((node: any) => {
        const label = node.labels?.[0] || node.label || '';
        const status = node.properties?.status || node.nProps?.status;
        if (status === 'critical') return '#ef4444';
        if (status === 'orphan' || status === 'bastard') return '#f59e0b';
        if (LABEL_COLORS[label]) return LABEL_COLORS[label];
        // Hash unknown labels to a contrasting palette color instead of gold
        const FALLBACK_PALETTE = [
            '#F4BB30', '#D4A017', '#B8860B', '#DAA520', '#C49102',
            '#E6A817', '#A67B00', '#CF9B1D', '#8B6914', '#F0C040',
        ];
        let hash = 0;
        for (let i = 0; i < label.length; i++) hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
        return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
    }, []);

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
                selectedNode={selectedNode}
            />

            <div ref={contentRef} className="explorer-content custom-scrollbar">
                <div className="viz-wrapper">
                    {/* Status Overlay */}
                    {(isLoading || error || !displayData) && (
                        <div className="status-overlay-container">
                            {isLoading && (
                                <div className="status-toast status-toast-loading">
                                    {t('josoor.explorer.fetching')}
                                </div>
                            )}
                            {error && !graphData && (
                                <div className="status-toast status-toast-fallback">
                                    <p className="font-bold">{t('josoor.explorer.connectionError')}</p>
                                    <p className="text-xs opacity-80">{t('josoor.explorer.connectionErrorDesc')}</p>
                                    <p className="text-xs opacity-50 mt-2">{String(error)}</p>
                                </div>
                            )}
                            {!displayData && !isLoading && !error && (
                                <div className="empty-state-container">
                                    <p className="text-2xl font-light">{t('josoor.explorer.title')}</p>
                                    <p className="text-sm">{t('josoor.explorer.subtitle')}</p>
                                    <p className="text-xs opacity-50 mt-2">{t('josoor.explorer.hint')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <HealthOverlay stats={statsData} isLoading={isStatsLoading} />

                    {/* Live Insight Panel */}
                    {liveSummary && (
                        <div className="live-insight-panel animate-fadeIn">
                            <p className="insight-title">{t('josoor.explorer.liveInsight')}</p>
                            <p className="insight-body">{liveSummary}</p>
                        </div>
                    )}

                    {/* Visualization Switch */}
                    {displayData && vizMode === 'sankey' && hasCanonicalPath && (
                        <GraphSankey
                            data={displayData}
                            isDark={isDark}
                            chain={selectedChain}
                            metadata={displayData.metadata}
                            isDiagnostic={queryType === 'diagnostic'}
                        />
                    )}
                    {displayData && vizMode === 'sankey' && !hasCanonicalPath && (
                        <div className="status-overlay-container">
                            <div className="empty-state-container">
                                <p className="text-2xl font-light">{t('josoor.explorer.sankeyNotAvailable')}</p>
                                <p className="text-sm">{t('josoor.explorer.branchingStructure')}</p>
                                <p className="text-xs opacity-50 mt-2">{t('josoor.explorer.switchTo3d')}</p>
                            </div>
                        </div>
                    )}
                    {displayData && vizMode === '3d' && (
                        <NeoGraph
                            data={displayData}
                            isDark={isDark}
                            language="en"
                            year={year}
                            quarter={quarter}
                            legendConfig={LEGEND_CONFIG}
                            nodeColor={getNodeColor}
                            onNodeClick={setSelectedNode}
                        />
                    )}

                    {/* Node Count Badge */}
                    {displayData && (
                        <div className="node-count-badge">
                            {displayData.nodes.length} {t('josoor.common.nodes')}, {displayData.links.length} {t('josoor.common.edges')}
                            {selectedChain && <span className="chain-label">[{selectedChain}]</span>}
                        </div>
                    )}
                </div>
                {/* Debug tables hidden — kept for future diagnostics */}
                {/* {displayData && <GraphDataTable data={displayData} isDark={isDark} />} */}
            </div>
        </div>
    );
}
