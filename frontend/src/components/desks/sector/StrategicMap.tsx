import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Layers, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
    strategicAssets,
    StrategicAsset,
    regionalHeatmaps,
    saudiGeoJson,
    ksaRegions,
    HEATMAP_LAYERS,
    CATEGORY_CONFIG,
    STATUS_COLORS,
    STATUS_GROUPS,
    AssetCategory
} from './data/strategicAssets';
import './SectorMap.css';

// Telco overlay imports
import mobilyOverlay from '../../../assets/telco-overlays/mobily.png';
import stcOverlay from '../../../assets/telco-overlays/stc.png';
import zainOverlay from '../../../assets/telco-overlays/zain.png';

// Original icons for fallback
import factoryIcon from '../../../assets/d06a8c9edb7a3c4705388fb7f4e1e9dd775f2172.png';
import mapOutline from '../../../assets/ab5ac211c3c610f7bdfcd6d4a2384b98355ce7e5.png';

// Calculate exact GeoJSON bounds
const calculateGeoJsonBounds = () => {
    const coords = saudiGeoJson.features[0].geometry.coordinates[0];
    let minLong = Infinity, maxLong = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    coords.forEach((coord: number[]) => {
        const [long, lat] = coord;
        minLong = Math.min(minLong, long);
        maxLong = Math.max(maxLong, long);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
    });

    return { minLong, maxLong, minLat, maxLat };
};

const BOUNDS = calculateGeoJsonBounds();

// Convert geo coordinates to SVG percentage (0-100) - FOR MAP POLYGON ONLY (5% smaller)
const geoToPercentMap = (long: number, lat: number) => {
    const x = ((long - BOUNDS.minLong) / (BOUNDS.maxLong - BOUNDS.minLong)) * 100;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;

    const centerX = 50;
    const centerY = 50;
    const scaledX = centerX + (x - centerX) * 0.95;
    const scaledY = centerY + (y - centerY) * 0.95;

    return { x: scaledX, y: scaledY };
};

// Convert geo coordinates to SVG percentage (0-100) - FOR ASSETS (20% larger)
const geoToPercent = (long: number, lat: number) => {
    const x = ((long - BOUNDS.minLong) / (BOUNDS.maxLong - BOUNDS.minLong)) * 100;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;

    const centerX = 50;
    const centerY = 50;
    const scaledX = centerX + (x - centerX) * 1.2;
    const scaledY = centerY + (y - centerY) * 1.2;

    return { x: scaledX, y: scaledY };
};

// Convert GeoJSON to SVG path
const geoJsonToSvgPath = () => {
    const coords = saudiGeoJson.features[0].geometry.coordinates[0];
    let path = '';

    coords.forEach((coord: number[], index: number) => {
        const [long, lat] = coord;
        const { x, y } = geoToPercentMap(long, lat);

        if (index === 0) {
            path += `M ${x} ${y} `;
        } else {
            path += `L ${x} ${y} `;
        }
    });
    path += 'Z';

    return path;
};

// Interpolate color for heatmap
const interpolateColor = (value: number, min: number, max: number, colors: string[]) => {
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    // Simple linear interpolation between two colors
    const startColor = colors[0];
    const endColor = colors[1];

    // Parse hex colors
    const start = {
        r: parseInt(startColor.slice(1, 3), 16),
        g: parseInt(startColor.slice(3, 5), 16),
        b: parseInt(startColor.slice(5, 7), 16)
    };
    const end = {
        r: parseInt(endColor.slice(1, 3), 16),
        g: parseInt(endColor.slice(3, 5), 16),
        b: parseInt(endColor.slice(5, 7), 16)
    };

    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
};

interface SectorMapProps {
    year?: string;
    quarter?: string;
}

type HeatmapType = 'healthcare' | 'education' | 'projects' | 'foodSecurity' | 'digital';
type TelcoType = 'mobily' | 'stc' | 'zain';

