import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Map } from 'react-map-gl/mapbox';
import DeckGL from '@deck.gl/react';
import { BitmapLayer, IconLayer, ScatterplotLayer } from '@deck.gl/layers';
import { FlyToInterpolator } from '@deck.gl/core';
import { Layers, Filter, X, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

import {
    strategicAssets,
    StrategicAsset,
    CATEGORY_CONFIG,
    STATUS_COLORS,

    AssetCategory,
    MainCategory,
    getMainCategory,
    getSimpleStatus
} from './data/strategicAssets';
import './SectorMap.css';

// Telco overlay imports (enhanced versions)
import mobilyOverlay from '../../../assets/telco-overlays/mobily 1.png';
import stcOverlay from '../../../assets/telco-overlays/stc 1.png';
import zainOverlay from '../../../assets/telco-overlays/zain 1.png';

// Custom Map Markers (User Provided)
import iconMining from '../../../assets/map-markers/mining.svg';
import iconWater from '../../../assets/map-markers/water.svg';
import iconEnergy from '../../../assets/map-markers/energy.svg';
import iconIndustry from '../../../assets/map-markers/industry.svg';
import iconTransportation from '../../../assets/map-markers/transportation.svg';
import iconGiga from '../../../assets/map-markers/giga.svg';

// Custom Map Glows (User Provided)
import glowMining from '../../../assets/map-markers/miningg.svg';
import glowWater from '../../../assets/map-markers/waterg.svg';
import glowEnergy from '../../../assets/map-markers/energyg.svg';
import glowIndustry from '../../../assets/map-markers/industryg.svg';
import glowTransportation from '../../../assets/map-markers/transportationg.svg';
import glowGiga from '../../../assets/map-markers/gigag.svg';

// MainCategory to Custom Icon mapping
const MAIN_CATEGORY_ICONS: Record<MainCategory, string> = {
    'Mining': iconMining,
    'Water': iconWater,
    'Energy': iconEnergy,
    'Industry': iconIndustry,
    'Transportation': iconTransportation,
    'Giga': iconGiga
};

// MainCategory to Glow Icon mapping
const MAIN_CATEGORY_GLOWS: Record<MainCategory, string> = {
    'Mining': glowMining,
    'Water': glowWater,
    'Energy': glowEnergy,
    'Industry': glowIndustry,
    'Transportation': glowTransportation,
    'Giga': glowGiga
};

// MainCategory colors for map markers
const MAIN_CATEGORY_COLORS: Record<MainCategory, string> = {
    'Mining': '#d97706',      // Amber
    'Water': '#06b6d4',       // Cyan
    'Energy': '#facc15',      // Yellow
    'Industry': '#3b82f6',    // Blue
    'Transportation': '#18181b', // Black (Zinc-900 for better depth)
    'Giga': '#eab308'         // Gold
};

// Get Maki icon URL for asset's main category
const getIconForMainCategory = (mainCategory: MainCategory): string => {
    return MAIN_CATEGORY_ICONS[mainCategory] || iconIndustry;
};

// Get Glow icon URL for asset's main category
const getGlowForMainCategory = (mainCategory: MainCategory): string => {
    return MAIN_CATEGORY_GLOWS[mainCategory] || glowIndustry;
};

// Mapbox token from environment (compatible with both CRA and Vite)
const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';

// Saudi Arabia view constraints
const SAUDI_BOUNDS = {
    longitude: 45.0,
    latitude: 24.0,
    zoom: 5,
    pitch: 0,
    bearing: 0
};

// Zoom constraints to lock view to KSA
const VIEW_CONSTRAINTS = {
    minZoom: 5.0,
    maxZoom: 12,
    minPitch: 0,
    maxPitch: 0,
    minBearing: 0,
    maxBearing: 0
};

// KSA bounding box for panning restriction [west, south, east, north]
const KSA_BOUNDS: [[number, number], [number, number]] = [
    [34.0, 15.5],   // Southwest corner
    [56.5, 32.5]    // Northeast corner
];

// Image bounds for telecom overlays (Shifted west to align better)
const KSA_IMAGE_BOUNDS: [number, number, number, number] = [
    32.8,  // West (Original: 34.0)
    15.5,  // South
    55.3,  // East (Original: 56.5)
    32.5   // North
];

// Hex color to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [100, 100, 100];
};

