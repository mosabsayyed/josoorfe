import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import SectorHeaderNav from './sector/SectorHeaderNav';
import SectorMap from './sector/SectorMap';
import SectorDetailsPanel from './sector/SectorDetailsPanel';

// Import newly created CSS
import './sector/SectorDesk.css';

// Type definition for shared data
interface GraphNode {
    id: string;
    name?: string;
    sector?: string;
    asset_type?: string;
    status?: string;
    priority?: string;
    region?: string;
    [key: string]: any;
}

interface SectorDeskProps {
    year?: string;
    quarter?: string;
}

export const SectorDesk: React.FC<SectorDeskProps> = ({ year: propYear, quarter: propQuarter }) => {
    const [selectedPillar, setSelectedPillar] = useState('economy');
    const [selectedSector, setSelectedSector] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [focusedAssetId, setFocusedAssetId] = useState<string | null>(null);
    const [timelineFilter, setTimelineFilter] = useState<'current' | 'future' | 'both'>('both');
    const [priorityFilter, setPriorityFilter] = useState<'major' | 'strategic' | 'both'>('both');

    // Handle both Prop (JosoorShell) and Context (Legacy Desk) injection
    const outletContext = useOutletContext<{ year: string; quarter: string } | null>();
    const year = propYear || outletContext?.year;
    const quarter = propQuarter || outletContext?.quarter;

    // Data State (Single Source of Truth)
    const [allAssets, setAllAssets] = useState<GraphNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sync sector selection with pillar
    useEffect(() => {
        const PILLARS_SECTORS: { [key: string]: string[] } = {
            'society': ['health', 'livability', 'water', 'culture'],
            'economy': ['all', 'energy', 'logistics', 'industry', 'mining', 'giga'], // 'all' as first
            'nation': ['gov']
        };

        if (PILLARS_SECTORS[selectedPillar] && !PILLARS_SECTORS[selectedPillar].includes(selectedSector)) {
            setSelectedSector(PILLARS_SECTORS[selectedPillar][0]);
        }
    }, [selectedPillar]);

    // Fetch Data Once
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Entities + Connections + Regions/Cities for line endpoints + Infrastructure Projects
                const res = await fetch('/api/graph?nodeLabels=SectorGovEntity,SectorBusiness,NetworkConnection,Region,City,SectorRegion,EntityProject');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const nodes = (data.nodes || []) as GraphNode[];

                if (isMounted) {
                    // Filter out network connections for the "Assets" list, keep them if needed for map lines
                    // Actually, SectorMap needs connections too for lines. 
                    // Let's pass EVERYTHING and let children filter.
                    setAllAssets(nodes);
                    setLoading(false);
                }
            } catch (err: any) {
                console.error("SectorDesk Data Error:", err);
                if (isMounted) {
                    setError("Failed to load data");
                    setLoading(false);
                }
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    // Handler for asset selection from right panel
    const handleAssetFocus = useCallback((assetId: string) => {
        setFocusedAssetId(assetId);
        setTimeout(() => setFocusedAssetId(null), 100);
    }, []);

    // Filter assets based on ALL active filters
    const filteredAssets = useMemo(() => {
        const activeSectors = ['water', 'energy', 'mining', 'industry', 'logistics', 'giga'];

        return allAssets.filter(a => {
            // Sector filter
            if (selectedSector === 'all') {
                // "All" shows all 6 active sectors
                if (!activeSectors.includes(a.sector?.toLowerCase() || '')) {
                    return false;
                }
            } else if (selectedSector !== 'All Factors' &&
                a.sector?.toLowerCase() !== selectedSector.toLowerCase()) {
                return false;
            }

            // Timeline filter
            const status = a.status?.toLowerCase();
            const isRunning = status === 'existing' || status === 'active' || status === 'operational';
            if (timelineFilter === 'current' && !isRunning) return false;
            if (timelineFilter === 'future' && isRunning) return false;

            // Priority filter
            const priority = a.priority === 'HIGH' ? 'major' : 'strategic';
            if (priorityFilter !== 'both' && priority !== priorityFilter) return false;

            return true;
        });
    }, [allAssets, selectedSector, timelineFilter, priorityFilter]);

    // Stats calculation with region filter
    const statsAssets = useMemo(() => {
        let assets = filteredAssets;
        // Apply region filter if active
        if (selectedRegion) {
            assets = assets.filter(a => a.region === selectedRegion);
        }
        return assets;
    }, [filteredAssets, selectedRegion]);

    const existingCount = statsAssets.filter(a => {
        const status = a.status?.toLowerCase();
        return status === 'existing' || status === 'active' || status === 'operational';
    }).length;

    const plannedCount = statsAssets.length - existingCount;

    return (
        <div className="sector-desk-container-new">

            {/* TOP: Horizontal Header */}
            <SectorHeaderNav
                selectedPillar={selectedPillar}
                selectedSector={selectedSector}
                onSelectPillar={setSelectedPillar}
                onSelectSector={setSelectedSector}
                timelineFilter={timelineFilter}
                onTimelineFilterChange={setTimelineFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                existingCount={existingCount}
                plannedCount={plannedCount}
            />

            {/* MIDDLE: Map + Right Panel */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* MAP: Full width */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <SectorMap
                        selectedSector={selectedSector}
                        selectedRegion={selectedRegion}
                        onRegionSelect={setSelectedRegion}
                        focusAssetId={focusedAssetId}
                        assets={allAssets}
                        isLoading={loading}
                        year={year ? parseInt(year) : undefined}
                        quarter={quarter}
                        timelineFilter={timelineFilter}
                        priorityFilter={priorityFilter}
                    />
                </div>

                {/* RIGHT: ONLY Details + Disclaimer (NO Sidebar) */}
                <div style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid var(--component-panel-border)', background: 'var(--component-bg-primary)' }}>

                    {/* Details Panel - 90% height */}
                    <div style={{ flex: '0 0 90%', overflow: 'auto', padding: '1rem', borderBottom: '1px solid var(--component-panel-border)' }}>
                        <SectorDetailsPanel
                            selectedSector={selectedSector}
                            selectedRegion={selectedRegion}
                            onBackToNational={() => setSelectedRegion(null)}
                            onAssetClick={handleAssetFocus}
                            assets={allAssets}
                            isLoading={loading}
                            year={year ? parseInt(year) : undefined}
                            quarter={quarter}
                        />
                    </div>

                    {/* Disclaimer - 10% height */}
                    <div style={{ flex: '0 0 10%', padding: '0.75rem', display: 'flex', alignItems: 'center' }}>
                        <p style={{ margin: 0, lineHeight: '1.4', fontSize: '9px', color: '#64748b' }}>
                            <strong>Disclaimer:</strong> Data based on publicly available KSA datasets. May be out of date. Non-comprehensive, for demo purposes.
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
};
