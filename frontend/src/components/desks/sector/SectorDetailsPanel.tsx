import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import * as LucideIcons from 'lucide-react'; // Assuming lucide-react is available, or use standard emojis/svgs

interface SectorDetailsPanelProps {
    selectedSector: string;
    selectedRegion: string | null;
    onBackToNational?: () => void;
    onAssetClick?: (assetId: string) => void;
    assets: GraphNode[]; // Shared data
    isLoading?: boolean;
    year?: number;
    quarter?: string;
}

// FLAT structure from API
interface GraphNode {
    id: string;
    name?: string;
    sector?: string;
    asset_type?: string;
    status?: string;
    priority?: string;
    region?: string;
    capacity?: string;
    investment?: string; // e.g. "500M SAR"
    description?: string;
    labels?: string[];
    [key: string]: any;
}

interface KPI {
    name: string;
    value: string | number;
    unit: string;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
}

// Simple status helper
function getSimpleStatus(status?: string): 'Running' | 'Future' {
    if (!status) return 'Future';
    const s = status.toLowerCase();
    if (s === 'existing' || s === 'active' || s === 'operational') return 'Running';
    return 'Future';
}

// Helper to parse investment string to number (e.g. "500M SAR" -> 500)
function parseInvestment(inv?: string): number {
    if (!inv) return 0;
    const clean = inv.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
    return clean ? parseFloat(clean[0]) : 0;
}

