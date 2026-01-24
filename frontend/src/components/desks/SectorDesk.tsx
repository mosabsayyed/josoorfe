import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import PillarSectorNav from './sector/PillarSectorNav';
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
    const [selectedSector, setSelectedSector] = useState('industry');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [focusedAssetId, setFocusedAssetId] = useState<string | null>(null);

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
            'economy': ['energy', 'logistics', 'industry', 'mining', 'giga'], // Added giga
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
                // Fetch Entities + Connections + Regions/Cities for line endpoints
                const res = await fetch('/api/graph?nodeLabels=SectorGovEntity,SectorBusiness,NetworkConnection,Region,City,SectorRegion');
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

    return (
        <div className="sector-desk-container">

            {/* LEFT PANEL: Navigation */}
            <div className="sector-nav-panel">
                <PillarSectorNav
                    selectedPillar={selectedPillar}
                    selectedSector={selectedSector}
                    onSelectPillar={setSelectedPillar}
                    onSelectSector={setSelectedSector}
                />
            </div>

            {/* CENTER PANEL: Map */}
            <div className="sector-map-container">
                <SectorMap
                    selectedSector={selectedSector}
                    selectedRegion={selectedRegion}
                    onRegionSelect={setSelectedRegion}
                    focusAssetId={focusedAssetId}
                    assets={allAssets}  // PASSING DATA
                    isLoading={loading}
                    year={year ? parseInt(year) : undefined}
                    quarter={quarter}
                />
            </div>

            {/* RIGHT PANEL: Details */}
            <div className="sector-details-panel">
                <SectorDetailsPanel
                    selectedSector={selectedSector}
                    selectedRegion={selectedRegion}
                    onBackToNational={() => setSelectedRegion(null)}
                    onAssetClick={handleAssetFocus}
                    assets={allAssets}  // PASSING DATA
                    isLoading={loading}
                    year={year ? parseInt(year) : undefined}
                    quarter={quarter}
                />
            </div>

        </div>
    );
};