export function StrategicMap({ year, quarter }: SectorMapProps) {
    // View state
    const [selectedAsset, setSelectedAsset] = useState<StrategicAsset | null>(null);
    const [isZoomedIn, setIsZoomedIn] = useState(false);
    const [zoomedAssetId, setZoomedAssetId] = useState<string | null>(null);
    const [showOutline, setShowOutline] = useState(true);

    // Layer controls
    const [activeHeatmaps, setActiveHeatmaps] = useState<Set<HeatmapType>>(new Set());
    const [activeTelco, setActiveTelco] = useState<Set<TelcoType>>(new Set());
    const [showLayerPanel, setShowLayerPanel] = useState(false);

    // Filter controls
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<Set<AssetCategory>>(new Set());
    const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());

    // ViewBox animation
    const [animatedViewBox, setAnimatedViewBox] = useState('0 0 100 100');
    const animationFrameRef = useRef<number | null>(null);
    const viewBoxRef = useRef('0 0 100 100');

    // Filter assets based on selections
    const filteredAssets = useMemo(() => {
        return strategicAssets.filter(asset => {
            // Category filter
            if (selectedCategories.size > 0 && !selectedCategories.has(asset.category)) {
                return false;
            }
            // Status filter
            if (selectedStatuses.size > 0 && !selectedStatuses.has(asset.status)) {
                return false;
            }
            // Exclude "Investor Tool" from map (they don't have real coords)
            if (asset.category === 'Investor Tool') {
                return false;
            }
            return true;
        });
    }, [selectedCategories, selectedStatuses]);

    // ViewBox animation effect
    useEffect(() => {
        let targetViewBox = '0 0 100 100';

        if (isZoomedIn && zoomedAssetId) {
            const asset = strategicAssets.find(a => a.id === zoomedAssetId);
            if (asset) {
                const { x, y } = geoToPercent(asset.long, asset.lat);
                targetViewBox = `${x - 20} ${y - 20} 40 40`;
            }
        }

        const animate = () => {
            setAnimatedViewBox(prevBox => {
                viewBoxRef.current = prevBox;

                const [px, py, pw, ph] = prevBox.split(' ').map(Number);
                const [tx, ty, tw, th] = targetViewBox.split(' ').map(Number);

                const dx = tx - px;
                const dy = ty - py;
                const dw = tw - pw;
                const dh = th - ph;

                if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dw) < 0.1) {
                    viewBoxRef.current = targetViewBox;
                    return targetViewBox;
                }

                const ease = 0.1;
                const nextBox = `${px + dx * ease} ${py + dy * ease} ${pw + dw * ease} ${ph + dh * ease}`;
                viewBoxRef.current = nextBox;
                return nextBox;
            });

            if (isZoomedIn) {
                setShowOutline(false);
            } else {
                const currentWidth = parseFloat(viewBoxRef.current.split(' ')[2]);
                if (currentWidth > 80) setShowOutline(true);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isZoomedIn, zoomedAssetId]);

    const handleAssetClick = (asset: StrategicAsset) => {
        setSelectedAsset(asset);
        if (!isZoomedIn) {
            setIsZoomedIn(true);
            setZoomedAssetId(asset.id);
        }
    };

    const zoomOut = () => {
        setIsZoomedIn(false);
        setZoomedAssetId(null);
        setSelectedAsset(null);
    };

    const toggleHeatmap = (type: HeatmapType) => {
        setActiveHeatmaps(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    };

    const toggleTelco = (type: TelcoType) => {
        setActiveTelco(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    };

    const toggleCategory = (cat: AssetCategory) => {
        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) {
                next.delete(cat);
            } else {
                next.add(cat);
            }
            return next;
        });
    };

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev => {
            const next = new Set(prev);
            if (next.has(status)) {
                next.delete(status);
            } else {
                next.add(status);
            }
            return next;
        });
    };

    // Get all unique categories and statuses
    const allCategories = [...new Set(strategicAssets.map(a => a.category))].filter(c => c !== 'Investor Tool');
    const allStatuses = [...new Set(strategicAssets.map(a => a.status))];

    return (
        <div className="saudi-map-container">
            {/* Map Container */}
            <div className="map-view-container">
                <div className="map-wrapper" style={{ aspectRatio: '1.0', width: '100%', height: '100%' }}>

                    {/* SVG Map */}
                    <svg
                        className="map-svg"
                        viewBox={animatedViewBox}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Defs */}
                        <defs>
                            <linearGradient id="saudiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                            </linearGradient>
                            <linearGradient id="saudiFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
                            </linearGradient>
                        </defs>

                        {/* Saudi Arabia Shape */}
                        <path
                            d={geoJsonToSvgPath()}
                            fill="url(#saudiFillGradient)"
                            stroke="url(#saudiGradient)"
                            strokeWidth="0.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            opacity="0.8"
                        />

                        {/* Heatmap Region Overlays */}
                        {activeHeatmaps.size > 0 && regionalHeatmaps.map(region => {
                            const { x, y } = geoToPercent(region.centroidLong, region.centroidLat);

                            // Get the first active heatmap for color
                            const activeType = Array.from(activeHeatmaps)[0];
                            const config = HEATMAP_LAYERS[activeType];
                            const value = region[activeType];
                            const color = interpolateColor(value, config.min, config.max, config.colors);
                            const radius = 6 + (value / config.max) * 8;

                            return (
                                <circle
                                    key={region.name}
                                    cx={x}
                                    cy={y}
                                    r={radius}
                                    fill={color}
                                    opacity={0.6}
                                    stroke={color}
                                    strokeWidth={0.3}
                                />
                            );
                        })}

                        {/* Region Labels */}
                        {ksaRegions.map(region => {
                            const { x, y } = geoToPercent(region.long, region.lat);
                            return (
                                <g key={region.id}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="0.5"
                                        fill="#64748b"
                                        stroke="#94a3b8"
                                        strokeWidth="0.1"
                                    />
                                    <text
                                        x={x + 1}
                                        y={y + 0.3}
                                        fontSize="1.0"
                                        fill="#94a3b8"
                                        fontWeight="500"
                                    >
                                        {region.name}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Asset Markers */}
                        {filteredAssets.map(asset => {
                            const { x, y } = geoToPercent(asset.long, asset.lat);
                            const categoryConfig = CATEGORY_CONFIG[asset.category];
                            const statusColor = STATUS_COLORS[asset.status] || '#64748b';
                            const isSelected = selectedAsset?.id === asset.id;

                            return (
                                <g
                                    key={asset.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleAssetClick(asset)}
                                >
                                    {/* Glow effect */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isSelected ? 5 : 3}
                                        fill={statusColor}
                                        opacity={0.3}
                                    />
                                    {/* Main marker */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isSelected ? 2.5 : 1.5}
                                        fill={categoryConfig.color}
                                        stroke={statusColor}
                                        strokeWidth={0.4}
                                    />
                                    {/* Label on zoom */}
                                    {isZoomedIn && (
                                        <text
                                            x={x}
                                            y={y + 3.5}
                                            fontSize="1.2"
                                            fill="#e2e8f0"
                                            fontWeight="600"
                                            textAnchor="middle"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {asset.id} {asset.name.length > 20 ? asset.name.substring(0, 17) + '...' : asset.name}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Telco Overlays */}
                    {activeTelco.has('mobily') && (
                        <img
                            src={mobilyOverlay}
                            alt="Mobily Coverage"
                            className="telco-overlay"
                            style={{ opacity: 0.6 }}
                        />
                    )}
                    {activeTelco.has('stc') && (
                        <img
                            src={stcOverlay}
                            alt="STC Coverage"
                            className="telco-overlay"
                            style={{ opacity: 0.6 }}
                        />
                    )}
                    {activeTelco.has('zain') && (
                        <img
                            src={zainOverlay}
                            alt="Zain Coverage"
                            className="telco-overlay"
                            style={{ opacity: 0.6 }}
                        />
                    )}

                    {/* Map Outline */}
                    {showOutline && (
                        <img
                            src={mapOutline}
                            alt="Saudi Arabia Outline"
                            className="map-outline-overlay"
                            style={{ opacity: 0.6, objectFit: 'contain', mixBlendMode: 'screen' }}
                        />
                    )}
                </div>
            </div>

            {/* Layer Panel Toggle */}
            <button
                className="layer-toggle-btn"
                onClick={() => setShowLayerPanel(!showLayerPanel)}
            >
                <Layers size={16} />
                Layers
                {showLayerPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Layer Panel */}
            {showLayerPanel && (
                <div className="layer-panel">
                    <div className="panel-section">
                        <h4>Heatmaps</h4>
                        {Object.entries(HEATMAP_LAYERS).map(([key, config]) => (
                            <label key={key} className="layer-checkbox">
                                <input
                                    type="checkbox"
                                    checked={activeHeatmaps.has(key as HeatmapType)}
                                    onChange={() => toggleHeatmap(key as HeatmapType)}
                                />
                                <span className="layer-color" style={{ background: config.colors[1] }} />
                                {config.label}
                            </label>
                        ))}
                    </div>
                    <div className="panel-section">
                        <h4>Telecom Coverage</h4>
                        <label className="layer-checkbox">
                            <input type="checkbox" checked={activeTelco.has('mobily')} onChange={() => toggleTelco('mobily')} />
                            <span className="layer-color" style={{ background: '#7c3aed' }} />
                            Mobily
                        </label>
                        <label className="layer-checkbox">
                            <input type="checkbox" checked={activeTelco.has('stc')} onChange={() => toggleTelco('stc')} />
                            <span className="layer-color" style={{ background: '#dc2626' }} />
                            STC
                        </label>
                        <label className="layer-checkbox">
                            <input type="checkbox" checked={activeTelco.has('zain')} onChange={() => toggleTelco('zain')} />
                            <span className="layer-color" style={{ background: '#10b981' }} />
                            Zain
                        </label>
                    </div>
                </div>
            )}

            {/* Filter Panel Toggle */}
            <button
                className="filter-toggle-btn"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
                <Filter size={16} />
                Filter ({filteredAssets.length}/{strategicAssets.length - 4})
                {showFilterPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Filter Panel */}
            {showFilterPanel && (
                <div className="filter-panel">
                    <div className="panel-section">
                        <h4>Categories</h4>
                        <div className="filter-chips">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-chip ${selectedCategories.has(cat) ? 'active' : ''}`}
                                    style={{ borderColor: CATEGORY_CONFIG[cat]?.color || '#64748b' }}
                                    onClick={() => toggleCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="panel-section">
                        <h4>Status</h4>
                        <div className="filter-chips">
                            {allStatuses.map(status => (
                                <button
                                    key={status}
                                    className={`filter-chip ${selectedStatuses.has(status) ? 'active' : ''}`}
                                    style={{ borderColor: STATUS_COLORS[status] || '#64748b' }}
                                    onClick={() => toggleStatus(status)}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    {(selectedCategories.size > 0 || selectedStatuses.size > 0) && (
                        <button className="clear-filters-btn" onClick={() => { setSelectedCategories(new Set()); setSelectedStatuses(new Set()); }}>
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Back Button */}
            {isZoomedIn && (
                <button onClick={zoomOut} className="back-btn">
                    <ArrowLeft className="back-icon" />
                    RETURN TO KINGDOM VIEW
                </button>
            )}

            {/* Asset Details Panel */}
            {selectedAsset && (
                <div className="asset-panel">
                    <div className="panel-header">
                        <span className="panel-title">ASSET DETAILS</span>
                        <button onClick={() => setSelectedAsset(null)} className="panel-close-btn">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="panel-content">
                        <h2 className="asset-name">{selectedAsset.name}</h2>
                        <div className="asset-meta">
                            <span className="asset-category" style={{ color: CATEGORY_CONFIG[selectedAsset.category]?.color }}>
                                {selectedAsset.category}
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
            )}

            {/* Legend */}
            <div className="legend-container">
                <div className="legend-header">
                    <div className="legend-dot" />
                    Legend
                </div>
                <div className="legend-section">
                    <div className="legend-subtitle">Asset Status</div>
                    {Object.entries(STATUS_COLORS).map(([status, color]) => (
                        <div key={status} className="legend-item">
                            <span className="legend-circle" style={{ backgroundColor: color }} />
                            <span className="legend-label">{status}</span>
                        </div>
                    ))}
                </div>
                <div className="legend-section">
                    <div className="legend-subtitle">Asset Count: {filteredAssets.length}</div>
                </div>
            </div>
        </div>
    );
}
