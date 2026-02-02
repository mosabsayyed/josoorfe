import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

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
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
            return /^\d+(\.\d+)?$/.test(s) ? s : null;
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

    // 2. Process Data & Layout
    const layout = useMemo(() => {
        if (!data?.nodes?.length || columns.length === 0) return null;

        const width = containerRef.current?.offsetWidth || 1200;
        const height = Math.max(680, data.nodes.length * 56);
        const padding = { top: 36, right: 16, bottom: 28, left: 16 };
        const availableWidth = width - padding.left - padding.right;
        const availableHeight = height - padding.top - padding.bottom;

        const colCount = Math.max(1, columns.length);
        const cellWidth = availableWidth / colCount;
        const colWidth = Math.max(90, Math.min(120, cellWidth * 0.6));
        const colSpacing = colCount > 1 ? Math.max(18, (availableWidth - (colWidth * colCount)) / (colCount - 1)) : 0;

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
            const isVirtual = props.virtual === true;
            const baseColor = isDark ? '#1a365d' : '#2563eb';

            return {
                id,
                originalId: id,
                name: baseName,
                labels,
                properties: props,
                color: isBroken ? '#ef4444' : (isVirtual ? '#D4AF37' : baseColor),
                isBroken,
                isVirtual,
                stepIndex,
                nameDisplay,
                sortId,
                sortIdRaw: displayId
            };
        }).filter(n => n.stepIndex !== -1); // Filter nodes not in canonical path

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
        const nodesByCol = new Array(columns.length).fill(0).map(() => [] as Node[]);
        nodes.forEach(n => nodesByCol[n.stepIndex].push(n));

        // Add sub-header markers for operations and stakeholders columns
        nodesByCol.forEach((colNodes) => {
            const hasOrgUnit = colNodes.some(n => n.labels?.includes('EntityOrgUnit'));
            const hasProcess = colNodes.some(n => n.labels?.includes('EntityProcess'));
            const hasITSystem = colNodes.some(n => n.labels?.includes('EntityITSystem'));
            const hasCitizen = colNodes.some(n => n.labels?.includes('SectorCitizen'));
            const hasGovEntity = colNodes.some(n => n.labels?.includes('SectorGovEntity'));
            const hasBusiness = colNodes.some(n => n.labels?.includes('SectorBusiness'));

            if ((hasOrgUnit && hasProcess) || (hasOrgUnit && hasITSystem) || (hasProcess && hasITSystem)) {
                colNodes.forEach(node => {
                    if (node.labels?.includes('EntityOrgUnit')) node.entityTypeSubHeader = 'Org';
                    else if (node.labels?.includes('EntityProcess')) node.entityTypeSubHeader = 'Process';
                    else if (node.labels?.includes('EntityITSystem')) node.entityTypeSubHeader = 'IT';
                });
            }

            if ((hasCitizen && hasGovEntity) || (hasCitizen && hasBusiness) || (hasGovEntity && hasBusiness)) {
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

        // Assign X/Y
        nodesByCol.forEach((colNodes, colIndex) => {
            const x = padding.left + colIndex * (colWidth + colSpacing);
            // Center vertically? Or top align? Top align is safer for many nodes.
            // Let's Top Align with scroll capability if needed? No, SVG scales.
            // Let's squeeze if too many?

            const nodeHeight = Math.min(38, availableHeight / colNodes.length - 10);
            const gap = 10;

            colNodes.forEach((node, idx) => {
                node.x = x;
                node.y = padding.top + idx * (nodeHeight + gap);
                node.width = colWidth;
                node.height = nodeHeight;
                node.column = colIndex;
            });
        });

        // Flatten nodes in render order (column -> y)
        const renderNodes = nodesByCol.flat();
        nodes = renderNodes;

        // Map for Link drawing
        const nodeMap = new Map(nodes.map(n => [n.originalId, n]));

        // Process Links
        const rawLinks = data.links || [];
        const links: any[] = [];
        rawLinks.forEach((l: any) => {
            const sId = getLinkEndpointId(l.sourceId ?? l.source);
            const tId = getLinkEndpointId(l.targetId ?? l.target);

            const src = nodeMap.get(sId);
            const rawType = l.rType ?? l.type ?? l.relationship ?? l.relType ?? l.label ?? null;
            const linkType = normalizeRelType(rawType);
            const isClosingEdge = lastEdgeNormalized && linkType === lastEdgeNormalized && cloneMap.has(tId);
            const targetId = isClosingEdge ? cloneMap.get(tId)! : tId;
            const tgt = nodeMap.get(targetId);

            if (src && tgt && src.column !== undefined && tgt.column !== undefined) {
                const leftNode = src.column <= tgt.column ? src : tgt;
                const rightNode = src.column <= tgt.column ? tgt : src;
                const leftCol = leftNode.column!;
                const rightCol = rightNode.column!;
                if (leftCol === rightCol) return;
                if (hasEdgeMap) {
                    if (rightCol - leftCol !== 1) return;
                    const allowed = edgeMap.get(`${leftCol}->${rightCol}`);
                    if (!allowed || !allowed.has(linkType)) return;
                }
                links.push({
                    source: leftNode,
                    target: rightNode,
                    color: l.rProps?.virtual ? '#D4AF37' : (isDark ? '#444' : '#ccc'),
                    isVirtual: l.rProps?.virtual,
                    type: linkType
                });
            }
        });

        return { nodes, links, width, height, colWidth };
    }, [data, columns, isDark, isDiagnostic, metadata?.canonicalPath]);

    // Render Sigmoid Path
    const getPath = (link: any) => {
        const s = link.source;
        const t = link.target;

        const sx = s.x! + s.width!;
        const sy = s.y! + s.height! / 2;
        const tx = t.x!;
        const ty = t.y! + t.height! / 2;

        const deltaX = tx - sx;
        const controlX = deltaX * 0.5;

        return `M ${sx} ${sy} C ${sx + controlX} ${sy}, ${tx - controlX} ${ty}, ${tx} ${ty}`;
    };

    if (!layout || layout.nodes.length === 0) {
        return (
            <div className="flex-center h-full text-center p-8 opacity-50">
                {(!metadata?.canonicalPath) ? 'Waiting for Metadata...' : 'No matching nodes found for this chain.'}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="graph-sankey">
            {/* Header Info */}
            <div style={{ 
                padding: '0.5rem 0.5rem',
                borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
            }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Canonical Flow
                </div>
                <div style={{ fontSize: '0.85rem', color: isDark ? '#d1d5db' : '#374151', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {columns.map((c: any, i) => {
                        const displayText = getColumnDisplayLabel(c.label, c.level);
                        return (
                            <span key={i}>
                                {i > 0 && <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>→</span>}
                                <span style={{ whiteSpace: 'nowrap' }}>{displayText}</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="graph-sankey-scroll custom-scrollbar">
                <svg width="100%" height={Math.max(600, layout.height)} viewBox={`0 0 ${layout.width || 1200} ${layout.height}`} style={{ minHeight: '600px' }}>

                    {/* Headers (Inside SVG for Alignment) */}
                    {columns.map((col: any, i) => {
                        const nodeSample = layout.nodes.find(n => n.column === i);
                        const x = nodeSample ? nodeSample.x! : (20 + i * 200); // Fallback

                        const displayText = getColumnDisplayLabel(col.label, col.level).toUpperCase();

                        const charsPerLine = Math.max(8, Math.floor((layout.colWidth - 12) / 7));
                        const lines: string[] = [];
                        let remaining = displayText;
                        while (remaining.length > 0) {
                            if (remaining.length <= charsPerLine) {
                                lines.push(remaining);
                                remaining = '';
                            } else {
                                const chunk = remaining.substring(0, charsPerLine);
                                const lastSpace = chunk.lastIndexOf(' ');
                                if (lastSpace > 0) {
                                    lines.push(remaining.substring(0, lastSpace));
                                    remaining = remaining.substring(lastSpace + 1);
                                } else {
                                    lines.push(chunk);
                                    remaining = remaining.substring(charsPerLine);
                                }
                            }
                        }
                        const lineHeight = 12;
                        const headerPadY = 6;
                        const headerHeight = headerPadY * 2 + lines.length * lineHeight;

                        return (
                            <g key={`head-${i}`}>
                                <rect
                                    x={x}
                                    y={5}
                                    width={layout.colWidth}
                                    height={headerHeight}
                                    rx={4}
                                    fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                                    stroke={isDark ? '#444' : '#d1d5db'}
                                    strokeWidth={1}
                                />
                                <text
                                    x={x + layout.colWidth / 2}
                                    y={5 + headerPadY}
                                    textAnchor="middle"
                                    fill={isDark ? '#d4af37' : '#92400e'}
                                    fontSize="10"
                                    fontWeight="bold"
                                    letterSpacing="0.5px"
                                    style={{ pointerEvents: 'none', dominantBaseline: 'hanging' }}
                                >
                                    {lines.map((line, lineIdx) => (
                                        <tspan
                                            key={`line-${lineIdx}`}
                                            x={x + layout.colWidth / 2}
                                            dy={lineIdx === 0 ? 0 : 12}
                                        >
                                            {line}
                                        </tspan>
                                    ))}
                                </text>
                            </g>
                        );
                    })}

                    {/* Links */}
                    {layout.links.map((link, i) => (
                        <motion.path
                            key={`link-${i}`}
                            d={getPath(link)}
                            fill="none"
                            stroke={link.color}
                            strokeWidth="2"
                            strokeDasharray={link.isVirtual ? "5,5" : "none"}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6 }}
                            transition={{ duration: 0.8, delay: 0.1 * i }}
                            onMouseEnter={(e) => {
                                if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                                (e.target as SVGElement).setAttribute('stroke-opacity', '1');
                                setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: (
                                        <div className="text-xs">
                                            <span style={{ color: '#888' }}>{link.source.name}</span>
                                            {' -> '}
                                            <span style={{ color: '#fff' }}>{link.target.name}</span>
                                            {link.isVirtual && <div className="text-gold italic mt-1">AI Recommendation</div>}
                                        </div>
                                    )
                                });
                            }}
                            onMouseLeave={(e) => {
                                (e.target as SVGElement).setAttribute('stroke-opacity', '0.6');
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
                                    content: (
                                        <div style={{ maxWidth: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                                                {node.nameDisplay}
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', borderTop: `1px solid ${isDark ? '#555' : '#ddd'}`, paddingTop: '8px' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Labels:</div>
                                                <div style={{ marginLeft: '8px', marginBottom: '12px' }}>{node.labels.join(', ')}</div>
                                            </div>
                                            <div style={{ fontSize: '12px', borderTop: `1px solid ${isDark ? '#555' : '#ddd'}`, paddingTop: '8px' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Properties:</div>
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
                                                    ⚠️ GAP DETECTED
                                                </div>
                                            )}
                                            {node.isVirtual && (
                                                <div style={{ color: '#ffaa00', fontWeight: 'bold', marginTop: '12px', fontSize: '12px' }}>
                                                    ✨ VIRTUAL
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
                                    stroke={isDark ? '#555' : '#d1d5db'}
                                    strokeWidth="1"
                                    strokeDasharray="2,2"
                                    opacity="0.5"
                                />
                            )}
                            {node.entityTypeSubHeader && (i === 0 || layout.nodes[i - 1]?.entityTypeSubHeader !== node.entityTypeSubHeader) && (
                                <text
                                    x={node.x! + 3}
                                    y={node.y! - 8}
                                    fill={isDark ? '#9ca3af' : '#6b7280'}
                                    fontSize="7"
                                    fontWeight="600"
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
                                rx={4}
                                fill={node.color}
                                stroke={isDark ? '#000' : '#fff'}
                                strokeWidth={1}
                                className="transition-colors hover:brightness-110"
                            />
                            <text
                                x={node.x! + 5}
                                y={node.y! + 6}
                                fill="#fff"
                                fontSize="9"
                                fontWeight="500"
                                style={{ pointerEvents: 'none' }}
                                textAnchor="start"
                                dominantBaseline="hanging"
                            >
                                {(() => {
                                    const padding = 10;
                                    const charWidth = 5.5;
                                    const maxChars = Math.max(4, Math.floor(((node.width ?? 80) - padding) / charWidth));
                                    const words = node.nameDisplay.split(' ');
                                    const lines: string[] = [];
                                    let current = '';
                                    for (const word of words) {
                                        if ((current + ' ' + word).trim().length > maxChars) {
                                            if (current) lines.push(current.trim());
                                            current = word;
                                        } else {
                                            current += ' ' + word;
                                        }
                                    }
                                    if (current) lines.push(current.trim());
                                    return lines.map((line, idx) => (
                                        <tspan
                                            key={idx}
                                            x={node.x! + 5}
                                            y={node.y! + 6 + idx * 12}
                                            fontSize="9"
                                            fontWeight="500"
                                            dominantBaseline="hanging"
                                        >
                                            {line}
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

            {/* Custom Portal Tooltip */}
            {tooltip && (() => {
                const padding = 16;
                const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
                const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
                const maxWidth = Math.min(420, vw - padding * 2);
                const maxHeight = Math.min(500, vh - padding * 2);
                let left = tooltip.x + 12;
                let top = tooltip.y + 12;
                if (left + maxWidth + padding > vw) {
                    left = tooltip.x - maxWidth - 12;
                }
                if (top + maxHeight + padding > vh) {
                    top = tooltip.y - maxHeight - 12;
                }
                left = Math.min(left, vw - maxWidth - padding);
                top = Math.min(top, vh - maxHeight - padding);
                left = Math.max(padding, left);
                top = Math.max(padding, top);
                return (
                <div
                    onMouseEnter={() => {
                        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                    }}
                    onMouseLeave={() => {
                        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                        tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 200);
                    }}
                    style={{
                    position: 'fixed',
                    left,
                    top,
                    backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
                    border: `1px solid ${isDark ? '#333' : '#ccc'}`,
                    borderRadius: '4px',
                    padding: '8px',
                    zIndex: 9999,
                    pointerEvents: 'auto',
                    color: isDark ? '#fff' : '#000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    maxWidth,
                    maxHeight,
                    overflowY: 'auto'
                }}>
                    {tooltip.content}
                </div>
                );
            })()}
        </div>
    );
}