interface DeckGLMapProps {
    year?: string;
    quarter?: string;
}

type TelcoType = 'mobily' | 'stc' | 'zain';

export function DeckGLMap({ year, quarter }: DeckGLMapProps) {
    // View state
    const [viewState, setViewState] = useState(SAUDI_BOUNDS);
    const [selectedAsset, setSelectedAsset] = useState<StrategicAsset | null>(null);


    // Asset visibility controls
    const [showFutureAssets, setShowFutureAssets] = useState(true);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedMainCategories, setSelectedMainCategories] = useState<Set<MainCategory>>(new Set());

    // Draggable Asset Panel State
    const [panelPos, setPanelPos] = useState({ x: 16, y: 16 }); // Default: top: 1rem, right: 1rem (relative to right)
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Handle panel dragging (Manual implementation since we are in a custom map component)
    const onMouseDown = (e: React.MouseEvent) => {
        const panel = (e.target as HTMLElement).closest('.asset-panel');
        if (!panel) return;

        setIsDragging(true);
        const rect = panel.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            // Calculate new position relative to the container
            // We use right/top for simplicity in current layout
            const container = document.querySelector('.saudi-map-container');
            if (!container) return;

            const contRect = container.getBoundingClientRect();

            // Positioning from the top-left of the container
            const newX = e.clientX - contRect.left - dragOffset.x;
            const newY = e.clientY - contRect.top - dragOffset.y;

            setPanelPos({ x: newX, y: newY });
        };

        const onMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Reset panel position when asset changes (optional, but keeps it predictable)
    useEffect(() => {
        if (selectedAsset) {
            // Logic to keep it on the right by default if needed, 
            // but for now we'll just let it stay where the user moved it or reset it
        }
    }, [selectedAsset]);

    // Filter assets - use MainCategory and binary status
    const filteredAssets = useMemo(() => {
        const base = strategicAssets.filter(asset => {
            // Get main category for this asset
            const mainCat = getMainCategory(asset.category, asset.subCategory);

            // Skip assets with no main category (Investor Tools)
            if (!mainCat) return false;

            // Filter by main category if any selected
            if (selectedMainCategories.size > 0 && !selectedMainCategories.has(mainCat)) return false;

            // Filter by status (Running vs Future)
            const simpleStatus = getSimpleStatus(asset.status);
            if (!showFutureAssets && simpleStatus === 'Future') return false;

            return true;
        });

        // Sort: HIGH priority on top
        return [...base].sort((a, b) => {
            const aPriority = a.priority === 'HIGH' ? 1 : 0;
            const bPriority = b.priority === 'HIGH' ? 1 : 0;
            return aPriority - bPriority;
        });
    }, [selectedMainCategories, showFutureAssets]);


    // Asset click handler

    const onAssetClick = useCallback((info: any) => {
        if (info.object) {
            setSelectedAsset(info.object);
            // Smoothly fly to the asset
            setViewState(prev => ({
                ...prev,
                longitude: info.object.long,
                latitude: info.object.lat,
                zoom: 8.5, // Regional view
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator()
            }));
        }
    }, []);

    // Create layers
    const layers = useMemo(() => {
        const layerList: any[] = [];

        /* Telecom overlays commented out temporarily as they overshot
        if (activeTelco.has('mobily')) {
            layerList.push(new BitmapLayer({
                id: 'mobily-overlay',
                bounds: KSA_IMAGE_BOUNDS,
                image: mobilyOverlay,
                opacity: 0.6
            }));
        }
        if (activeTelco.has('stc')) {
            layerList.push(new BitmapLayer({
                id: 'stc-overlay',
                bounds: KSA_IMAGE_BOUNDS,
                image: stcOverlay,
                opacity: 0.6
            }));
        }
        if (activeTelco.has('zain')) {
            layerList.push(new BitmapLayer({
                id: 'zain-overlay',
                bounds: KSA_IMAGE_BOUNDS,
                image: zainOverlay,
                opacity: 0.6
            }));
        }
        */

        const highPriorityAssets = filteredAssets.filter(a => a.priority === 'HIGH');

        // Create "Contour Halo" layers for HIGH priority assets
        // To achieve a sharp "border" effect, we use the specific *g.svg glow assets provided by the user.
        // These are rendered behind the main icon.
        layerList.push(new IconLayer({
            id: 'priority-halo-border',
            data: highPriorityAssets,
            getPosition: (d: StrategicAsset) => [d.long, d.lat],
            getIcon: (d: StrategicAsset) => {
                const mainCat = getMainCategory(d.category, d.subCategory);
                return {
                    url: mainCat ? getGlowForMainCategory(mainCat) : glowIndustry,
                    width: 123, // Match original SVG width
                    height: 176, // Match original SVG height
                    anchorX: 61.5,
                    anchorY: 176,
                    mask: false // FALSE to show original glow colors (gold)
                };
            },
            // No programmatic coloring, use original SVG colors
            getColor: [255, 255, 255, 255],
            getSize: (d: StrategicAsset) => (selectedAsset?.id === d.id ? 90 : 60),
            sizeScale: 1.25, // Scale up slightly to peek out from behind
            sizeMinPixels: 28,
            pickable: false,
            updateTriggers: {
                getSize: selectedAsset?.id
            }
        }));

        // Asset markers layer
        layerList.push(new IconLayer({
            id: 'asset-markers',
            data: filteredAssets,
            getPosition: (d: StrategicAsset) => [d.long, d.lat],
            getIcon: (d: StrategicAsset) => {
                const mainCat = getMainCategory(d.category, d.subCategory);
                return {
                    url: mainCat ? getIconForMainCategory(mainCat) : iconIndustry,
                    width: 123, // Match original SVG width
                    height: 176, // Match original SVG height
                    anchorX: 61.5, // Center horizontally
                    anchorY: 176,  // Anchor at the bottom tip
                    mask: false  // Show original SVG colors
                };
            },
            getColor: (d: StrategicAsset) => {
                // Solid opaque markers
                return [255, 255, 255, 255];
            },
            getSize: (d: StrategicAsset) => (selectedAsset?.id === d.id ? 90 : 60),
            sizeScale: 1,
            sizeMinPixels: 24,
            sizeMaxPixels: 120,
            pickable: true,
            onClick: onAssetClick,
            updateTriggers: {
                getSize: selectedAsset?.id,
                getColor: selectedAsset?.id
            }
        }));

        return layerList;
    }, [filteredAssets, selectedAsset, onAssetClick, showFutureAssets]);



    const toggleMainCategory = (cat: MainCategory) => {
        setSelectedMainCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    // All 6 main categories
    const allMainCategories: MainCategory[] = ['Mining', 'Water', 'Energy', 'Industry', 'Transportation', 'Giga'];

    // Count running vs future assets
    const runningCount = filteredAssets.filter(a => getSimpleStatus(a.status) === 'Running').length;
    const futureCount = filteredAssets.filter(a => getSimpleStatus(a.status) === 'Future').length;

    return (
        <div className="saudi-map-container">
            <DeckGL
                viewState={viewState as any}
                onViewStateChange={({ viewState: vs }: any) => {
                    // Force strictly zero pitch and bearing
                    const zoom = Math.max(VIEW_CONSTRAINTS.minZoom, Math.min(VIEW_CONSTRAINTS.maxZoom, vs.zoom));

                    // Clamp coordinates to KSA bounds to prevent panning away
                    const longitude = Math.max(KSA_BOUNDS[0][0], Math.min(KSA_BOUNDS[1][0], vs.longitude));
                    const latitude = Math.max(KSA_BOUNDS[0][1], Math.min(KSA_BOUNDS[1][1], vs.latitude));

                    setViewState({
                        ...vs,
                        zoom,
                        longitude,
                        latitude,
                        pitch: 0,
                        bearing: 0,
                        // CRITICAL FIX: Clear transition duration/interpolator during manual panning
                        // to prevent "rubber-banding" or lag between marker and map.
                        transitionDuration: 0,
                        transitionInterpolator: null
                    });
                }}
                controller={{
                    dragRotate: false,
                    touchRotate: false,
                    dragPan: true,
                    scrollZoom: true,
                    doubleClickZoom: true,
                    touchZoom: true,
                    keyboard: false
                }}
                getCursor={({ isHovering, isDragging }) => {
                    if (isHovering) return 'pointer';
                    if (isDragging) return 'grabbing';
                    return 'grab';
                }}
                layers={layers}
                style={{ width: '100%', height: '100%' }}
                getTooltip={({ object }: any) => {
                    if (!object) return null;
                    const mainCat = getMainCategory(object.category, object.subCategory);
                    return {
                        html: `<div style="padding: 8px; font-size: 13px;">
                            <strong>${object.name}</strong><br/>
                            <span style="color: ${mainCat ? MAIN_CATEGORY_COLORS[mainCat] : '#888'}">${mainCat || object.category}</span>
                            <span style="margin-left: 8px; opacity: 0.7">${object.subCategory}</span><br/>
                            <span style="opacity: 0.7">${object.status}</span>
                        </div>`,
                        style: {
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            color: 'white',
                            borderRadius: '4px'
                        }
                    };
                }}
            >
                <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/mapbox/navigation-night-v1"
                    style={{ width: '100%', height: '100%' }}
                    maxBounds={KSA_BOUNDS}
                    interactive={false}
                />

            </DeckGL>


            <button
                className="filter-toggle-btn"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
                <Filter size={16} />
                Asset Sectors
                {showFilterPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Fixed Asset Overview Stats */}
            <div className="map-stats-panel">
                <div className="stat-item">
                    <span className="stat-label">Running</span>
                    <span className="stat-value" style={{ color: '#10b981' }}>{runningCount}</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-label">Future</span>
                    <span className="stat-value" style={{ color: '#6366f1' }}>{futureCount}</span>
                </div>
            </div>


            {/* Filter Panel */}
            {
                showFilterPanel && (
                    <div className="filter-panel">
                        {/* Future Assets Toggle */}
                        <div className="panel-section">
                            <button
                                className={`future-toggle-btn ${showFutureAssets ? 'active' : ''}`}
                                onClick={() => setShowFutureAssets(!showFutureAssets)}
                            >
                                {showFutureAssets ? <Eye size={16} /> : <EyeOff size={16} />}
                                {showFutureAssets ? 'Showing Future Assets' : 'Future Assets Hidden'}
                            </button>
                        </div>

                        <div className="panel-section">
                            <h4>Sectors</h4>
                            <div className="filter-chips">
                                {allMainCategories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`filter-chip ${selectedMainCategories.has(cat) ? 'active' : ''}`}
                                        style={{ borderColor: MAIN_CATEGORY_COLORS[cat] }}
                                        onClick={() => toggleMainCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {selectedMainCategories.size > 0 && (
                            <button className="clear-filters-btn" onClick={() => setSelectedMainCategories(new Set())}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                )
            }

            {/* Asset Details Panel */}
            {
                selectedAsset && (
                    <div
                        className={`asset-panel ${isDragging ? 'dragging' : ''}`}
                        style={{
                            left: isDragging ? `${panelPos.x}px` : (panelPos.x !== 16 ? `${panelPos.x}px` : 'auto'),
                            top: `${panelPos.y}px`,
                            position: 'absolute',
                            right: isDragging || panelPos.x !== 16 ? 'auto' : '1rem' // Initial position behavior
                        }}
                    >
                        <div className="panel-header" onMouseDown={onMouseDown} style={{ cursor: 'grab' }}>
                            <span className="panel-title">ASSET DETAILS</span>
                            <button
                                onClick={() => {
                                    setSelectedAsset(null);
                                    // Smoothly fly back to full KSA view
                                    setViewState(prev => ({
                                        ...prev,
                                        ...SAUDI_BOUNDS,
                                        transitionDuration: 1000,
                                        transitionInterpolator: new FlyToInterpolator()
                                    }));
                                }}
                                className="panel-close-btn"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="panel-content">
                            <h2 className="asset-name">{selectedAsset.name}</h2>
                            <div className="asset-meta">
                                <span className="asset-category" style={{ color: MAIN_CATEGORY_COLORS[getMainCategory(selectedAsset.category, selectedAsset.subCategory) || 'Industry'] }}>
                                    {getMainCategory(selectedAsset.category, selectedAsset.subCategory) || selectedAsset.category}
                                </span>
                                <span className="asset-subcategory">{selectedAsset.subCategory}</span>
                            </div>
                            <span
                                className="status-badge"
                                style={{ backgroundColor: STATUS_COLORS[selectedAsset.status] + '22', color: STATUS_COLORS[selectedAsset.status], borderColor: STATUS_COLORS[selectedAsset.status] }}
                            >
                                ● {selectedAsset.status}
                            </span>

                            <div className="asset-details">
                                <div className="detail-row">
                                    <span className="detail-label">Region</span>
                                    <span className="detail-value">{selectedAsset.region}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Capacity</span>
                                    <span className="detail-value">{selectedAsset.capacity}</span>
                                </div>
                                {selectedAsset.investment && (
                                    <div className="detail-row" style={{ borderLeft: '2px solid #eab308' }}>
                                        <span className="detail-label" style={{ color: '#eab308' }}>Investment</span>
                                        <span className="detail-value" style={{ color: '#eab308', fontWeight: 700 }}>{selectedAsset.investment}</span>
                                    </div>
                                )}
                                {selectedAsset.priority && (
                                    <div className="detail-row">
                                        <span className="detail-label">Strategic Priority</span>
                                        <span className="detail-value" style={{ color: '#eab308', fontWeight: 700, textShadow: '0 0 8px rgba(234,179,8,0.4)' }}>
                                            {selectedAsset.priority}
                                        </span>
                                    </div>
                                )}

                                {selectedAsset.fiscalAction && (
                                    <div className="detail-row">
                                        <span className="detail-label">Fiscal Action</span>
                                        <span className="detail-value" style={{ fontStyle: 'italic' }}>{selectedAsset.fiscalAction}</span>
                                    </div>
                                )}
                                {selectedAsset.rationale && (
                                    <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                                        <span className="detail-label">Rationale</span>
                                        <span className="detail-value" style={{ whiteSpace: 'normal', fontSize: '0.8rem', lineHeight: 1.4, color: 'rgba(255,255,255,0.8)' }}>{selectedAsset.rationale}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Description</span>
                                    <span className="detail-value">{selectedAsset.description}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Coordinates</span>
                                    <span className="detail-value">{selectedAsset.lat.toFixed(4)}, {selectedAsset.long.toFixed(4)}</span>
                                </div>
                            </div>

                            <a
                                href={`https://www.google.com/maps?q=${selectedAsset.lat},${selectedAsset.long}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="google-maps-link"
                            >
                                Open in Google Maps →
                            </a>
                        </div>
                    </div>
                )
            }

            {/* Legend */}
            <div className="legend-container">
                <div className="legend-header">
                    <div className="legend-dot" />
                    Legend
                </div>
                <div className="legend-section">
                    <div className="legend-subtitle">Sectors</div>
                    {(Object.keys(MAIN_CATEGORY_ICONS) as MainCategory[]).map(cat => (
                        <div key={cat} className="legend-item">
                            <img
                                src={MAIN_CATEGORY_ICONS[cat]}
                                alt={cat}
                                style={{
                                    width: '1.5rem',
                                    height: '1.5rem',
                                    objectFit: 'contain',
                                    flexShrink: 0,
                                    filter: `drop-shadow(0 0 2px ${MAIN_CATEGORY_COLORS[cat]})`
                                }}
                            />
                            <span className="legend-label" style={{ color: MAIN_CATEGORY_COLORS[cat], fontSize: '0.875rem' }}>{cat}</span>
                        </div>
                    ))}
                </div>
                <div className="legend-section">
                    <div className="legend-subtitle">Asset Count: {filteredAssets.length}</div>
                </div>
            </div>
            {/* Data Disclaimer */}
            <div className="map-disclaimer">
                Data based on KSA public Sector datasets publicly available. Data shown is indicative and non-comprehnesive and might be out of date.
            </div>
        </div >
    );
}
