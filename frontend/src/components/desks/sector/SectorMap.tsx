import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { ksaData, saudiGeoJson } from './data/ksaData';
import { getSectorValueChain, transformToMapEntities, MapEntity } from '../../../services/sectorService';
import './SectorMap.css';

// Import icons (Public Assets) - Using relative paths
import factoryIcon from '../../../assets/d06a8c9edb7a3c4705388fb7f4e1e9dd775f2172.png';
import layersIcon from '../../../assets/d8f139bc6eb42908fc05a27d7464940450f1ebce.png';
import buildingsIcon from '../../../assets/bd89c9093f7e2782417c2cf0a6e772f9b40df676.png';
import cityIcon from '../../../assets/425f09a50feb64694c6b2c3a1203e88b8090d79e.png';
import chipIcon from '../../../assets/d90d9826020dfd8a2255a0b0a04f11ea09dcb3cc.png';
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

interface SectorMapProps {
  year?: string;
  quarter?: string;
}

export function SectorMap({ year, quarter }: SectorMapProps) {
  type Plant = MapEntity; // Alias for code compatibility
  const [showFuture, setShowFuture] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [zoomedPlantId, setZoomedPlantId] = useState<string | null>(null);

  // New state for API data - No Fallback
  const [mapPlants, setMapPlants] = useState<MapEntity[]>([]);
  const [mapFlows, setMapFlows] = useState<any[]>([]); // TODO: Type flows
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API - DISABLED: USES MOCK DATA AS REQUESTED
  useEffect(() => {
    const fetchSectorData = async () => {
      setIsLoading(true);
      try {
        // MOCK DATA MODE
        // the sectormap data is NOT to be removed BECAUSE THERE IS NO ALTERNATIVE REAL DATA YET!!!!
        console.log('[SectorMap] Using mock ksaData');
        setMapPlants(ksaData.plants as any);
        setMapFlows(ksaData.flows);

        // Original API call preserved but commented out
        /*
        const data = await getSectorValueChain(year || '2025');
        if (data && data.nodes) {
          const entities = transformToMapEntities(data.nodes);
          setMapPlants(entities);
          setMapFlows(ksaData.flows);
        }
        */
      } catch (err) {
        console.error('Failed to load map data', err);
        setError("Failed to load map data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSectorData();
  }, [year]);

  // State to control outline visibility with delay on zoom out
  const [showOutline, setShowOutline] = useState(true);

  // Animated viewBox state for smooth transitions
  const [animatedViewBox, setAnimatedViewBox] = useState('0 0 100 100');
  const animationFrameRef = useRef<number | null>(null);
  const viewBoxRef = useRef('0 0 100 100'); // Track latest value for animation logic

  useEffect(() => {
    let targetViewBox = '0 0 100 100';
    let targetOpacity = 1;

    if (isZoomedIn && zoomedPlantId) {
      const plant = ksaData.plants.find(p => p.id === zoomedPlantId);
      if (plant && plant.coords) {
        const { x, y } = geoToPercent(plant.coords[0], plant.coords[1]);
        targetViewBox = `${x - 20} ${y - 20} 40 40`;
        targetOpacity = 0;
      }
    }

    const animate = () => {
      setAnimatedViewBox(prevBox => {
        // Update ref
        viewBoxRef.current = prevBox;

        const [px, py, pw, ph] = prevBox.split(' ').map(Number);
        const [tx, ty, tw, th] = targetViewBox.split(' ').map(Number);

        const dx = tx - px;
        const dy = ty - py;
        const dw = tw - pw;
        const dh = th - ph;

        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dw) < 0.1) {
          viewBoxRef.current = targetViewBox; // Ensure exact
          return targetViewBox;
        }

        const ease = 0.1;
        const nextBox = `${px + dx * ease} ${py + dy * ease} ${pw + dw * ease} ${ph + dh * ease}`;
        viewBoxRef.current = nextBox;
        return nextBox;
      });

      // Handle outline fade using Ref to avoid stale closure
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
  }, [isZoomedIn, zoomedPlantId]);

  // Filter plants - Only render those with VALID COORDS
  const visiblePlants = showFuture
    ? mapPlants.filter(p => p.coords && p.coords.length === 2)
    : mapPlants.filter(p => {
      const status = p.properties?.status || (p as any).status;
      return (status === 'operational' || status === 'at-risk') && p.coords && p.coords.length === 2;
    });

  // Generate supporting assets around zoomed plant
  const generateSupportingAssets = (mainPlant: Plant) => {
    const assets = [];
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

  const handlePlantClick = (plant: Plant) => {
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
    <div className="saudi-map-container">
      {/* Map Container with fixed viewBox for perfect coordinate stability */}
      <div className="map-view-container">
        <div
          className="map-wrapper"
          style={{
            aspectRatio: '1.0',
            width: '100%',
            height: '100%'
          }}
        >

          {/* Map Container with fixed viewBox for perfect coordinate stability */}
          {isLoading && <div className="map-loading-overlay">Loading Sector Data...</div>}
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
            {!isZoomedIn && ksaData.flows.map((flow, idx) => {
              const sourcePlant = ksaData.plants.find(p => p.name === flow.source);
              const targetPlant = ksaData.plants.find(p => p.name === flow.target);

              if (!sourcePlant || !targetPlant) return null;
              if (!showFuture && (sourcePlant.status === 'planned' || targetPlant.status === 'planned')) return null;

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
              const { x, y } = geoToPercent(plant.coords[0], plant.coords[1]);
              const icon = plant.status === 'planned' ? layersIcon : factoryIcon;
              const glowColor = plant.status === 'operational' ? '#10b981' :
                plant.status === 'planned' ? '#f59e0b' : '#ef4444';

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
              const zoomedPlant = ksaData.plants.find(p => p.id === zoomedPlantId);
              if (!zoomedPlant) return null;
              const assets = generateSupportingAssets(zoomedPlant as unknown as Plant);

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
      {!(isZoomedIn && showFuture && ksaData.plants.find(p => p.id === zoomedPlantId)?.status === 'planned') && (
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

      {/* Legend */}
      <div className="legend-container">
        <div className="legend-header">
          <div className="legend-dot" />
          Legend
        </div>

        {!isZoomedIn ? (
          // Normal view legend
          <>
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
          </>
        ) : (
          // Zoomed view legend - Supporting Assets
          <div className="legend-section">
            <div className="legend-subtitle">Supporting Assets</div>
            <div className="legend-item">
              <img src={buildingsIcon} alt="" className="legend-icon" />
              <span className="legend-label">Urban Zone</span>
            </div>
            <div className="legend-item">
              <img src={cityIcon} alt="" className="legend-icon" />
              <span className="legend-label">Distribution Center</span>
            </div>
            <div className="legend-item">
              <img src={chipIcon} alt="" className="legend-icon" />
              <span className="legend-label">Control Station</span>
            </div>
            <div className="legend-item">
              <img src={buildingsIcon} alt="" className="legend-icon" />
              <span className="legend-label">Treatment Facility</span>
            </div>
            <div className="legend-item">
              <img src={cityIcon} alt="" className="legend-icon" />
              <span className="legend-label">Pump Station</span>
            </div>
            <div className="legend-item">
              <img src={chipIcon} alt="" className="legend-icon" />
              <span className="legend-label">Monitoring Hub</span>
            </div>
          </div>
        )}
      </div>

      {/* Plant Details Panel - COMPREHENSIVE WITH ALL SECTIONS */}
      {
        selectedPlant && (() => {
          const agri = selectedPlant.sectors.agriculture.toLocaleString();
          const ind = selectedPlant.sectors.industry.toLocaleString();
          const urb = selectedPlant.sectors.urban.toLocaleString();

          const total = selectedPlant.sectors.agriculture + selectedPlant.sectors.industry + selectedPlant.sectors.urban;
          const pAgri = (selectedPlant.sectors.agriculture / total) * 100;
          const pInd = (selectedPlant.sectors.industry / total) * 100;
          const pUrb = (selectedPlant.sectors.urban / total) * 100;

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
                  <span className={`status-badge ${selectedPlant.status === 'operational'
                    ? 'status-operational'
                    : selectedPlant.status === 'planned'
                      ? 'status-planned'
                      : 'status-risk'
                    }`}>
                    <span className="status-dot">●</span>
                    {selectedPlant.status.toUpperCase()}
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
                      <div className="metric-value">{selectedPlant.capacity.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="metric-label">Jobs</div>
                      <div className="metric-value">{selectedPlant.jobs}</div>
                    </div>
                    <div>
                      <div className="metric-label">Revenue</div>
                      <div className="metric-value">{selectedPlant.revenue}</div>
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
                      <div className="invest-source">{selectedPlant.fundingSource.toUpperCase()}</div>
                      <div className="invest-launch">
                        Launch: <span className="invest-quarter">{selectedPlant.quarterLaunched}</span>
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
                    {selectedPlant.coords[1].toFixed(4)}, {selectedPlant.coords[0].toFixed(4)}
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
        })()
      }
    </div >
  );
}