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
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    column?: number;
}

interface Link {
    source: string; // originalId
    target: string; // originalId
    value: number;
    type: string;
    properties: any;
    isVirtual: boolean;
}

interface GraphSankeyProps {
    data: { nodes: any[]; links: any[] };
    metadata?: { canonicalPath?: Array<{ type: 'node' | 'edge', label: string }> };
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

    // 1. Parse Metadata for Columns
    const columns = useMemo(() => {
        if (!metadata?.canonicalPath) return [];
        return metadata.canonicalPath.filter(step => step.type === 'node').map(step => step.label);
    }, [metadata]);

    // 2. Process Data & Layout
    const layout = useMemo(() => {
        if (!data?.nodes?.length || columns.length === 0) return null;

        const width = containerRef.current?.offsetWidth || 1200;
        const height = 600;
        const padding = { top: 40, right: 20, bottom: 20, left: 20 };
        const availableWidth = width - padding.left - padding.right;
        const availableHeight = height - padding.top - padding.bottom;

        const colWidth = 120; // Fixed Node Width
        const colSpacing = (availableWidth - (columns.length * colWidth)) / (columns.length - 1 || 1);

        // Map Columns (Step Index)
        // NOTE: canonicalPath labels can be pipe-separated strings like 'EntityOrgUnit|EntityProcess|EntityITSystem'
        const colMap = new Map<string, number>();
        columns.forEach((col: string | string[], i: number) => {
            if (Array.isArray(col)) {
                col.forEach((c: string) => colMap.set(c, i));
            } else if (typeof col === 'string' && col.includes('|')) {
                // Handle pipe-separated labels from canonicalPath
                col.split('|').forEach((c: string) => colMap.set(c.trim(), i));
            } else {
                colMap.set(col, i);
            }
        });

        // Process Nodes
        let nodes: Node[] = data.nodes.map(n => {
            const props = n.nProps || n.properties || {};
            const id = getSafeId(n.nId ?? n.id ?? n.identity ?? n.elementId);
            const labels = n.nLabels || n.labels || [];

            // Assign Column
            // Heuristic: Last matching label in list (most specific logic usually?)
            // Or First matching.
            const colLabel = labels.find((l: string) => colMap.has(l));
            const stepIndex = colLabel ? colMap.get(colLabel)! : -1;

            const isBroken = isDiagnostic && props.status === 'critical';
            const isVirtual = props.virtual === true;
            const baseColor = isDark ? '#1a365d' : '#2563eb';

            return {
                id,
                originalId: id,
                name: props.name || props.title || labels[0] || 'Unknown',
                labels,
                properties: props,
                color: isBroken ? '#ef4444' : (isVirtual ? '#D4AF37' : baseColor),
                isBroken,
                isVirtual,
                stepIndex,
                nameDisplay: props.name || props.title || 'Node'
            };
        }).filter(n => n.stepIndex !== -1); // Filter nodes not in canonical path

        // Group by Column for Y-Calculation
        const nodesByCol = new Array(columns.length).fill(0).map(() => [] as Node[]);
        nodes.forEach(n => nodesByCol[n.stepIndex].push(n));

        // Sort Nodes in Column (Alphabetical or other logic)
        nodesByCol.forEach(col => col.sort((a, b) => a.name.localeCompare(b.name)));

        // Assign X/Y
        nodesByCol.forEach((colNodes, colIndex) => {
            const x = padding.left + colIndex * (colWidth + colSpacing);
            const totalHeightNeeded = colNodes.length * 50; // 40px height + 10px gap
            // Center vertically? Or top align? Top align is safer for many nodes.
            // Let's Top Align with scroll capability if needed? No, SVG scales.
            // Let's squeeze if too many?

            const nodeHeight = Math.min(40, availableHeight / colNodes.length - 10);
            const gap = 10;

            colNodes.forEach((node, idx) => {
                node.x = x;
                node.y = padding.top + idx * (nodeHeight + gap);
                node.width = colWidth;
                node.height = nodeHeight;
                node.column = colIndex;
            });
        });

        // Map for Link drawing
        const nodeMap = new Map(nodes.map(n => [n.originalId, n]));

        // Process Links
        const links: any[] = [];
        (data.links || []).forEach((l: any) => {
            const sId = getSafeId(l.sourceId ?? l.source);
            const tId = getSafeId(l.targetId ?? l.target);

            const src = nodeMap.get(sId);
            const tgt = nodeMap.get(tId);

            if (src && tgt && src.column !== undefined && tgt.column !== undefined) {
                // Only verify forward flow
                if (tgt.column > src.column) {
                    links.push({
                        source: src,
                        target: tgt,
                        color: l.rProps?.virtual ? '#D4AF37' : (isDark ? '#444' : '#ccc'),
                        isVirtual: l.rProps?.virtual,
                        type: l.rType || l.type || 'LINK'
                    });
                }
            }
        });

        return { nodes, links, width, height, colWidth };
    }, [data, columns, isDark]);

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
        <div ref={containerRef} className="w-full h-full relative flex flex-col overflow-hidden select-none">
            {/* Header Strip - Synced with Layout */}
            <div className="flex w-full border-b pb-2" style={{ borderColor: isDark ? '#333' : '#eee', paddingLeft: '20px', paddingRight: '20px' }}>
                <div className="relative w-full h-8">
                    {columns.map((col, i) => {
                        // Calculate X center of column
                        // Replicate layout math: padding.left + colIndex * (colWidth + colSpacing)
                        const colLayoutX = 0 + i * (layout.colWidth + ((1200 - 40 - (columns.length * 120)) / (columns.length - 1 || 1)));
                        // Note: offsetWidth calc inside useMemo is dynamic. 
                        // To sync perfectly, we should render headers IN SVG or use %?
                        // Better: Render headers in SVG for perfect pixel alignment.
                        return null;
                    })}
                    <span className="text-xs opacity-50 ml-2">
                        Canonical Flow: {columns.map(c => {
                            // Handle both arrays and pipe-separated strings
                            const txt = Array.isArray(c) ? c.join(' & ') : (c.includes('|') ? c.split('|').join(' & ') : c);
                            return txt.replace(/([A-Z])/g, ' $1').trim();
                        }).join(' → ')}
                    </span>
                </div>
            </div>

