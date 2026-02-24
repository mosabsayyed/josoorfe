import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ExpandableNodeList } from './GraphSankeyExpanded';

interface Node {
    id: string; // Internal Index
    name: string;
    nameDisplay: string;
    originalId: string;
    labels: string[];
    properties: any;
    color: string;
    isBroken: boolean;
    isVirtual: boolean;
    stepIndex: number; // 0..N
    entityTypeSubHeader?: string;
    sortId?: number;
    sortIdRaw?: string | null;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    column?: number;
    // Aggregation fields
    isAggregate?: boolean;
    aggregateCount?: number;
    aggregateMembers?: string[]; // original IDs of grouped nodes
    primaryLabel?: string;
    level?: string;
}

interface GraphSankeyProps {
    data: { nodes: any[]; links: any[] };
    metadata?: { canonicalPath?: Array<{ type: 'node' | 'edge'; label: string | string[]; level?: string }> };
    isDark?: boolean;
    chain?: string | null;
    isDiagnostic?: boolean;
}

// Helper for ID extraction and Normalization
const getSafeId = (val: any): string => {
    if (val === undefined || val === null) return '';
    let s = String(val);

    if (typeof val === 'object') {
        if (typeof val.toNumber === 'function') s = String(val.toNumber());
        else if (val.low !== undefined) s = String(val.low);
        else if (val.id !== undefined) s = String(val.id);
        else if (val.identity !== undefined) s = String(val.identity);
        else if (val.elementId !== undefined) s = String(val.elementId);
    }

    // Normalize Float Strings ('1.0' -> '1') to fix link mismatches common in Neo4j/JSON
    if (s.endsWith('.0')) s = s.slice(0, -2);
    return s;
};

