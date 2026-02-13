import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NeoGraph } from '../dashboards/NeoGraph';
import { GraphSankey } from './GraphSankey';
import { GraphDataTable } from './GraphDataTable';
import { CANONICAL_PATHS } from '../../data/canonicalPaths';

// Tooltip now uses createPortal in NeoGraph - no CSS dependency needed

const LABEL_COLORS: Record<string, string> = {
    SectorObjective: '#3b82f6', SectorPolicyTool: '#8b5cf6', SectorAdminRecord: '#06b6d4',
    SectorBusiness: '#f59e0b', SectorCitizen: '#10b981', SectorGovEntity: '#ef4444',
    SectorDataTransaction: '#ec4899', SectorPerformance: '#f97316',
    EntityCapability: '#6366f1', EntityOrgUnit: '#14b8a6', EntityProcess: '#a855f7',
    EntityITSystem: '#0ea5e9', EntityProject: '#84cc16', EntityChangeAdoption: '#e879f9',
    EntityRisk: '#f43f5e', EntityCultureHealth: '#22d3ee', EntityVendor: '#fb923c',
};

const LEGEND_CONFIG = { colors: LABEL_COLORS };

interface ChainDef {
    name: string;
    labels: string[];
    rels?: string[];
    startLabels?: string[];
    endLabels?: string[];
}

const CHAINS: Record<string, ChainDef> = {
    sector_value_chain: {
        name: 'Sector Value Chain',
        labels: ['SectorObjective','SectorPolicyTool','SectorAdminRecord','SectorBusiness','SectorCitizen','SectorGovEntity','SectorDataTransaction','SectorPerformance'],
        rels: ['REALIZED_VIA','REFERS_TO','APPLIED_ON','TRIGGERS_EVENT','MEASURED_BY','AGGREGATES_TO'],
        startLabels: ['SectorObjective'], endLabels: ['SectorPerformance'],
    },
    setting_strategic_initiatives: {
        name: 'Strategic Initiatives',
        labels: ['SectorObjective','SectorPolicyTool','EntityCapability','EntityOrgUnit','EntityProcess','EntityITSystem','EntityProject','EntityChangeAdoption'],
        rels: ['REALIZED_VIA','PARENT_OF','SETS_PRIORITIES','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS','GAPS_SCOPE','ADOPTION_RISKS'],
        startLabels: ['SectorObjective'], endLabels: ['EntityChangeAdoption'],
    },
    setting_strategic_priorities: {
        name: 'Strategic Priorities',
        labels: ['SectorObjective','SectorPerformance','EntityCapability','EntityOrgUnit','EntityProcess','EntityITSystem'],
        rels: ['CASCADED_VIA','PARENT_OF','SETS_TARGETS','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS'],
        startLabels: ['SectorObjective'], endLabels: ['EntityOrgUnit','EntityProcess','EntityITSystem'],
    },
    build_oversight: {
        name: 'Build Oversight',
        labels: ['EntityChangeAdoption','EntityProject','EntityOrgUnit','EntityProcess','EntityITSystem','EntityCapability','EntityRisk','SectorPolicyTool','SectorObjective'],
        rels: ['INCREASE_ADOPTION','CLOSE_GAPS','GAP_STATUS','MONITORED_BY','PARENT_OF','INFORMS','GOVERNED_BY'],
        startLabels: ['EntityChangeAdoption'], endLabels: ['SectorObjective'],
    },
    operate_oversight: {
        name: 'Operate Oversight',
        labels: ['EntityCapability','EntityRisk','SectorPerformance','SectorObjective'],
        rels: ['MONITORED_BY','PARENT_OF','INFORMS','AGGREGATES_TO'],
        startLabels: ['EntityCapability'], endLabels: ['SectorObjective'],
    },
    sustainable_operations: {
        name: 'Sustainable Operations',
        labels: ['EntityCultureHealth','EntityOrgUnit','EntityProcess','EntityITSystem','EntityVendor'],
        rels: ['MONITORS_FOR','APPLY','AUTOMATION','DEPENDS_ON'],
        startLabels: ['EntityCultureHealth'], endLabels: ['EntityVendor'],
    },
    integrated_oversight: {
        name: 'Integrated Oversight',
        labels: ['SectorPolicyTool','EntityCapability','EntityOrgUnit','EntityProcess','EntityITSystem','EntityRisk','SectorPerformance'],
        rels: ['SETS_PRIORITIES','PARENT_OF','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS','MONITORED_BY','INFORMS'],
        startLabels: ['SectorPolicyTool'], endLabels: ['SectorPerformance'],
    }
};

