import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface GraphDataTableProps {
    data: { nodes: any[]; links: any[] };
    isDark: boolean;
    onNodeClick?: (node: any) => void;
}

type SortKey = 'id' | 'name' | 'type' | 'level' | 'year' | 'status' | 'chainState';
type SortDir = 'asc' | 'desc';

const LABEL_COLORS: Record<string, string> = {
    SectorObjective: '#3b82f6', SectorPolicyTool: '#8b5cf6', SectorAdminRecord: '#06b6d4',
    SectorBusiness: '#f59e0b', SectorCitizen: '#10b981', SectorGovEntity: '#ef4444',
    SectorDataTransaction: '#ec4899', SectorPerformance: '#f97316',
    EntityCapability: '#6366f1', EntityOrgUnit: '#14b8a6', EntityProcess: '#a855f7',
    EntityITSystem: '#0ea5e9', EntityProject: '#84cc16', EntityChangeAdoption: '#e879f9',
    EntityRisk: '#f43f5e', EntityCultureHealth: '#22d3ee', EntityVendor: '#fb923c',
};

export function GraphDataTable({ data, isDark, onNodeClick }: GraphDataTableProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'nodes' | 'matrix'>('nodes');
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const getField = (node: any, key: SortKey): string => {
        const props = node.properties || node.nProps || {};
        switch (key) {
            case 'id': return String(props.id ?? '');
            case 'name': return node.name || props.name || '';
            case 'type': return node.labels?.[0] || node.label || '';
            case 'level': return props.level || '';
            case 'year': return String(props.year || '');
            case 'status': return props.status || '';
            case 'chainState': {
                const ds = props._diagnosticStatus;
                return ds === 'orphan' ? 'Unlinked' : ds === 'bastard' ? 'Unattributed' : 'Healthy';
            }
        }
    };

    const filteredNodes = useMemo(() => {
        let result = data.nodes;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(n => {
                const props = n.properties || n.nProps || {};
                const nodeId = String(props.id ?? '').toLowerCase();
                const name = (n.name || props.name || '').toLowerCase();
                const type = (n.labels?.[0] || n.label || '').toLowerCase();
                const chainState = (props._diagnosticStatus === 'orphan' ? 'unlinked' : props._diagnosticStatus === 'bastard' ? 'unattributed' : 'healthy');
                return nodeId.includes(q) || name.includes(q) || type.includes(q) || chainState.includes(q);
            });
        }
        return [...result].sort((a, b) => {
            const aVal = getField(a, sortKey).toLowerCase();
            const bVal = getField(b, sortKey).toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [data.nodes, search, sortKey, sortDir]);

    const sortIndicator = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

    if (!data || (!data.nodes.length && !data.links.length)) return null;

    return (
        <div className="graph-table-container" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '2px', padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
                <button className={`btn-reset mode-toggle-btn ${activeTab === 'nodes' ? 'active' : ''}`} onClick={() => setActiveTab('nodes')}>
                    {t('josoor.explorer.table.nodeList', 'Node List')} ({data.nodes.length})
                </button>
                <button className={`btn-reset mode-toggle-btn ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
                    {t('josoor.explorer.table.adjacencyMatrix', 'Adjacency Matrix')}
                </button>
            </div>

            {activeTab === 'nodes' && (
                <>
                    {/* Search */}
                    <div style={{ padding: '8px 12px' }}>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('josoor.explorer.table.searchPlaceholder', 'Search nodes...')}
                            style={{
                                width: '100%', padding: '6px 10px', fontSize: '12px',
                                borderRadius: '4px', border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                                backgroundColor: isDark ? '#1f2937' : '#fff',
                                color: isDark ? '#f9fafb' : '#111827',
                            }}
                        />
                    </div>

                    {/* Table */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: isDark ? '#d1d5db' : '#374151' }}>
                            <thead>
                                <tr>
                                    {(['id', 'name', 'type', 'level', 'year', 'status', 'chainState'] as SortKey[]).map(key => (
                                        <th key={key} onClick={() => handleSort(key)} style={{
                                            textAlign: 'left', padding: '8px', cursor: 'pointer', userSelect: 'none',
                                            borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            position: 'sticky', top: 0,
                                        }}>
                                            {t(`josoor.explorer.table.${key}`, key === 'chainState' ? 'Chain State' : key.charAt(0).toUpperCase() + key.slice(1))}{sortIndicator(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNodes.map((n, i) => {
                                    const type = n.labels?.[0] || n.label || '';
                                    const props = n.properties || n.nProps || {};
                                    return (
                                        <tr key={`${n.labels?.[0] || n.label}:${n.id}`}
                                            onClick={() => onNodeClick?.(n)}
                                            style={{
                                                cursor: onNodeClick ? 'pointer' : 'default',
                                                backgroundColor: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                                            }}
                                        >
                                            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}`, fontFamily: 'monospace', fontSize: '11px' }}>
                                                {props.id ?? ''}
                                            </td>
                                            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>
                                                {n.name || props.name || n.id}
                                            </td>
                                            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>
                                                {type}
                                            </td>
                                            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>{props.level || ''}</td>
                                            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>{props.year || ''}</td>
                                            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>{props.status || ''}</td>
                                            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>
                                                {(() => {
                                                    const ds = props._diagnosticStatus;
                                                    const label = ds === 'orphan' ? 'Unlinked' : ds === 'bastard' ? 'Unattributed' : 'Healthy';
                                                    const color = ds === 'orphan' ? '#ef4444' : ds === 'bastard' ? '#f59e0b' : '#10b981';
                                                    return (
                                                        <span style={{
                                                            display: 'inline-block', padding: '1px 6px', borderRadius: '3px', fontSize: '10px',
                                                            backgroundColor: color + '22',
                                                            color, fontWeight: 600,
                                                        }}>{label}</span>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'matrix' && (
                <AdjacencyMatrix data={data} isDark={isDark} />
            )}
        </div>
    );
}

/** Adjacency Matrix sub-component */
function AdjacencyMatrix({ data, isDark }: { data: { nodes: any[]; links: any[] }; isDark: boolean }) {
    const { t } = useTranslation();

    const sortedNodes = useMemo(() => {
        return [...data.nodes].sort((a, b) => {
            const aType = a.labels?.[0] || a.label || '';
            const bType = b.labels?.[0] || b.label || '';
            if (aType !== bType) return aType.localeCompare(bType);
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [data.nodes]);

    const adjacency = useMemo(() => {
        const map = new Map<string, Map<string, string[]>>();
        for (const l of data.links) {
            const src = typeof l.source === 'object' ? l.source.id : l.source;
            const tgt = typeof l.target === 'object' ? l.target.id : l.target;
            const relType = l.type || l.rType || '?';
            if (!map.has(src)) map.set(src, new Map());
            const inner = map.get(src)!;
            if (!inner.has(tgt)) inner.set(tgt, []);
            inner.get(tgt)!.push(relType);
        }
        return map;
    }, [data.links]);

    const displayNodes = sortedNodes.slice(0, 50);
    const truncated = sortedNodes.length > 50;

    const cellSize = 24;
    const headerHeight = 120;
    const labelWidth = 160;

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {truncated && (
                <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px', color: isDark ? '#9ca3af' : '#6b7280' }}>
                    {t('josoor.explorer.table.matrixTruncated', `Showing first 50 of ${sortedNodes.length} nodes`)}
                </p>
            )}
            <div style={{ position: 'relative', minWidth: labelWidth + displayNodes.length * cellSize }}>
                {/* Column headers (rotated) */}
                <div style={{ display: 'flex', marginLeft: labelWidth, height: headerHeight }}>
                    {displayNodes.map((n, i) => (
                        <div key={n.id || i} style={{ width: cellSize, position: 'relative' }}>
                            <span style={{
                                position: 'absolute', bottom: 0, left: '50%',
                                transform: 'rotate(-60deg) translateX(-50%)',
                                transformOrigin: 'bottom left',
                                fontSize: '9px', whiteSpace: 'nowrap',
                                color: isDark ? '#9ca3af' : '#6b7280',
                                maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {(n.name || n.id || '').slice(0, 20)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {displayNodes.map((rowNode, ri) => (
                    <div key={rowNode.id || ri} style={{ display: 'flex', height: cellSize }}>
                        <div style={{
                            width: labelWidth, fontSize: '9px', padding: '2px 4px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: isDark ? '#d1d5db' : '#374151', lineHeight: `${cellSize}px`,
                        }}>
                            {(rowNode.name || rowNode.id || '').slice(0, 25)}
                        </div>
                        {displayNodes.map((colNode, ci) => {
                            const rels = adjacency.get(rowNode.id)?.get(colNode.id) || [];
                            const count = rels.length;
                            const bg = count === 0
                                ? 'transparent'
                                : isDark
                                    ? `rgba(244, 187, 48, ${Math.min(0.1 + count * 0.15, 0.8)})`
                                    : `rgba(59, 130, 246, ${Math.min(0.1 + count * 0.15, 0.8)})`;

                            return (
                                <div key={`${ri}-${ci}`} title={rels.length > 0 ? `${rowNode.name} \u2192 ${colNode.name}: ${rels.join(', ')}` : ''} style={{
                                    width: cellSize, height: cellSize,
                                    backgroundColor: bg,
                                    border: `0.5px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                                    fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: count > 0 ? '#fff' : 'transparent',
                                }}>
                                    {count > 0 ? count : ''}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