const SectorDetailsPanel: React.FC<SectorDetailsPanelProps> = ({
    selectedSector,
    selectedRegion,
    onBackToNational,
    onAssetClick,
    assets: allAssets, // Use prop
    isLoading = false,
    year,
    quarter
}) => {
    const [activeTab, setActiveTab] = useState<'assets' | 'performance'>('performance');
    // No internal state/fetch for data


    // Filter assets based on selection
    const filteredAssets = useMemo(() => {
        return allAssets.filter(node => {
            if (!node) return false;
            // Sector filter
            const nodeSector = node.sector?.toLowerCase();
            if (!nodeSector) return false;

            // FIX: Allow 'All Factors' to pass through
            if (selectedSector !== 'All Factors' && nodeSector !== selectedSector.toLowerCase()) {
                // Allow Economy aggregation if needed, but for now strict
                if (!(selectedSector.toLowerCase() === 'economy' && ['mining', 'industry', 'energy'].includes(nodeSector))) {
                    return false;
                }
            }
            if (selectedRegion && node.region !== selectedRegion) {
                return false;
            }

            // Global Date Filter
            if (year) {
                const finishYear = node.completion_date ? parseInt(node.completion_date.substring(0, 4)) : null;
                // If asset finishes AFTER the selected year, filtering it.
                if (finishYear && finishYear > year) return false;
                // NOTE: We don't filter based on 'Future' status here because details panel might want to show future assets 
                // but strictly respects the Time Filter. 
                // Actually, if year < completion, it's NOT YET EXISTENT. So hide it.
            }

            return true;
        });
    }, [allAssets, selectedSector, selectedRegion, year]);

    // =========================================================================
    // DYNAMIC CHART DATA GENERATION (Aligned with HTML Logic)
    // =========================================================================

    // 1. Chart Data 1 (Left Chart)
    const chart1Data = useMemo(() => {
        if (selectedRegion) {
            // REGIONAL VIEW: Region vs National Average (Asset Count)
            const regionCounts: Record<string, number> = {};
            // USE FILTERED ASSETS or ALL? 
            // User complained about inconsistency. The chart title is "Region vs National Avg".
            // If we filter by 'Industry' sector, it should be "Industry in Region" vs "Avg Industry per Region".
            // So we MUST use filteredAssets logic (or re-filter allAssets by the CURRENT sector).

            // Re-filter allAssets by the current sector to get the "National Average" for THIS sector
            const sectorAssets = allAssets.filter(node => {
                if (selectedSector === 'All Factors') return true;
                return node.sector?.toLowerCase() === selectedSector.toLowerCase();
            });

            sectorAssets.forEach(a => {
                if (a.region) regionCounts[a.region] = (regionCounts[a.region] || 0) + 1;
            });
            const values = Object.values(regionCounts);
            const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
            const current = regionCounts[selectedRegion] || 0;

            return [
                { name: selectedRegion, value: current },
                { name: 'National Avg', value: avg }
            ];
        } else {
            // NATIONAL VIEW: Top Regions by Asset Count
            const counts: Record<string, number> = {};
            filteredAssets.forEach(a => {
                const reg = a.region || 'Unknown';
                counts[reg] = (counts[reg] || 0) + 1;
            });
            return Object.entries(counts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
        }
    }, [filteredAssets, allAssets, selectedRegion]);

    // 2. Chart Data 2 (Right Chart)
    const chart2Data = useMemo(() => {
        if (selectedRegion) {
            // REGIONAL VIEW: Local Asset Mix (Types)
            const counts: Record<string, number> = {};
            filteredAssets.forEach(a => {
                const type = a.asset_type || 'Other';
                counts[type] = (counts[type] || 0) + 1;
            });
            return Object.entries(counts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        } else {
            // NATIONAL VIEW: Sector Composition (Public vs Private)
            // Inferred from labels if available, else fallback to Status Mix
            const publicCount = filteredAssets.filter(n => n.labels?.includes('SectorGovEntity')).length;
            const privateCount = filteredAssets.filter(n => n.labels?.includes('SectorBusiness')).length;

            if (publicCount + privateCount > 0) {
                return [
                    { name: 'Public', value: publicCount, color: '#10b981' },
                    { name: 'Private', value: privateCount, color: '#3b82f6' }
                ];
            } else {
                // Fallback to Status Mix if labels missing
                let running = 0;
                let future = 0;
                filteredAssets.forEach(a => {
                    if (getSimpleStatus(a.status) === 'Running') running++;
                    else future++;
                });
                return [
                    { name: 'Operational', value: running, color: '#10b981' },
                    { name: 'Future', value: future, color: '#6366f1' }
                ].filter(d => d.value > 0);
            }
        }
    }, [filteredAssets, selectedRegion]);

    // 3. KPIs Calculation
    const totalCount = filteredAssets.length;
    const totalInvestment = filteredAssets.reduce((sum, a) => sum + parseInvestment(a.investment), 0);
    const highPriority = filteredAssets.filter(a => a.priority === 'HIGH').length;
    // Calc operational based on all filtered assets
    const opCount = filteredAssets.filter(a => getSimpleStatus(a.status) === 'Running').length;
    const operationalPct = totalCount > 0 ? Math.round((opCount / totalCount) * 100) : 0;

    const kpis: KPI[] = [
        { name: 'Total Assets', value: totalCount, unit: '', trend: 'up', color: '#fbbf24' },
        { name: 'Operational', value: operationalPct, unit: '%', trend: 'stable', color: '#10b981' },
        { name: 'Est. Investment', value: totalInvestment > 0 ? parseFloat(totalInvestment.toFixed(1)) : 'N/A', unit: totalInvestment > 0 ? 'B SAR' : '', trend: 'up', color: '#3b82f6' },
        { name: 'High Priority', value: highPriority, unit: '', trend: 'stable', color: '#f59e0b' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div className="details-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 className="details-title" style={{ textTransform: 'capitalize', margin: 0 }}>
                            {selectedSector === 'All Factors' ? 'All Sectors' : `${selectedSector} Sector`}
                        </h2>
                        <p className="details-subtitle" style={{ margin: '0.25rem 0 0 0' }}>
                            {selectedRegion ? `Region: ${selectedRegion}` : 'National Perspective'}
                        </p>
                    </div>
                    {selectedRegion && onBackToNational && (
                        <button
                            onClick={onBackToNational}
                            style={{
                                fontSize: '0.625rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#94a3b8',
                                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}
                        >
                            ← National
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 1rem', display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('performance')}
                    style={{
                        padding: '0.75rem 0', background: 'none', border: 'none',
                        color: activeTab === 'performance' ? '#fbbf24' : '#94a3b8',
                        borderBottom: activeTab === 'performance' ? '2px solid #fbbf24' : 'none',
                        cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    style={{
                        padding: '0.75rem 0', background: 'none', border: 'none',
                        color: activeTab === 'assets' ? '#fbbf24' : '#94a3b8',
                        borderBottom: activeTab === 'assets' ? '2px solid #fbbf24' : 'none',
                        cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600
                    }}
                >
                    Asset List
                </button>
            </div>

            {/* Content Switch */}
            {activeTab === 'performance' ? (
                /* Charts View (Default) */
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

                    {/* KPI Grid - Top Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {kpis.slice(0, 2).map((kpi, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>{kpi.name}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: kpi.color }}>{kpi.value}{kpi.unit}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart 1: Bar Chart (Top Regions OR Region Vs Avg) */}
                    <div style={{ marginBottom: '1.5rem', height: '180px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {selectedRegion ? 'Region vs National Avg' : 'Regional Comparison (Assets)'}
                        </div>
                        {chart1Data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chart1Data} layout="vertical" margin={{ left: 10, right: 10 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16}>
                                        {chart1Data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f0abfc'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                No data available
                            </div>
                        )}
                    </div>

                    {/* KPI Grid - Bottom Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {kpis.slice(2, 4).map((kpi, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>{kpi.name}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: kpi.color }}>{kpi.value} <span style={{ fontSize: '0.7rem' }}>{kpi.unit}</span></div>
                            </div>
                        ))}
                    </div>

                    {/* Chart 2: Donut/Pie (Composition) */}
                    <div style={{ marginBottom: '1rem', height: '180px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {selectedRegion ? 'Local Asset Mix' : 'Sector Composition'}
                        </div>
                        {chart2Data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chart2Data}
                                        innerRadius={selectedRegion ? 0 : 40} // Pie for regional, Donut for National
                                        outerRadius={60}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chart2Data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || ['#10b981', '#6366f1', '#f59e0b', '#ec4899'][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#ccc' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                No composition data
                            </div>
                        )}
                    </div>

                </div>
            ) : (
                /* Assets List View */
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="assets-list custom-scrollbar" style={{
                        flex: 1, overflowY: 'auto', padding: '1rem'
                    }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</div>
                        ) : filteredAssets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontStyle: 'italic' }}>
                                No assets found.
                            </div>
                        ) : (
                            filteredAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    className="asset-card"
                                    onClick={() => onAssetClick?.(asset.id)}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        marginBottom: '0.5rem',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white' }}>{asset.name}</div>
                                        {asset.priority === 'HIGH' && (
                                            <span style={{ fontSize: '0.5rem', padding: '2px 6px', background: 'rgba(234,179,8,0.2)', color: '#fbbf24', borderRadius: '4px', border: '1px solid rgba(234,179,8,0.4)' }}>
                                                HIGH
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.6875rem', color: '#94a3b8' }}>
                                        <span>{asset.asset_type || 'Asset'}</span>
                                        <span style={{ color: getSimpleStatus(asset.status) === 'Running' ? '#10b981' : '#6366f1' }}>
                                            ● {asset.status || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectorDetailsPanel;