            <div className="flex-1 relative overflow-auto custom-scrollbar">
                <svg width="100%" height={Math.max(600, layout.height)} viewBox={`0 0 ${layout.width || 1200} ${layout.height}`} style={{ minHeight: '600px' }}>

                    {/* Headers (Inside SVG for Alignment) */}
                    {columns.map((col, i) => {
                        const nodeSample = layout.nodes.find(n => n.column === i);
                        const x = nodeSample ? nodeSample.x! : (20 + i * 200); // Fallback

                        // Format Label Logic - handle both arrays and pipe-separated strings
                        const rawLabel = Array.isArray(col) ? col.join(' & ') : (col.includes('|') ? col.split('|').join(' & ') : col);
                        const displayText = rawLabel.replace(/([A-Z])/g, ' $1').trim().toUpperCase();

                        return (
                            <text key={`head-${i}`} x={x + layout.colWidth / 2} y={20}
                                textAnchor="middle"
                                fill={isDark ? '#aaa' : '#555'}
                                fontSize="12"
                                fontWeight="bold"
                                letterSpacing="1px"
                            >
                                {displayText}
                            </text>
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
                                setTooltip(null);
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                    ))}

                    {/* Nodes */}
                    {layout.nodes.map((node, i) => (
                        <g key={`node-${i}`}
                            onMouseEnter={(e) => {
                                setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: (
                                        <div>
                                            <div className="font-bold text-sm mb-1">{node.nameDisplay}</div>
                                            <div className="text-xs opacity-70">{node.labels.join(', ')}</div>
                                            {node.isBroken && <div className="text-red-500 font-bold mt-1 text-xs">⚠️ GAP DETECTED</div>}
                                            {node.isVirtual && <div className="text-gold font-bold mt-1 text-xs">✨ VIRTUAL</div>}
                                        </div>
                                    )
                                });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                            style={{ cursor: 'pointer' }}
                        >
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
                                x={node.x! + 10}
                                y={node.y! + node.height! / 2}
                                dy=".35em"
                                fill="#fff"
                                fontSize="10"
                                fontWeight="500"
                                style={{ pointerEvents: 'none' }}
                            >
                                {node.nameDisplay.length > 15 ? node.nameDisplay.substring(0, 15) + '...' : node.nameDisplay}
                            </text>
                            {node.isBroken && (
                                <circle cx={node.x! + node.width!} cy={node.y!} r={6} fill="#ef4444" stroke="#fff" />
                            )}
                        </g>
                    ))}
                </svg>
            </div>

            {/* Custom Portal Tooltip */}
            {tooltip && (
                <div style={{
                    position: 'fixed',
                    left: tooltip.x + 15,
                    top: tooltip.y + 15,
                    backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
                    border: `1px solid ${isDark ? '#333' : '#ccc'}`,
                    borderRadius: '4px',
                    padding: '8px',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    color: isDark ? '#fff' : '#000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    {tooltip.content}
                </div>
            )}
        </div>
    );
}
