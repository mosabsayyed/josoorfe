import React from 'react';
import { Map } from 'react-map-gl/mapbox';
import DeckGL from '@deck.gl/react';
import { IconLayer } from '@deck.gl/layers';
import { FlyToInterpolator } from '@deck.gl/core';

// Data
import { strategicAssets, StrategicAsset, MainCategory, getMainCategory, getSimpleStatus, STATUS_COLORS } from './data/strategicAssets';
import './SectorMap.css';

// Icons
// Icons
import iconMining from '../../../assets/map-markers/mining.svg';
import iconWater from '../../../assets/map-markers/water.svg';
import iconEnergy from '../../../assets/map-markers/energy.svg';
import iconIndustry from '../../../assets/map-markers/industry.svg';
import iconTransportation from '../../../assets/map-markers/transportation.svg';
import iconGiga from '../../../assets/map-markers/giga.svg';

const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';

const INITIAL_VIEW_STATE = {
    longitude: 45.0,
    latitude: 24.0,
    zoom: 5,
    pitch: 0,
    bearing: 0
};

// View constraints to prevent extreme zooming/panning
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

const MAIN_CATEGORY_ICONS: Record<MainCategory, string> = {
    'Mining': iconMining,
    'Water': iconWater,
    'Energy': iconEnergy,
    'Industry': iconIndustry,
    'Transportation': iconTransportation,
    'Giga': iconGiga
};

// Custom Map Glows
import glowMining from '../../../assets/map-markers/miningg.svg';
import glowWater from '../../../assets/map-markers/waterg.svg';
import glowEnergy from '../../../assets/map-markers/energyg.svg';
import glowIndustry from '../../../assets/map-markers/industryg.svg';
import glowTransportation from '../../../assets/map-markers/transportationg.svg';
import glowGiga from '../../../assets/map-markers/gigag.svg';

const MAIN_CATEGORY_GLOWS: Record<MainCategory, string> = {
    'Mining': glowMining,
    'Water': glowWater,
    'Energy': glowEnergy,
    'Industry': glowIndustry,
    'Transportation': glowTransportation,
    'Giga': glowGiga
};

// Legend Icons (l-prefixed versions)
import legendMining from '../../../assets/map-markers/lmining.svg';
import legendWater from '../../../assets/map-markers/lwater.svg';
import legendEnergy from '../../../assets/map-markers/lenergy.svg';
import legendIndustry from '../../../assets/map-markers/lindustry.svg';
import legendTransportation from '../../../assets/map-markers/ltransport.svg';
import legendGiga from '../../../assets/map-markers/lgiga.svg';
import legendPriority from '../../../assets/map-markers/lPriority.svg';

const LEGEND_ICONS: Record<MainCategory, string> = {
    'Mining': legendMining,
    'Water': legendWater,
    'Energy': legendEnergy,
    'Industry': legendIndustry,
    'Transportation': legendTransportation,
    'Giga': legendGiga
};

const MAIN_CATEGORY_COLORS: Record<MainCategory, string> = {
    'Mining': '#d97706',      // Amber
    'Water': '#06b6d4',       // Cyan
    'Energy': '#facc15',      // Yellow
    'Industry': '#3b82f6',    // Blue
    'Transportation': '#18181b', // Black (Zinc-900 for better depth)
    'Giga': '#eab308'         // Gold
};

const getGlowForMainCategory = (mainCategory: MainCategory): string => {
    return MAIN_CATEGORY_GLOWS[mainCategory] || glowIndustry;
};