export function GraphSankey({ data, isDark = true, chain, metadata, isDiagnostic = false }: GraphSankeyProps) {
    const { t } = useTranslation();
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const isRTL = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';

    const getColumnDisplayLabel = (labelRaw: any, level?: string) => {
        let labels: string[] = [];
        if (Array.isArray(labelRaw)) {
            labels = labelRaw;
        } else if (typeof labelRaw === 'string' && labelRaw.includes('|')) {
            labels = labelRaw.split('|').map((l: string) => l.trim());
        } else if (labelRaw) {
            labels = [String(labelRaw)];
        }

        const labelSet = new Set(labels);
        const isEntityOps = labelSet.size === 3
            && labelSet.has('EntityOrgUnit')
            && labelSet.has('EntityProcess')
            && labelSet.has('EntityITSystem');
        const isSectorStakeholders = labelSet.size === 3
            && labelSet.has('SectorCitizen')
            && labelSet.has('SectorGovEntity')
            && labelSet.has('SectorBusiness');

        let rawLabel = labels.join(' & ');
        if (isEntityOps) rawLabel = 'Entity[operations]';
        if (isSectorStakeholders) rawLabel = 'Sector[stakeholders]';
        if (level) rawLabel = `${rawLabel} (${level})`;

        return rawLabel.replace(/([A-Z])/g, ' $1').trim();
    };

    const getDisplayId = (props: any): string | null => {
        const raw =
            props?.id ??
            props?.ID ??
            props?.code ??
            props?.Code ??
            props?.kpi_id ??
            props?.kpiId ??
            props?.node_id ??
            props?.nodeId ??
            null;
        if (raw === null || raw === undefined) return null;
        const s = String(raw).trim();
        return /^\d+(\.\d+)*$/.test(s) ? s : null;
    };

    const getLinkEndpointId = (val: any): string => {
        if (val && typeof val === 'object') {
            return getSafeId(val.originalId ?? val.nId ?? val.id ?? val.identity ?? val.elementId ?? val);
        }
        return getSafeId(val);
    };

    const normalizeRelType = (val: any): string => {
        if (val === undefined || val === null) return '';
        return String(val)
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9_]/g, '_')
            .replace(/_+/g, '_');
    };

    // 1. Parse Metadata for Columns
    const columns = useMemo(() => {
        if (!metadata?.canonicalPath) return [];
        return metadata.canonicalPath.filter(step => step.type === 'node');
    }, [metadata]);

    // 2. Process Data & Layout — proper Sankey: node height ∝ throughput, links are thick bands
    const layout = useMemo(() => {
        if (!data?.nodes?.length || columns.length === 0) return null;

        const width = containerRef.current?.offsetWidth || 1200;
        const padding = { top: 36, right: 16, bottom: 28, left: 16 };
        const availableWidth = width - padding.left - padding.right;
        const UNIT_HEIGHT = 4; // height per connection thread — thin for 1, visibly thicker for many
        const NODE_GAP = 14; // vertical gap between nodes in a column
        const MIN_NODE_HEIGHT = 40; // minimum node rect height (ensures text fits)

        // Ping-pong: always 2 visual columns (LEFT / RIGHT), N rows
        const colWidth = Math.max(140, Math.min(220, availableWidth * 0.3));
        const colSpacing = availableWidth - 2 * colWidth; // gap between left and right columns
        const LEFT_X = padding.left;
        const RIGHT_X = padding.left + colWidth + colSpacing;

        const normalizeLabels = (labelRaw: any): string[] => {
            if (Array.isArray(labelRaw)) return labelRaw.map(String);
            if (typeof labelRaw === 'string' && labelRaw.includes('|')) {
                return labelRaw.split('|').map((l: string) => l.trim());
            }
            if (labelRaw) return [String(labelRaw)];
            return [];
        };

        // Map Columns (Step Index)
        // NOTE: canonicalPath labels can be pipe-separated strings like 'EntityOrgUnit|EntityProcess|EntityITSystem'
        const colMap = new Map<string, number[]>();
        const colSequence: Array<{ labels: string[]; level?: string }> = [];
        const pushCol = (label: string, idx: number) => {
            if (!colMap.has(label)) colMap.set(label, []);
            colMap.get(label)!.push(idx);
        };
        columns.forEach((colStep: any, i: number) => {
            const labels = normalizeLabels(colStep.label);
            labels.forEach((label) => pushCol(label, i));
            colSequence.push({ labels, level: colStep.level });
        });

        // Allowed edge types by adjacent columns (canonical only)
        const edgeMap = new Map<string, Set<string>>();
        if (metadata?.canonicalPath?.length) {
            let nodeIndex = -1;
            metadata.canonicalPath.forEach(step => {
                if (step.type === 'node') {
                    nodeIndex += 1;
                    return;
                }
                if (step.type !== 'edge') return;
                const srcIndex = nodeIndex;
                const tgtIndex = nodeIndex + 1;
                if (srcIndex < 0) return;
                const key = `${srcIndex}->${tgtIndex}`;
                if (!edgeMap.has(key)) edgeMap.set(key, new Set());
                const raw = step.label;
                const labels = typeof raw === 'string' && raw.includes('|')
                    ? raw.split('|').map((l: string) => l.trim())
                    : [String(raw)];
                labels.forEach(l => edgeMap.get(key)!.add(normalizeRelType(l)));
            });
        }
        const hasEdgeMap = edgeMap.size > 0;

        // Process Nodes
        let nodes: Node[] = data.nodes.map(n => {
            const props = n.nProps || n.properties || {};
            const id = getSafeId(n.nId ?? n.id ?? n.identity ?? n.elementId);
            const labels = (n.nLabels || n.labels || []).filter((l: any) => l);
            const level = props.level as string | undefined;
            const displayId = getDisplayId(props);
            const baseName = props.name || props.title || props.label || labels[0] || 'Unknown';
            const baseNameStr = String(baseName);
            const alreadyPrefixed = displayId ? baseNameStr.trim().startsWith(`${displayId}`) : false;
            const nameDisplay = displayId
                ? (alreadyPrefixed ? baseNameStr : `${displayId}: ${baseNameStr}`)
                : baseNameStr;
            const sortId = displayId ? parseFloat(displayId) : NaN;

            // Assign Column
            let stepIndex = -1;
            if (level) {
                for (let i = 0; i < colSequence.length; i += 1) {
                    const colStep = colSequence[i];
                    if (colStep.level !== level) continue;
                    if (colStep.labels.some(label => labels.includes(label))) {
                        stepIndex = i;
                        break;
                    }
                }
            }
            if (stepIndex === -1) {
                const colLabel = labels.find((l: string) => colMap.has(l));
                stepIndex = colLabel ? colMap.get(colLabel)![0] : -1;
            }

            const isBroken = isDiagnostic && props.status === 'critical';
            const isOrphanOrBastard = isDiagnostic && (props.status === 'orphan' || props.status === 'bastard');
            const isVirtual = props.virtual === true;

            // Simple: one color for normal, red for broken (diagnostic)
            const nodeColor = isBroken ? '#ef4444' : (isDark ? '#1F2937' : '#FFFFFF');

            return {
                id,
                originalId: id,
                name: baseName,
                labels,
                properties: props,
                color: nodeColor,
                isBroken: isBroken || isOrphanOrBastard,
                isVirtual,
                stepIndex,
                nameDisplay,
                sortId,
                sortIdRaw: displayId
            };
        }).filter(n => n.stepIndex !== -1 || n.isBroken); // Include broken nodes even if no step index found

        // Post-process: Assign broken nodes to a "Gap" column (last column + 1) or nearest neighbor
        const gapColumnIndex = columns.length;
        nodes.forEach(n => {
            if (n.stepIndex === -1 && n.isBroken) {
                n.stepIndex = gapColumnIndex;
                n.column = gapColumnIndex;
                n.nameDisplay = `[GAP] ${n.nameDisplay}`;
            }
        });

        // --- Client-side node aggregation ---
        // If backend already sent pre-aggregated nodes (v5 format with nProps.count), skip aggregation.
        const isPreAggregated = nodes.some(n => n.properties?.count != null && typeof n.properties.count === 'number');

        // Map from original individual node ID → aggregate node ID (used to remap links)
        const individualToAggregateMap = new Map<string, string>();

        if (!isPreAggregated && nodes.length > 0) {
            // Group by (primaryLabel, level, stepIndex)
            const aggGroups = new Map<string, Node[]>();
            nodes.forEach(n => {
                const pLabel = n.labels[0] || 'Unknown';
                const lvl = n.properties?.level || 'none';
                const key = `${pLabel}__${lvl}__col${n.stepIndex}`;
                if (!aggGroups.has(key)) aggGroups.set(key, []);
                aggGroups.get(key)!.push(n);
            });

            // Only aggregate if there are enough nodes to warrant it (> 3 per group on average)
            const totalGroups = aggGroups.size;
            const shouldAggregate = totalGroups > 0 && (nodes.length / totalGroups) > 2;

            if (shouldAggregate) {
                const aggregatedNodes: Node[] = [];
                aggGroups.forEach((members, key) => {
                    const first = members[0];
                    const pLabel = first.labels[0] || 'Unknown';
                    const lvl = first.properties?.level || '';
                    const displayName = pLabel.replace(/^(Sector|Entity)/, '').replace(/([A-Z])/g, ' $1').trim();
                    const aggId = key; // e.g. "EntityRisk__L3__col4"

                    // Record mapping for each member
                    members.forEach(m => individualToAggregateMap.set(m.originalId, aggId));

                    // Pick color from first member (all same label → same color)
                    const hasBroken = members.some(m => m.isBroken);
                    const hasVirtual = members.some(m => m.isVirtual);

                    // Collect sample IDs for tooltip
                    const sampleIds = members
                        .map(m => m.sortIdRaw || m.originalId)
                        .slice(0, 5);

                    aggregatedNodes.push({
                        id: aggId,
                        originalId: aggId,
                        name: displayName,
                        nameDisplay: lvl ? `${displayName} (${lvl})` : displayName,
                        labels: first.labels,
                        properties: {
                            level: lvl,
                            count: members.length,
                            sampleIds,
                        },
                        color: first.color,
                        isBroken: hasBroken,
                        isVirtual: hasVirtual,
                        stepIndex: first.stepIndex,
                        sortId: first.sortId,
                        sortIdRaw: first.sortIdRaw,
                        isAggregate: true,
                        aggregateCount: members.length,
                        aggregateMembers: members.map(m => m.originalId),
                        primaryLabel: pLabel,
                        level: lvl || undefined,
                        entityTypeSubHeader: first.entityTypeSubHeader,
                    });
                });
                nodes = aggregatedNodes;
            }
        }

        // If canonical path loops back to same label, clone last column for visibility
        const firstCol = columns[0];
        const lastCol = columns[columns.length - 1];
        const getFirstLabel = (col: any) => normalizeLabels(col?.label)[0] ?? null;
        const firstLabel = firstCol ? getFirstLabel(firstCol) : null;
        const lastLabel = lastCol ? getFirstLabel(lastCol) : null;
        const sameLevel = (firstCol?.level || null) === (lastCol?.level || null);
        const lastEdgeLabel = metadata?.canonicalPath && metadata.canonicalPath.length >= 2
            ? metadata.canonicalPath[metadata.canonicalPath.length - 2]?.label
            : null;
        const lastEdgeNormalized = lastEdgeLabel ? normalizeRelType(lastEdgeLabel) : null;

        const cloneMap = new Map<string, string>();
        if (firstLabel && lastLabel && firstLabel === lastLabel && sameLevel) {
            nodes
                .filter(n => n.labels.includes(firstLabel))
                .forEach(n => {
                    const cloneId = `${n.id}__last`;
                    cloneMap.set(n.originalId, cloneId);
                    nodes.push({
                        ...n,
                        id: cloneId,
                        originalId: cloneId,
                        stepIndex: columns.length - 1,
                        isVirtual: false
                    });
                });
        }

        // Group by Column for Y-Calculation
        // Use max stepIndex found + 1 to accommodate GAP columns
        const maxStep = Math.max(columns.length - 1, ...nodes.map(n => n.stepIndex));
        const nodesByCol = new Array(maxStep + 1).fill(0).map(() => [] as Node[]);
        nodes.forEach(n => nodesByCol[n.stepIndex].push(n));

        // Add sub-header markers for operations and stakeholders columns
        nodesByCol.forEach((colNodes) => {
            const hasOrgUnit = colNodes.some(n => n.labels?.includes('EntityOrgUnit'));
            const hasProcess = colNodes.some(n => n.labels?.includes('EntityProcess'));
            const hasITSystem = colNodes.some(n => n.labels?.includes('EntityITSystem'));
            const hasCitizen = colNodes.some(n => n.labels?.includes('SectorCitizen'));
            const hasGovEntity = colNodes.some(n => n.labels?.includes('SectorGovEntity'));
            const hasBusiness = colNodes.some(n => n.labels?.includes('SectorBusiness'));

            if (hasOrgUnit || hasProcess || hasITSystem) {
                colNodes.forEach(node => {
                    if (node.labels?.includes('EntityOrgUnit')) node.entityTypeSubHeader = 'Org';
                    else if (node.labels?.includes('EntityProcess')) node.entityTypeSubHeader = 'Process';
                    else if (node.labels?.includes('EntityITSystem')) node.entityTypeSubHeader = 'IT';
                });
            }

            if (hasCitizen || hasGovEntity || hasBusiness) {
                colNodes.forEach(node => {
                    if (node.labels?.includes('SectorCitizen')) node.entityTypeSubHeader = 'Citizen';
                    else if (node.labels?.includes('SectorGovEntity')) node.entityTypeSubHeader = 'Gov Entity';
                    else if (node.labels?.includes('SectorBusiness')) node.entityTypeSubHeader = 'Business';
                });
            }
        });

        // Sort Nodes in Column (group order, then alpha)
        nodesByCol.forEach(col => col.sort((a, b) => {
            const groupOrder: Record<string, number> = {
                'Org': 0,
                'Process': 1,
                'IT': 2,
                'Citizen': 0,
                'Gov Entity': 1,
                'Business': 2
            };
            const aGroup = a.entityTypeSubHeader ? groupOrder[a.entityTypeSubHeader] ?? 99 : 99;
            const bGroup = b.entityTypeSubHeader ? groupOrder[b.entityTypeSubHeader] ?? 99 : 99;
            if (aGroup !== bGroup) return aGroup - bGroup;
            const aId = a.sortId ?? NaN;
            const bId = b.sortId ?? NaN;
            const aHasId = !Number.isNaN(aId);
            const bHasId = !Number.isNaN(bId);
            if (aHasId && bHasId && aId !== bId) return aId - bId;
            if (aHasId && !bHasId) return -1;
            if (!aHasId && bHasId) return 1;
            return a.name.localeCompare(b.name);
        }));

        // --- First pass: count connections per node to set height proportional to throughput ---
        const rawLinks = data.links || [];
        const nodeMap = new Map<string, Node>();
        nodes.forEach(n => nodeMap.set(n.originalId, n));

        // Resolve a raw node ID to the correct Node (handles aggregate remapping + clone remapping)
        const resolveNode = (rawId: string, linkType: string): Node | undefined => {
            // Direct match (aggregate or non-aggregated node)
            if (nodeMap.has(rawId)) return nodeMap.get(rawId);
            // If aggregation happened, map individual ID → aggregate ID
            const aggId = individualToAggregateMap.get(rawId);
            if (aggId && nodeMap.has(aggId)) return nodeMap.get(aggId);
            return undefined;
        };

        // Assign column index before counting
        nodesByCol.forEach((colNodes, colIndex) => {
            colNodes.forEach(node => { node.column = colIndex; });
        });

        // Tally how many link threads touch each node (outgoing from right side, incoming from left side)
        const outCount = new Map<string, number>(); // nodeId → outgoing count
        const inCount = new Map<string, number>();  // nodeId → incoming count

        // Pre-process valid links to count throughput
        interface RawLinkInfo { srcNode: Node; tgtNode: Node; isVirtual: boolean; type: string; color: string; weight: number; }
        const validLinks: RawLinkInfo[] = [];
        rawLinks.forEach((l: any) => {
            const sId = getLinkEndpointId(l.sourceId ?? l.source);
            const tId = getLinkEndpointId(l.targetId ?? l.target);
            const rawType = l.rType ?? l.type ?? l.relationship ?? l.relType ?? l.label ?? null;
            const linkType = normalizeRelType(rawType);

            // Handle closing edge (clone target for looping chains)
            // Check both raw ID and aggregate ID against cloneMap
            const tAggId = individualToAggregateMap.get(tId);
            const cloneKey = cloneMap.has(tId) ? tId : (tAggId && cloneMap.has(tAggId) ? tAggId : null);
            const isClosingEdge = lastEdgeNormalized && linkType === lastEdgeNormalized && cloneKey !== null;
            const resolvedTargetId = isClosingEdge ? cloneMap.get(cloneKey!)! : tId;

            // Resolve through aggregate mapping
            const src = resolveNode(sId, linkType);
            const tgt = resolveNode(resolvedTargetId, linkType);

            if (src && tgt && src.column !== undefined && tgt.column !== undefined) {
                const leftNode = src.column! <= tgt.column! ? src : tgt;
                const rightNode = src.column! <= tgt.column! ? tgt : src;
                if (leftNode.column === rightNode.column) return;
                if (hasEdgeMap) {
                    if (rightNode.column! - leftNode.column! !== 1) return;
                    const allowed = edgeMap.get(`${leftNode.column}->${rightNode.column}`);
                    if (!allowed || !allowed.has(linkType)) return;
                }
                const w = l.rProps?.weight || 1;
                outCount.set(leftNode.originalId, (outCount.get(leftNode.originalId) || 0) + w);
                inCount.set(rightNode.originalId, (inCount.get(rightNode.originalId) || 0) + w);
                validLinks.push({
                    srcNode: leftNode,
                    tgtNode: rightNode,
                    isVirtual: !!l.rProps?.virtual,
                    type: linkType,
                    color: l.rProps?.virtual ? '#D4AF37' : (isDark ? 'rgba(212,175,55,0.35)' : 'rgba(184,134,11,0.4)'),
                    weight: w
                });
            }
        });

        // Node height: for aggregate nodes use sqrt scale to prevent oversized rects;
        // for individual nodes use linear UNIT_HEIGHT as before.
        const hasAggregates = nodes.some(n => n.isAggregate);
        nodes.forEach(n => {
            const throughput = Math.max(outCount.get(n.originalId) || 0, inCount.get(n.originalId) || 0, 1);
            if (hasAggregates) {
                // Sqrt scale: keeps proportional but caps growth for large throughput (50-300+)
                n.height = Math.max(MIN_NODE_HEIGHT, Math.sqrt(throughput) * 10);
            } else {
                n.height = Math.max(MIN_NODE_HEIGHT, throughput * UNIT_HEIGHT);
            }
        });

        // --- Assign X/Y positions (Ping-Pong: 2 columns, N rows) ---
        // Each stepIndex gets its own horizontal row-band, alternating LEFT/RIGHT
        const ROW_GAP = 40; // vertical gap between step groups
        let runningY = padding.top + 40; // start below header area

        nodesByCol.forEach((colNodes, colIndex) => {
            if (colNodes.length === 0) return;
            const isLeft = colIndex % 2 === 0;
            const x = isLeft ? LEFT_X : RIGHT_X;
            let y = runningY;
            colNodes.forEach(node => {
                node.x = x;
                node.y = y;
                node.width = colWidth;
                y += node.height! + NODE_GAP;
            });
            // Advance runningY past this group
            runningY = y + ROW_GAP;
        });

        // Flatten nodes in render order
        nodes = nodesByCol.flat();

        // Compute total height
        const height = Math.max(900, runningY + padding.bottom);

        // --- Aggregate links into bands between (sourceNode, targetNode) pairs ---
        const bandKey = (src: Node, tgt: Node) => `${src.originalId}::${tgt.originalId}`;
        const bandMap = new Map<string, { source: Node; target: Node; value: number; isVirtual: boolean; types: Set<string>; color: string }>();
        validLinks.forEach(vl => {
            const key = bandKey(vl.srcNode, vl.tgtNode);
            if (!bandMap.has(key)) {
                bandMap.set(key, { source: vl.srcNode, target: vl.tgtNode, value: 0, isVirtual: vl.isVirtual, types: new Set(), color: vl.color });
            }
            const band = bandMap.get(key)!;
            band.value += vl.weight;
            band.types.add(vl.type);
        });

        // Assign vertical port offsets so bands stack on each node side
        // Source side: bands leave from right edge, stacked top-to-bottom
        // Target side: bands arrive at left edge, stacked top-to-bottom
        const srcPortOffset = new Map<string, number>(); // nodeId → next available y offset from node top
        const tgtPortOffset = new Map<string, number>();
        nodes.forEach(n => { srcPortOffset.set(n.originalId, 0); tgtPortOffset.set(n.originalId, 0); });

        const links: any[] = [];
        // Sort bands for consistent stacking (by source column, then source y, then target y)
        const sortedBands = Array.from(bandMap.values()).sort((a, b) => {
            if (a.source.column !== b.source.column) return a.source.column! - b.source.column!;
            if (a.source.y !== b.source.y) return a.source.y! - b.source.y!;
            return a.target.y! - b.target.y!;
        });

        sortedBands.forEach(band => {
            // For aggregate data, use log scale to prevent huge bands from dominating
            const bandHeight = hasAggregates
                ? Math.max(2, Math.log2(band.value + 1) * 8)
                : band.value * UNIT_HEIGHT;
            const srcOff = srcPortOffset.get(band.source.originalId) || 0;
            const tgtOff = tgtPortOffset.get(band.target.originalId) || 0;

            links.push({
                source: band.source,
                target: band.target,
                value: band.value,
                bandHeight,
                srcY: band.source.y! + srcOff,
                tgtY: band.target.y! + tgtOff,
                color: band.color,
                isVirtual: band.isVirtual,
                types: Array.from(band.types),
            });

            srcPortOffset.set(band.source.originalId, srcOff + bandHeight);
            tgtPortOffset.set(band.target.originalId, tgtOff + bandHeight);
        });

        return { nodes, links, width, height, colWidth };
    }, [data, columns, isDark, isDiagnostic, metadata?.canonicalPath]);

    // Render a thick Sankey band — handles both L→R and R→L (ping pong)
    const getBandPath = (link: any) => {
        const srcIsLeft = link.source.x! < link.target.x!;
        // Source exit point: right edge if going right, left edge if going left
        const sx = srcIsLeft ? link.source.x! + link.source.width! : link.source.x!;
        // Target entry point: left edge if coming from left, right edge if coming from right
        const tx = srcIsLeft ? link.target.x! : link.target.x! + link.target.width!;

        const sy0 = link.srcY;
        const sy1 = link.srcY + link.bandHeight;
        const ty0 = link.tgtY;
        const ty1 = link.tgtY + link.bandHeight;

        const dx = (tx - sx) * 0.15;

        return `M ${sx} ${sy0}
                C ${sx + dx} ${sy0}, ${tx - dx} ${ty0}, ${tx} ${ty0}
                L ${tx} ${ty1}
                C ${tx - dx} ${ty1}, ${sx + dx} ${sy1}, ${sx} ${sy1}
                Z`;
    };

    if (!layout || layout.nodes.length === 0) {
        return (
            <div className="flex-center h-full text-center p-8 opacity-50">
                {(!metadata?.canonicalPath) ? t('josoor.explorer.sankey.waitingMetadata') : t('josoor.explorer.sankey.noMatchingNodes')}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="graph-sankey">

            <div className="graph-sankey-scroll custom-scrollbar">
                <svg width="100%" height={Math.max(900, layout.height)} viewBox={`0 0 ${layout.width || 1200} ${Math.max(900, layout.height)}`} style={{ minHeight: '100%' }}>

                    {/* Step Headers — inline with each step group (ping pong) */}
                    {columns.map((col: any, i) => {
                        const groupNodes = layout.nodes.filter(n => n.column === i);
                        if (groupNodes.length === 0) return null;
                        const firstNode = groupNodes[0];
                        const x = firstNode.x!;
                        const hasSubs = firstNode.entityTypeSubHeader;
                        const groupTopY = firstNode.y! - (hasSubs ? 42 : 18);

                        const displayText = `${i + 1}. ${getColumnDisplayLabel(col.label, col.level)}`.toUpperCase();
                        const isLeft = i % 2 === 0;

                        // In RTL, flip anchor: left columns anchor end (right-align), right columns anchor start (left-align)
                        const anchor = isRTL
                            ? (isLeft ? 'end' : 'start')
                            : (isLeft ? 'start' : 'end');
                        const headX = isRTL
                            ? (isLeft ? x + layout.colWidth : x)
                            : (isLeft ? x : x + layout.colWidth);

                        return (
                            <text
                                key={`head-${i}`}
                                x={headX}
                                y={groupTopY}
                                textAnchor={anchor}
                                fill="#F4BB30"
                                fontSize="16"
                                fontWeight="700"
                                fontFamily="Inter, sans-serif"
                                letterSpacing="0.5px"
                                direction={isRTL ? 'rtl' : 'ltr'}
                                style={{ pointerEvents: 'none', dominantBaseline: 'auto' }}
                            >
                                {displayText}
                            </text>
                        );
                    })}

                    {/* Links — thick Sankey bands */}
                    {layout.links.map((link, i) => (
                        <motion.path
                            key={`link-${i}`}
                            d={getBandPath(link)}
                            fill={isDark ? '#D4AF37' : '#B8860B'}
                            stroke="none"
                            strokeDasharray={link.isVirtual ? "5,5" : "none"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.55 }}
                            transition={{ duration: 0.6, delay: 0.05 * Math.min(i, 10) }}
                            onMouseEnter={(e) => {
                                if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                                (e.target as SVGElement).setAttribute('opacity', '0.85');
                                const srcDisplay = link.source.isAggregate
                                    ? link.source.nameDisplay
                                    : link.source.nameDisplay;
                                const tgtDisplay = link.target.isAggregate
                                    ? link.target.nameDisplay
                                    : link.target.nameDisplay;
                                setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: (
                                        <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                                            <div>
                                                <span style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{srcDisplay}</span>
                                                {' \u2192 '}
                                                <span style={{ color: isDark ? '#F9FAFB' : '#111827', fontWeight: 500 }}>{tgtDisplay}</span>
                                            </div>
                                            <div style={{ marginTop: '4px', color: '#F4BB30', fontWeight: 600 }}>
                                                {t('josoor.explorer.sankey.connections', { count: link.value })}
                                            </div>
                                            <div style={{ marginTop: '2px', color: isDark ? '#9CA3AF' : '#6B7280', fontSize: '10px' }}>
                                                {t('josoor.explorer.sankey.via', { types: link.types.join(', ') })}
                                            </div>
                                            {link.isVirtual && <div style={{ color: '#F4BB30', fontStyle: 'italic', marginTop: '4px' }}>{t('josoor.explorer.sankey.aiRecommendation')}</div>}
                                        </div>
                                    )
                                });
                            }}
                            onMouseLeave={(e) => {
                                (e.target as SVGElement).setAttribute('opacity', '0.55');
                                if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                                tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 200);
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                    ))}

                    {/* Nodes */}
                    {layout.nodes.map((node, i) => (
                        <g key={`node-${i}`}
                            onMouseEnter={(e) => {
                                if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                                setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: node.isAggregate ? (
                                        <div style={{ maxWidth: '320px', maxHeight: '400px', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: isDark ? '#F9FAFB' : '#111827' }}>
                                                {node.nameDisplay}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#F4BB30', fontWeight: 600, marginBottom: '8px' }}>
                                                {t('josoor.explorer.sankey.nodeCount', { count: node.aggregateCount })}
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.8, borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, paddingTop: '8px' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{t('josoor.explorer.sankey.labels')}</div>
                                                <div style={{ marginLeft: '8px', marginBottom: '8px' }}>{node.labels.join(', ')}</div>
                                            </div>
                                            {node.properties?.sampleIds?.length > 0 && node.aggregateMembers && (
                                                <ExpandableNodeList 
                                                    sampleIds={node.aggregateMembers} 
                                                    totalCount={node.aggregateCount || 0}
                                                    isDark={isDark}
                                                />
                                            )}
                                            {node.isBroken && (
                                                <div style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '12px', fontSize: '12px' }}>
                                                    {t('josoor.explorer.sankey.gapDetected')}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ maxWidth: '320px', maxHeight: '400px', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: isDark ? '#F9FAFB' : '#111827' }}>
                                                {node.nameDisplay}
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, paddingTop: '8px' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{t('josoor.explorer.sankey.labels')}</div>
                                                <div style={{ marginLeft: '8px', marginBottom: '12px' }}>{node.labels.join(', ')}</div>
                                            </div>
                                            <div style={{ fontSize: '12px', borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, paddingTop: '8px' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{t('josoor.explorer.sankey.properties')}</div>
                                                {Object.entries(node.properties || {})
                                                    .filter(([key]) => !key.toLowerCase().includes('embedding'))
                                                    .map(([key, value]) => (
                                                        <div key={key} style={{ marginBottom: '4px', marginLeft: '8px', opacity: 0.85 }}>
                                                            <span style={{ fontWeight: '600', color: isDark ? '#aaa' : '#555' }}>{key}:</span>
                                                            <span style={{ marginLeft: '6px' }}>
                                                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                            {node.isBroken && (
                                                <div style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '12px', fontSize: '12px' }}>
                                                    {t('josoor.explorer.sankey.gapDetected')}
                                                </div>
                                            )}
                                            {node.isVirtual && (
                                                <div style={{ color: '#ffaa00', fontWeight: 'bold', marginTop: '12px', fontSize: '12px' }}>
                                                    {t('josoor.explorer.sankey.virtual')}
                                                </div>
                                            )}
                                        </div>
                                    )
                                });
                            }}
                            onMouseLeave={() => {
                                if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                                tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 200);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {node.entityTypeSubHeader && i > 0 && layout.nodes[i - 1]?.entityTypeSubHeader !== node.entityTypeSubHeader && (
                                <line
                                    x1={node.x!}
                                    x2={node.x! + node.width!}
                                    y1={node.y! - 5}
                                    y2={node.y! - 5}
                                    stroke={isDark ? '#374151' : '#E5E7EB'}
                                    strokeWidth="1"
                                    strokeDasharray="2,2"
                                    opacity="0.5"
                                />
                            )}
                            {node.entityTypeSubHeader && (i === 0 || layout.nodes[i - 1]?.entityTypeSubHeader !== node.entityTypeSubHeader) && (
                                <text
                                    x={isRTL
                                        ? (node.column! % 2 === 0 ? node.x! + node.width! - 3 : node.x! + 3)
                                        : (node.column! % 2 === 0 ? node.x! + 3 : node.x! + node.width! - 3)}
                                    y={node.y! - 24}
                                    fill={isDark ? '#9ca3af' : '#6b7280'}
                                    fontSize="14"
                                    fontWeight="600"
                                    textAnchor={isRTL
                                        ? (node.column! % 2 === 0 ? 'end' : 'start')
                                        : (node.column! % 2 === 0 ? 'start' : 'end')}
                                    direction={isRTL ? 'rtl' : 'ltr'}
                                    style={{ pointerEvents: 'none', dominantBaseline: 'hanging' }}
                                >
                                    {node.entityTypeSubHeader}
                                </text>
                            )}
                            <rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                rx={2}
                                fill={node.color}
                                stroke={node.isBroken ? '#ef4444' : '#D4AF37'}
                                strokeWidth={node.isBroken ? 1.5 : 0.5}
                                className="transition-colors hover:brightness-125"
                            />
                            <text
                                x={isRTL ? node.x! + node.width! - 8 : node.x! + 8}
                                y={node.y! + 8}
                                fill={isDark ? '#F9FAFB' : '#1F2937'}
                                fontSize="12"
                                fontWeight="500"
                                fontFamily="Inter, sans-serif"
                                style={{ pointerEvents: 'none' }}
                                textAnchor={isRTL ? 'end' : 'start'}
                                dominantBaseline="hanging"
                                direction={isRTL ? 'rtl' : 'ltr'}
                            >
                                {(() => {
                                    const pad = 16;
                                    const charWidth = isRTL ? 10 : 8;
                                    const countSuffix = node.isAggregate && node.aggregateCount ? ` \u00D7${node.aggregateCount}` : '';
                                    const reserveChars = countSuffix.length;
                                    const maxChars = Math.max(4, Math.floor(((node.width ?? 80) - pad) / charWidth));

                                    const wrapText = (text: string, max: number): string[] => {
                                        const words = text.split(' ');
                                        const result: string[] = [];
                                        let cur = '';
                                        for (const w of words) {
                                            if ((cur + ' ' + w).trim().length > max) {
                                                if (cur) result.push(cur.trim());
                                                cur = w;
                                            } else { cur += ' ' + w; }
                                        }
                                        if (cur) result.push(cur.trim());
                                        return result;
                                    };

                                    const lines = wrapText(node.nameDisplay, maxChars - (countSuffix ? reserveChars : 0));

                                    return lines.map((line, idx) => (
                                        <tspan
                                            key={idx}
                                            x={isRTL ? node.x! + node.width! - 8 : node.x! + 8}
                                            y={node.y! + 8 + idx * 16}
                                            fontSize="12"
                                            fontWeight="500"
                                            dominantBaseline="hanging"
                                        >
                                            {line}
                                            {/* Count inline on the last line */}
                                            {idx === lines.length - 1 && countSuffix && (
                                                <tspan fill="#F4BB30" fontWeight="700" dx={isRTL ? '-6' : '6'}>{countSuffix.trim()}</tspan>
                                            )}
                                        </tspan>
                                    ));
                                })()}
                            </text>
                            {node.isBroken && (
                                <circle cx={node.x! + node.width!} cy={node.y!} r={6} fill="#ef4444" stroke="#fff" />
                            )}
                        </g>
                    ))}
                </svg>
            </div>

            {/* Tooltip via portal - escapes any parent CSS transforms */}
            {tooltip && createPortal(
                (() => {
                    const pad = 20;
                    const vw = window.innerWidth;
                    const vh = window.innerHeight;
                    const tw = 320;
                    const th = 400;

                    let left = tooltip.x + 15;
                    let top = tooltip.y + 15;

                    if (left + tw > vw - pad) left = Math.max(pad, tooltip.x - tw - 15);
                    if (top + th > vh - pad) top = Math.max(pad, tooltip.y - th - 15);
                    left = Math.max(pad, Math.min(left, vw - tw - pad));
                    top = Math.max(pad, Math.min(top, vh - th - pad));

                    return (
                        <div
                            onMouseEnter={() => { if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current); }}
                            onMouseLeave={() => {
                                if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                                tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 200);
                            }}
                            style={{
                                position: 'fixed',
                                left,
                                top,
                                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                                borderRadius: '8px',
                                padding: '12px 14px',
                                zIndex: 99999,
                                pointerEvents: 'auto',
                                color: isDark ? '#F9FAFB' : '#111827',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '12px',
                                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.12)',
                                maxWidth: tw,
                                maxHeight: th,
                                overflowY: 'auto'
                            }}
                        >
                            {tooltip.content}
                        </div>
                    );
                })(),
                document.body
            )}
        </div>
    );
}
