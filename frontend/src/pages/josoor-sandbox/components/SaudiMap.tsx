import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { ksaData, saudiGeoJson } from '../../../data/ksaData';
import { getSectorValueChain, transformToMapEntities, MapEntity } from '../../../services/sectorService';
import './SaudiMap.css';

// Import icons (Public Assets) - Using relative paths to ensure resolution
import factoryIcon from '../../../assets/d06a8c9edb7a3c4705388fb7f4e1e9dd775f2172.png';
import layersIcon from '../../../assets/d8f139bc6eb42908fc05a27d7464940450f1ebce.png';
import buildingsIcon from '../../../assets/bd89c9093f7e2782417c2cf0a6e772f9b40df676.png';
import cityIcon from '../../../assets/425f09a50feb64694c6b2c3a1203e88b8090d79e.png';
import chipIcon from '../../../assets/d90d9826020dfd8a2255a0b0a04f11ea09dcb3cc.png';
import mapOutline from '../../../assets/ab5ac211c3c610f7bdfcd6d4a2384b98355ce7e5.png';

// Interfaces for local types if needed, or import from service
interface Plant {
    id: string;
    name: string;
    status: string;
    coords: number[];
    sectors: any;
    fundingSource: string;
    quarterLaunched: string;
    capacity: number;
    jobs: string;
    revenue: string;
    region?: string;
    type?: string;
}

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

    // Scale down map by 5% from center
    const centerX = 50;
    const centerY = 50;
    const scaledX = centerX + (x - centerX) * 0.95;
    const scaledY = centerY + (y - centerY) * 0.95;

    return { x: scaledX, y: scaledY };
};

// Convert geo coordinates to SVG percentage (0-100) - FOR CITIES/PLANTS (20% larger)
const geoToPercent = (long: number, lat: number) => {
    // First convert to 0-100 range
    const x = ((long - BOUNDS.minLong) / (BOUNDS.maxLong - BOUNDS.minLong)) * 100;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;

    // Scale from center by 20% to match the map
    const centerX = 50;
    const centerY = 50;
    const scaledX = centerX + (x - centerX) * 1.2;
    const scaledY = centerY + (y - centerY) * 1.2;

    return { x: scaledX, y: scaledY };
};

// Convert GeoJSON to SVG path - USES UNSCALED COORDINATES
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

interface SaudiMapProps {
    year?: string;
    quarter?: string;
}

