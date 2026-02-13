import React, { useState, useEffect, useMemo } from 'react';
import { NeoGraph } from '../dashboards/NeoGraph';
import { GraphSankey } from './GraphSankey';
import { GraphDataTable } from './GraphDataTable';
import { CANONICAL_PATHS } from '../../data/canonicalPaths';
import { useQuery } from '@tanstack/react-query';
// Tooltip now uses createPortal in NeoGraph - no CSS dependency needed

const STAGING_URL = 'http://localhost:7475';
const STAGING_AUTH = btoa('neo4j:stagingpassword');

const LABEL_COLORS: Record<string, string> = {
    SectorObjective: '#3b82f6', SectorPolicyTool: '#8b5cf6', SectorAdminRecord: '#06b6d4',
    SectorBusiness: '#f59e0b', SectorCitizen: '#10b981', SectorGovEntity: '#ef4444',
    SectorDataTransaction: '#ec4899', SectorPerformance: '#f97316',
    EntityCapability: '#6366f1', EntityOrgUnit: '#14b8a6', EntityProcess: '#a855f7',
    EntityITSystem: '#0ea5e9', EntityProject: '#84cc16', EntityChangeAdoption: '#e879f9',
    EntityRisk: '#f43f5e', EntityCultureHealth: '#22d3ee', EntityVendor: '#fb923c',
};

const LEGEND_CONFIG = { colors: LABEL_COLORS };

const RET = `elementId(n) AS nId, labels(n) AS nLabels,
{id: n.id, kpi_id: n.kpi_id, code: n.code, name: n.name, year: n.year, level: n.level} AS nProps,
type(r) AS rType, {} AS rProps,
elementId(startNode(r)) AS sourceId, elementId(endNode(r)) AS targetId`;

const DRET = `elementId(n) AS nId, labels(n) AS nLabels,
{id: n.id, kpi_id: n.kpi_id, code: n.code, name: n.name, year: n.year, level: n.level} AS nProps,
CASE WHEN r IS NOT NULL THEN type(r) ELSE null END AS rType, {} AS rProps,
CASE WHEN r IS NOT NULL THEN elementId(n) ELSE null END AS sourceId,
CASE WHEN r IS NOT NULL THEN elementId(m) ELSE null END AS targetId`;

const YF = `($year = '0' OR toInteger(root.year) = toInteger($year))`;
const YFN = `($year = '0' OR toInteger(n.year) = toInteger($year))`;

interface ChainDef {
    name: string;
    labels: string[];
    rels: string[];
    startLabels: string[];
    endLabels: string[];
    narrativeQuery: string;
    diagnosticQuery?: string;
}

function autoDiag(c: ChainDef): string {
    const lf = c.labels.map(l => `n:${l}`).join(' OR ');
    const tf = c.labels.map(l => `m:${l}`).join(' OR ');
    const rf = c.rels.map(r => `'${r}'`).join(',');
    return `MATCH (n) WHERE (${lf}) AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m) WHERE type(r) IN [${rf}] AND (${tf})
RETURN DISTINCT ${DRET}`;
}

