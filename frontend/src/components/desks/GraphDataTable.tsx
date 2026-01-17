import React from 'react';

interface GraphDataTableProps {
    data: {
        nodes: any[];
        links: any[];
    };
    isDark: boolean;
}

export function GraphDataTable({ data, isDark }: GraphDataTableProps) {
    if (!data || (!data.nodes.length && !data.links.length)) return null;

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '12px',
        color: isDark ? '#ddd' : '#333',
    };

    const thStyle = {
        textAlign: 'left' as const,
        padding: '8px',
        borderBottom: `1px solid ${isDark ? '#444' : '#ccc'}`,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        fontWeight: 'bold',
        position: 'sticky' as const,
        top: 0
    };

    const tdStyle = {
        padding: '6px 8px',
        borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        maxWidth: '200px'
    };

    // Helper to extract a display name/id
    const getNodeId = (n: any) => n.id ?? n.identity ?? n.elementId ?? 'N/A';
    const getNodeName = (n: any) => n.properties?.name || n.properties?.title || n.name || 'N/A';
    const getNodeLabel = (n: any) => n.labels ? n.labels.join(', ') : (n.label || 'N/A');

    return (
        <div className="w-full mt-4 flex flex-col gap-6 p-4 rounded-lg animate-fadeIn"
            style={{
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                borderTop: `1px solid ${isDark ? '#333' : '#ccc'}`
            }}>

            <h3 style={{ color: isDark ? '#D4AF37' : '#B4922B' }} className="text-lg font-bold">
                📊 Dataset Audit ({data.nodes.length} Nodes, {data.links.length} Links)
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* NODES TABLE */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
                    <table style={tableStyle}>
                        <thead style={{ backgroundColor: isDark ? '#111' : '#f9f9f9' }}>
                            <tr>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>Label</th>
                                <th style={thStyle}>Name / Title</th>
                                <th style={thStyle}>Raw Properties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.nodes.map((n, i) => (
                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                                    <td style={tdStyle} title={String(getNodeId(n))}>{getNodeId(n)}</td>
                                    <td style={{ ...tdStyle, color: '#60a5fa' }}>{getNodeLabel(n)}</td>
                                    <td style={{ ...tdStyle, fontWeight: 500 }} title={getNodeName(n)}>{getNodeName(n)}</td>
                                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '10px', maxWidth: '300px' }} title={JSON.stringify(n.properties, null, 2)}>
                                        {JSON.stringify(n.properties)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* LINKS TABLE */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
                    <table style={tableStyle}>
                        <thead style={{ backgroundColor: isDark ? '#111' : '#f9f9f9' }}>
                            <tr>
                                <th style={thStyle}>Source</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Target</th>
                                <th style={thStyle}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.links.map((l, i) => {
                                const source = typeof l.source === 'object' ? (l.source.name || l.source.id) : l.source;
                                const target = typeof l.target === 'object' ? (l.target.name || l.target.id) : l.target;
                                return (
                                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                                        <td style={tdStyle} title={String(source)}>{String(source)}</td>
                                        <td style={{ ...tdStyle, color: '#f59e0b' }}>{l.type}</td>
                                        <td style={tdStyle} title={String(target)}>{String(target)}</td>
                                        <td style={tdStyle}>{l.value ?? 1}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