export function SaudiMap({ year, quarter }: SaudiMapProps) {
    const [showFuture, setShowFuture] = useState(false);
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
    const [isZoomedIn, setIsZoomedIn] = useState(false);
    const [zoomedPlantId, setZoomedPlantId] = useState<string | null>(null);

    // New state for API data - No Fallback
    const [mapPlants, setMapPlants] = useState<MapEntity[]>([]);
    const [mapFlows, setMapFlows] = useState<any[]>([]); // TODO: Type flows
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from API
    useEffect(() => {
        const fetchSectorData = async () => {
            setIsLoading(true);
            try {
                // Use live data from verified API
                // const data = await getSectorValueChain(year, quarter);
                const data = null; // FORCE LOCAL as per user request (map uses mock data)

                if (data && data.nodes) {
                    // Transform API nodes to UI Entities
                    const entities = transformToMapEntities(data.nodes);
                    console.log("Mapped Entities:", entities);
                    setMapPlants(entities);
                    // TODO: Transform flows similarly if API provides them, else fallback to ksaData for flows only
                    setMapFlows(ksaData.flows);
                } else {
                    // Use ksaData as default/fallback if API returns empty
                    setMapPlants(ksaData.plants as any[]);
                    setMapFlows(ksaData.flows);
                }
            } catch (err) {
                console.error('Failed to fetch sector data', err);
                setError("Failed to connect to backend");
                // Fallback to local data
                setMapPlants(ksaData.plants as any[]);
                setMapFlows(ksaData.flows);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSectorData();
    }, [year, quarter]); // Depend on year/quarter

    // Animated viewBox state for smooth transitions
    const [animatedViewBox, setAnimatedViewBox] = useState('0 0 100 100');
    const animationFrameRef = useRef<number | null>(null);

    // State to control outline visibility with delay on zoom out
    const [showOutline, setShowOutline] = useState(true);

    // Smooth viewBox animation when zoom state changes
    useEffect(() => {
        const targetViewBox = isZoomedIn && zoomedPlantId
            ? (() => {
                // Fallback to finding in mapPlants first, then ksaData if needed
                const plant = mapPlants.find(p => p.id === zoomedPlantId) || ksaData.plants.find(p => p.id === zoomedPlantId);
                if (plant && plant.coords) {
                    const { x, y } = geoToPercent(plant.coords[0], plant.coords[1]);
                    const zoomSize = 40;
                    return `${x - zoomSize / 2} ${y - zoomSize / 2} ${zoomSize} ${zoomSize}`;
                }
                return '0 0 100 100';
            })()
            : '0 0 100 100';

        // Handle outline visibility
        if (isZoomedIn) {
            // Zoom in: hide outline immediately
            setShowOutline(false);
        }
        // Zoom out: delay outline appearance until animation completes
        // (handled in animation completion callback below)

        // Parse current and target viewBox values
        const parseViewBox = (vb: string) => vb.split(' ').map(Number);
        const current = parseViewBox(animatedViewBox);
        const target = parseViewBox(targetViewBox);

        const duration = 700; // milliseconds
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Interpolate each viewBox value
            const interpolated = current.map((start, i) => {
                const end = target[i];
                return start + (end - start) * eased;
            });

            setAnimatedViewBox(interpolated.join(' '));

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete
                if (!isZoomedIn) {
                    // Zoom out complete: now show the outline
                    setShowOutline(true);
                }
            }
        };

        // Cancel any ongoing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        // Start animation
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isZoomedIn, zoomedPlantId, mapPlants]);

    // Filter plants - Only render those with VALID COORDS
    const visiblePlants = showFuture
        ? mapPlants.filter(p => p.coords && p.coords.length === 2)
        : mapPlants.filter(p => {
            // Debug log for filtering
            // console.log(`Plant ${p.name}: Status=${(p as any).status}, Coords=${p.coords}`);
            return ((p as any).status === 'operational' || (p as any).status === 'at-risk' || (p as any).status === 'Operational') && p.coords && p.coords.length === 2;
        });

    console.log('Total Map Plants:', mapPlants.length);
    console.log('Visible Plants:', visiblePlants.length);
    if (visiblePlants.length > 0) {
        console.log('First Visible Plant:', visiblePlants[0]);
        console.log('First Plant Coords:', visiblePlants[0].coords);
        console.log('Converted Percent:', geoToPercent(visiblePlants[0].coords[0], visiblePlants[0].coords[1]));
    }

    // Generate supporting assets around zoomed plant
    const generateSupportingAssets = (mainPlant: any) => {
        const assets: any[] = [];
        const baseCoords = geoToPercent(mainPlant.coords[0], mainPlant.coords[1]);

        const assetTypes = [
            { icon: buildingsIcon, name: 'Urban Zone', angle: 0 },
            { icon: cityIcon, name: 'Distribution Center', angle: 60 },
            { icon: chipIcon, name: 'Control Station', angle: 120 },
            { icon: buildingsIcon, name: 'Treatment Facility', angle: 180 },
            { icon: cityIcon, name: 'Pump Station', angle: 240 },
            { icon: chipIcon, name: 'Monitoring Hub', angle: 300 }
        ];

        assetTypes.forEach((asset) => {
            const angleRad = (asset.angle) * (Math.PI / 180);
            const offsetX = 8 * Math.cos(angleRad);
            const offsetY = 8 * Math.sin(angleRad);

            assets.push({
                x: baseCoords.x + offsetX,
                y: baseCoords.y + offsetY,
                icon: asset.icon,
                name: asset.name
            });
        });

        return assets;
    };

    const handlePlantClick = (plant: any) => {
        setSelectedPlant(plant);
        if (!isZoomedIn) {
            setIsZoomedIn(true);
            setZoomedPlantId(plant.id);
        }
    };

    const zoomOut = () => {
        setIsZoomedIn(false);
        setZoomedPlantId(null);
        setSelectedPlant(null);
    };

    return (
        <div className="saudi-map-container" style={{ background: 'transparent', height: '100%' }}>
            {/* Map Container with fixed viewBox for perfect coordinate stability */}
            <div className="map-view-container" style={{ padding: 0 }}>
                <div
                    className="map-wrapper"
                    style={{
                        aspectRatio: '1.0',
                        transform: 'scale(0.9)', // Adjusted scale for fit
                        transformOrigin: 'center',
                        width: '100%',
                        height: '100%'
                    }}
                >

                    {/* Messages */}
                    {/* Messages */}
                    {/* {isLoading && <div className="map-loading-overlay">Loading Sector Data...</div>} */}
                    {error && <div className="map-error-overlay">Error: {error}</div>}

                    {/* SVG Map - uses viewBox for perfect coordinate stability */}
                    <svg
                        className="map-svg"
                        viewBox={animatedViewBox}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* GeoJSON Shape with Gradient Fill */}
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

                            {/* Arrow marker definition */}
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="10"
                                refX="8"
                                refY="3"
                                orient="auto"
                                markerUnits="strokeWidth"
                            >
                                <polygon
                                    points="0 0, 10 3, 0 6"
                                    fill="#ffffff"
                                    opacity="0.9"
                                />
                            </marker>
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

                        {/* Region Dots */}
                        {ksaData.regions.map(region => {
                            const { x, y } = geoToPercent(region.long, region.lat);
                            return (
                                <g key={region.id}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="0.6"
                                        fill="#64748b"
                                        stroke="#94a3b8"
                                        strokeWidth="0.1"
                                    />
                                    <text
                                        x={x + 1.2}
                                        y={y + 0.3}
                                        fontSize="1.2"
                                        fill="#94a3b8"
                                        fontWeight="500"
                                    >
                                        {region.name}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Pipeline Flows with Animated Arrows - SVG Native */}
                        {!isZoomedIn && mapFlows.map((flow, idx) => {
                            const sourcePlant = ksaData.plants.find(p => p.name === flow.source);
                            const targetPlant = ksaData.plants.find(p => p.name === flow.target);

                            if (!sourcePlant || !targetPlant) return null;
                            if (!showFuture && ((sourcePlant as any).status === 'planned' || (targetPlant as any).status === 'planned')) return null;

                            const start = geoToPercent(sourcePlant.coords[0], sourcePlant.coords[1]);
                            const end = geoToPercent(targetPlant.coords[0], targetPlant.coords[1]);

                            const color = flow.status === 'Green' ? '#10b981' :
                                flow.status === 'Red' ? '#ef4444' : '#f59e0b';

                            const pathId = `flow-path-${idx}`;
                            const pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

                            return (
                                <g key={idx}>
                                    {/* Define the path (invisible) */}
                                    <path
                                        id={pathId}
                                        d={pathD}
                                        fill="none"
                                    />

                                    {/* Background glow */}
                                    <line
                                        x1={start.x}
                                        y1={start.y}
                                        x2={end.x}
                                        y2={end.y}
                                        stroke={color}
                                        strokeWidth="1.2"
                                        opacity="0.3"
                                        strokeLinecap="round"
                                        filter="url(#glow)"
                                    />

                                    {/* Main solid line */}
                                    <line
                                        x1={start.x}
                                        y1={start.y}
                                        x2={end.x}
                                        y2={end.y}
                                        stroke={color}
                                        strokeWidth="0.5"
                                        opacity="0.7"
                                        strokeLinecap="round"
                                    />

                                    {/* Animated arrow symbol moving along path */}
                                    <polygon
                                        points="0,-0.8 2,0 0,0.8"
                                        fill="#ffffff"
                                        opacity="0.9"
                                    >
                                        <animateMotion
                                            dur="4s"
                                            repeatCount="indefinite"
                                            path={pathD}
                                        />
                                        <animateTransform
                                            attributeName="transform"
                                            attributeType="XML"
                                            type="rotate"
                                            from={`0`}
                                            to={`${Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI}`}
                                            dur="0.01s"
                                            repeatCount="1"
                                            fill="freeze"
                                        />
                                    </polygon>

                                    {/* Additional trailing dots for effect */}
                                    <circle r="0.4" fill="#ffffff" opacity="0.6">
                                        <animateMotion
                                            dur="4s"
                                            repeatCount="indefinite"
                                            path={pathD}
                                            begin="0.5s"
                                        />
                                    </circle>
                                    <circle r="0.3" fill="#ffffff" opacity="0.4">
                                        <animateMotion
                                            dur="4s"
                                            repeatCount="indefinite"
                                            path={pathD}
                                            begin="1s"
                                        />
                                    </circle>
                                </g>
                            );
                        })}

                        {/* Plant Icons */}
                        {visiblePlants.map(plant => {
                            if (!plant.coords) return null;
                            const { x, y } = geoToPercent(plant.coords[0], plant.coords[1]);
                            const icon = (plant as any).status === 'planned' ? layersIcon : factoryIcon;
                            const glowColor = (plant as any).status === 'operational' ? '#10b981' :
                                (plant as any).status === 'planned' ? '#f59e0b' : '#ef4444';

                            return (
                                <g
                                    key={plant.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handlePlantClick(plant)}
                                >
                                    {/* Glow */}
                                    <circle
                                        cx={x}
                                        cy={y - 1.5}
                                        r={isZoomedIn ? 4 : 4.7}
                                        fill={glowColor}
                                        opacity="0.3"
                                        filter="blur(8px)"
                                    />
                                    {/* Icon - 25% larger */}
                                    <image
                                        href={icon}
                                        xlinkHref={icon}
                                        x={x - 3.90625}
                                        y={y - 6.03125}
                                        width={isZoomedIn ? 7.5 : 7.8125}
                                        height={isZoomedIn ? 7.5 : 7.8125}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    {/* Label */}
                                    <text
                                        x={x}
                                        y={y + 2.5}
                                        fontSize={isZoomedIn ? 1.3 : 1.2}
                                        fill="#e2e8f0"
                                        fontWeight="600"
                                        textAnchor="middle"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {plant.name}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Supporting Assets - only show for zoomed plant */}
                        {isZoomedIn && zoomedPlantId && (() => {
                            const zoomedPlant = mapPlants.find(p => p.id === zoomedPlantId) || ksaData.plants.find(p => p.id === zoomedPlantId);
                            if (!zoomedPlant) return null;
                            const assets = generateSupportingAssets(zoomedPlant);

                            return assets.map((asset, idx) => (
                                <g key={`asset-${idx}`}>
                                    {/* Glow */}
                                    <circle
                                        cx={asset.x}
                                        cy={asset.y}
                                        r="2"
                                        fill="#3b82f6"
                                        opacity="0.2"
                                        filter="blur(4px)"
                                    />
                                    {/* Icon */}
                                    <image
                                        href={asset.icon}
                                        xlinkHref={asset.icon}
                                        x={asset.x - 1.5}
                                        y={asset.y - 1.5}
                                        width="3"
                                        height="3"
                                    />
                                    {/* Label */}
                                    <text
                                        x={asset.x}
                                        y={asset.y + 2.5}
                                        fontSize="0.9"
                                        fill="#cbd5e1"
                                        fontWeight="500"
                                        textAnchor="middle"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {asset.name}
                                    </text>
                                </g>
                            ));
                        })()}
                    </svg>

                    {/* Outline Image Overlay - FIXED position, not affected by SVG zoom */}
                    {showOutline && (
                        <img
                            src={mapOutline}
                            alt="Saudi Arabia Outline"
                            className="map-outline-overlay"
                            style={{
                                opacity: 0.6,
                                objectFit: 'contain',
                                mixBlendMode: 'screen'
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Map Controls - Hide when zoomed in on a PLANNED plant if showing future */}
            {!(isZoomedIn && showFuture && (mapPlants.find(p => p.id === zoomedPlantId) as any)?.status === 'planned') && (
                <div className="map-controls">
                    <button
                        onClick={() => setShowFuture(!showFuture)}
                        className={`control-btn ${showFuture ? 'active' : 'inactive'}`}
                    >
                        <Clock className="control-icon" />
                        {showFuture ? 'HIDE FUTURE PLANS' : 'SHOW FUTURE PLANS'}
                    </button>
                </div>
            )}

            {/* Back Button */}
            {isZoomedIn && (
                <button
                    onClick={zoomOut}
                    className="back-btn"
                >
                    <ArrowLeft className="back-icon" />
                    RETURN TO KINGDOM VIEW
                </button>
            )}

            {/* Legend - Only show in normal view for now to save space, or style specifically */}
            {!isZoomedIn && (
                <div className="legend-container">
                    <div className="legend-header">
                        <div className="legend-dot" />
                        Legend
                    </div>

                    <div className="legend-section">
                        <div className="legend-subtitle">Plants</div>
                        <div className="legend-item">
                            <img src={factoryIcon} alt="" className="legend-icon" />
                            <span className="legend-label">Operational</span>
                        </div>
                        <div className="legend-item">
                            <img src={layersIcon} alt="" className="legend-icon" />
                            <span className="legend-label">Planned</span>
                        </div>
                        <div className="legend-item">
                            <img src={factoryIcon} alt="" className="legend-icon" style={{ opacity: 0.75, filter: 'drop-shadow(0 0 4px #ef4444)' }} />
                            <span className="legend-label">At Risk</span>
                        </div>
                    </div>

                    <div className="legend-divider">
                        <div className="legend-subtitle">Pipeline Flows</div>
                        <div className="legend-item">
                            <div className="legend-line" />
                            <span className="legend-label">Active</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Plant Details Panel - COMPREHENSIVE WITH ALL SECTIONS */}
            {selectedPlant && (() => {
                const agri = selectedPlant.sectors && selectedPlant.sectors.agriculture ? selectedPlant.sectors.agriculture.toLocaleString() : '0';
                const ind = selectedPlant.sectors && selectedPlant.sectors.industry ? selectedPlant.sectors.industry.toLocaleString() : '0';
                const urb = selectedPlant.sectors && selectedPlant.sectors.urban ? selectedPlant.sectors.urban.toLocaleString() : '0';

                const total = (selectedPlant.sectors?.agriculture || 0) + (selectedPlant.sectors?.industry || 0) + (selectedPlant.sectors?.urban || 0);
                const pAgri = total ? ((selectedPlant.sectors?.agriculture || 0) / total) * 100 : 0;
                const pInd = total ? ((selectedPlant.sectors?.industry || 0) / total) * 100 : 0;
                const pUrb = total ? ((selectedPlant.sectors?.urban || 0) / total) * 100 : 0;

                return (
                    <div className="plant-panel">
                        {/* Header */}
                        <div className="panel-header">
                            <div className="panel-header-content">
                                <div className="panel-header-dots">
                                    <div className="header-dot"></div>
                                    <div className="header-dot"></div>
                                    <div className="header-dot"></div>
                                </div>
                                <span className="panel-title">PLANT DETAILS</span>
                            </div>
                            <button
                                onClick={() => setSelectedPlant(null)}
                                className="panel-close-btn"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="panel-content">
                            {/* Plant Name and Status */}
                            <div>
                                <h2 className="plant-name">
                                    {selectedPlant.name}
                                </h2>
                                <span className={`status-badge ${(selectedPlant as any).status === 'operational'
                                    ? 'status-operational'
                                    : (selectedPlant as any).status === 'planned'
                                        ? 'status-planned'
                                        : 'status-risk'
                                    }`}>
                                    <span className="status-dot">●</span>
                                    {((selectedPlant as any).status || '').toUpperCase()}
                                </span>
                            </div>

                            {/* Operational Metrics */}
                            <div>
                                <div className="section-header">
                                    <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Operational Metrics
                                </div>
                                <div className="metrics-grid">
                                    <div>
                                        <div className="metric-label">Water Supply</div>
                                        <div className="metric-value">{selectedPlant.capacity ? selectedPlant.capacity.toLocaleString() : 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="metric-label">Jobs</div>
                                        <div className="metric-value">{selectedPlant.jobs || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="metric-label">Revenue</div>
                                        <div className="metric-value">{selectedPlant.revenue || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Sector Allocation */}
                            <div className="sector-section">
                                <div className="section-header">
                                    <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                    Sector Allocation
                                </div>

                                {/* Colored bar chart */}
                                <div className="sector-bar-container">
                                    <div
                                        className="sector-bar bar-agri"
                                        style={{ width: `${pAgri}%` }}
                                    />
                                    <div
                                        className="sector-bar bar-ind"
                                        style={{ width: `${pInd}%` }}
                                    />
                                    <div
                                        className="sector-bar bar-urb"
                                        style={{ width: `${pUrb}%` }}
                                    />
                                </div>

                                {/* Legend with values */}
                                <div className="sector-legend">
                                    <div className="sector-legend-item">
                                        <span className="sector-name">
                                            <span className="dot-agri">●</span> Agriculture
                                        </span>
                                        <span className="sector-val">{agri}</span>
                                    </div>
                                    <div className="sector-legend-item">
                                        <span className="sector-name">
                                            <span className="dot-ind">●</span> Industry
                                        </span>
                                        <span className="sector-val">{ind}</span>
                                    </div>
                                    <div className="sector-legend-item">
                                        <span className="sector-name">
                                            <span className="dot-urb">●</span> Urban
                                        </span>
                                        <span className="sector-val">{urb}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Investment Status */}
                            <div className="investment-section">
                                <div className="section-header">
                                    <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    Investment Status
                                </div>
                                <div className="investment-row">
                                    <div className={`investment-icon-box ${selectedPlant.fundingSource === 'FDI' ? 'box-fdi' : 'box-default'
                                        }`}>
                                        <svg className={`investment-icon ${selectedPlant.fundingSource === 'FDI' ? 'icon-fdi' : 'icon-default'
                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="invest-source">{selectedPlant.fundingSource ? selectedPlant.fundingSource.toUpperCase() : 'UNKNOWN'}</div>
                                        <div className="invest-launch">
                                            Launch: <span className="invest-quarter">{selectedPlant.quarterLaunched || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coordinates */}
                            <div className="coordinates-section">
                                <div className="section-header">
                                    <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Coordinates
                                </div>
                                <div className="coordinates-value">
                                    {selectedPlant.coords && selectedPlant.coords.length === 2 ? `${selectedPlant.coords[1].toFixed(4)}, ${selectedPlant.coords[0].toFixed(4)}` : 'Invalid Coords'}
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedPlant(null)}
                                className="panel-action-btn"
                            >
                                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close Panel
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