const CHAINS: Record<string, ChainDef> = {
    sector_value_chain: {
        name: 'Sector Value Chain',
        labels: ['SectorObjective','SectorPolicyTool','SectorAdminRecord','SectorBusiness','SectorCitizen','SectorGovEntity','SectorDataTransaction','SectorPerformance'],
        rels: ['REALIZED_VIA','REFERS_TO','APPLIED_ON','TRIGGERS_EVENT','MEASURED_BY','AGGREGATES_TO'],
        startLabels: ['SectorObjective'], endLabels: ['SectorPerformance'],
        narrativeQuery: `MATCH path = (root:SectorObjective {level:'L1'})-[:REALIZED_VIA]->(pol:SectorPolicyTool {level:'L1'})-[:REFERS_TO]->(rec:SectorAdminRecord {level:'L1'})-[:APPLIED_ON]->(stake {level:'L1'})-[:TRIGGERS_EVENT]->(txn:SectorDataTransaction {level:'L1'})-[:MEASURED_BY]->(perf:SectorPerformance {level:'L1'})-[:AGGREGATES_TO]->(root)
WHERE (stake:SectorBusiness OR stake:SectorCitizen OR stake:SectorGovEntity) AND ${YF}
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT ${RET}`,
        diagnosticQuery: `MATCH (n {level: 'L1'})
WHERE (n:SectorObjective OR n:SectorPolicyTool OR n:SectorAdminRecord OR n:SectorBusiness OR n:SectorCitizen OR n:SectorGovEntity OR n:SectorDataTransaction OR n:SectorPerformance) AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m {level: 'L1'})
WHERE type(r) IN ['REALIZED_VIA','REFERS_TO','APPLIED_ON','TRIGGERS_EVENT','MEASURED_BY','AGGREGATES_TO']
AND (m:SectorObjective OR m:SectorPolicyTool OR m:SectorAdminRecord OR m:SectorBusiness OR m:SectorCitizen OR m:SectorGovEntity OR m:SectorDataTransaction OR m:SectorPerformance)
RETURN DISTINCT ${DRET}`
    },
    setting_strategic_initiatives: {
        name: 'Strategic Initiatives',
        labels: ['SectorObjective','SectorPolicyTool','EntityCapability','EntityOrgUnit','EntityProcess','EntityITSystem','EntityProject','EntityChangeAdoption'],
        rels: ['REALIZED_VIA','PARENT_OF','SETS_PRIORITIES','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS','GAPS_SCOPE','ADOPTION_RISKS'],
        startLabels: ['SectorObjective'], endLabels: ['EntityChangeAdoption'],
        narrativeQuery: `MATCH path = (root:SectorObjective {level:'L1'})-[:REALIZED_VIA]->(polL1:SectorPolicyTool {level:'L1'})-[:PARENT_OF*0..1]->(polL2:SectorPolicyTool {level:'L2'})-[:SETS_PRIORITIES]->(capL2:EntityCapability {level:'L2'})-[:PARENT_OF*0..1]->(capL3:EntityCapability {level:'L3'})-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {level:'L3'})-[:GAPS_SCOPE]->(proj:EntityProject {level:'L3'})-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption {level:'L3'})
WHERE ${YF}
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT ${RET}`,
        diagnosticQuery: `MATCH (n)
WHERE (
    (n:SectorObjective AND n.level = 'L1') OR
    (n:SectorPolicyTool AND n.level IN ['L1','L2']) OR
    (n:EntityCapability AND n.level IN ['L2','L3']) OR
    (n:EntityOrgUnit AND n.level = 'L3') OR
    (n:EntityProcess AND n.level = 'L3') OR
    (n:EntityITSystem AND n.level = 'L3') OR
    (n:EntityProject AND n.level = 'L3') OR
    (n:EntityChangeAdoption AND n.level = 'L3')
)
AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m)
WHERE type(r) IN ['REALIZED_VIA','PARENT_OF','SETS_PRIORITIES','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS','GAPS_SCOPE','ADOPTION_RISKS']
AND (
    (m:SectorObjective AND m.level = 'L1') OR
    (m:SectorPolicyTool AND m.level IN ['L1','L2']) OR
    (m:EntityCapability AND m.level IN ['L2','L3']) OR
    (m:EntityOrgUnit AND m.level = 'L3') OR
    (m:EntityProcess AND m.level = 'L3') OR
    (m:EntityITSystem AND m.level = 'L3') OR
    (m:EntityProject AND m.level = 'L3') OR
    (m:EntityChangeAdoption AND m.level = 'L3')
)
RETURN DISTINCT ${DRET}`
    },
    setting_strategic_priorities: {
        name: 'Strategic Priorities',
        labels: ['SectorObjective','SectorPerformance','EntityCapability','EntityOrgUnit','EntityProcess','EntityITSystem'],
        rels: ['CASCADED_VIA','PARENT_OF','SETS_TARGETS','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS'],
        startLabels: ['SectorObjective'], endLabels: ['EntityOrgUnit','EntityProcess','EntityITSystem'],
        narrativeQuery: `MATCH path = (root:SectorObjective {level:'L1'})-[:CASCADED_VIA]->(perfL1:SectorPerformance {level:'L1'})-[:PARENT_OF*0..1]->(perfL2:SectorPerformance {level:'L2'})-[:SETS_TARGETS]->(capL2:EntityCapability {level:'L2'})-[:PARENT_OF*0..1]->(capL3:EntityCapability {level:'L3'})-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {level:'L3'})
WHERE ${YF}
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT ${RET}`,
        diagnosticQuery: `MATCH (n)
WHERE (
    (n:SectorObjective AND n.level = 'L1') OR
    (n:SectorPerformance AND n.level IN ['L1','L2']) OR
    (n:EntityCapability AND n.level IN ['L2','L3']) OR
    (n:EntityOrgUnit AND n.level = 'L3') OR
    (n:EntityProcess AND n.level = 'L3') OR
    (n:EntityITSystem AND n.level = 'L3')
)
AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m)
WHERE type(r) IN ['CASCADED_VIA','PARENT_OF','SETS_TARGETS','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS']
AND (
    (m:SectorObjective AND m.level = 'L1') OR
    (m:SectorPerformance AND m.level IN ['L1','L2']) OR
    (m:EntityCapability AND m.level IN ['L2','L3']) OR
    (m:EntityOrgUnit AND m.level = 'L3') OR
    (m:EntityProcess AND m.level = 'L3') OR
    (m:EntityITSystem AND m.level = 'L3')
)
RETURN DISTINCT ${DRET}`
    },
    build_oversight: {
        name: 'Build Oversight',
        labels: ['EntityChangeAdoption','EntityProject','EntityOrgUnit','EntityProcess','EntityITSystem','EntityCapability','EntityRisk','SectorPolicyTool','SectorObjective'],
        rels: ['INCREASE_ADOPTION','CLOSE_GAPS','GAP_STATUS','MONITORED_BY','PARENT_OF','INFORMS','GOVERNED_BY'],
        startLabels: ['EntityChangeAdoption'], endLabels: ['SectorObjective'],
        narrativeQuery: `MATCH (root:EntityChangeAdoption {level:'L3'}) WHERE ${YF}
MATCH path = (root)-[:INCREASE_ADOPTION]->(proj:EntityProject {level:'L3'})-[:CLOSE_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {level:'L3'})-[:GAP_STATUS]->(capL3:EntityCapability {level:'L3'})-[:MONITORED_BY]->(riskL3:EntityRisk {level:'L3'})<-[:PARENT_OF]-(riskL2:EntityRisk {level:'L2'})-[:INFORMS]->(polL2:SectorPolicyTool {level:'L2'})<-[:PARENT_OF*0..1]-(polL1:SectorPolicyTool {level:'L1'})-[:GOVERNED_BY]->(objL1:SectorObjective {level:'L1'})
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT ${RET}`,
        diagnosticQuery: `MATCH (n)
WHERE (
    (n:EntityChangeAdoption AND n.level = 'L3') OR
    (n:EntityProject AND n.level = 'L3') OR
    (n:EntityOrgUnit AND n.level = 'L3') OR
    (n:EntityProcess AND n.level = 'L3') OR
    (n:EntityITSystem AND n.level = 'L3') OR
    (n:EntityCapability AND n.level = 'L3') OR
    (n:EntityRisk AND n.level IN ['L2','L3']) OR
    (n:SectorPolicyTool AND n.level IN ['L1','L2']) OR
    (n:SectorObjective AND n.level = 'L1')
)
AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m)
WHERE type(r) IN ['INCREASE_ADOPTION','CLOSE_GAPS','GAP_STATUS','MONITORED_BY','PARENT_OF','INFORMS','GOVERNED_BY']
AND (
    (m:EntityChangeAdoption AND m.level = 'L3') OR
    (m:EntityProject AND m.level = 'L3') OR
    (m:EntityOrgUnit AND m.level = 'L3') OR
    (m:EntityProcess AND m.level = 'L3') OR
    (m:EntityITSystem AND m.level = 'L3') OR
    (m:EntityCapability AND m.level = 'L3') OR
    (m:EntityRisk AND m.level IN ['L2','L3']) OR
    (m:SectorPolicyTool AND m.level IN ['L1','L2']) OR
    (m:SectorObjective AND m.level = 'L1')
)
RETURN DISTINCT ${DRET}`
    },
    operate_oversight: {
        name: 'Operate Oversight',
        labels: ['EntityCapability','EntityRisk','SectorPerformance','SectorObjective'],
        rels: ['MONITORED_BY','PARENT_OF','INFORMS','AGGREGATES_TO'],
        startLabels: ['EntityCapability'], endLabels: ['SectorObjective'],
        narrativeQuery: `MATCH (root:EntityCapability {level:'L3'}) WHERE ${YF}
MATCH path = (root)-[:MONITORED_BY]->(riskL3:EntityRisk {level:'L3'})<-[:PARENT_OF]-(riskL2:EntityRisk {level:'L2'})-[:INFORMS]->(perfL2:SectorPerformance {level:'L2'})<-[:PARENT_OF]-(perfL1:SectorPerformance {level:'L1'})-[:AGGREGATES_TO]->(objL1:SectorObjective {level:'L1'})
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT ${RET}`,
        diagnosticQuery: `MATCH (n)
WHERE (
    (n:EntityCapability AND n.level = 'L3') OR
    (n:EntityRisk AND n.level IN ['L2','L3']) OR
    (n:SectorPerformance AND n.level IN ['L1','L2']) OR
    (n:SectorObjective AND n.level = 'L1')
)
AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m)
WHERE type(r) IN ['MONITORED_BY','PARENT_OF','INFORMS','AGGREGATES_TO']
AND (
    (m:EntityCapability AND m.level = 'L3') OR
    (m:EntityRisk AND m.level IN ['L2','L3']) OR
    (m:SectorPerformance AND m.level IN ['L1','L2']) OR
    (m:SectorObjective AND m.level = 'L1')
)
RETURN DISTINCT ${DRET}`
    },
    sustainable_operations: {
        name: 'Sustainable Operations',
        labels: ['EntityCultureHealth','EntityOrgUnit','EntityProcess','EntityITSystem','EntityVendor'],
        rels: ['MONITORS_FOR','APPLY','AUTOMATION','DEPENDS_ON'],
        startLabels: ['EntityCultureHealth'], endLabels: ['EntityVendor'],
        narrativeQuery: `MATCH (root:EntityCultureHealth {level:'L3'}) WHERE ${YF}
MATCH path = (root)-[:MONITORS_FOR]->(org:EntityOrgUnit {level:'L3'})-[:APPLY]->(proc:EntityProcess {level:'L3'})-[:AUTOMATION]->(sys:EntityITSystem {level:'L3'})-[:DEPENDS_ON]->(vendor:EntityVendor {level:'L3'})
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT ${RET}`,
        diagnosticQuery: `MATCH (n)
WHERE (
    n:EntityCultureHealth OR
    n:EntityOrgUnit OR
    n:EntityProcess OR
    n:EntityITSystem OR
    n:EntityVendor
)
AND n.level = 'L3'
AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m)
WHERE type(r) IN ['MONITORS_FOR','APPLY','AUTOMATION','DEPENDS_ON']
AND (
    m:EntityCultureHealth OR
    m:EntityOrgUnit OR
    m:EntityProcess OR
    m:EntityITSystem OR
    m:EntityVendor
)
AND m.level = 'L3'
RETURN DISTINCT ${DRET}`
    },
    integrated_oversight: {
        name: 'Integrated Oversight',
        labels: ['SectorPolicyTool','EntityCapability','EntityOrgUnit','EntityProcess','EntityITSystem','EntityRisk','SectorPerformance'],
        rels: ['SETS_PRIORITIES','PARENT_OF','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS','MONITORED_BY','INFORMS'],
        startLabels: ['SectorPolicyTool'], endLabels: ['SectorPerformance'],
        narrativeQuery: `MATCH (root:SectorPolicyTool {level:'L2'}) WHERE ${YF}
MATCH p1 = (root)-[:SETS_PRIORITIES]->(capL2:EntityCapability {level:'L2'})
MATCH p2 = (capL2)-[:PARENT_OF*0..1]->(capL3:EntityCapability {level:'L3'})
MATCH p3 = (capL3)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {level:'L3'})
MATCH p4 = (capL3)<-[:MONITORED_BY]-(riskL3:EntityRisk {level:'L3'})
MATCH p5 = (riskL3)<-[:PARENT_OF*0..1]-(riskL2:EntityRisk {level:'L2'})
MATCH p6 = (riskL2)-[:INFORMS]->(perfL2:SectorPerformance {level:'L2'})
WITH [p1,p2,p3,p4,p5,p6] AS paths UNWIND paths AS path
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT ${RET}`,
        diagnosticQuery: `MATCH (n)
WHERE (
    (n:SectorPolicyTool AND n.level = 'L2') OR
    (n:EntityCapability AND n.level IN ['L2','L3']) OR
    (n:EntityOrgUnit AND n.level = 'L3') OR
    (n:EntityProcess AND n.level = 'L3') OR
    (n:EntityITSystem AND n.level = 'L3') OR
    (n:EntityRisk AND n.level IN ['L2','L3']) OR
    (n:SectorPerformance AND n.level = 'L2')
)
AND ${YFN}
OPTIONAL MATCH (n)-[r]->(m)
WHERE type(r) IN ['SETS_PRIORITIES','PARENT_OF','ROLE_GAPS','KNOWLEDGE_GAPS','AUTOMATION_GAPS','MONITORED_BY','INFORMS']
AND (
    (m:SectorPolicyTool AND m.level = 'L2') OR
    (m:EntityCapability AND m.level IN ['L2','L3']) OR
    (m:EntityOrgUnit AND m.level = 'L3') OR
    (m:EntityProcess AND m.level = 'L3') OR
    (m:EntityITSystem AND m.level = 'L3') OR
    (m:EntityRisk AND m.level IN ['L2','L3']) OR
    (m:SectorPerformance AND m.level = 'L2')
)
RETURN DISTINCT ${DRET}`
    }
};

