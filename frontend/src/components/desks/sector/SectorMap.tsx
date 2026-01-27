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
import iconAll from '../../../assets/map-markers/all.svg';

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
  timelineFilter?: 'current' | 'future' | 'both';
  priorityFilter?: 'major' | 'strategic' | 'both';
}

type MainCategory = 'All' | 'Mining' | 'Water' | 'Energy' | 'Industry' | 'Transportation' | 'Giga';

const MAIN_CATEGORY_ICONS: Record<MainCategory, string> = {
  'All': iconAll, // Placeholder
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
  'Existing': 'var(--status-existing)',
  'Active': 'var(--status-existing)',
  'Under Construction': 'var(--status-construction)',
  'Planned': 'var(--status-planned)',
  'Future': 'var(--status-future)'
};

const MAIN_CATEGORY_COLORS: Record<MainCategory, string> = {
  'Mining': 'var(--sector-mining)',
  'Water': 'var(--sector-water)',
  'Energy': 'var(--sector-energy)',
  'Industry': 'var(--sector-industry)',
  'Transportation': 'var(--sector-logistics)',
  'Giga': 'var(--sector-giga)'
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

// TEMPORARY: Hardcoded infrastructure asset coordinates until DB is populated
const INFRASTRUCTURE_FALLBACK: Record<string, [number, number]> = {
  // Water facilities
  'w_jubail': [49.6583, 27.0174],      // Jubail desalination
  'w_ras': [49.9777, 27.8864],          // Ras Al-Khair
  'w_yanbu': [38.0618, 24.0889],        // Yanbu IWP
  'w_shuaibah': [39.5149, 20.9844],     // Shuaibah desalination
  'w_shuqaiq': [42.0450, 17.7167],      // Shuqaiq plant
  
  // Industrial cities
  'i_jubail': [49.6583, 27.0174],       // Jubail Industrial City
  'i_yanbu': [38.0618, 24.0889],        // Yanbu Industrial City
  'i_waad': [41.1183, 30.0],            // Waad Al-Shamal
  'i_ras': [49.9777, 27.8864],          // Ras Al-Khair Industrial
  
  // Logistics hubs
  'l_dam': [50.1000, 26.4207],          // Dammam Logistics Park
  'l_dry': [46.6753, 24.7136],          // Dry Port Riyadh
  'l_jed': [39.1925, 21.5433],          // Jeddah Islamic Port
  'l_kaec': [39.1031, 22.3411],         // King Abdullah Economic City
  
  // Energy projects
  'e_neom': [35.3171, 28.4006],         // NEOM
  
  // Cities/Regions (reuse from KSA_REGIONS)
  'riyadh': [46.6753, 24.7136],
  'makkah': [39.8262, 21.4225],
  'medina': [39.6142, 24.4539],
  'hail': [41.6903, 27.5114],
  'jawf': [39.8675, 29.8117],
  'asir': [42.5053, 18.2164]
};

// Helpers
function getMainCategory(sector?: string): MainCategory {
  if (!sector || sector === 'all') return 'All';
  const s = sector.toLowerCase();
  if (s === 'mining') return 'Mining';
  if (s === 'water') return 'Water';
  if (s === 'energy') return 'Energy';
  if (s === 'industry') return 'Industry';
  if (s === 'logistics' || s === 'transportation') return 'Transportation';
  if (s === 'giga') return 'Giga';
  return 'All';
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
  const svgRef = useRef<SVGSVGElement>(null);

  // Sanitize coordinates to prevent NaN/Infinity in SVG paths
  const sanitizeCoord = (value: number): number => {
    if (!isFinite(value) || isNaN(value)) {
      return 0;
    }
    return Math.round(value * 100) / 100;
  };

  const generatePaths = useCallback((geojson: any, color: string, idPrefix: string) => {
    const map = mapRef.current?.getMap();
    if (!map) return [];
    
    return geojson.features.map((f: any, i: number) => {
        try {
          const coords = f.geometry.coordinates;
          if (!coords || coords.length < 2) return null;
          
          // Validate coordinates are valid numbers
          if (!Array.isArray(coords[0]) || !Array.isArray(coords[1]) ||
              typeof coords[0][0] !== 'number' || typeof coords[0][1] !== 'number' ||
              typeof coords[1][0] !== 'number' || typeof coords[1][1] !== 'number' ||
              !isFinite(coords[0][0]) || !isFinite(coords[0][1]) ||
              !isFinite(coords[1][0]) || !isFinite(coords[1][1])) {
            return null;
          }
          
          const p1 = map.project(coords[0]);
          const p2 = map.project(coords[1]);
          
          // Validate projected coordinates - must be objects with FINITE x and y values
          if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p1.y !== 'number' ||
              typeof p2.x !== 'number' || typeof p2.y !== 'number' ||
              !isFinite(p1.x) || !isFinite(p1.y) || !isFinite(p2.x) || !isFinite(p2.y)) {
            return null;
          }

          // Sanitize all coordinates (belt and suspenders approach)
          const p1x = sanitizeCoord(p1.x);
          const p1y = sanitizeCoord(p1.y);
          const p2x = sanitizeCoord(p2.x);
          const p2y = sanitizeCoord(p2.y);

          // Calculate mid-point and angle for labels
          const midX = sanitizeCoord((p1x + p2x) / 2);
          const midY = sanitizeCoord((p1y + p2y) / 2);
          const angle = Math.atan2(p2y - p1y, p2x - p1x) * (180 / Math.PI);

          // Final validation: ensure no Infinity or NaN in final values
          if (!isFinite(p1x) || !isFinite(p1y) || !isFinite(p2x) || !isFinite(p2y) ||
              !isFinite(midX) || !isFinite(midY) || !isFinite(angle)) {
            return null;
          }

          const pathString = `M ${p1x} ${p1y} L ${p2x} ${p2y}`;
          
          // Sanity check on the path string itself
          if (pathString.includes('Infinity') || pathString.includes('NaN')) {
            return null;
          }

          return {
            id: `${idPrefix}-${i}`,
            d: pathString,
            color,
            label: f.properties.label,
            labelPos: { x: midX, y: midY, angle }
          };
        } catch (err) {
          return null;
        }
      }).filter(Boolean);
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Initial draw
    setPaths([
      ...generatePaths(manualGeoJSON, 'var(--network-manual)', 'manual'),
      ...generatePaths(dbGeoJSON, 'var(--network-db)', 'db')
    ].filter(Boolean) as any);

    // Direct DOM manipulation for smooth updates during drag
    const updatePathsDirect = () => {
      if (!svgRef.current) return;
      
      const newPaths = [
        ...generatePaths(manualGeoJSON, 'var(--network-manual)', 'manual'),
        ...generatePaths(dbGeoJSON, 'var(--network-db)', 'db')
      ].filter(Boolean) as any;

      // Update path elements and labels by matching data-id attribute
      newPaths.forEach((pathData: any) => {
        const basePath = svgRef.current?.querySelector(`path.network-path-base[data-id="${pathData.id}"]`);
        const flowPath = svgRef.current?.querySelector(`path.network-path-flow[data-id="${pathData.id}"]`);
        const labelGroup = svgRef.current?.querySelector(`g.network-label[data-id="${pathData.id}"]`);
        
        if (basePath) basePath.setAttribute('d', pathData.d);
        if (flowPath) flowPath.setAttribute('d', pathData.d);
        
        // Update label position and rotation
        if (labelGroup && pathData.labelPos) {
          const { x, y, angle } = pathData.labelPos;
          const rotation = angle > 90 || angle < -90 ? angle + 180 : angle;
          labelGroup.setAttribute('transform', `rotate(${rotation}, ${x}, ${y})`);
          
          // Update rect and text positions
          const rect = labelGroup.querySelector('rect');
          const text = labelGroup.querySelector('text');
          if (rect && pathData.label) {
            rect.setAttribute('x', String(x - (pathData.label.length * 3)));
            rect.setAttribute('y', String(y - 14));
          }
          if (text) {
            text.setAttribute('x', String(x));
            text.setAttribute('y', String(y));
          }
        }
      });
    };

    // Listen to map move events for real-time updates during drag
    map.on('move', updatePathsDirect);

    return () => {
      map.off('move', updatePathsDirect);
    };
  }, [manualGeoJSON, dbGeoJSON, mapRef, generatePaths]);

  return (
    <svg ref={svgRef} className="network-svg-overlay">
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
        <g key={path.id} className="network-connection-group">
          <path
            d={path.d}
            className="network-path-base"
            data-id={path.id}
            stroke={path.color}
            strokeWidth="4"
            strokeOpacity="0.3"
          />
          <path
            d={path.d}
            className="network-path-flow"
            data-id={path.id}
            stroke={path.color}
            strokeWidth="2"
            strokeOpacity="1.0"
            filter="url(#soft-glow)"
          />
          {/* Hover-only label */}
          {path.label && (
            <g className="network-label" data-id={path.id} transform={`translate(${path.labelPos.x}, ${path.labelPos.y})`}>
              <rect
                x={-path.label.length * 3.5}
                y={-10}
                width={path.label.length * 7}
                height={20}
                fill="rgba(0,0,0,0.9)"
                stroke={path.color}
                strokeWidth="1.5"
                rx="4"
              />
              <text
                x={0}
                y={0}
                dy="4"
                textAnchor="middle"
                fill="white"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  pointerEvents: 'none',
                  letterSpacing: '0.3px'
                }}
              >
                {path.label}
              </text>
            </g>
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
  quarter,
  timelineFilter = 'both',
  priorityFilter = 'both'
}) => {
  const mapRef = useRef<any>(null);

  // UI State
  const [selectedAsset, setSelectedAsset] = useState<GraphNode | null>(null);
  const [hoverAsset, setHoverAsset] = useState<GraphNode | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Animation State for Line Flow - REMOVED (Now handled by CSS in SVG)
  const [mapViewport, setMapViewport] = useState<any>(null);

  // Sync SVG on move
  const onMove = useCallback((evt: any) => {
    setMapViewport(evt.viewState);
  }, []);

  // NO CONTROLLED ViewState - Allows smooth animations via mapRef.current.flyTo()

  // Filter Assets
  const filteredAssets = useMemo(() => {
    const activeSectors = ['water', 'energy', 'mining', 'industry', 'logistics', 'giga'];

    return allAssets.filter(node => {
      if (node.asset_type === 'Network Connection') return false;
      if (node.asset_type === 'Region') return false; // Exclude region markers (rendered separately)
      const coords = getCoords(node);
      if (!coords) return false;

      const nodeSector = node.sector?.toLowerCase();

      // Handle 'all' sector - show all 6 active sectors
      if (selectedSector === 'all') {
        if (!activeSectors.includes(nodeSector || '')) {
          return false;
        }
      } else if (selectedSector !== 'All Factors' && nodeSector !== selectedSector.toLowerCase()) {
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
    { s: 'Yanbu 4 IWP', d: 'Madinah', type: 'Water', status: 'Existing', label: 'Yanbu-Madinah Water Line' },
    { s: 'Yanbu 4 IWP', d: 'Riyadh', type: 'Water', status: 'Existing', label: 'Yanbu-Riyadh Water Line' },
    { s: 'Jubail Power Plant', d: 'Riyadh', type: 'Water', status: 'Existing', label: 'Jubail-Riyadh Water Line' },
    { s: 'Jubail Power Plant', d: 'Ras Al-Khair Power Plant', type: 'Water', status: 'Existing', label: 'Jubail-Ras Al-Khair Water Line' },

    // Logistics Corridors (Landbridge & Ports)
    { s: 'Dammam Logistics Park', d: 'Riyadh Integrated Logistics Zone', type: 'Transportation', status: 'Planned', label: 'Dammam-Riyadh Logistics Corridor' },
    { s: 'Riyadh Integrated Logistics Zone', d: 'King Abdullah Port Logistics', type: 'Transportation', status: 'Planned', label: 'Riyadh-Jeddah Landbridge' },
    { s: 'King Abdullah Port Logistics', d: 'Yanbu Industrial City', type: 'Transportation', status: 'Existing', label: 'Red Sea Logistics Route' },

    // Industrial Supply Chains (Mining to Industry)
    { s: 'Jubail Industrial City', d: 'NEOM (The Line)', type: 'Industry', status: 'Existing', label: 'Jubail-NEOM Industrial Link' },
    { s: 'Wa\'ad Al-Shamal', d: 'Jubail Industrial City', type: 'Industry', status: 'Existing', label: 'Phosphate Supply Chain' },
    { s: 'Mahd Ad Dahab Mine', d: 'Riyadh 2nd Industrial City', type: 'Industry', status: 'Existing', label: 'Gold-Industrial Supply Line' },

    // Energy Grid (Power Distribution)
    { s: 'Jubail Power Plant', d: 'Eastern Region', type: 'Energy', status: 'Existing', label: 'Eastern Grid Trunk' },
    { s: 'Ras Al-Khair Power Plant', d: 'Riyadh', type: 'Energy', status: 'Existing', label: 'East-Central Power Line' },
    { s: 'Dumat Al Jandal Wind Farm', d: 'Tabuk', type: 'Energy', status: 'Planned', label: 'Northern Renewable Link' },
    { s: 'Rabigh 3 IWP', d: 'Makkah', type: 'Energy', status: 'Existing', label: 'Rabigh-Makkah Power Line' },

    // Regional Connectors (Strategic)
    { s: 'Mahd Ad Dahab Mine', d: 'Riyadh', type: 'Mining', status: 'Existing', label: 'Gold Mining Route' },
    { s: 'Mahd Ad Dahab Mine', d: 'Hail', type: 'Mining', status: 'Existing', label: 'Mining Regional Link' },
    { s: 'Madinah', d: 'King Abdullah Port Logistics', type: 'Transportation', status: 'Existing', label: 'Madinah-Jeddah Corridor' }
  ];

  // Animation State - Disabled line dash animation to prevent Mapbox crash (property not supported)
  // const [lineDashOffset, setLineDashOffset] = useState(0);

  // useEffect(() => { ... });

  // --- GENERATE LINE LAYERS ---
  const { manualGeoJSON, dbGeoJSON } = useMemo(() => {
    const findNode = (id: string) => allAssets.find(n => n.id === id || n.name === id);
    const getPoint = (node: GraphNode | undefined) => node ? getCoords(node) : null;

    // VISIBILITY CHECK: Show lines if both endpoints exist in allAssets (not filtered view)
    // This allows connections to display even when endpoints are filtered out of current view
    const isVisible = (id: string) => allAssets.some(a => a.id === id || a.name === id);

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
            label: conn.label || `${conn.type} Connection`,
            sector: conn.type
          },
          geometry: { type: 'LineString', coordinates: [sPoint, dPoint] }
        };
      }
      return null;
    }).filter(Boolean);

    // 2. DB Lines
    const dbConnections = allAssets.filter(n => n.asset_type === 'Network Connection');
    
    console.log('=== DB CONNECTIONS DEBUG ===');
    console.log(`Total DB connections found: ${dbConnections.length}`);
    console.log('Available asset names:', allAssets.map(a => a.name).filter(Boolean).slice(0, 30));
    
    const dbFeatures = dbConnections.map((conn, idx) => {
      if (!conn.source_asset_name || !conn.destination_asset_name) {
        console.log(`#${idx + 1} SKIP: Missing source/dest names`, conn.name);
        return null;
      }

      let sPoint: [number, number] | null = null;
      let dPoint: [number, number] | null = null;

      // Flexible matching: try name, id, case-insensitive, OR fallback coords
      const findAsset = (searchName: string) => {
        const normalized = searchName.trim().toLowerCase();
        
        // First try to find in actual assets
        const found = allAssets.find(a => 
          a.name?.trim().toLowerCase() === normalized || 
          a.id?.trim().toLowerCase() === normalized
        );
        
        if (found) return found;
        
        // FALLBACK: Create temporary asset from hardcoded coords
        const coords = INFRASTRUCTURE_FALLBACK[normalized];
        if (coords) {
          return {
            id: normalized,
            name: searchName,
            longitude: coords[0],
            latitude: coords[1]
          } as GraphNode;
        }
        
        return undefined;
      };

      const sAsset = findAsset(conn.source_asset_name);
      const dAsset = findAsset(conn.destination_asset_name);

      if (sAsset) sPoint = getCoords(sAsset);
      if (dAsset) dPoint = getCoords(dAsset);
      
      console.log(`#${idx + 1} "${conn.name || 'Unnamed'}"`);
      console.log(`  Source: "${conn.source_asset_name}" → ${sAsset ? `FOUND: "${sAsset.name}"` : 'NOT FOUND'} → ${sPoint ? `[${sPoint}]` : 'NO COORDS'}`);
      console.log(`  Dest: "${conn.destination_asset_name}" → ${dAsset ? `FOUND: "${dAsset.name}"` : 'NOT FOUND'} → ${dPoint ? `[${dPoint}]` : 'NO COORDS'}`);
      console.log(`  Result: ${sPoint && dPoint ? '✅ LINE CREATED' : '❌ LINE SKIPPED'}`);
      console.log('');

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
                'line-color': getComputedStyle(document.documentElement).getPropertyValue('--network-db').trim() || '#22d3ee',
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
                'line-color': getComputedStyle(document.documentElement).getPropertyValue('--network-manual').trim() || '#818cf8',
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
                    <span>{asset.sector}</span>
                    {asset.subCategory && (
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>{asset.subCategory}</span>
                    )}
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

        {/* 1. Left Group: Controls (Reset only) */}
        {selectedRegion && (
          <div className="controls-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto' }}>
            <button
              className="control-btn"
              onClick={() => onRegionSelect?.(null)}
              style={{ alignSelf: 'flex-start' }}
            >
              Reset View
            </button>
          </div>
        )}

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
                    <span style={{ fontSize: '9px', color: 'var(--component-text-muted)', marginTop: '-2px' }}>{selectedAsset.subCategory}</span>
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
                          <span className="tag-pill ownership" style={{ background: selectedAsset.ownership_type === 'PPP' ? 'var(--component-color-info)' : 'var(--component-panel-border)' }}>
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
                                  background: selectedAsset.sector === 'Water' ? 'var(--sector-water)' : 'var(--sector-industry)'
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
                    <div className="popup-section full-width highlight-box" style={{ background: 'color-mix(in srgb, var(--component-color-warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--component-color-warning) 30%, transparent)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--status-construction)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Private Investment Size</div>
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

      {/* LEGEND REMOVED - Now redundant with header sector icons */}
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
