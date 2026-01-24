/**
 * SectorMap.tsx - Merged from SimpleKsaMap.tsx + Neo4j Data Fetch
 * 
 * Base: SimpleKsaMap.tsx (all features preserved)
 * Added: Neo4j data fetch from current SectorMap implementation
 * Modified: Accepts selectedSector/selectedRegion props for 3-panel layout
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Map } from 'react-map-gl/mapbox';
import DeckGL from '@deck.gl/react';
import { IconLayer, LineLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { FlyToInterpolator } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';
import './SectorMap.css';

// Icons - PRESERVED FROM SimpleKsaMap.tsx
import iconMining from '../../../assets/map-markers/mining.svg';
import iconWater from '../../../assets/map-markers/water.svg';
import iconEnergy from '../../../assets/map-markers/energy.svg';
import iconIndustry from '../../../assets/map-markers/industry.svg';
import iconTransportation from '../../../assets/map-markers/transportation.svg';
import iconGiga from '../../../assets/map-markers/giga.svg';

// Glow Icons for HIGH priority
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

// Types - From API documentation (flat structure)
interface GraphNode {
  id: string;
  name?: string;
  sector?: string;
  category?: string;
  subCategory?: string;
  asset_type?: string;
  status?: string;
  priority?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  long?: number;
  source_lat?: number;
  source_long?: number;
  dest_lat?: number;
  dest_long?: number;
  region?: string;
  description?: string;
  capacity?: string;
  investment?: string;
  rationale?: string;
  fiscalAction?: string;
  source_asset_name?: string; // For network connections
  destination_asset_name?: string; // For network connections
  dest_asset_name?: string;
  [key: string]: any;
}

// Props interface for 3-panel layout integration
interface SectorMapProps {
  selectedSector: string;
  selectedRegion?: string | null;
  onRegionSelect?: (regionId: string | null) => void;
  focusAssetId?: string | null;
}

// Main category mapping
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

const MAIN_CATEGORY_COLORS: Record<MainCategory, string> = {
  'Mining': '#d97706',
  'Water': '#06b6d4',
  'Energy': '#facc15',
  'Industry': '#3b82f6',
  'Transportation': '#18181b',
  'Giga': '#eab308'
};

const STATUS_COLORS: Record<string, string> = {
  'Existing': '#10b981',
  'Active': '#10b981',
  'Under Construction': '#f59e0b',
  'Planned': '#6366f1',
  'Future': '#6366f1'
};

// Sector to MainCategory mapping
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
  if (s === 'existing' || s === 'active') return 'Running';
  return 'Future';
}

// Helper to extract coordinates
function getCoords(node: GraphNode): [number, number] | null {
  const lng = node.longitude ?? node.long;
  const lat = node.latitude ?? node.lat;
  if (lng != null && lat != null && (Math.abs(lng) > 0.1 || Math.abs(lat) > 0.1)) {
    return [lng, lat];
  }
  return null;
}

// Map Configuration
const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';
// Fallback only if needed, but ENV is preferred.
// const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9zYWItYWl0d2luIiwiYSI6ImNtMnR5Z3R4YjBieXkya3F5MXczcG9jN3EifQ.C58sV58KzWcfiC45gGkZpQ';
const INITIAL_VIEW_STATE = {
  latitude: 24.0,
  longitude: 45.0,
  zoom: 5,
  pitch: 45,
  bearing: 0
};

// KSA Administrative Regions with main city coordinates
interface Region {
  id: string;
  name: string;
  lat: number;
  long: number;
}

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

// ============================================================
// COMPONENT
// ============================================================
const SectorMap: React.FC<SectorMapProps> = ({ selectedSector, selectedRegion, onRegionSelect, focusAssetId }) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // Real Data State
  const [allAssets, setAllAssets] = useState<GraphNode[]>([]);
  // We compute network assets separately from allAssets or filteredAssets
  const [networkLines, setNetworkLines] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation State
  const [pulseRadius, setPulseRadius] = useState(0);

  // UI State
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<GraphNode | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showFuture, setShowFuture] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  // 1. Animation Loop
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      const time = Date.now() / 1500;
      const value = (Math.sin(time) + 1) / 2;
      setPulseRadius(value);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // 2. Fetch Real Data from Remote Backend
  useEffect(() => {
    // DIAGNOSTIC: Check WebGL Context Availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error("❌ CRITICAL: Browser refused to create WebGL2 context. Context limit likely reached.");
    } else {
      console.log("✅ DIAGNOSTIC: Fresh WebGL2 context created successfully.");
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        console.log("✅ GPU Vendor:", gl.getParameter(ext.UNMASKED_VENDOR_WEBGL));
        console.log("✅ GPU Renderer:", gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
      }
    }
    // End Diagnostic

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Broader query to catch Energy (businesses) and Lines
      const endpoint = '/api/graph?nodeLabels=SectorGovEntity,SectorBusiness';

      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const rawNodes = (data.nodes || []) as GraphNode[];

        // Filter Connection nodes vs Assets
        const assets = rawNodes.filter(n => n.asset_type !== 'Network Connection');
        const connectionNodes = rawNodes.filter(n => n.asset_type === 'Network Connection');

        if (isMounted) {
          console.log(`✅ Received ${rawNodes.length} nodes (${assets.length} assets, ${connectionNodes.length} connections)`);

          setAllAssets(assets);

          // Generate lines: PRIORITIZE direct coordinates on the Connection Node
          const lines = connectionNodes.map((conn, idx) => {
            let sCoords: [number, number] | null = null;
            let dCoords: [number, number] | null = null;

            // DIAGNOSTIC LOG for first item
            if (idx === 0) console.log("🔍 Sample Connection Node:", conn);

            // Strategy 1: Direct Coordinates (Ensure Number parsing)
            if (conn.source_lat != null && conn.source_long != null && conn.dest_lat != null && conn.dest_long != null) {
              sCoords = [Number(conn.source_long), Number(conn.source_lat)];
              dCoords = [Number(conn.dest_long), Number(conn.dest_lat)];
            }
            // Strategy 2: Lookup via Asset ID or Name (Fallback)
            else {
              const sourceName = conn.source_asset_name?.toLowerCase();
              const destName = (conn.destination_asset_name || conn.dest_asset_name)?.toLowerCase();

              const sourceAsset = assets.find(a => a.name?.toLowerCase() === sourceName || a.id === conn.source_asset_name);
              const destAsset = assets.find(a => a.name?.toLowerCase() === destName || a.id === conn.destination_asset_name);

              if (sourceAsset && destAsset) {
                sCoords = getCoords(sourceAsset);
                dCoords = getCoords(destAsset);
              }
            }

            if (sCoords && dCoords) {
              return {
                sourcePosition: sCoords,
                targetPosition: dCoords,
                color: [0, 255, 255, 200], // Neon Cyan
                name: conn.name
              };
            }

            // Log failures (sample first 5)
            if (idx < 5) console.warn(`⚠️ Line skipped (${idx}):`, conn.name, conn.source_asset_name, conn.destination_asset_name);
            return null;
          }).filter(Boolean);

          // Hardcoded TEST LINE to verify visibility (Riyadh -> Jeddah)
          const testLine = {
            sourcePosition: [46.6753, 24.7136], // Riyadh
            targetPosition: [39.1925, 21.4858], // Jeddah
            color: [255, 0, 0, 255], // RED DEBUG
            name: "DEBUG LINE"
          };

          console.log(`✅ Generated ${lines.length} valid lines (+1 Debug).`);
          setNetworkLines([testLine, ...lines]);
        }
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Handle focusAssetId from right panel (click-to-focus)
  useEffect(() => {
    if (focusAssetId && allAssets.length > 0) {
      const asset = allAssets.find(a => a.id === focusAssetId);
      if (asset) {
        const coords = getCoords(asset);
        if (coords) {
          setViewState({
            ...(viewState as any),
            longitude: coords[0],
            latitude: coords[1],
            zoom: 9,
            transitionDuration: 1500,
            transitionInterpolator: new FlyToInterpolator()
          });
          setSelectedAssetId(asset.id);
          setSelectedAsset(asset);
        }
      }
    }
  }, [focusAssetId, allAssets]);

  // ============================================================
  // FILTERING - MERGED LOGIC
  // ============================================================
  const filteredAssets = useMemo(() => {
    return allAssets.filter(node => {
      if (!node) return false;
      const coords = getCoords(node);
      if (!coords) return false; // Must have coordinates

      // Sector filter from prop
      const nodeSector = node.sector?.toLowerCase();
      if (selectedSector !== 'All Factors' && nodeSector !== selectedSector.toLowerCase()) {
        // Allow GIGA for economy
        if (nodeSector === 'giga' && selectedSector.toLowerCase() === 'economy') {
          // allow
        } else {
          return false;
        }
      }

      // Region filter from prop
      if (selectedRegion && node.region !== selectedRegion) {
        return false;
      }

      // Future toggle
      const simpleStatus = getSimpleStatus(node.status);
      if (!showFuture && simpleStatus === 'Future') return false;

      return true;
    });
  }, [allAssets, selectedSector, selectedRegion, showFuture]);

  // ============================================================
  // INTERACTIONS - FROM SimpleKsaMap
  // ============================================================
  const goToAsset = useCallback((asset: GraphNode) => {
    const coords = getCoords(asset);
    if (!coords) return;

    setViewState({
      ...(viewState as any),
      longitude: coords[0],
      latitude: coords[1],
      zoom: 9,
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator()
    });
    setSelectedAssetId(asset.id);
    setSelectedAsset(asset);
  }, [viewState]);

  useEffect(() => {
    if (selectedAsset) {
      setIsPanelCollapsed(false);
    }
  }, [selectedAsset?.id]);

  // ============================================================
  // LAYERS - FROM SimpleKsaMap with adaptations
  // ============================================================
  const layers = useMemo(() => [
    // Network lines
    new LineLayer({
      id: 'network-lines',
      data: networkLines,
      getSourcePosition: (d: any) => d.sourcePosition,
      getTargetPosition: (d: any) => d.targetPosition,
      getColor: [0, 255, 255, 200], // Neon Cyan
      getWidth: 4, // Increased thickness
      pickable: true
    }),

    // Asset icons - WITH PRIORITY SORTING
    new IconLayer({
      id: 'asset-icons',
      data: [...filteredAssets].sort((a, b) => {
        if (a.priority === 'HIGH' && b.priority !== 'HIGH') return 1;
        if (a.priority !== 'HIGH' && b.priority === 'HIGH') return -1;
        return 0;
      }),
      getPosition: (d: GraphNode) => getCoords(d) || [0, 0],
      getIcon: (d: GraphNode) => {
        const mainCat = getMainCategory(d.sector);
        const isHighPriority = d.priority === 'HIGH';
        const iconSet = isHighPriority ? MAIN_CATEGORY_GLOWS : MAIN_CATEGORY_ICONS;

        return {
          url: mainCat ? iconSet[mainCat] : iconIndustry,
          width: 123,
          height: 176,
          anchorX: 61.5,
          anchorY: 176,
          mask: false
        };
      },
      getSize: (d: GraphNode) => selectedAssetId === d.id ? 90 : 60,
      sizeScale: 1,
      sizeMinPixels: 24,
      pickable: true,
      onClick: (info) => {
        if (info.object) {
          goToAsset(info.object);
        }
      },
      updateTriggers: {
        getIcon: [selectedAssetId],
        getSize: selectedAssetId
      }
    }),

    // Region Markers - OUTER RING (Glow/Pulse Effect)
    new ScatterplotLayer({
      id: 'region-markers-outer',
      data: KSA_REGIONS,
      getPosition: (d: Region) => [d.long, d.lat],
      getRadius: (d: Region) => selectedRegion === d.id ? 35000 : 25000,
      getFillColor: (d: Region) => selectedRegion === d.id
        ? [251, 191, 36, 100]  // Gold transparent when selected
        : [59, 130, 246, 60],  // Blue transparent default
      getLineColor: (d: Region) => selectedRegion === d.id
        ? [251, 191, 36, 255]
        : [59, 130, 246, 200],
      lineWidthMinPixels: 2,
      stroked: true,
      pickable: true,
      onClick: (info) => {
        if (info.object && onRegionSelect) {
          const region = info.object as Region;
          if (selectedRegion === region.id) {
            onRegionSelect(null);
          } else {
            onRegionSelect(region.id);
          }
        }
      },
      updateTriggers: {
        getRadius: [selectedRegion],
        getFillColor: [selectedRegion],
        getLineColor: [selectedRegion]
      }
    }),

    // Region Markers - INNER DOT (Solid Core)
    new ScatterplotLayer({
      id: 'region-markers-inner',
      data: KSA_REGIONS,
      getPosition: (d: Region) => [d.long, d.lat],
      getRadius: (d: Region) => selectedRegion === d.id ? 8000 : 6000,
      getFillColor: (d: Region) => selectedRegion === d.id
        ? [251, 191, 36, 255]  // Gold solid
        : [59, 130, 246, 255], // Blue solid
      pickable: false, // Let outer ring handle clicks
      updateTriggers: {
        getRadius: [selectedRegion],
        getFillColor: [selectedRegion]
      }
    }),

    // Region labels
    new TextLayer({
      id: 'region-labels',
      data: KSA_REGIONS,
      getPosition: (d: Region) => [d.long, d.lat],
      getText: (d: Region) => d.name,
      getSize: 12,
      getColor: (d: Region) => selectedRegion === d.id
        ? [255, 255, 255, 255]
        : [148, 163, 184, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'top',
      getPixelOffset: [0, 20],
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      updateTriggers: {
        getColor: [selectedRegion]
      }
    })
  ], [filteredAssets, networkLines, selectedAssetId, goToAsset, selectedRegion, onRegionSelect]);

  // Tooltip
  const getTooltip = useCallback(({ object }: any) => {
    if (!object) return null;
    if (object.sourcePosition) return null; // Line tooltips optional
    const asset = object as GraphNode;
    const mainCat = getMainCategory(asset.sector);
    return {
      html: `
    <div style="font-family: 'Inter', sans-serif; padding: 8px; color: white;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #fbbf24;">${asset.name}</div>
      <div style="font-size: 12px; color: #94a3b8;">${mainCat || asset.sector || 'Unknown'}</div>
      <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">Status: ${asset.status || 'N/A'}</div>
      ${asset.priority === 'HIGH' ? '<div style="font-size: 10px; color: #fbbf24; margin-top: 4px; border: 1px solid #fbbf24; display: inline-block; padding: 1px 4px; border-radius: 4px;">HIGH PRIORITY</div>' : ''}
    </div>
  `,
      style: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        zIndex: '1000'
      }
    };
  }, []);

  // ============================================================
  // SEQUENCE CONTROL: EXPLLICIT DIMENSIONS
  // ============================================================
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    console.log("🚀 SECTOR MAP V5: INITIALIZING...");

    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        console.log(`📏 Container Size: ${clientWidth}x${clientHeight}`);

        // Ensure we don't try to render in a collapsed or tiny container (prevents WebGL crash)
        if (clientWidth > 100 && clientHeight > 100) {
          setDimensions({ width: clientWidth, height: clientHeight });
        } else {
          console.warn(`⚠️ Skipped update: Container too small (${clientWidth}x${clientHeight})`);
        }
      }
    };

    // Initial check
    updateSize();

    // Resize listener
    window.addEventListener('resize', updateSize);

    // Backup: Poll for size if initial was 0
    const t = setInterval(updateSize, 500);

    // SAFETY FALLBACK: If stuck for 2 seconds, force window size
    const safety = setTimeout(() => {
      if (containerRef.current && (containerRef.current.clientWidth < 100 || containerRef.current.clientHeight < 100)) {
        console.warn("⚠️ Container size stuck/small after timeout. Forcing Window size.");
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    }, 2000);

    return () => {
      window.removeEventListener('resize', updateSize);
      clearInterval(t);
      clearTimeout(safety);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', background: '#0f172a', overflow: 'hidden' }}
    >
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <DeckGL
          viewState={viewState as any}
          onViewStateChange={(e) => setViewState(e.viewState as any)}
          controller={true}
          layers={layers}
          getTooltip={getTooltip}
          width={dimensions.width}
          height={dimensions.height}
          style={{ width: '100%', height: '100%' }}
          onError={(e) => console.error("❌ DeckGL Runtime Error:", e)}
          useDevicePixels={false}
        >
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: '100%', height: '100%' }}
          />
        </DeckGL>
      ) : (
        <div className="map-loading-overlay">Initializing Dimensions...</div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="map-loading-overlay">Loading Data...</div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="map-error-overlay">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ marginBottom: '8px' }}>Data Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>Retry</button>
          </div>
        </div>
      )}

      {/* Future Assets Toggle Button */}
      <button
        onClick={() => setShowFuture(!showFuture)}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: showFuture ? 'rgba(59, 130, 246, 0.9)' : 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {showFuture ? (
            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
          ) : (
            <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
          )}
        </svg>
        {showFuture ? 'Showing Future Assets' : 'Future Assets Hidden'}
      </button>

      {/* STATS PILL - Restored from SimpleKsaMap */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1px',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '4px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>Current</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              {allAssets.filter(a => getSimpleStatus(a.status) === 'Running').length}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          marginLeft: '4px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>Future</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              {allAssets.filter(a => getSimpleStatus(a.status) === 'Future').length}
            </span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="map-loading-overlay">Loading Data...</div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="map-error-overlay">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ marginBottom: '8px' }}>Data Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>Retry</button>
          </div>
        </div>
      )}

      {/* Future Assets Toggle Button */}
      <button
        onClick={() => setShowFuture(!showFuture)}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: showFuture ? 'rgba(59, 130, 246, 0.9)' : 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {showFuture ? (
            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
          ) : (
            <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
          )}
        </svg>
        {showFuture ? 'Showing Future Assets' : 'Future Assets Hidden'}
      </button>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000
      }}>
        <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Legend</div>
        {Object.entries(LEGEND_ICONS).map(([cat, icon]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <img src={icon} alt={cat} style={{ width: '22px', height: '22px' }} />
            <span style={{ color: 'white', fontSize: '12px' }}>{cat}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={legendPriority} alt="High Priority" style={{ width: '22px', height: '22px' }} />
          <span style={{ color: '#fbbf24', fontSize: '11px' }}>High Priority</span>
        </div>
      </div>

      {/* Asset Details Panel - RICH POPUP */}
      {selectedAsset && (
        <div
          className="asset-panel"
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: isPanelCollapsed ? '320px' : '380px',
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              cursor: 'pointer',
              background: 'rgba(30, 41, 59, 1)',
              borderBottom: isPanelCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={MAIN_CATEGORY_ICONS[getMainCategory(selectedAsset.sector) || 'Industry']}
                alt="icon"
                style={{ width: '24px', height: '24px' }}
              />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                {selectedAsset.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAsset(null);
                  setSelectedAssetId(null);
                }}
                className="panel-close-btn"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>
          </div>

          {!isPanelCollapsed && (
            <div className="panel-content" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Meta Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Sector</span>
                  <span style={{ color: MAIN_CATEGORY_COLORS[getMainCategory(selectedAsset.sector) || 'Industry'], fontWeight: 600 }}>
                    {getMainCategory(selectedAsset.sector) || selectedAsset.sector}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
                  <span
                    style={{
                      backgroundColor: (STATUS_COLORS[selectedAsset.status || ''] || '#6366f1') + '22',
                      color: STATUS_COLORS[selectedAsset.status || ''] || '#6366f1',
                      border: `1px solid ${STATUS_COLORS[selectedAsset.status || ''] || '#6366f1'}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    ● {selectedAsset.status || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>REGION</span>
                  <span style={{ fontSize: '13px', color: 'white' }}>{selectedAsset.region || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>CAPACITY</span>
                  <span style={{ fontSize: '13px', color: 'white' }}>{selectedAsset.capacity || 'N/A'}</span>
                </div>
                {selectedAsset.investment && (
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#eab308', display: 'block', fontWeight: 700 }}>INVESTMENT</span>
                    <span style={{ fontSize: '15px', color: '#eab308', fontWeight: 700 }}>{selectedAsset.investment}</span>
                  </div>
                )}
              </div>

              {/* Priority & Rationale */}
              {selectedAsset.priority === 'HIGH' && (
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: '#eab308', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>⚠️ STRATEGIC PRIORITY</span>
                  <span style={{ color: '#fef08a', fontSize: '12px' }}>{selectedAsset.rationale || 'Critical infrastructure asset for Vision 2030 targets.'}</span>
                </div>
              )}

              {/* Description */}
              {selectedAsset.description && (
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '2px' }}>DESCRIPTION</span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>{selectedAsset.description}</span>
                </div>
              )}

              {/* Maps Link */}
              <a
                href={`https://www.google.com/maps?q=${selectedAsset.lat || 0},${selectedAsset.long || 0}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: '4px', textAlign: 'center',
                  fontSize: '11px', color: '#3b82f6', textDecoration: 'none',
                  padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px'
                }}
              >
                Open in Google Maps →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Region Tooltips handled by DeckGL getTooltip */}
    </div>
  );
};

export default SectorMap;