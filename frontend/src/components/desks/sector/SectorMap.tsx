/**
 * SectorMap.tsx - Pure Mapbox with Uncontrolled ViewState for Smooth Animations
 * 
 * FEATURES:
 * 1. Uncontrolled Mode (initialViewState) -> Allows smooth map.flyTo() animations.
 * 2. Manual Red Lines (100% Opacity) + DB Green Lines.
 * 3. High-Res Circular Icons + Glow Effects.
 * 4. Marker Jump Fix (transform-origin: bottom center).
 * 5. Controls Overlay & Fixed Panel -> Horizontal Layout (Top Left).
 * 6. Minimized State -> Collapses Body only (Header stays in place).
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// @ts-ignore
import Map, { Marker, Source, Layer, NavigationControl, FullscreenControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './SectorMap.css';

// Icons
import { Clock } from 'lucide-react';
import iconMining from '../../../assets/map-markers/mining.svg';
import iconWater from '../../../assets/map-markers/water.svg';
import iconEnergy from '../../../assets/map-markers/energy.svg';
import iconIndustry from '../../../assets/map-markers/industry.svg';
import iconTransportation from '../../../assets/map-markers/transportation.svg';
import iconGiga from '../../../assets/map-markers/giga.svg';

// Glow Icons
import glowMining from '../../../assets/map-markers/miningg.svg';
import glowWater from '../../../assets/map-markers/waterg.svg';
import glowEnergy from '../../../assets/map-markers/energyg.svg';
import glowIndustry from '../../../assets/map-markers/industryg.svg';
import glowTransportation from '../../../assets/map-markers/transportationg.svg';
import glowGiga from '../../../assets/map-markers/gigag.svg';

// Legend Icons
import legendMining from '../../../assets/map-markers/lmining.svg';
import legendWater from '../../../assets/map-markers/lwater.svg';
import legendEnergy from '../../../assets/map-markers/lenergy.svg';
import legendIndustry from '../../../assets/map-markers/lindustry.svg';
import legendTransportation from '../../../assets/map-markers/ltransport.svg';
import legendGiga from '../../../assets/map-markers/lgiga.svg';
import legendPriority from '../../../assets/map-markers/lPriority.svg';

const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';

// Types
interface GraphNode {
  id: string;
  name?: string;
  sector?: string;
  status?: string;
  priority?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  long?: number;
  asset_type?: string;
  region?: string;
  description?: string;
  capacity?: string;
  investment?: string;
  rationale?: string;
  source_asset_name?: string;
  destination_asset_name?: string;
  dest_asset_name?: string;
  source_lat?: number;
  source_long?: number;
  dest_lat?: number;
  dest_long?: number;
  completion_date?: string;
  launch_date?: string;
  sector_split?: { [key: string]: number }; // Optional real data field
  [key: string]: any;
}

interface SectorMapProps {
  selectedSector: string;
  selectedRegion?: string | null;
  onRegionSelect?: (regionId: string | null) => void;
  onAssetSelect?: (asset: GraphNode | null) => void;
  focusAssetId?: string | null;
  assets: GraphNode[]; // Data from parent
  isLoading?: boolean;
  year?: number;
  quarter?: string;
}

type MainCategory = 'Mining' | 'Water' | 'Energy' | 'Industry' | 'Transportation' | 'Giga';

const MAIN_CATEGORY_ICONS: Record<MainCategory, string> = {
  'Mining': iconMining,
  'Water': iconWater,
  'Energy': iconEnergy,
  'Industry': iconIndustry,
  'Transportation': iconTransportation,
  'Giga': iconGiga
};

const MAIN_CATEGORY_GLOWS: Record<MainCategory, string> = {
  'Mining': glowMining,
  'Water': glowWater,
  'Energy': glowEnergy,
  'Industry': glowIndustry,
  'Transportation': glowTransportation,
  'Giga': glowGiga
};

const LEGEND_ICONS: Record<MainCategory, string> = {
  'Mining': legendMining,
  'Water': legendWater,
  'Energy': legendEnergy,
  'Industry': legendIndustry,
  'Transportation': legendTransportation,
  'Giga': legendGiga
};

const STATUS_COLORS: Record<string, string> = {
  'Existing': '#10b981',
  'Active': '#10b981',
  'Under Construction': '#f59e0b',
  'Planned': '#6366f1',
  'Future': '#6366f1'
};

const MAIN_CATEGORY_COLORS: Record<MainCategory, string> = {
  'Mining': '#d97706',
  'Water': '#06b6d4',
  'Energy': '#facc15',
  'Industry': '#3b82f6',
  'Transportation': '#18181b',
  'Giga': '#eab308'
};

// KSA Administrative Regions
interface Region { id: string; name: string; lat: number; long: number; }
const KSA_REGIONS: Region[] = [
  { id: 'Riyadh', name: 'Riyadh', lat: 24.7136, long: 46.6753 },
  { id: 'Makkah', name: 'Makkah', lat: 21.4225, long: 39.8262 },
  { id: 'Eastern', name: 'Eastern', lat: 26.3927, long: 49.9777 },
  { id: 'Madinah', name: 'Madinah', lat: 24.4539, long: 39.6142 },
  { id: 'Qassim', name: 'Qassim', lat: 26.3260, long: 43.9750 },
  { id: 'Tabuk', name: 'Tabuk', lat: 28.3835, long: 36.5662 },
  { id: 'Hail', name: 'Hail', lat: 27.5114, long: 41.6903 },
  { id: 'Northern', name: 'Northern Borders', lat: 30.9843, long: 41.1183 },
  { id: 'Jawf', name: 'Al Jawf', lat: 29.8117, long: 39.8675 },
  { id: 'Jazan', name: 'Jazan', lat: 16.8894, long: 42.5511 },
  { id: 'Asir', name: 'Asir', lat: 18.2164, long: 42.5053 },
  { id: 'Baha', name: 'Al Baha', lat: 20.0129, long: 41.4677 },
  { id: 'Najran', name: 'Najran', lat: 17.4933, long: 44.1322 }
];

// Helpers
function getMainCategory(sector?: string): MainCategory | null {
  if (!sector) return null;
  const s = sector.toLowerCase();
  if (s === 'mining') return 'Mining';
  if (s === 'water') return 'Water';
  if (s === 'energy') return 'Energy';
  if (s === 'industry') return 'Industry';
  if (s === 'logistics' || s === 'transportation') return 'Transportation';
  if (s === 'giga') return 'Giga';
  return null;
}

function getSimpleStatus(status?: string): 'Running' | 'Future' {
  if (!status) return 'Future';
  const s = status.toLowerCase();

  // Running = Existing or Active
  if (s === 'existing' || s === 'active' || s === 'operational') return 'Running';

  // Everything else is Future (Planned, Under Construction, Tendering, Awarded, etc.)
  return 'Future';
}

function getCoords(node: GraphNode): [number, number] | null {
  const lng = node.longitude ?? node.long;
  const lat = node.latitude ?? node.lat;
  if (lng != null && lat != null && (Math.abs(lng) > 0.1 || Math.abs(lat) > 0.1)) {
    return [lng, lat];
  }
  return null;
}


// SVG Network Overlay Component (Native Animated SVG)
const NetworkSVGOverlay: React.FC<{
  manualGeoJSON: any;
  dbGeoJSON: any;
  mapRef: React.RefObject<any>;
  viewport: any;
}> = ({ manualGeoJSON, dbGeoJSON, mapRef, viewport }) => {
  const [paths, setPaths] = useState<{ d: string; color: string; id: string; label?: string; labelPos?: { x: number; y: number; angle: number } }[]>([]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const generatePaths = (geojson: any, color: string, idPrefix: string) => {
      return geojson.features.map((f: any, i: number) => {
        const coords = f.geometry.coordinates;
        if (!coords || coords.length < 2) return null;
        const p1 = map.project(coords[0]);
        const p2 = map.project(coords[1]);

        // Calculate mid-point and angle for labels
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

        return {
          id: `${idPrefix}-${i}`,
          d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
          color,
          label: f.properties.label,
          labelPos: { x: midX, y: midY, angle }
        };
      }).filter(Boolean);
    };

    setPaths([
      ...generatePaths(manualGeoJSON, '#818cf8', 'manual'),
      ...generatePaths(dbGeoJSON, '#22d3ee', 'db')
    ].filter(Boolean) as any);
  }, [manualGeoJSON, dbGeoJSON, viewport, mapRef]);

  return (
    <svg className="network-svg-overlay">
      <defs>
        <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map(path => (
        <g key={path.id}>
          <path
            d={path.d}
            className="network-path-base"
            stroke={path.color}
            strokeWidth="4"
            strokeOpacity="0.3"
          />
          <path
            d={path.d}
            className="network-path-flow"
            stroke={path.color}
            strokeWidth="2"
            strokeOpacity="1.0"
            filter="url(#soft-glow)"
          />
          {/* Text labels for connections */}
          {path.label && (
            <text
              x={path.labelPos.x}
              y={path.labelPos.y}
              dy="-4"
              textAnchor="middle"
              className="network-line-label"
              fill={path.color}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textShadow: '0 0 4px black',
                pointerEvents: 'none'
              }}
              transform={`rotate(${path.labelPos.angle > 90 || path.labelPos.angle < -90 ? path.labelPos.angle + 180 : path.labelPos.angle}, ${path.labelPos.x}, ${path.labelPos.y})`}
            >
              {path.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

const SectorMap: React.FC<SectorMapProps> = ({
  selectedSector,
  selectedRegion,
  onRegionSelect,
  onAssetSelect,
  focusAssetId,
  assets: allAssets, // Use parent data
  isLoading = false,
  year,
  quarter
}) => {
  const mapRef = useRef<any>(null);

  // UI State
  // UI State
  const [selectedAsset, setSelectedAsset] = useState<GraphNode | null>(null);
  const [hoverAsset, setHoverAsset] = useState<GraphNode | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'current' | 'future' | 'both'>('both');
  const [priorityFilter, setPriorityFilter] = useState<'major' | 'strategic' | 'both'>('both');

  // Animation State for Line Flow - REMOVED (Now handled by CSS in SVG)
  const [mapViewport, setMapViewport] = useState<any>(null);

  // Sync SVG on move
  const onMove = useCallback((evt: any) => {
    setMapViewport(evt.viewState);
  }, []);

  // NO CONTROLLED ViewState - Allows smooth animations via mapRef.current.flyTo()

  // Filter Assets
  const filteredAssets = useMemo(() => {
    return allAssets.filter(node => {
      if (node.asset_type === 'Network Connection') return false;
      const coords = getCoords(node);
      if (!coords) return false;

      const nodeSector = node.sector?.toLowerCase();
      if (selectedSector !== 'All Factors' && nodeSector !== selectedSector.toLowerCase()) {
        if (!(nodeSector === 'giga' && selectedSector.toLowerCase() === 'economy')) {
          return false;
        }
      }

      if (selectedRegion && node.region !== selectedRegion) return false;

      const simpleStatus = getSimpleStatus(node.status);
      if (timelineFilter === 'current' && simpleStatus === 'Future') return false;
      if (timelineFilter === 'future' && simpleStatus === 'Running') return false;

      // Priority Filter
      const assetPriority = node.priority === 'HIGH' ? 'major' : 'strategic';
      if (priorityFilter !== 'both' && assetPriority !== priorityFilter) return false;

      // Global Date Filter
      if (year) {
        const finishYear = node.completion_date ? parseInt(node.completion_date.substring(0, 4)) : null;
        if (finishYear && finishYear > year) return false;
      }

      return true;
    });
  }, [allAssets, selectedSector, selectedRegion, timelineFilter, priorityFilter, year]);

  // Handle Region Selection Zoom
  useEffect(() => {
    if (selectedRegion) {
      const region = KSA_REGIONS.find(r => r.id === selectedRegion);
      if (region) {
        mapRef.current?.flyTo({
          center: [region.long, region.lat],
          zoom: 7,
          pitch: 50,
          duration: 2000,
          essential: true,
          easing: (t: number) => t * (2 - t)
        });
      }
    } else if (!focusAssetId && !selectedAsset) {
      // RESET TO MAIN VIEW
      mapRef.current?.flyTo({
        center: [45.0, 24.0],
        zoom: 5,
        pitch: 45,
        bearing: 0,
        duration: 2000,
        essential: true,
        easing: (t: number) => t * (2 - t)
      });
    }
  }, [selectedRegion, focusAssetId, selectedAsset]);

  // --- 1. RED LINE: MANUAL CONNECTIONS (Strict IDs) ---
  const MANUAL_CONNECTIONS = [
    // Water Network (Yanbu 4 IWP Hub)
    { s: 'Yanbu 4 IWP', d: 'Madinah', type: 'Water', status: 'Existing' },
    { s: 'Yanbu 4 IWP', d: 'Riyadh', type: 'Water', status: 'Existing' },
    { s: 'Jubail Power Plant', d: 'Riyadh', type: 'Water', status: 'Existing' },
    { s: 'Jubail Power Plant', d: 'Ras Al-Khair Power Plant', type: 'Water', status: 'Existing' },

    // Logistics Corridors (Landbridge & Ports)
    { s: 'Dammam Logistics Park', d: 'Riyadh Integrated Logistics Zone', type: 'Transportation', status: 'Planned' },
    { s: 'Riyadh Integrated Logistics Zone', d: 'King Abdullah Port Logistics', type: 'Transportation', status: 'Planned' },
    { s: 'King Abdullah Port Logistics', d: 'Yanbu Industrial City', type: 'Transportation', status: 'Existing' },

    // Industrial Supply Chains (Mining to Industry)
    { s: 'Jubail Industrial City', d: 'NEOM (The Line)', type: 'Industry', status: 'Existing' },
    { s: 'Wa\'ad Al-Shamal', d: 'Jubail Industrial City', type: 'Industry', status: 'Existing' },
    { s: 'Mahd Ad Dahab Mine', d: 'Riyadh 2nd Industrial City', type: 'Industry', status: 'Existing' },

    // Energy Grid (Power Distribution)
    { s: 'Jubail Power Plant', d: 'Eastern Region', type: 'Energy', status: 'Existing' },
    { s: 'Ras Al-Khair Power Plant', d: 'Riyadh', type: 'Energy', status: 'Existing' },
    { s: 'Dumat Al Jandal Wind Farm', d: 'Tabuk', type: 'Energy', status: 'Planned' },
    { s: 'Rabigh 3 IWP', d: 'Makkah', type: 'Energy', status: 'Existing' },

    // Regional Connectors (Strategic)
    { s: 'Mahd Ad Dahab Mine', d: 'Riyadh', type: 'Mining', status: 'Existing' },
    { s: 'Mahd Ad Dahab Mine', d: 'Hail', type: 'Mining', status: 'Existing' },
    { s: 'Madinah', d: 'King Abdullah Port Logistics', type: 'Transportation', status: 'Existing' }
  ];

  // Animation State - Disabled line dash animation to prevent Mapbox crash (property not supported)
  // const [lineDashOffset, setLineDashOffset] = useState(0);

  // useEffect(() => { ... });

  // --- GENERATE LINE LAYERS ---
  const { manualGeoJSON, dbGeoJSON } = useMemo(() => {
    const findNode = (id: string) => allAssets.find(n => n.id === id || n.name === id);
    const getPoint = (node: GraphNode | undefined) => node ? getCoords(node) : null;

    // VISIBILITY CHECK: Only show lines if both ends are in filteredAssets
    const isVisible = (id: string) => filteredAssets.some(a => a.id === id || a.name === id);

    // 1. Manual Lines
    const manualFeatures = MANUAL_CONNECTIONS.map(conn => {
      const sNode = findNode(conn.s);
      const dNode = findNode(conn.d);

      // Auto-hide if ends are missing or filtered out
      if (!isVisible(conn.s) || !isVisible(conn.d)) return null;

      const sPoint = getPoint(sNode);
      const dPoint = getPoint(dNode);

      if (sPoint && dPoint) {
        return {
          type: 'Feature',
          properties: {
            type: 'Manual',
            status: conn.status,
            label: `${conn.type} Connection`,
            sector: conn.type
          },
          geometry: { type: 'LineString', coordinates: [sPoint, dPoint] }
        };
      }
      return null;
    }).filter(Boolean);

    // 2. DB Lines
    const dbConnections = allAssets.filter(n => n.asset_type === 'Network Connection');
    const dbFeatures = dbConnections.map(conn => {
      if (!conn.source_asset_name || !conn.destination_asset_name) return null;

      // Auto-hide if ends are filtered out
      if (!isVisible(conn.source_asset_name) || !isVisible(conn.destination_asset_name)) return null;

      let sPoint: [number, number] | null = null;
      let dPoint: [number, number] | null = null;

      const sAsset = allAssets.find(a => a.name === conn.source_asset_name);
      const dAsset = allAssets.find(a => a.name === conn.destination_asset_name);

      if (sAsset) sPoint = getCoords(sAsset);
      if (dAsset) dPoint = getCoords(dAsset);

      if (sPoint && dPoint) {
        return {
          type: 'Feature',
          properties: {
            type: 'DB',
            status: 'Existing',
            label: conn.name || 'Transmission Line'
          },
          geometry: { type: 'LineString', coordinates: [sPoint, dPoint] }
        };
      }
      return null;
    }).filter(Boolean);

    return {
      manualGeoJSON: { type: 'FeatureCollection', features: manualFeatures },
      dbGeoJSON: { type: 'FeatureCollection', features: dbFeatures }
    };
  }, [allAssets, filteredAssets]);

  // Focus Handling
  useEffect(() => {
    if (focusAssetId) {
      const asset = allAssets.find(a => a.id === focusAssetId);
      if (asset) {
        const coords = getCoords(asset);
        if (coords) {
          setSelectedAsset(asset);
          setIsPanelCollapsed(false);
          mapRef.current?.flyTo({
            center: coords,
            zoom: 10,
            pitch: 60,
            duration: 2000,
            essential: true,
            easing: (t: number) => t * (2 - t)
          });
        }
      }
    }
  }, [focusAssetId, allAssets]);

  return (
    <div className="saudi-map-container">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 24.0,
          longitude: 45.0,
          zoom: 5,
          pitch: 45,
          bearing: 0
        }}
        // UNCONTROLLED MODE: No viewState prop here!
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        reuseMaps
        minZoom={4.5}
        maxZoom={16}
        maxBounds={[[32.0, 15.0], [60.0, 35.0]]} // Strict KSA Bounds
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        onMove={onMove}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* SVG ANIMATED OVERLAY */}
        <NetworkSVGOverlay
          manualGeoJSON={manualGeoJSON}
          dbGeoJSON={dbGeoJSON}
          mapRef={mapRef}
          viewport={mapViewport}
        />

        {/* Background Network Lines (Mapbox Layers) - Keep static base for depth */}
        {dbGeoJSON.features.length > 0 && (
          <Source id="lines-db" type="geojson" data={dbGeoJSON as any}>
            <Layer
              id="layer-lines-db"
              type="line"
              paint={{
                'line-color': '#06b6d4',
                'line-width': 2,
                'line-opacity': 0.2, // Very subtle background
              } as any}
            />
          </Source>
        )}

        {manualGeoJSON.features.length > 0 && (
          <Source id="lines-manual" type="geojson" data={manualGeoJSON as any}>
            <Layer
              id="layer-lines-manual"
              type="line"
              paint={{
                'line-color': '#6366f1',
                'line-width': 2,
                'line-opacity': 0.2,
              } as any}
            />
          </Source>
        )}

        {/* 2. REGION MARKERS (PULSING) */}
        {KSA_REGIONS.map(region => (
          <Marker
            key={region.id}
            longitude={region.long}
            latitude={region.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onRegionSelect?.(selectedRegion === region.id ? null : region.id);
            }}
          >
            <div className={`region-marker ${selectedRegion === region.id ? 'active' : ''}`}>
              <div className="region-dot"></div>
              <div className="region-label">{region.name}</div>
            </div>
          </Marker>
        ))}

        {/* 3. ASSET MARKERS (GLOWING PINS - CITY APPROACH) */}
        {filteredAssets.map(asset => {
          const coords = getCoords(asset);
          if (!coords) return null;
          const mainCat = getMainCategory(asset.sector);
          const isHigh = asset.priority === 'HIGH';
          const isSelected = selectedAsset?.id === asset.id;

          const iconSrc = isHigh ? MAIN_CATEGORY_GLOWS[mainCat || 'Industry'] : MAIN_CATEGORY_ICONS[mainCat || 'Industry'];
          const size = isSelected ? 60 : 40;

          return (
            <Marker
              key={asset.id}
              longitude={coords[0]}
              latitude={coords[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedAsset(asset);
                setIsPanelCollapsed(false);
                onAssetSelect?.(asset);
                mapRef.current?.flyTo({
                  center: coords,
                  zoom: 9,
                  pitch: 60,
                  duration: 2000,
                  essential: true,
                  easing: (t: number) => t * (2 - t)
                });
              }}
            >
              <div
                className={`asset-marker-container ${isHigh ? 'high-priority' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  transform: `translateY(${isSelected ? -12 : -8}px)`, // Offset from city center
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={() => setHoverAsset(asset)}
                onMouseLeave={() => setHoverAsset(null)}
              >
                <img
                  src={iconSrc}
                  alt={asset.name}
                  className="asset-icon"
                  style={{
                    width: size,
                    height: size,
                  }}
                />

                {/* Visual indicator for Major Unlock vs Strategic Impact - REMOVED per user request (Legend is sufficient) */}

                {/* TOOLTIP ON HOVER */}
                {hoverAsset?.id === asset.id && !isSelected && (
                  <div className="asset-tooltip">
                    <strong>{asset.name}</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{asset.sector}</span>
                      {asset.subCategory && (
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>{asset.subCategory}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* --- OVERLAYS (Structured Layout) --- */}
      {/* Container to align Controls and Panel side-by-side (Horizontal) */}
      <div className="map-top-left-section" style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '20px', zIndex: 50, pointerEvents: 'none' }}>

        {/* 1. Left Group: Controls (Toggle + Stats + Reset) */}
        <div className="controls-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto' }}>

          {/* THREE-WAY TIMELINE TOGGLE */}
          <div className="pill-toggle-group">
            <button
              className={`pill-btn ${timelineFilter === 'current' ? 'active' : ''}`}
              onClick={() => setTimelineFilter('current')}
            >Current</button>
            <button
              className={`pill-btn ${timelineFilter === 'future' ? 'active' : ''}`}
              onClick={() => setTimelineFilter('future')}
            >Future</button>
            <button
              className={`pill-btn ${timelineFilter === 'both' ? 'active' : ''}`}
              onClick={() => setTimelineFilter('both')}
            >Both</button>
          </div>

          {/* ASSET IMPACT TOGGLE */}
          <div className="pill-toggle-group">
            <button
              className={`pill-btn ${priorityFilter === 'major' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('major')}
            >Major Unlock</button>
            <button
              className={`pill-btn ${priorityFilter === 'strategic' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('strategic')}
            >Strategic Impact</button>
            <button
              className={`pill-btn ${priorityFilter === 'both' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('both')}
            >All</button>
          </div>

          {/* Stats Pill */}
          <div className="map-stats-pill" style={{ position: 'relative', top: 0, left: 0, transform: 'none', margin: 0, display: 'flex', gap: '8px', padding: '6px 8px' }}>
            {/* Total */}
            <div className="stat-item total" style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '12px', marginRight: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="lbl" style={{ fontSize: '9px' }}>Total Assets</span>
                <span className="val" style={{ fontSize: '14px' }}>{allAssets.length}</span>
              </div>
            </div>
            {/* Current */}
            <div className="stat-item current" style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '4px 12px', borderRadius: '10px' }}>
              <div className="dot" style={{ width: '6px', height: '6px', background: '#10b981' }}></div>
              <div>
                <div className="lbl" style={{ fontSize: '9px', color: '#86efac' }}>Now</div>
                <div className="val" style={{ fontSize: '14px' }}>{filteredAssets.filter(a => getSimpleStatus(a.status) === 'Running').length}</div>
              </div>
            </div>
            {/* Future */}
            <div className="stat-item future" style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '4px 12px', borderRadius: '10px' }}>
              <div className="dot-future" style={{ width: '6px', height: '6px', background: '#6366f1' }}></div>
              <div>
                <div className="lbl" style={{ fontSize: '9px', color: '#a5b4fc' }}>Future</div>
                <div className="val" style={{ fontSize: '14px' }}>{filteredAssets.filter(a => getSimpleStatus(a.status) === 'Future').length}</div>
              </div>
            </div>
          </div>

          {selectedRegion && (
            <button
              className="control-btn"
              onClick={() => onRegionSelect?.(null)}
              style={{ alignSelf: 'flex-start' }}
            >
              Reset View
            </button>
          )}

          {/* DISCLAIMER */}
          <div className="map-disclaimer" style={{ maxWidth: '240px', marginTop: '10px' }}>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', margin: 0 }}>
              Disclaimer:<br />
              - Data based on publicly available KSA public Sector datasets and could be out of date.<br />
              - Data is non-comprehensive and highly selective for demo purpose.
            </p>
          </div>
        </div>

        {/* 2. Right Group: Asset Panel (Next to Stats Pill) */}
        {selectedAsset && (
          <div className="asset-panel-fixed glass-panel" style={{ pointerEvents: 'auto', marginBottom: isPanelCollapsed ? '0' : '20px' }}>
            <div className="popup-header" style={{ marginBottom: isPanelCollapsed ? '0' : '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="popup-category" style={{ color: MAIN_CATEGORY_COLORS[getMainCategory(selectedAsset.sector) || 'Industry'] }}>
                    {selectedAsset.sector?.toUpperCase()}
                  </span>
                  {selectedAsset.subCategory && (
                    <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '-2px' }}>{selectedAsset.subCategory}</span>
                  )}
                </div>
                <span className={`popup-status ${getStatusClass(selectedAsset.status)}`}>
                  {selectedAsset.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="header-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPanelCollapsed(!isPanelCollapsed);
                  }}
                  title={isPanelCollapsed ? "Expand" : "Minimize"}
                >
                  {isPanelCollapsed ? '□' : '_'}
                </button>
                <button
                  className="header-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAsset(null);
                    onAssetSelect?.(null);
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Title & Body - HIDDEN IF COLLAPSED */}
            {!isPanelCollapsed && (
              <>
                <h3 className="popup-title">{selectedAsset.name}</h3>

                <div className="popup-grid">
                  {/* 1. FINANCIALS */}
                  {(selectedAsset.investment || selectedAsset.revenue || selectedAsset.cost) && (
                    <div className="popup-section full-width">
                      <label>Financial Impact</label>
                      <div className="metrics-row">
                        {selectedAsset.investment && (
                          <div className="metric-item">
                            <span className="value">{formatNumber(selectedAsset.investment, true)}</span>
                            <span className="label">Investment</span>
                          </div>
                        )}
                        {selectedAsset.revenue && (
                          <div className="metric-item">
                            <span className="value">{selectedAsset.revenue}</span>
                            <span className="label">Revenue</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. SCALE & OPERATIONS */}
                  {(selectedAsset.capacity || selectedAsset.jobs) && (
                    <div className="popup-section full-width">
                      <label>Operational Scale</label>
                      <div className="metrics-row">
                        {selectedAsset.capacity && (
                          <div className="metric-item">
                            <span className="value">{selectedAsset.capacity}</span>
                            <span className="label">Capacity</span>
                          </div>
                        )}
                        {selectedAsset.jobs && (
                          <div className="metric-item">
                            <span className="value">{selectedAsset.jobs}</span>
                            <span className="label">Jobs Created</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. STRATEGIC ALIGNMENT & OWNERSHIP */}
                  {(selectedAsset.fiscalAction || selectedAsset.priority || selectedAsset.ownership_type) && (
                    <div className="popup-section full-width">
                      <label>Strategic Mandate & Ownership</label>
                      <div className="tags-row">
                        {selectedAsset.priority && (
                          <span className={`tag-pill priority-${selectedAsset.priority.toLowerCase()}`}>
                            {selectedAsset.priority === 'HIGH' ? 'Major Unlock' : 'Strategic Impact'}
                          </span>
                        )}
                        {selectedAsset.ownership_type && (
                          <span className="tag-pill ownership" style={{ background: selectedAsset.ownership_type === 'PPP' ? '#6366f1' : '#475569' }}>
                            {selectedAsset.ownership_type}
                          </span>
                        )}
                        {selectedAsset.fiscalAction && (
                          <span className="tag-pill action">
                            ACTION: {selectedAsset.fiscalAction}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. SECTOR SPLIT (Breakdown) - Visualized as Bars */}
                  {(selectedAsset.sector_split || selectedAsset.sectors) && (
                    <div className="popup-section full-width">
                      <label>{selectedAsset.sector === 'Water' ? 'Water Supply Split' : 'Sector Distribution'}</label>
                      <div className="sector-bars">
                        {Object.entries(selectedAsset.sector_split || selectedAsset.sectors || {}).map(([key, val]) => (
                          <div key={key} className="sector-bar-item">
                            <div className="bar-label">
                              <span>{key}</span>
                              <span style={{ fontWeight: 700 }}>{typeof val === 'number' ? `${val}%` : String(val)}</span>
                            </div>
                            <div className="bar-track" style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px' }}>
                              <div
                                className="bar-fill"
                                style={{
                                  height: '100%',
                                  borderRadius: '2px',
                                  width: `${typeof val === 'number' ? Math.min(100, val) : 0}%`,
                                  background: selectedAsset.sector === 'Water' ? '#06b6d4' : '#3b82f6'
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SPECIAL HIGHLIGHT: Investment for Private Future Assets */}
                  {getSimpleStatus(selectedAsset.status) === 'Future' && selectedAsset.ownership_type === 'Private' && selectedAsset.investment && (
                    <div className="popup-section full-width highlight-box" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Private Investment Size</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>{formatNumber(selectedAsset.investment, true)}</div>
                    </div>
                  )}

                  {/* 5. RATIONALE */}
                  <div className="popup-metric full-width">
                    <label>Strategic Rationale</label>
                    <p>{selectedAsset.rationale || selectedAsset.description || 'No description available.'}</p>
                  </div>
                </div>

                <div className="popup-actions" style={{ marginTop: '20px' }}>
                  <button
                    className="popup-btn primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => {
                      const lat = selectedAsset.latitude ?? selectedAsset.lat;
                      const lng = selectedAsset.longitude ?? selectedAsset.long;
                      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                    }}
                  >
                    See on Google Maps
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* LEGEND - RESTORED */}
      <div style={{
        position: 'absolute', bottom: '24px', right: '24px',
        background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
        borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', minWidth: '200px', zIndex: 100
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Asset Types</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
          {[
            { l: 'Energy', i: legendEnergy }, { l: 'Water', i: legendWater },
            { l: 'Industry', i: legendIndustry }, { l: 'Transport', i: legendTransportation },
            { l: 'Mining', i: legendMining }, { l: 'Giga', i: legendGiga }
          ].map(item => (
            <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={item.i} alt={item.l} style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '12px', color: '#e2e8f0' }}>{item.l}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={legendPriority} alt="Major Unlock" style={{ width: '20px', height: '20px' }} />
          <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>Major Unlock Asset</span>
        </div>
      </div>
    </div>
  );
};

// Helper for status class
function getStatusClass(status?: string): string {
  if (!status) return 'status-unknown';
  const s = status.toLowerCase();
  if (s === 'existing' || s === 'active' || s === 'operational') return 'status-active';
  if (s.includes('construct')) return 'status-construction';
  if (s === 'planned' || s === 'future') return 'status-future';
  return 'status-unknown';
}



function formatNumber(value: string | number | undefined, isCurrency: boolean): string {
  if (value === undefined || value === null) return 'N/A';
  // If string (e.g. "SAR 26 Billion"), return as is (maybe clean up?)
  if (typeof value === 'string') return value;

  // If number
  if (typeof value === 'number') {
    if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
    return value.toString();
  }
  return String(value);
}

export default SectorMap;
