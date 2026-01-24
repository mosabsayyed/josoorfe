/**
 * SectorMap.tsx - Pure Mapbox with ALL Original Features Restored
 * 
 * RESTORED FEATURES:
 * 1. 3D Perspective (Pitch/Bearing) & FlyTo Animations.
 * 2. Panel Collapsing (isPanelCollapsed).
 * 3. Hover Tooltips (for quick info).
 * 4. Rich Detail Panel (Investment, Sectors, Status).
 * 5. Future/Stats Toggles.
 *
 * FIXED: Manual connections now render using unfiltered asset lookup and correct region IDs.
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
  if (s === 'existing' || s === 'active') return 'Running';
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

const SectorMap: React.FC<SectorMapProps> = ({
  selectedSector,
  selectedRegion,
  onRegionSelect,
  onAssetSelect,
  focusAssetId,
  assets: allAssets, // Use parent data
  isLoading = false
}) => {
  const mapRef = useRef<any>(null);

  // UI State
  const [selectedAsset, setSelectedAsset] = useState<GraphNode | null>(null);
  const [hoverAsset, setHoverAsset] = useState<GraphNode | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showFuture, setShowFuture] = useState(true);

  // View State
  const [viewState, setViewState] = useState({
    latitude: 24.0,
    longitude: 45.0,
    zoom: 5,
    pitch: 45,
    bearing: 0
  });

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
      if (!showFuture && simpleStatus === 'Future') return false;

      return true;
    });
  }, [allAssets, selectedSector, selectedRegion, showFuture]);

  // Handle Region Selection Zoom
  useEffect(() => {
    if (selectedRegion) {
      const region = KSA_REGIONS.find(r => r.id === selectedRegion);
      if (region) {
        mapRef.current?.flyTo({
          center: [region.long, region.lat],
          zoom: 7,
          pitch: 50,
          duration: 2000, // Slower for smoothness
          essential: true, // Respect user preference but force animation if possible
          easing: (t: number) => t * (2 - t) // Ease-out quad
        });
      }
    } else if (!focusAssetId) {
      // Reset to default
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
  }, [selectedRegion, focusAssetId]);

  // --- 1. RED LINE: MANUAL CONNECTIONS (Strict IDs) ---
  // Verified network topology from: 'Implementation Plan - Network Connections.md'
  const MANUAL_CONNECTIONS = [
    // Water Network (Yanbu 4 IWP Hub)
    { s: 'A-019', d: 'Madinah', type: 'Water', status: 'Existing' }, // Yanbu 4 IWP -> Madinah Region (City)
    { s: 'A-019', d: 'Riyadh', type: 'Water', status: 'Existing' },  // Yanbu 4 IWP -> Riyadh Region
    { s: 'A-015', d: 'Riyadh', type: 'Water', status: 'Existing' },  // Jubail Power & Desal -> Riyadh
    { s: 'A-015', d: 'A-016', type: 'Water', status: 'Existing' },   // Jubail Power & Desal -> Ras Al Khair Power

    // Logistics Corridors (Landbridge & Ports)
    { s: 'A-064', d: 'A-061', type: 'Transportation', status: 'Planned' }, // Dammam Logistics -> Riyadh Dry Port (Landbridge)
    { s: 'A-061', d: 'A-060', type: 'Transportation', status: 'Planned' }, // Riyadh Dry Port -> Jeddah Islamic Port (Landbridge)
    { s: 'A-060', d: 'A-063', type: 'Transportation', status: 'Existing' }, // Jeddah Islamic Port -> KAEC Port (Red Sea Corridor)
    { s: 'A-063', d: 'A-019', type: 'Transportation', status: 'Existing' }, // KAEC Port -> Yanbu Hub (Industrial Link)

    // Industrial Supply Chains (Mining to Industry)
    { s: 'A-001', d: 'A-032', type: 'Industry', status: 'Existing' }, // Fadhili Gas -> Sadara Chemical
    { s: 'A-001', d: 'A-033', type: 'Industry', status: 'Existing' }, // Fadhili Gas -> Jubail United Petrochem
    { s: 'A-010', d: 'A-032', type: 'Industry', status: 'Existing' }, // Waad Al Shamal (Phosphate) -> Sadara (Feedstock)
    { s: 'A-013', d: 'A-030', type: 'Industry', status: 'Existing' }, // Mahd Ad Dhahab (Gold) -> Modon Oasis (Hypothetical Processing)

    // Energy Grid (Power Distribution)
    { s: 'A-015', d: 'Eastern', type: 'Energy', status: 'Existing' }, // Jubail Plant -> Eastern Grid
    { s: 'A-016', d: 'Riyadh', type: 'Energy', status: 'Existing' },  // Ras Al Khair -> Riyadh Grid
    { s: 'A-025', d: 'Tabuk', type: 'Energy', status: 'Planned' },    // Dumat Al Jandal Wind -> Tabuk/NEOM
    { s: 'A-026', d: 'Makkah', type: 'Energy', status: 'Existing' },  // Rabigh Solar -> Makkah Grid

    // Regional Connectors (Strategic)
    { s: 'A-013', d: 'Riyadh', type: 'Mining', status: 'Existing' },  // Mahd Ad Dhahab -> Riyadh HQ
    { s: 'A-013', d: 'Hail', type: 'Mining', status: 'Existing' },    // Mahd Ad Dhahab -> Hail Support
    { s: 'Madinah', d: 'A-063', type: 'Transportation', status: 'Existing' }  // Madinah -> KAEC Port
  ];

  // Animation State
  const [lineDashOffset, setLineDashOffset] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setLineDashOffset(prev => (prev - 1) % 24); // Determine speed here
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- GENERATE LINE LAYERS ---
  const { manualGeoJSON, dbGeoJSON } = useMemo(() => {

    /**
     * FIX: Use allAssets (not filteredAssets) for lookup
     * This ensures connections remain visible even if one endpoint is filtered out
     */
    const findNode = (id: string) => allAssets.find(n => n.id === id || n.name === id);
    const getPoint = (node: GraphNode | undefined) => node ? getCoords(node) : null;

    // 1. Manual Lines (Red)
    const manualFeatures = MANUAL_CONNECTIONS.map(conn => {
      const sNode = findNode(conn.s);
      const dNode = findNode(conn.d);

      // Fallback to Regions list if not in Assets (for Region endpoints like 'Riyadh')
      // Corrected logic: Look in KSA_REGIONS purely by ID or Name matching
      const sRegion = KSA_REGIONS.find(r => r.id === conn.s || r.name === conn.s);
      const dRegion = KSA_REGIONS.find(r => r.id === conn.d || r.name === conn.d);

      const sPoint = getPoint(sNode) || (sRegion ? [sRegion.long, sRegion.lat] : null);
      const dPoint = getPoint(dNode) || (dRegion ? [dRegion.long, dRegion.lat] : null);

      if (sPoint && dPoint) {
        return {
          type: 'Feature',
          properties: { type: 'Manual', status: conn.status },
          geometry: { type: 'LineString', coordinates: [sPoint, dPoint] }
        };
      }
      return null;
    }).filter(Boolean);

    // 2. DB Lines (Green)
    const dbConnections = allAssets.filter(n => n.asset_type === 'Network Connection');
    const dbFeatures = dbConnections.map(conn => {
      // Start with coordinates if they exist (DB Source of Truth)
      let sPoint: [number, number] | null = null;
      let dPoint: [number, number] | null = null;

      if (conn.source_lat && conn.source_long && conn.source_lat !== 0) {
        sPoint = [conn.source_long, conn.source_lat];
      }
      if (conn.dest_lat && conn.dest_long && conn.dest_lat !== 0) {
        dPoint = [conn.dest_long, conn.dest_lat];
      }

      // Fallback: Try to resolve by name if validation failed (Strict Match Only)
      if (!sPoint && conn.source_asset_name) {
        const n = allAssets.find(a => a.name === conn.source_asset_name);
        if (n) sPoint = getCoords(n);
      }
      if (!dPoint && conn.destination_asset_name) {
        const n = allAssets.find(a => a.name === conn.destination_asset_name);
        if (n) dPoint = getCoords(n);
      }

      if (sPoint && dPoint) {
        return {
          type: 'Feature',
          properties: { type: 'DB', status: 'Existing' },
          geometry: { type: 'LineString', coordinates: [sPoint, dPoint] }
        };
      }
      return null;
    }).filter(Boolean);

    return {
      manualGeoJSON: { type: 'FeatureCollection', features: manualFeatures },
      dbGeoJSON: { type: 'FeatureCollection', features: dbFeatures }
    };
  }, [allAssets]); // Depend on allAssets, not filteredAssets

  // Focus Handling
  useEffect(() => {
    if (focusAssetId) {
      const asset = allAssets.find(a => a.id === focusAssetId);
      if (asset) {
        const coords = getCoords(asset);
        if (coords) {
          setSelectedAsset(asset);
          setIsPanelCollapsed(false);
          mapRef.current?.flyTo({ center: coords, zoom: 10, pitch: 60, duration: 2000 });
        }
      }
    }
  }, [focusAssetId, allAssets]);

  return (
    <div className="saudi-map-container">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        reuseMaps
        minZoom={4} // Relaxed from 5
        maxZoom={16}
        // maxBounds={[[32.0, 12.0], [60.0, 35.0]]} // Relaxed or Checked
        // Expanding bounds slightly to avoid "stuck" feeling on wide monitors
        maxBounds={[[30.0, 10.0], [65.0, 40.0]]}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* --- GREEN LINE (DB DATA) --- */}
        {dbGeoJSON.features.length > 0 && (
          <Source id="lines-db" type="geojson" data={dbGeoJSON as any}>
            <Layer
              id="layer-lines-db"
              type="line"
              paint={{
                'line-color': '#00ff00', // GREEN
                'line-width': 4,
                'line-opacity': 0.6,
                'line-dasharray': [1, 2], // Dotted
              } as any}
            />
          </Source>
        )}

        {/* --- RED LINE (MANUAL DATA) --- */}
        {manualGeoJSON.features.length > 0 && (
          <Source id="lines-manual" type="geojson" data={manualGeoJSON as any}>
            <Layer
              id="layer-lines-manual"
              type="line"
              paint={{
                'line-color': '#ff0000', // RED
                'line-width': 6,
                'line-opacity': 0.8,
                'line-dasharray': [2, 4],
                'line-dash-offset': lineDashOffset
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

        {/* 3. ASSET MARKERS (GLOWING PINS) */}
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
                mapRef.current?.flyTo({ center: coords, zoom: 9, pitch: 60, duration: 1500 });
              }}
            >
              <div
                className={`asset-marker-container ${isHigh ? 'high-priority' : ''} ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setHoverAsset(asset)}
                onMouseLeave={() => setHoverAsset(null)}
              >
                <img
                  src={iconSrc}
                  alt={asset.name}
                  style={{
                    width: size,
                    height: size,
                    filter: isSelected ? 'drop-shadow(0 0 10px #ffffff)' : undefined,
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}
                />

                {/* TOOLTIP ON HOVER */}
                {hoverAsset?.id === asset.id && !isSelected && (
                  <div className="asset-tooltip">
                    <strong>{asset.name}</strong>
                    <div>{asset.sector}</div>
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {/* 4. DETAIL PANEL (OVERLAY) */}
        {selectedAsset && !isPanelCollapsed && (
          <Popup
            longitude={getCoords(selectedAsset)![0]}
            latitude={getCoords(selectedAsset)![1]}
            anchor="left"
            closeButton={false}
            offset={40}
            maxWidth="400px"
            className="sector-popup"
          >
            <div className="popup-card glass-panel">
              <div className="popup-header">
                <span className="popup-category" style={{ color: MAIN_CATEGORY_COLORS[getMainCategory(selectedAsset.sector) || 'Industry'] }}>
                  {selectedAsset.sector?.toUpperCase()}
                </span>
                <span className={`popup-status ${getStatusClass(selectedAsset.status)}`}>
                  {selectedAsset.status}
                </span>
              </div>

              <h3 className="popup-title">{selectedAsset.name}</h3>


              <div className="popup-grid">
                {/* 1. FINANCIALS */}
                {(selectedAsset.investment || selectedAsset.revenue || selectedAsset.cost) && (
                  <div className="popup-section full-width">
                    <label>Financial Impact</label>
                    <div className="metrics-row">
                      {selectedAsset.investment && (
                        <div className="metric-item">
                          <span className="value">{selectedAsset.investment}</span>
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

                {/* 3. STRATEGIC ALIGNMENT */}
                {(selectedAsset.fiscalAction || selectedAsset.priority) && (
                  <div className="popup-section full-width">
                    <label>Strategic Mandate</label>
                    <div className="tags-row">
                      {selectedAsset.priority && (
                        <span className={`tag-pill priority-${selectedAsset.priority.toLowerCase()}`}>
                          {selectedAsset.priority} Priority
                        </span>
                      )}
                      {selectedAsset.fiscalAction && (
                        <span className="tag-pill action">
                          ACTION: {selectedAsset.fiscalAction}
                        </span>
                      )}
                      {selectedAsset.fundingSource && (
                        <span className="tag-pill source">
                          Source: {selectedAsset.fundingSource}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. SECTOR SPLIT (Breakdown) */}
                {(selectedAsset.sectors || selectedAsset.sector_split) && (
                  <div className="popup-section full-width">
                    <label>Sector Distribution</label>
                    <div className="sector-bars">
                      {Object.entries(selectedAsset.sectors || selectedAsset.sector_split || {}).map(([key, val]) => (
                        <div key={key} className="sector-bar-item">
                          <div className="bar-label">
                            <span>{key}</span>
                            <span>{typeof val === 'number' ? val.toLocaleString() : String(val)}</span>
                          </div>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{ width: `${Math.min(100, (Number(val) / 100000) * 100)}%` }} // Rough scaling
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. RATIONALE */}
                <div className="popup-metric full-width">
                  <label>Strategic Rationale</label>
                  <p>{selectedAsset.rationale || selectedAsset.description || 'No description available.'}</p>
                </div>
              </div>

              <div className="popup-actions">
                <button
                  className="popup-btn primary"
                  onClick={() => window.open(`/assets/${selectedAsset.id}`, '_blank')}
                >
                  View Details
                </button>
                <button
                  className="popup-btn secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPanelCollapsed(true);
                  }}
                >
                  Minimize
                </button>
              </div>
            </div>
          </Popup>
        )}

      </Map>

      {/* --- OVERLAYS --- */}

      {/* Stats Pill */}
      {/* Stats Pill - DYNAMIC filteredAssets */}
      <div className="map-stats-pill">
        <div className="stat-item current">
          <div className="dot"></div>
          <div>
            <div className="val">{filteredAssets.length}</div>
            <div className="lbl">Active Assets</div>
          </div>
        </div>
        <div className="divider"></div>
        <div className="stat-item future">
          <div className="dot-future"></div>
          <div>
            <div className="val">
              {filteredAssets.reduce((acc, curr) =>
                acc + (parseInt(curr.investment?.replace(/[^0-9]/g, '') || '0') / 1000), 0
              ).toFixed(1)}B
            </div>
            <div className="lbl">Total CapEx</div>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="map-controls-overlay">
        <button
          className={`control-btn ${showFuture ? 'active' : ''}`}
          onClick={() => setShowFuture(!showFuture)}
          title="Toggle Future Projects"
        >
          <Clock size={18} />
          <span>Future</span>
        </button>
        {selectedRegion && (
          <button
            className="control-btn"
            onClick={() => onRegionSelect?.(null)}
          >
            Reset View
          </button>
        )}
      </div>

      {/* Collapsed Panel Tab (Bottom Right) */}
      {selectedAsset && isPanelCollapsed && (
        <div
          className="collapsed-panel-tab"
          onClick={() => setIsPanelCollapsed(false)}
          style={{ borderLeft: `4px solid ${MAIN_CATEGORY_COLORS[getMainCategory(selectedAsset.sector) || 'Industry']}` }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.025em', color: MAIN_CATEGORY_COLORS[getMainCategory(selectedAsset.sector) || 'Industry'] }}>
            {selectedAsset.name}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAsset(null);
                onAssetSelect?.(null);
              }}
              className="panel-close-btn"
              style={{ color: 'inherit' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>
      )}
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

export default SectorMap;