export function SimpleKsaMap() {
    // We need state to handle selection sizing
    // State
    const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);
    const [viewState, setViewState] = React.useState(INITIAL_VIEW_STATE);

    // Filter State
    const [activeSectors, setActiveSectors] = React.useState<string[]>(Object.keys(MAIN_CATEGORY_ICONS));
    const [showFuture, setShowFuture] = React.useState<boolean>(true);
    const [showFilterPanel, setShowFilterPanel] = React.useState<boolean>(false);

    // Asset Details Panel State
    const [selectedAsset, setSelectedAsset] = React.useState<StrategicAsset | null>(null);
    const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(false);

    const goToAsset = (d: StrategicAsset) => {
        setViewState({
            ...(viewState as any),
            longitude: d.long,
            latitude: d.lat,
            zoom: 9,
            transitionDuration: 2000,
            transitionInterpolator: new FlyToInterpolator()
        });
        setSelectedAssetId(d.id);
        setSelectedAsset(d);
    };

    // Reset collapse state when asset changes
    React.useEffect(() => {
        if (selectedAsset) {
            setIsPanelCollapsed(false);
        }
    }, [selectedAsset?.id]);

    // Filter Data
    const filteredAssets = React.useMemo(() => {
        return strategicAssets.filter(d => {
            const mainCat = getMainCategory(d.category, d.subCategory);
            const isSectorActive = mainCat && activeSectors.includes(mainCat);

            // Use getSimpleStatus helper: 'Existing'/'Active' => 'Running', others => 'Future'
            const simpleStatus = getSimpleStatus(d.status);
            if (!showFuture && simpleStatus === 'Future') return false;

            return isSectorActive;
        });
    }, [activeSectors, showFuture]);

    // Calculate Running vs Future counts
    const runningCount = React.useMemo(() => {
        return filteredAssets.filter(d => getSimpleStatus(d.status) === 'Running').length;
    }, [filteredAssets]);

    const futureCount = React.useMemo(() => {
        return filteredAssets.filter(d => getSimpleStatus(d.status) === 'Future').length;
    }, [filteredAssets]);

    const layers = [
        new IconLayer({
            id: 'combined-assets',
            // SORTING IS CRITICAL: Render High Priority LAST so they appear ON TOP
            data: [...filteredAssets].sort((a, b) => { // Use filteredAssets here
                if (a.priority === 'HIGH' && b.priority !== 'HIGH') return 1;
                if (a.priority !== 'HIGH' && b.priority === 'HIGH') return -1;
                return 0;
            }),
            getPosition: (d: StrategicAsset) => [d.long, d.lat],
            getIcon: (d: StrategicAsset) => {
                const mainCat = getMainCategory(d.category, d.subCategory);
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
            getSize: (d: StrategicAsset) => (selectedAssetId === d.id ? 90 : 60),
            sizeScale: 1,
            sizeMinPixels: 24,
            pickable: true,
            onClick: (info) => {
                if (info.object) {
                    console.log('Clicked:', info.object.name);
                    goToAsset(info.object);
                }
            },
            updateTriggers: {
                getIcon: [selectedAssetId],
                getSize: selectedAssetId
            }
        })
    ];

    const getTooltip = ({ object }: any) => {
        if (!object) return null;
        const asset = object as StrategicAsset;
        return {
            html: `
                <div style="font-family: 'Inter', sans-serif; padding: 8px; color: white;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #fbbf24;">${asset.name}</div>
                    <div style="font-size: 12px; color: #94a3b8;">${asset.category} - ${asset.subCategory}</div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">Status: ${asset.status}</div>
                    ${asset.priority === 'HIGH' ? '<div style="font-size: 10px; color: #fbbf24; margin-top: 4px; border: 1px solid #fbbf24; display: inline-block; padding: 1px 4px; border-radius: 4px;">HIGH PRIORITY</div>' : ''}
                </div>
            `,
            // ... (Wait, I need to be precise with StartLine/EndLine) ...
            // Instead of replacing the whole file, I will do targeted edits for the simple ones, and one for the end.

            // EDIT 1: Fix zIndex and End of File
            style: {
                backgroundColor: '#1e293b',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #334155',
                borderRadius: '8px',
                zIndex: '1000'
            }
        };
    };

    const toggleSector = (sector: string) => {
        if (activeSectors.includes(sector)) {
            setActiveSectors(activeSectors.filter(s => s !== sector));
        } else {
            setActiveSectors([...activeSectors, sector]);
        }
    };

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <DeckGL
                viewState={viewState as any}
                onViewStateChange={(e) => setViewState(e.viewState as any)}
                controller={true}
                layers={layers}
                getTooltip={getTooltip}
                style={{ width: '100%', height: '100%' }}
            >
                <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/mapbox/navigation-night-v1"
                    style={{ width: '100%', height: '100%' }}
                />
            </DeckGL>

            {/* Filter Toggle Button (Top Left) */}
            <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '1rem',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(15, 23, 42, 0.95)',
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
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.95)'}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Asset Sectors
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showFilterPanel ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
            </button>

            {/* Stats Panel (Top Right) */}
            <div style={{
                position: 'absolute',
                top: '2rem',
                right: '1rem',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                zIndex: 1000,
                display: 'flex',
                gap: '24px',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Running</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{runningCount}</span>
                </div>
                <div style={{ width: '1px', height: '2rem', background: 'rgba(255, 255, 255, 0.1)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Future</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#6366f1' }}>{futureCount}</span>
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilterPanel && (
                <div style={{
                    position: 'absolute',
                    top: '4.5rem',
                    left: '1rem',
                    zIndex: 999,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '16px',
                    width: '240px',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                }}>
                    {/* Future Assets Toggle */}
                    <div style={{ marginBottom: '16px' }}>
                        <button
                            onClick={() => setShowFuture(!showFuture)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: showFuture ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                color: 'white',
                                fontSize: '13px',
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
                    </div>

                    {/* Sectors */}
                    <div>
                        <h4 style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sectors</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.keys(MAIN_CATEGORY_ICONS).map(sector => (
                                <button
                                    key={sector}
                                    onClick={() => toggleSector(sector)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: `1px solid ${activeSectors.includes(sector) ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)'}`,
                                        background: activeSectors.includes(sector) ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                                        color: activeSectors.includes(sector) ? '#fbbf24' : '#94a3b8',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {sector}
                                </button>
                            ))}
                        </div>
                        {activeSectors.length > 0 && activeSectors.length < Object.keys(MAIN_CATEGORY_ICONS).length && (
                            <button
                                onClick={() => setActiveSectors([])}
                                style={{
                                    marginTop: '12px',
                                    width: '100%',
                                    padding: '6px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '6px',
                                    color: '#94a3b8',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Disclaimer (Bottom Left - Above Mapbox Logo, with background strip) */}
            <div style={{
                position: 'absolute',
                bottom: '2.5rem',
                left: '0.5rem',
                zIndex: 200,
                fontSize: '0.625rem',
                color: '#ffffff',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
                pointerEvents: 'none',
                fontWeight: 500,
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '6px 12px',
                borderRadius: '6px',
                backdropFilter: 'blur(4px)',
                maxWidth: 'calc(100% - 350px)',
                lineHeight: 1.4
            }}>
                <strong>Disclaimer:</strong>
                <br />• Data based on KSA public Sector datasets publicly available.
                <br />• Data shown is indicative and non-comprehensive and might be out of date.
            </div>

            {/* Legend (Bottom Right) */}
            <div style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Legend</div>
                {Object.entries(LEGEND_ICONS).map(([cat, icon]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            {/* Asset Details Panel (Collapsible, Centered) */}
            {selectedAsset && (
                <div
                    className="asset-panel"
                    style={{
                        position: 'absolute',
                        top: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        width: isPanelCollapsed ? '320px' : '380px',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div
                        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            cursor: 'pointer',
                            background: '#1e293b',
                            borderBottom: isPanelCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px'
                        }}
                    >
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.025em', color: MAIN_CATEGORY_COLORS[getMainCategory(selectedAsset.category, selectedAsset.subCategory) || 'Industry'] }}>{selectedAsset.name}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAsset(null);
                                    setSelectedAssetId(null);
                                    setViewState({
                                        ...INITIAL_VIEW_STATE,
                                        transitionDuration: 1000,
                                        transitionInterpolator: new FlyToInterpolator()
                                    } as any);
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
                                {isPanelCollapsed ? <polyline points="6 9 12 15 18 9" /> : <polyline points="18 15 12 9 6 15" />}
                            </svg>
                        </div>
                    </div>
                    {!isPanelCollapsed && (
                        <div className="panel-content" style={{ padding: '1rem', gap: '0.75rem' }}>
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

                            <div className="asset-details" style={{ gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
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
                                    <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                        <span className="detail-label">Rationale</span>
                                        <span className="detail-value" style={{ whiteSpace: 'normal', fontSize: '0.75rem', lineHeight: 1.3, color: 'rgba(255,255,255,0.8)' }}>{selectedAsset.rationale}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Description</span>
                                    <span className="detail-value" style={{ fontSize: '0.75rem' }}>{selectedAsset.description}</span>
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
                                style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.7rem' }}
                            >
                                Open in Google Maps →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