export function ChainTestDesk() {
    const [selectedChain, setSelectedChain] = useState<string>('sector_value_chain');
    const [selectedYear, setSelectedYear] = useState<string>('2025');
    const [queryType, setQueryType] = useState<'narrative' | 'diagnostic'>('diagnostic');
    const [vizMode, setVizMode] = useState<'3d' | 'sankey'>('sankey');
    const [zoom, setZoom] = useState<number>(1);

    const [isDark, setIsDark] = useState<boolean>(() => {
        const attr = document.documentElement.getAttribute('data-theme');
        return attr === 'dark' || attr === null;
    });

    useEffect(() => {
        const updateTheme = () => {
            const attr = document.documentElement.getAttribute('data-theme');
            setIsDark(attr === 'dark' || attr === null);
        };
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    const chainConfig = CHAINS[selectedChain];

    const { data: graphData, isLoading, error } = useQuery({
        queryKey: ['chain-api-v1', selectedChain, selectedYear, queryType],
        queryFn: async () => {
            const isDiag = queryType === 'diagnostic';
            const API_BASE = process.env.REACT_APP_API_URL || 'https://betaBE.aitwintech.com';
            const url = `${API_BASE}/api/v1/chains/${selectedChain}?id=L1&year=${selectedYear}&analyzeGaps=${isDiag}`;

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 503) {
                    const errorText = await response.text();
                    if (errorText.includes('Neo4j unavailable')) {
                        return { nodes: [], links: [] };
                    }
                }
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();

            const apiData = result.results?.[0] || { nodes: [], relationships: [] };

            // Map to expected {nodes, links} format for compatibility
            return {
                nodes: apiData.nodes || [],
                links: (apiData.relationships || []).map((rel: any) => ({
                    source: rel.sourceId || rel.source,
                    target: rel.targetId || rel.target,
                    type: rel.rType || rel.type,
                    rType: rel.rType || rel.type,
                    sourceId: rel.sourceId || rel.source,
                    targetId: rel.targetId || rel.target,
                    value: rel.value || 1,
                    ...rel
                }))
            };
        },
        refetchOnWindowFocus: false
    });

    const displayData = useMemo(() => {
        if (!graphData) return null;
        const pathDef = CANONICAL_PATHS[selectedChain];
        if (pathDef && pathDef.steps.length > 0) {
            const canonicalPath: any[] = [];
            pathDef.steps.forEach((step, idx) => {
                if (idx === 0) canonicalPath.push({ type: 'node', label: step.sourceLabel, level: step.sourceLevel });
                canonicalPath.push({ type: 'edge', label: step.relationship });
                canonicalPath.push({ type: 'node', label: step.targetLabel, level: step.targetLevel });
            });
            return { ...graphData, metadata: { canonicalPath } };
        }
        return { ...graphData, metadata: {} };
    }, [graphData, selectedChain]);

    const stats = displayData ? { nodes: displayData.nodes?.length || 0, links: displayData.links?.length || 0 } : null;
    const hasCanonicalPath = CANONICAL_PATHS[selectedChain]?.steps?.length > 0;

    // Active labels for legend (only show labels present in current chain)
    const activeLabelColors = useMemo(() => {
        const active: Record<string, string> = {};
        for (const l of chainConfig.labels) {
            if (LABEL_COLORS[l]) active[l] = LABEL_COLORS[l];
        }
        return active;
    }, [chainConfig]);

    const selectStyle = { padding: '4px 8px', background: '#1f2937', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '12px' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#0b0f14' }}>
            <div style={{ padding: '6px 16px', borderBottom: '1px solid rgba(212,175,55,0.25)', background: 'rgba(12,16,22,0.92)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <select value={selectedChain} onChange={(e) => setSelectedChain(e.target.value)} style={selectStyle}>
                        {Object.entries(CHAINS).map(([key, c]) => (
                            <option key={key} value={key}>{c.name}</option>
                        ))}
                    </select>

                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={selectStyle}>
                        <option value="0">All Years</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                        <option value="2029">2029</option>
                    </select>

                    <select value={queryType} onChange={(e) => setQueryType(e.target.value as any)} style={selectStyle}>
                        <option value="narrative">Complete</option>
                        <option value="diagnostic">Diagnostic</option>
                    </select>

                    <div style={{ display: 'flex' }}>
                        <button onClick={() => setVizMode('3d')}
                            style={{ padding: '4px 12px', background: vizMode === '3d' ? '#3b82f6' : 'transparent', color: vizMode === '3d' ? '#fff' : '#9ca3af', border: '1px solid #444', borderRadius: '4px 0 0 4px', cursor: 'pointer', fontSize: '11px' }}>3D</button>
                        <button onClick={() => setVizMode('sankey')}
                            style={{ padding: '4px 12px', background: vizMode === 'sankey' ? '#3b82f6' : 'transparent', color: vizMode === 'sankey' ? '#fff' : '#9ca3af', border: '1px solid #444', borderLeft: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontSize: '11px' }}>Sankey</button>
                    </div>

                    {stats && <span style={{ fontSize: '11px', color: '#9ca3af' }}>{stats.nodes} nodes | {stats.links} links</span>}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                            style={{ padding: '2px 8px', background: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>-</button>
                        <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                            style={{ padding: '2px 8px', background: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>+</button>
                    </div>

                    <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 600, marginLeft: 'auto' }}>BACKEND API</span>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '8px' }}>
                        {Object.entries(activeLabelColors).map(([label, color]) => (
                            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: '#9ca3af' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                {label.replace('Sector', '').replace('Entity', '')}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0 }}>
                <div style={{ minHeight: '500px', position: 'relative', width: `${zoom * 100}%`, minWidth: '100%' }}>
                    {(isLoading || error || !displayData) && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: isDark ? '#fff' : '#000' }}>
                            {isLoading && <div>Loading...</div>}
                            {error && <div style={{ color: '#ef4444' }}>Error: {String(error)}</div>}
                            {!displayData && !isLoading && !error && <div>Select chain and year to load data</div>}
                        </div>
                    )}

                    {displayData && vizMode === 'sankey' && hasCanonicalPath && (
                        <GraphSankey data={displayData} isDark={isDark} chain={selectedChain} metadata={displayData.metadata} isDiagnostic={queryType === 'diagnostic'} />
                    )}
                    {displayData && vizMode === 'sankey' && !hasCanonicalPath && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#9ca3af' }}>
                            <div>Sankey not available for {chainConfig.name}</div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>This chain has a branching structure. Use 3D view instead.</div>
                        </div>
                    )}
                    {displayData && vizMode === '3d' && (
                        <div style={{ width: '100%', height: '600px' }}>
                        <NeoGraph data={displayData} isDark={isDark} language="en" year={selectedYear} quarter="All"
                            legendConfig={LEGEND_CONFIG}
                            nodeColor={(node: any) => {
                                const label = node.labels?.[0] || node.label || '';
                                const status = node.properties?.status || node.nProps?.status;
                                if (status === 'critical') return '#ef4444';
                                if (status === 'orphan' || status === 'bastard') return '#f59e0b';
                                return LABEL_COLORS[label] || '#D4AF37';
                            }}
                        />
                        </div>
                    )}
                </div>
            </div>

            {displayData && (
                <div style={{ maxHeight: '180px', overflow: 'auto', flexShrink: 0, borderTop: '1px solid rgba(212,175,55,0.25)' }}>
                    <GraphDataTable data={displayData} isDark={isDark} />
                </div>
            )}
        </div>
    );
}