const transformToGraphData = (records: any[], isDiagnostic: boolean, chainKey: string) => {
    const nodesMap = new Map();
    const linksSet = new Set<string>();
    const validLinks: any[] = [];
    const config = CHAINS[chainKey];

    for (const record of records) {
        const nId = record.nId;
        const labels = record.nLabels || [];
        const props = record.nProps || {};
        if (nId && !nodesMap.has(nId)) {
            const displayId = props.id || props.kpi_id || props.code || null;
            const displayName = props.name || nId;
            nodesMap.set(nId, {
                id: nId, nId, labels, nLabels: labels,
                label: labels[0] || 'Unknown',
                name: displayId ? `${displayId}: ${displayName}` : displayName,
                properties: props, nProps: props, val: 1
            });
        }
    }

    for (const record of records) {
        const { sourceId, targetId, rType } = record;
        if (sourceId && targetId && rType) {
            const linkKey = `${sourceId}-${rType}-${targetId}`;
            if (!linksSet.has(linkKey) && nodesMap.has(sourceId) && nodesMap.has(targetId)) {
                linksSet.add(linkKey);
                validLinks.push({ source: sourceId, sourceId, target: targetId, targetId, type: rType, rType, value: 1 });
            }
        }
    }

    const nodes = Array.from(nodesMap.values());
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    const safeLinks = validLinks.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

    if (isDiagnostic && config) {
        // Use connection-based check: a node is connected if it appears as source OR target
        // This avoids false orphans/bastards when relationships are traversed in reverse
        // (e.g. PARENT_OF goes L2→L3 in data but chain flows L3→L2 visually)
        const hasAnyConnection = new Set<string>();
        safeLinks.forEach((l: any) => { hasAnyConnection.add(l.source); hasAnyConnection.add(l.target); });
        for (const node of nodes) {
            if (!hasAnyConnection.has(node.id)) {
                node.nProps = { ...node.nProps, status: 'critical' };
                node.properties = node.nProps;
            }
        }
    }

    return { nodes, links: safeLinks };
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
        queryKey: ['chain-test-staging', selectedChain, selectedYear, queryType],
        queryFn: async () => {
            const isDiag = queryType === 'diagnostic';
            const query = isDiag
                ? (chainConfig.diagnosticQuery || autoDiag(chainConfig))
                : chainConfig.narrativeQuery;

            const response = await fetch(`${STAGING_URL}/db/neo4j/tx/commit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${STAGING_AUTH}` },
                body: JSON.stringify({ statements: [{ statement: query, parameters: { year: selectedYear } }] })
            });

            if (!response.ok) throw new Error(`Neo4j error: ${response.status}`);
            const result = await response.json();
            if (result.errors?.length > 0) throw new Error(result.errors[0].message);

            const records = result.results?.[0]?.data?.map((row: any) => {
                const cols = result.results[0].columns;
                const record: any = {};
                cols.forEach((col: string, idx: number) => { record[col] = row.row[idx]; });
                return record;
            }) || [];

            return transformToGraphData(records, isDiag, selectedChain);
        },
        enabled: true,
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

                    <span style={{ fontSize: '9px', color: '#d97706', fontWeight: 600, marginLeft: 'auto' }}>LOCAL STAGING</span>

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
