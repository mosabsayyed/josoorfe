import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NeoGraph } from '../dashboards/NeoGraph';
import { LayoutMode, HierarchySource } from '../dashboards/graphLayouts';
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
    'change_to_capability': {
        name: 'Change to Capability',
        labels: ['EntityChangeAdoption', 'EntityProject', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityCapability'],
        relationships: ['INCREASE_ADOPTION', 'CLOSE_GAPS', 'GAP_STATUS'],
        startLabels: ['EntityChangeAdoption'], endLabels: ['EntityCapability']
    },
    'capability_to_policy': {
        name: 'Capability to Policy',
        labels: ['EntityCapability', 'EntityRisk', 'SectorPolicyTool', 'SectorObjective'],
        relationships: ['MONITORED_BY', 'PARENT_OF', 'INFORMS', 'GOVERNED_BY'],
        startLabels: ['EntityCapability'], endLabels: ['SectorObjective']
    },
    'capability_to_performance': {
        name: 'Capability to Performance',
        labels: ['EntityCapability', 'EntityRisk', 'SectorPerformance', 'SectorObjective'],
        relationships: ['MONITORED_BY', 'PARENT_OF', 'INFORMS', 'AGGREGATES_TO'],
        startLabels: ['EntityCapability'], endLabels: ['SectorObjective']
    },
    'sustainable_operations': {
        name: 'Sustainable Operations',
        labels: ['EntityCultureHealth', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityVendor'],
        relationships: ['MONITORS_FOR', 'APPLY', 'AUTOMATION', 'DEPENDS_ON'],
        startLabels: ['EntityCultureHealth'], endLabels: ['EntityVendor']
    }
};

const AR_CHAIN_NAMES: Record<string, string> = {
    'sector_value_chain': 'سلسلة القيمة القطاعية',
    'setting_strategic_initiatives': 'المبادرات الاستراتيجية',
    'setting_strategic_priorities': 'الأولويات الاستراتيجية',
    'change_to_capability': 'التغيير إلى القدرات',
    'capability_to_policy': 'القدرات إلى السياسات',
    'capability_to_performance': 'القدرات إلى الأداء',
};

interface ExplorerDeskProps {
    year?: string;
    quarter?: string;
}

/**
 * Normalize API {nodes, links} into ForceGraph-compatible shape.
 * API node.id is non-unique (domain ID like "1.0" shared across types).
 * We use composite Label:id as the unique graph key.
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
const INTERNAL_KEYS = new Set(['color', 'val', 'value', 'group', 'label', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', '__indexColor']);

const normalizeGraphData = (data: { nodes: any[], links: any[] }) => {
    const nodes = data.nodes.map((n: any) => {
        const eid = n.id;

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

        return {
            id: eid, labels, label: labels[0] || nodeGroup || 'Unknown',
            name: nodeLabel || props.name || props.title || eid,
            color: n.color || getNodeColor(labels),
            properties: props, nProps: props, val: n.val || 1,
        };
    });

    const links = data.links.map((l: any) => ({
        source: l.source || '', target: l.target || '', type: l.type || '', value: 1,
    }));

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
    const isRTL = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';
    const contentRef = useRef<HTMLDivElement>(null);
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [selectedRelationships, setSelectedRelationships] = useState<string[]>([]);
    const [limit, setLimit] = useState<number>(200);
    const [queryType, setQueryType] = useState<'narrative' | 'diagnostic'>('narrative');
    const [selectedChain, setSelectedChain] = useState<string | null>(null);
    type VizMode = LayoutMode | 'sankey' | 'table';
    const [vizMode, setVizMode] = useState<VizMode>('sphere');
    const [is3D, setIs3D] = useState(true);
    const [hierarchySource, setHierarchySource] = useState<HierarchySource>('parent_of');

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
            // Default to sankey when chain has canonical path
            if (CANONICAL_PATHS[chain]?.steps?.length > 0) {
                setVizMode('sankey');
            }
        } else {
            // Custom selection defaults to sphere if currently on sankey
            if (vizMode === 'sankey') setVizMode('sphere');
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

        // If it's a chain call, use the v1 chains endpoint (match preload pattern)
        if (chain) {
            const yearNum = Number.parseInt(String(pYear), 10);
            const yearParam = Number.isNaN(yearNum) ? '0' : String(yearNum);
            let url = `${baseUrl}/api/v1/chains/${chain}?year=${yearParam}&row_limit=${limit}&analyzeGaps=${analyzeGaps}`;
            if (pQuarter && pQuarter !== 'All') url += `&quarter=${pQuarter.replace(/\D/g, '')}`;
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
        if (pQuarter && pQuarter !== 'All') params.append('quarter', pQuarter.replace(/\D/g, ''));
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
            const raw = await response.json();

            // Normalize chain/graph response into {nodes: [...], links: [...]}
            // New chain format: {nodes: {"Label": [{id,name,...}]}, edges: [{source_label,source_id,target_label,target_id,type,props}]}
            // Generic graph endpoint: {nodes: [...], links: [...]}
            // Legacy format: {results: [{nodes, relationships}]}
            let data: { nodes: any[]; links: any[] };
            if (raw.nodes && !Array.isArray(raw.nodes) && typeof raw.nodes === 'object') {
                // New chain format — aligned with chainsService.fetchChainCached
                const nodesDict: Record<string, any[]> = raw.nodes;
                const edgesArr: any[] = raw.edges || [];
                const flatNodes: any[] = [];
                const seenNodeIds = new Set<string>();
                for (const [label, nodeArr] of Object.entries(nodesDict)) {
                    for (const nodeObj of nodeArr) {
                        const uid = `${label}:${String(nodeObj.id ?? '')}`;
                        if (seenNodeIds.has(uid)) continue; // skip duplicates from diagnostic UNWIND
                        seenNodeIds.add(uid);
                        flatNodes.push({
                            nId: uid, nLabels: [label], nProps: nodeObj,
                            id: uid, labels: [label], properties: nodeObj,
                        });
                    }
                }
                const links = edgesArr.map((e: any) => ({
                    type: e.type,
                    source: `${e.source_label}:${String(e.source_id)}`,
                    target: `${e.target_label}:${String(e.target_id)}`,
                    properties: e.props || {},
                }));
                data = { nodes: flatNodes, links };
                console.log(`[ExplorerDesk] Parsed chain: ${flatNodes.length} nodes, ${links.length} edges`);
            } else if (raw.results && Array.isArray(raw.results)) {
                // Legacy format: {results: [{nodes, relationships}]}
                const r0 = raw.results[0] || {};
                data = {
                    nodes: (r0.nodes || []).map((n: any) => ({
                        id: n.id,
                        labels: n.labels || [], label: (n.labels || [])[0] || '',
                        group: (n.labels || [])[0] || '',
                        properties: n.properties || {}, ...n.properties,
                    })),
                    links: (r0.relationships || []).map((r: any) => ({
                        id: `${r.start}-${r.type}-${r.end}`,
                        type: r.type, source: r.start, target: r.end,
                    }))
                };
            } else if (raw.nodes && Array.isArray(raw.nodes)) {
                // Generic graph endpoint: already flat
                data = raw;
            } else {
                console.warn(`[ExplorerDesk] Unexpected response shape`, Object.keys(raw));
                return { nodes: [], links: [] };
            }

            const result = normalizeGraphData(data);
            console.log(`[ExplorerDesk] ${result.nodes.length} nodes, ${result.links.length} links`);

            // Tag orphan/bastard when in diagnostic mode — chain-aware per-column detection
            if (activeFetchParams.queryType === 'diagnostic' && result.nodes.length > 0) {
                const chainKey = activeFetchParams.chain;
                const chainDef = chainKey ? CANONICAL_PATHS[chainKey] : null;

                if (chainDef) {
                    // Build column sequence from canonical path (same logic as Sankey)
                    const colSequence: Array<{ labels: string[]; level?: string }> = [];
                    const colMap = new Map<string, number[]>();
                    const normalizeLabels = (raw: string | string[]) =>
                        Array.isArray(raw) ? raw : typeof raw === 'string' && raw.includes('|') ? raw.split('|').map(l => l.trim()) : [String(raw)];

                    chainDef.steps.forEach((step, idx) => {
                        if (idx === 0) {
                            const labels = normalizeLabels(step.sourceLabel);
                            labels.forEach(l => { if (!colMap.has(l)) colMap.set(l, []); colMap.get(l)!.push(colSequence.length); });
                            colSequence.push({ labels, level: step.sourceLevel });
                        }
                        const tgtLabels = normalizeLabels(step.targetLabel);
                        tgtLabels.forEach(l => { if (!colMap.has(l)) colMap.set(l, []); colMap.get(l)!.push(colSequence.length); });
                        colSequence.push({ labels: tgtLabels, level: step.targetLevel });
                    });

                    // Assign each node to a column
                    const nodeColMap = new Map<string, number>();
                    for (const node of result.nodes) {
                        const labels = node.labels || [];
                        const level = node.properties?.level as string | undefined;
                        // Assign to canonical column: match by label, and by level if the column specifies one
                        let stepIndex = -1;
                        for (let i = 0; i < colSequence.length; i++) {
                            const colStep = colSequence[i];
                            if (colStep.level && colStep.level !== level) continue;
                            if (colStep.labels.some((l: string) => labels.includes(l))) { stepIndex = i; break; }
                        }
                        nodeColMap.set(node.id, stepIndex);
                    }

                    // Build per-column outgoing/incoming maps
                    const hasOutgoingToCol = new Map<string, Set<number>>();
                    const hasIncomingFromCol = new Map<string, Set<number>>();
                    for (const node of result.nodes) {
                        hasOutgoingToCol.set(node.id, new Set());
                        hasIncomingFromCol.set(node.id, new Set());
                    }
                    for (const link of result.links) {
                        const srcId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
                        const tgtId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
                        const srcCol = srcId ? nodeColMap.get(srcId) : undefined;
                        const tgtCol = tgtId ? nodeColMap.get(tgtId) : undefined;
                        if (srcCol !== undefined && tgtCol !== undefined && srcCol >= 0 && tgtCol >= 0) {
                            hasOutgoingToCol.get(srcId!)?.add(tgtCol);
                            hasIncomingFromCol.get(tgtId!)?.add(srcCol);
                        }
                    }

                    const numCols = colSequence.length;
                    for (const node of result.nodes) {
                        const col = nodeColMap.get(node.id) ?? -1;
                        let diagStatus: string;
                        if (col < 0) {
                            // Node doesn't belong to any column in this chain — not applicable
                            diagStatus = 'connected';
                        } else {
                            const isOrphan = col < numCols - 1 && !(hasOutgoingToCol.get(node.id)?.has(col + 1));
                            const isBastard = col > 0 && !(hasIncomingFromCol.get(node.id)?.has(col - 1));
                            diagStatus = isOrphan ? 'orphan' : isBastard ? 'bastard' : 'connected';
                        }
                        node.properties = { ...node.properties, _diagnosticStatus: diagStatus };
                    }
                } else {
                    // No canonical path — fall back to global incoming/outgoing check
                    const hasOutgoing = new Set<string>();
                    const hasIncoming = new Set<string>();
                    for (const link of result.links) {
                        const srcId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
                        const tgtId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
                        if (srcId) hasOutgoing.add(srcId);
                        if (tgtId) hasIncoming.add(tgtId);
                    }
                    for (const node of result.nodes) {
                        const isSource = hasOutgoing.has(node.id);
                        const isTarget = hasIncoming.has(node.id);
                        let diagStatus: string;
                        if (!isSource && !isTarget) diagStatus = 'orphan';
                        else if (!isSource && isTarget) diagStatus = 'orphan';
                        else if (isSource && !isTarget) diagStatus = 'bastard';
                        else diagStatus = 'connected';
                        node.properties = { ...node.properties, _diagnosticStatus: diagStatus };
                    }
                }
                const orphanCount = result.nodes.filter(n => n.properties._diagnosticStatus === 'orphan').length;
                const bastardCount = result.nodes.filter(n => n.properties._diagnosticStatus === 'bastard').length;
                console.log(`[ExplorerDesk] Diagnostic tagging: ${orphanCount} orphans, ${bastardCount} bastards, chain-aware=${!!chainDef}`);
            }

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

    // Year/quarter filter — keep nodes with year <= selected. No dedup — API returns unique data.
    const filteredData = useMemo(() => {
        const baseData: GraphData | null = (graphData as unknown as GraphData);
        if (!baseData || !baseData.nodes) return null;

        const selectedYear = parseInt(String(year), 10) || 0;
        const quarterNum = quarter && quarter !== 'All'
            ? parseInt(quarter.replace(/\D/g, ''), 10) || null
            : null;

        if (!selectedYear) return baseData; // no filter if year=0

        const nodes = baseData.nodes.filter(n => {
            const props = n.properties || n.nProps || {};
            const nodeYear = typeof props.year === 'object' ? props.year?.low : props.year;
            if (!nodeYear) return true;
            if (Number(nodeYear) < selectedYear) return true;
            if (Number(nodeYear) === selectedYear) {
                if (!quarterNum) return true;
                const nq = props.quarter ?? null;
                const nodeQ = typeof nq === 'number' ? nq : (typeof nq === 'string' ? parseInt(nq.replace(/\D/g, ''), 10) || null : null);
                if (!nodeQ) return true;
                return nodeQ <= quarterNum;
            }
            return false;
        });

        // Prune links that reference nodes removed by the year filter
        const nodeIds = new Set(nodes.map(n => n.id));
        const links = (baseData.links || []).filter((l: any) => {
            const src = typeof l.source === 'object' ? l.source.id : l.source;
            const tgt = typeof l.target === 'object' ? l.target.id : l.target;
            return nodeIds.has(src) && nodeIds.has(tgt);
        });

        console.log(`[ExplorerDesk] Year filter: ${baseData.nodes.length} → ${nodes.length} nodes, ${(baseData.links||[]).length} → ${links.length} links (year=${selectedYear}, Q=${quarterNum})`);
        return { ...baseData, nodes, links };
    }, [graphData, year, quarter]);

    // Inject canonical path metadata for Sankey rendering
    const displayData = useMemo(() => {
        if (!filteredData || !filteredData.nodes) return null;

        if (selectedChain && CANONICAL_PATHS[selectedChain]) {
            const def = CANONICAL_PATHS[selectedChain];
            const canonicalPath: any[] = [];

            def.steps.forEach((step, idx) => {
                if (idx === 0) canonicalPath.push({ type: 'node', label: step.sourceLabel, level: step.sourceLevel });
                canonicalPath.push({ type: 'edge', label: step.relationship });
                canonicalPath.push({ type: 'node', label: step.targetLabel, level: step.targetLevel });
            });

            return {
                ...filteredData,
                metadata: {
                    ...(filteredData.metadata || {}),
                    canonicalPath
                }
            };
        }

        return { ...filteredData, metadata: filteredData.metadata || {} };
    }, [filteredData, selectedChain]);

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

    // Node color function: diagnostic status > label color > palette hash
    const getNodeColor = useCallback((node: any) => {
        const label = node.labels?.[0] || node.label || '';
        const props = node.properties || node.nProps || {};
        const diagStatus = props._diagnosticStatus;
        if (diagStatus === 'orphan') return '#ef4444';    // red — isolated / dead-end
        if (diagStatus === 'bastard') return '#f59e0b';   // amber — appears from nowhere
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
                is3D={is3D}
                hierarchySource={hierarchySource}
                onLabelsChange={setSelectedLabels}
                onRelationshipsChange={setSelectedRelationships}
                onLimitChange={setLimit}
                onQueryTypeChange={handleQueryTypeChange}
                onChainChange={handleChainChange}
                onVizModeChange={(mode: string) => setVizMode(mode as any)}
                onIs3DChange={setIs3D}
                onHierarchySourceChange={setHierarchySource}
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

                    {/* Graph Layouts (sphere, force, hierarchical, circular) */}
                    {displayData && ['sphere', 'force', 'hierarchical', 'circular'].includes(vizMode) && (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <NeoGraph
                                data={displayData}
                                isDark={isDark}
                                language="en"
                                year={year}
                                quarter={quarter}
                                legendConfig={LEGEND_CONFIG}
                                nodeColor={getNodeColor}
                                onNodeClick={setSelectedNode}
                                layoutMode={vizMode as LayoutMode}
                                hierarchySource={hierarchySource}
                                is3D={is3D}
                                isDiagnostic={queryType === 'diagnostic'}
                            />
                            {queryType === 'diagnostic' && (
                                <div style={{
                                    position: 'absolute',
                                    top: 57,
                                    right: 12,
                                    background: isDark ? 'rgba(17,24,39,0.85)' : 'rgba(255,255,255,0.9)',
                                    borderRadius: 8,
                                    padding: '8px 14px',
                                    fontSize: 12,
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: 6,
                                    zIndex: 10,
                                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                        <span style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>Unlinked (dead ends)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                                        <span style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>Unattributed (no source)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sankey */}
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
                            </div>
                        </div>
                    )}

                    {/* Table View */}
                    {displayData && vizMode === 'table' && (
                        <GraphDataTable
                            data={displayData}
                            isDark={isDark}
                            onNodeClick={setSelectedNode}
                        />
                    )}

                    {/* Node Count Badge */}
                    {displayData && (
                        <div className="node-count-badge">
                            {displayData.nodes.length} {t('josoor.common.nodes')}, {displayData.links.length} {t('josoor.common.edges')}
                            {selectedChain && <span className="chain-label">[{isRTL ? (AR_CHAIN_NAMES[selectedChain] ?? selectedChain) : selectedChain}]</span>}
                        </div>
                    )}
                </div>
                {/* Debug tables hidden — kept for future diagnostics */}
                {/* {displayData && <GraphDataTable data={displayData} isDark={isDark} />} */}
            </div>
        </div>
    );
}
