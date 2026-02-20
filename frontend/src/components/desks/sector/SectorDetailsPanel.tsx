import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface SectorDetailsPanelProps {
    selectedSector: string;
    selectedRegion: string | null;
    hoveredRegion?: string | null;
    selectedAsset?: GraphNode | null;
    onBackToNational?: () => void;
    onAssetClick?: (asset: GraphNode) => void;
    assets: GraphNode[];
    isLoading?: boolean;
    year?: number;
    quarter?: string;
    selectedPriority?: string; // "All" | "HIGH" | "MAJOR" | etc
    selectedStatus?: string;   // "All" | "Existing" | "Planned" | etc
    // Policy tool panel props
    selectedPolicyTool?: any;
    policyRiskByL1?: Map<string, any>;
    onPolicyToolClose?: () => void;
    onRiskAssessment?: (tool: any, riskData: any) => void;
}

interface GraphNode {
    id: string;
    name?: string;
    sector?: string;
    asset_type?: string;
    status?: string;
    priority?: string;
    region?: string;
    capacity_metric?: string;
    investment?: string;
    rationale?: string;
    fiscal_action?: string;
    labels?: string[];
    [key: string]: any;
}

interface SectorOutput {
    label: string;
    value: string;
    unit: string;
    color: string;
}

// Helper to parse capacity metrics
function parseCapacityMetric(metric?: string): number {
    if (!metric) return 0;

    // Clean up the metric string
    const cleaned = metric.toLowerCase().trim().replace(/,/g, '').replace(/~/g, '').replace(/–/g, '-').replace(/\s+/g, ' ');

    console.log('[CAPACITY PARSE] Input:', metric, '→ Cleaned:', cleaned);

    // Skip descriptive text (not numeric capacity values) — 'combined' is NOT descriptive, it's valid data
    const descriptivePatterns = [
        'tax-free', 'aviation hub', 'modon', 'container support', 'warehousing',
        'thermal', 'complex', 'integrated', 'port-centric', 'ev production',
        'multiple high-investment', 'various', 'cluster', 'lines'
    ];
    
    if (descriptivePatterns.some(pattern => cleaned.includes(pattern))) {
        console.log('[CAPACITY PARSE] Skipped (descriptive):', metric);
        return 0;
    }

    // Extract numeric value (handle ranges like "0.5-3M" by taking the higher value)
    let match = cleaned.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    let value = 0;
    
    if (match) {
        // Range found, use the higher value
        value = Math.max(parseFloat(match[1]), parseFloat(match[2]));
        console.log('[CAPACITY PARSE] Range detected:', match[1], '-', match[2], '→ Using:', value);
    } else {
        // Single value
        match = cleaned.match(/(\d+\.?\d*)/);
        if (!match) {
            console.log('[CAPACITY PARSE] No numeric value found');
            return 0;
        }
        value = parseFloat(match[1]);
        console.log('[CAPACITY PARSE] Single value:', value);
    }

    // Handle multipliers and units
    let result = 0;

    // Water capacity: m3/day or m³/day — handle M/k prefixes before unit
    if (cleaned.includes('m3/day') || cleaned.includes('m³/day')) {
        const prefixMatch = cleaned.match(/(\d+\.?\d*)([mk])\s*m[3³]\/day/i);
        if (prefixMatch) {
            const num = parseFloat(prefixMatch[1]);
            const prefix = prefixMatch[2].toLowerCase();
            result = prefix === 'm' ? num * 1000000 : prefix === 'k' ? num * 1000 : num;
            console.log('[CAPACITY PARSE] Water with prefix:', prefixMatch[1], prefixMatch[2], '→', result);
        } else if (cleaned.includes('m m3') || cleaned.match(/\d+\.?\d*m m/)) {
            result = value * 1000000; // "2.9M m3/day"
        } else if (cleaned.includes('k m3') || cleaned.match(/\d+\.?\d*k m/)) {
            result = value * 1000; // "600k m3/day"
        } else {
            result = value; // Plain number
        }
        console.log('[CAPACITY PARSE] Water (m3/day):', value, '→', result);
        return result;
    }

    // Power: MW or GW
    if (cleaned.includes('mw') || cleaned.includes('gw')) {
        if (cleaned.includes('gw')) {
            result = value * 1000; // Convert GW to MW
        } else {
            result = value;
        }
        console.log('[CAPACITY PARSE] Power:', value, '→', result);
        return result;
    }

    // Vehicles
    if (cleaned.includes('vehicle') || cleaned.includes('cars') || cleaned.match(/vehicles?\/yr/)) {
        if (cleaned.includes('k')) {
            result = value * 1000;
        } else {
            result = value;
        }
        console.log('[CAPACITY PARSE] Vehicles:', value, '→', result);
        return result;
    }

    // Passengers
    if (cleaned.includes('pax') || cleaned.includes('passenger')) {
        if (cleaned.includes('m ') || cleaned.match(/\d+\.?\d*m\s/)) {
            result = value * 1000000;
        } else if (cleaned.includes('k')) {
            result = value * 1000;
        } else {
            result = value;
        }
        console.log('[CAPACITY PARSE] Passengers:', value, '→', result);
        return result;
    }

    // Housing/Hotels/Stadiums
    if (cleaned.includes('units') || cleaned.includes('keys') || cleaned.includes('seats')) {
        if (cleaned.includes('k-') || cleaned.includes('k ')) {
            result = value * 1000;
        } else if (cleaned.includes('m ') || cleaned.match(/\d+m\s/)) {
            result = value * 1000000;
        } else {
            result = value;
        }
        console.log('[CAPACITY PARSE] Units/Keys/Seats:', value, '→', result);
        return result;
    }

    // Area
    if (cleaned.includes('km²') || cleaned.includes('sq km') || cleaned.includes('m²')) {
        result = value;
        console.log('[CAPACITY PARSE] Area:', value, '→', result);
        return result;
    }

    // Material throughput
    if (cleaned.includes('mt') && cleaned.includes('daily')) {
        result = value;
        console.log('[CAPACITY PARSE] Material (MT):', value, '→', result);
        return result;
    }

    console.log('[CAPACITY PARSE] Unrecognized format, returning 0');
    return 0;
}

// Format numbers with proper units
function formatNumber(value: number): string {
    if (value === 0) return '0';

    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
}

const SectorDetailsPanel: React.FC<SectorDetailsPanelProps> = ({
    selectedSector,
    selectedRegion,
    hoveredRegion,
    selectedAsset,
    onBackToNational,
    onAssetClick,
    assets: allAssets,
    isLoading = false,
    year,
    quarter,
    selectedPriority,
    selectedStatus,
    selectedPolicyTool,
    policyRiskByL1,
    onPolicyToolClose,
    onRiskAssessment
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const MEGA_REGIONS = [
        { id: 'Northern', name: 'Northern', regions: ['Northern', 'Tabuk', 'Jawf', 'Hail'] },
        { id: 'Western', name: 'Western', regions: ['Western', 'Makkah', 'Madinah', 'Jazan'] },
        { id: 'Eastern', name: 'Eastern', regions: ['Eastern', 'Baha'] },
        { id: 'Central', name: 'Central', regions: ['Central', 'Riyadh', 'Qassim', 'Asir', 'Najran'] }
    ];

    const getRegionStats = (regionId: string) => {
        const megaRegion = MEGA_REGIONS.find(r => r.id === regionId);
        if (!megaRegion) return null;
        
        const regionAssets = allAssets.filter(a => 
            a.region && megaRegion.regions.includes(a.region)
        );
        
        return {
            name: megaRegion.name,
            total: regionAssets.length,
            existing: regionAssets.filter(a => a.status?.toLowerCase() === 'existing').length,
            construction: regionAssets.filter(a => a.status?.toLowerCase() === 'under construction').length,
            planned: regionAssets.filter(a => a.status?.toLowerCase() === 'planned').length
        };
    };

    // Determine if drawer should be visible
    const isDrawerVisible = selectedRegion || selectedAsset;
    // Filter assets based on selection — IMPORTANT: Do NOT filter by year here
    const filteredAssets = useMemo(() => {
        const activeSectors = ['water', 'energy', 'mining', 'industry', 'logistics', 'giga'];

        return allAssets.filter(node => {
            if (!node) return false;

            const nodeSector = node.sector?.toLowerCase();
            if (!nodeSector) return false;

            // Sector filter
            if (selectedSector === 'all') {
                if (!activeSectors.includes(nodeSector)) return false;
            } else if (selectedSector !== 'All Factors' && nodeSector !== selectedSector.toLowerCase()) {
                if (!(selectedSector.toLowerCase() === 'economy' && ['mining', 'industry', 'energy'].includes(nodeSector))) {
                    return false;
                }
            }

            // Region filter
            if (selectedRegion && node.region !== selectedRegion) {
                return false;
            }

            // NOTE: Year filter removed — filteredAssets must include ALL assets in region
            // Year is used only for sector output aggregation, not asset filtering

            return true;
        });
    }, [allAssets, selectedSector, selectedRegion]);

    // Calculate sector outputs for BOTH L1 (national) and L2 (regional) views
    const sectorOutputs: SectorOutput[] = useMemo(() => {
        // L1 no hover: drawer is hidden, return empty (no need to calculate)
        // L1 mouseover region: show that region's outputs WITH ALL SAME FILTERS as L2
        // L2 selected region: show that region's outputs
        let assetsForOutput: typeof allAssets | null = null;
        
        if (selectedRegion) {
            // L2 view: use filteredAssets (already filtered by selectedRegion + sector)
            assetsForOutput = filteredAssets;
        } else if (hoveredRegion) {
            // L1 mouseover: filter by hovered region AND apply ALL SAME FILTERS as filteredAssets
            const MEGA_REGIONS = [
                { id: 'Northern', name: 'Northern', regions: ['Northern', 'Tabuk', 'Jawf', 'Hail'] },
                { id: 'Western', name: 'Western', regions: ['Western', 'Makkah', 'Madinah', 'Jazan'] },
                { id: 'Eastern', name: 'Eastern', regions: ['Eastern', 'Baha'] },
                { id: 'Central', name: 'Central', regions: ['Central', 'Riyadh', 'Qassim', 'Asir', 'Najran'] }
            ];
            const activeSectors = ['water', 'energy', 'mining', 'industry', 'logistics', 'giga'];
            const megaRegion = MEGA_REGIONS.find(r => r.id === hoveredRegion);
            
            if (megaRegion) {
                assetsForOutput = allAssets.filter(node => {
                    if (!node) return false;
                    
                    // Filter out policy tools (no region) - only physical assets for outputs
                    if (!node.region) return false;
                    
                    const nodeSector = node.sector?.toLowerCase();
                    if (!nodeSector) return false;

                    // Sector filter
                    if (selectedSector === 'all') {
                        if (!activeSectors.includes(nodeSector)) return false;
                    } else if (selectedSector !== 'All Factors' && nodeSector !== selectedSector.toLowerCase()) {
                        if (!(selectedSector.toLowerCase() === 'economy' && ['mining', 'industry', 'energy'].includes(nodeSector))) {
                            return false;
                        }
                    }

                    // Region filter (megaRegion)
                    if (!megaRegion.regions.includes(node.region)) return false;

                    // Year filter (completion year)
                    if (year) {
                        const completionDate = node.completion_date;
                        if (completionDate && typeof completionDate === 'string') {
                            const finishYear = parseInt(completionDate.substring(0, 4));
                            if (!isNaN(finishYear) && finishYear > year) return false;
                        }
                    }

                    // Priority filter (if specified and not "All")
                    if (selectedPriority && selectedPriority !== 'All') {
                        if (node.priority?.toUpperCase() !== selectedPriority.toUpperCase()) return false;
                    }

                    // Status filter (if specified and not "All")
                    if (selectedStatus && selectedStatus !== 'All') {
                        const normalizedStatus = node.status?.toLowerCase();
                        const selectedStatusLower = selectedStatus.toLowerCase();
                        if (normalizedStatus !== selectedStatusLower && 
                            !(selectedStatusLower === 'existing' && (normalizedStatus === 'operational' || normalizedStatus === 'existing'))) {
                            return false;
                        }
                    }

                    return true;
                });
            }
        } else {
            // L1 no hover: drawer is hidden anyway, return empty
            return [];
        }

        if (!assetsForOutput) return [];

        // Aggregate capacities by sector category
        const waterCapacity = assetsForOutput
            .filter(a => a.sector?.toLowerCase() === 'water')
            .reduce((sum, a) => sum + parseCapacityMetric(a.capacity_metric), 0);

        const energyCapacity = assetsForOutput
            .filter(a => a.sector?.toLowerCase() === 'energy')
            .reduce((sum, a) => sum + parseCapacityMetric(a.capacity_metric), 0);

        const housingUnits = assetsForOutput
            .filter(a => a.sector?.toLowerCase() === 'giga' && (a.asset_type?.toLowerCase().includes('housing') || a.asset_type?.toLowerCase().includes('residential')))
            .reduce((sum, a) => sum + parseCapacityMetric(a.capacity_metric), 0);

        const hotelKeys = assetsForOutput
            .filter(a => a.sector?.toLowerCase() === 'giga' && a.asset_type?.toLowerCase().includes('hotel'))
            .reduce((sum, a) => sum + parseCapacityMetric(a.capacity_metric), 0);

        const industrialSpace = assetsForOutput
            .filter(a => a.sector?.toLowerCase() === 'industry')
            .reduce((sum, a) => sum + parseCapacityMetric(a.capacity_metric), 0);

        const automotiveProduction = assetsForOutput
            .filter(a => a.sector?.toLowerCase() === 'industry' && a.asset_type?.toLowerCase().includes('automotive'))
            .reduce((sum, a) => sum + parseCapacityMetric(a.capacity_metric), 0);

        return [
            {
                label: t('josoor.sector.waterSupply'),
                value: formatNumber(waterCapacity),
                unit: 'm³/day',
                color: 'var(--sector-water)'
            },
            {
                label: t('josoor.sector.energyCapacity'),
                value: formatNumber(energyCapacity / 1000), // Convert MW to GW
                unit: 'GW',
                color: 'var(--sector-energy)'
            },
            {
                label: t('josoor.sector.housingUnits'),
                value: formatNumber(housingUnits),
                unit: 'units',
                color: 'var(--sector-giga)'
            },
            {
                label: t('josoor.sector.tourismHotelKeys'),
                value: formatNumber(hotelKeys),
                unit: 'keys',
                color: 'var(--sector-giga)'
            },
            {
                label: t('josoor.sector.industrialSpace'),
                value: formatNumber(industrialSpace),
                unit: 'km²',
                color: 'var(--sector-industry)'
            },
            {
                label: t('josoor.sector.automotiveProduction'),
                value: formatNumber(automotiveProduction),
                unit: 'cars/yr',
                color: 'var(--sector-industry)'
            }
        ];
    }, [allAssets, filteredAssets, selectedRegion, hoveredRegion, selectedSector, year, selectedPriority, selectedStatus, t]);

    // DEBUG: Log props to understand rendering flow
    console.log('[SectorDetailsPanel RENDER]', {
        selectedAsset: selectedAsset ? selectedAsset.name : 'NULL',
        selectedRegion: selectedRegion,
        hasAssetClick: !!onAssetClick,
        assetsCount: allAssets.length
    });

    // PRIORITY 0: Policy Tool View
    if (selectedPolicyTool) {
        const riskData = policyRiskByL1?.get(selectedPolicyTool.id);
        const worstBand = riskData?.worstBand || 'none';
        const l2Details = riskData?.l2Details || [];
        const bandColor = worstBand === 'red' ? 'var(--component-color-danger)' : worstBand === 'amber' ? 'var(--component-color-warning)' : worstBand === 'green' ? 'var(--component-color-success)' : 'var(--component-text-tertiary)';

        return (
            <div className="sector-details-panel drawer">
                {/* Header */}
                <div className="details-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h2 className="details-title">{selectedPolicyTool.id} • {selectedPolicyTool.name}</h2>
                            <div className="details-subtitle">{selectedPolicyTool.category}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {onRiskAssessment && (
                                <button
                                    onClick={() => onRiskAssessment(selectedPolicyTool, riskData)}
                                    style={{ background: 'rgba(244,187,48,0.15)', border: '1px solid rgba(244,187,48,0.3)', color: 'var(--component-text-accent)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                                    title={t('josoor.sector.policy.riskAssessment')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>
                                    {t('josoor.sector.policy.riskAssessment')}
                                </button>
                            )}
                            <button onClick={onPolicyToolClose} className="back-button">✕</button>
                        </div>
                    </div>
                </div>

                <div className="details-content">
                    {/* L2 Children with inline linked capability */}
                    <div>
                        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '12px' }}>
                            {t('josoor.sector.policy.l2Children')} ({l2Details.length})
                        </h3>
                        {l2Details.map((l2: any) => {
                            const l2Band = l2.buildBand?.toLowerCase() || 'none';
                            const l2Color = l2Band === 'red' ? 'var(--component-color-danger)' : l2Band === 'amber' ? 'var(--component-color-warning)' : l2Band === 'green' ? 'var(--component-color-success)' : 'var(--component-text-tertiary)';
                            return (
                                <div key={l2.l2Id} style={{ padding: '10px 12px', borderLeft: `3px solid ${l2Color}`, marginBottom: '8px', background: 'rgba(30,41,59,0.5)', borderRadius: '0 4px 4px 0' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--component-text-primary)' }}>{l2.l2Id} • {l2.l2Name}</div>
                                    {l2.capName && (
                                        <div
                                            onClick={() => l2.capId && navigate(`/desk/enterprise?cap=${l2.capId}`)}
                                            style={{ fontSize: '12px', color: 'var(--component-text-accent)', marginTop: '6px', cursor: l2.capId ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            title={l2.capId ? t('josoor.sector.policy.navigateToEnterprise') : ''}
                                        >
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '1px 6px',
                                                borderRadius: '3px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px',
                                                background: l2.buildBand ? 'rgba(99,102,241,0.15)' : 'rgba(6,182,212,0.15)',
                                                color: l2.buildBand ? 'var(--status-planned)' : 'var(--sector-water)',
                                                border: l2.buildBand ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(6,182,212,0.3)'
                                            }}>
                                                {l2.buildBand ? 'BUILD' : 'OPERATE'}
                                            </span>
                                            <span>→ {l2.capId} • {l2.capName}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {l2Details.length === 0 && (
                            <div style={{ fontSize: '13px', color: 'var(--component-text-muted)', fontStyle: 'italic' }}>
                                {t('josoor.sector.noPolicyTools')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // PRIORITY 1: Single Asset View (must check BEFORE selectedRegion)
    if (selectedAsset) {
        console.log('[SectorDetailsPanel] Rendering SINGLE ASSET VIEW for:', selectedAsset.name);
        return (
            <div className="sector-details-panel drawer">
                {/* Header - Fixed */}
                <div className="details-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h2 className="details-title">
                                <span style={{ opacity: 0.6, marginRight: '8px' }}>{selectedAsset.id}</span>
                                {selectedAsset.name}
                            </h2>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                <span className="details-subtitle" style={{ 
                                    color: 'var(--sector-' + (selectedAsset.sector?.toLowerCase() || 'industry') + ')',
                                    fontWeight: 600 
                                }}>
                                    {selectedAsset.sector?.toUpperCase()}
                                </span>
                                <span style={{ color: 'var(--component-text-muted)' }}>•</span>
                                <span className="details-subtitle" style={{
                                    color: selectedAsset.status?.toLowerCase() === 'existing' || selectedAsset.status?.toLowerCase() === 'operational'
                                        ? 'var(--component-color-success)'
                                        : selectedAsset.status?.toLowerCase() === 'planned'
                                        ? 'var(--component-color-info)'
                                        : 'var(--component-color-warning)'
                                }}>
                                    {selectedAsset.status?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => onAssetClick?.(null as any)} className="back-button">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="details-content">
                    {/* Description */}
                    {(selectedAsset.description || selectedAsset.rationale) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ 
                                color: 'var(--component-text-secondary)', 
                                lineHeight: '1.6',
                                fontSize: '14px'
                            }}>
                                {selectedAsset.description || selectedAsset.rationale}
                            </p>
                        </div>
                    )}

                    {/* Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        {selectedAsset.capacity_metric && (
                            <div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                    {t('josoor.sector.capacity')}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                    {selectedAsset.capacity_metric}
                                </div>
                            </div>
                        )}
                        
                        {selectedAsset.region && (
                            <div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                    {t('josoor.sector.region')}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                    {selectedAsset.region}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Investment */}
                    {selectedAsset.investment && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                {t('josoor.sector.investmentValue')}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--component-color-warning)' }}>
                                {selectedAsset.investment}
                            </div>
                        </div>
                    )}

                    {/* Location Details: Coordinates */}
                    {(selectedAsset.lat || selectedAsset.long || selectedAsset.latitude || selectedAsset.longitude) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {(selectedAsset.lat || selectedAsset.latitude) && (
                                <div>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.latitude')}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                        {(selectedAsset.lat || selectedAsset.latitude)?.toFixed(4)}°
                                    </div>
                                </div>
                            )}
                            {(selectedAsset.long || selectedAsset.longitude) && (
                                <div>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.longitude')}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                        {(selectedAsset.long || selectedAsset.longitude)?.toFixed(4)}°
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Completion/Launch Date */}
                    {(selectedAsset.completion_date || selectedAsset.launch_date) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                {selectedAsset.completion_date ? t('josoor.sector.completionDate') : t('josoor.sector.launchDate')}
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                {selectedAsset.completion_date || selectedAsset.launch_date}
                            </div>
                        </div>
                    )}

                    {/* Ownership Type */}
                    {selectedAsset.ownership_type && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                {t('josoor.sector.ownershipType')}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)', textTransform: 'capitalize' }}>
                                {selectedAsset.ownership_type}
                            </div>
                        </div>
                    )}

                    {/* Sector Split (for multi-sector assets) */}
                    {selectedAsset.sector_split && typeof selectedAsset.sector_split === 'object' && Object.keys(selectedAsset.sector_split).length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                {t('josoor.sector.capacityAllocation')}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {Object.entries(selectedAsset.sector_split).map(([sector, percentage]) => (
                                    <div key={sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--component-text-secondary)', textTransform: 'capitalize' }}>
                                            {sector}
                                        </span>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                            {percentage}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRIORITY ASSETS: Show ALL mock data fields */}
                    {(selectedAsset.priority === 'HIGH' || selectedAsset.priority === 'MAJOR' || selectedAsset.priority === 'URGENT' || selectedAsset.priority === 'CRITICAL') && (
                        <>
                            {/* Priority Badge */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '6px 12px',
                                    background: 'var(--component-color-error)',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {t('josoor.sector.prioritySuffix', { level: selectedAsset.priority })}
                                </span>
                            </div>

                            {/* Fiscal Action */}
                            {selectedAsset.fiscal_action && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.fiscalAction')}
                                    </div>
                                    <div style={{ 
                                        fontSize: '16px', 
                                        fontWeight: 600, 
                                        color: 'var(--component-color-warning)',
                                        padding: '8px 12px',
                                        background: 'rgba(251, 191, 36, 0.1)',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(251, 191, 36, 0.3)'
                                    }}>
                                        {selectedAsset.fiscal_action}
                                    </div>
                                </div>
                            )}

                            {/* Rationale */}
                            {selectedAsset.rationale && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.strategicRationale')}
                                    </div>
                                    <div style={{ 
                                        fontSize: '14px', 
                                        lineHeight: '1.6',
                                        color: 'var(--component-text-secondary)',
                                        padding: '12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        {selectedAsset.rationale}
                                    </div>
                                </div>
                            )}

                            {/* Capacity (if not already shown above) */}
                            {selectedAsset.capacity && selectedAsset.capacity !== selectedAsset.capacity_metric && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.capacityDetails')}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--component-text-secondary)' }}>
                                        {selectedAsset.capacity}
                                    </div>
                                </div>
                            )}

                            {/* Category */}
                            {selectedAsset.category && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.category')}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--component-text-secondary)' }}>
                                        {selectedAsset.category}
                                    </div>
                                </div>
                            )}

                            {/* Sub-category */}
                            {selectedAsset.sub_category && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.subCategory')}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--component-text-secondary)' }}>
                                        {selectedAsset.sub_category}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Strategic Alignment - ONLY for non-priority or if no rationale shown above */}
                    {!(selectedAsset.priority === 'HIGH' || selectedAsset.priority === 'MAJOR' || selectedAsset.priority === 'URGENT' || selectedAsset.priority === 'CRITICAL') && (selectedAsset.rationale || selectedAsset.fiscal_action) && (
                        <div style={{ 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '16px' }}>🎯</span>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-color-info)' }}>
                                    {t('josoor.sector.strategicAlignment')}
                                </div>
                            </div>
                            {selectedAsset.rationale && (
                                <p style={{ 
                                    fontSize: '14px', 
                                    lineHeight: '1.6', 
                                    color: 'var(--component-text-secondary)',
                                    margin: 0
                                }}>
                                    {selectedAsset.rationale}
                                </p>
                            )}
                            {selectedAsset.fiscal_action && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px' }}>
                                        {t('josoor.sector.fiscalAction')}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--component-text-primary)', fontWeight: 500 }}>
                                        {selectedAsset.fiscal_action}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Additional Location Details - for all assets */}
                    {(selectedAsset.lat || selectedAsset.long || selectedAsset.latitude || selectedAsset.longitude) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {(selectedAsset.lat || selectedAsset.latitude) && (
                                <div>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.latitude')}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                        {(selectedAsset.lat || selectedAsset.latitude)?.toFixed(4)}°
                                    </div>
                                </div>
                            )}
                            {(selectedAsset.long || selectedAsset.longitude) && (
                                <div>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {t('josoor.sector.longitude')}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                        {(selectedAsset.long || selectedAsset.longitude)?.toFixed(4)}°
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Completion/Launch Date - for all assets */}
                    {(selectedAsset.completion_date || selectedAsset.launch_date) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                {selectedAsset.completion_date ? 'COMPLETION DATE' : 'LAUNCH DATE'}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                {selectedAsset.completion_date || selectedAsset.launch_date}
                            </div>
                        </div>
                    )}

                    {/* Ownership Type - for all assets */}
                    {selectedAsset.ownership_type && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                OWNERSHIP TYPE
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)', textTransform: 'capitalize' }}>
                                {selectedAsset.ownership_type}
                            </div>
                        </div>
                    )}

                    {/* Sector Split - for all assets */}
                    {selectedAsset.sector_split && typeof selectedAsset.sector_split === 'object' && Object.keys(selectedAsset.sector_split).length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                CAPACITY ALLOCATION
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {Object.entries(selectedAsset.sector_split).map(([sector, percentage]) => (
                                    <div key={sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--component-text-secondary)', textTransform: 'capitalize' }}>
                                            {sector}
                                        </span>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                            {percentage}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional Details - for non-priority assets */}
                    {!(selectedAsset.priority === 'HIGH' || selectedAsset.priority === 'MAJOR' || selectedAsset.priority === 'URGENT' || selectedAsset.priority === 'CRITICAL') && selectedAsset.sub_category && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                {t('josoor.sector.typeLabel')}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--component-text-secondary)' }}>
                                {selectedAsset.sub_category}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // PRIORITY 2: L1 National View - Show Sector Outputs
    if (!selectedRegion) {
        return (
            <div className="sector-details-panel">
                <div className="details-header">
                    <h2 className="details-title">
                        {selectedSector === 'all' || selectedSector === 'All Factors' ? t('josoor.sector.allSectors') : t('josoor.sector.sectorSuffix', { sector: selectedSector })}
                    </h2>
                    <p className="details-subtitle">{t('josoor.sector.nationalPerspective')}</p>
                </div>

                {/* Show Sector Outputs on L1 */}
                <div className="details-content">
                    <div className="sector-outputs-section">
                        <h3 className="section-title">{t('josoor.sector.sectorOutputs')}</h3>
                        <div className="outputs-grid">
                            {sectorOutputs.map((output, idx) => (
                                <div key={idx} className="output-card">
                                    <div className="output-label">{output.label}</div>
                                    <div className="output-value" style={{ color: output.color }}>
                                        {output.value}
                                    </div>
                                    <div className="output-unit">{output.unit}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // PRIORITY 3: L2 Region View - Asset List
    return (
        <div className={`sector-details-panel drawer ${isDrawerVisible ? 'visible' : ''}`}>
            {/* Header */}
            <div className="details-header">
                <div className="header-content">
                    <div className="header-text">
                        <h2 className="details-title">
                            {selectedSector === 'all' || selectedSector === 'All Factors' ? t('josoor.sector.allSectors') : t('josoor.sector.sectorSuffix', { sector: selectedSector })}
                        </h2>
                        <p className="details-subtitle">{t('josoor.sector.regionLabel', { region: selectedRegion })}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="details-content">
                {/* Top Section: Sector Outputs */}
                <div className="sector-outputs-section">
                    <h3 className="section-title">{t('josoor.sector.sectorOutputs')}</h3>
                    <div className="outputs-grid">
                        {sectorOutputs.map((output, idx) => (
                            <div key={idx} className="output-card">
                                <div className="output-label">{output.label}</div>
                                <div className="output-value" style={{ color: output.color }}>
                                    {output.value}
                                </div>
                                <div className="output-unit">{output.unit}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Asset List */}
                <div className="assets-section">
                    <h3 className="section-title">{t('josoor.sector.assetsCount', { count: filteredAssets.length })}</h3>

                    {isLoading ? (
                        <div className="loading-state">{t('josoor.common.loading')}</div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="empty-state">{t('josoor.sector.noAssetsFound')}</div>
                    ) : (
                        <div className="assets-list">
                            {filteredAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    className="asset-card"
                                    onClick={() => {
                                        console.log('[ASSET CLICKED]', asset.name, asset);
                                        if (!onAssetClick) {
                                            console.error('[ERROR] onAssetClick handler not provided to SectorDetailsPanel');
                                            return;
                                        }
                                        onAssetClick(asset);
                                    }}
                                >
                                    <div className="asset-header">
                                        <div className="asset-name">
                                            <span style={{ opacity: 0.6, marginRight: '6px' }}>{asset.id}</span>
                                            {asset.name}
                                        </div>
                                        {(asset.priority === 'HIGH' || asset.priority === 'MAJOR' || asset.priority === 'URGENT' || asset.priority === 'CRITICAL') && (
                                            <span className="priority-badge">{asset.priority}</span>
                                        )}
                                    </div>

                                    <div className="asset-meta">
                                        <span className="asset-type">{asset.asset_type || asset.category || 'Asset'}</span>
                                        <span
                                            className="asset-status"
                                            style={{
                                                color: asset.status?.toLowerCase() === 'existing' || asset.status?.toLowerCase() === 'operational'
                                                    ? 'var(--component-color-success)'
                                                    : 'var(--component-color-info)'
                                            }}
                                        >
                                            ● {asset.status || 'Unknown'}
                                        </span>
                                    </div>

                                    {/* Asset Details Summary */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--component-text-muted)', marginTop: '6px' }}>
                                        {asset.capacity_metric && (
                                            <span style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                                                {asset.capacity_metric}
                                            </span>
                                        )}
                                        {asset.investment && (
                                            <span style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                                                💰 {asset.investment}
                                            </span>
                                        )}
                                        {asset.completion_date && (
                                            <span style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                                                📅 {asset.completion_date}
                                            </span>
                                        )}
                                    </div>

                                    {/* Extra fields for HIGH/MAJOR priority assets */}
                                    {(asset.priority === 'HIGH' || asset.priority === 'MAJOR' || asset.priority === 'URGENT' || asset.priority === 'CRITICAL') && (
                                        <div className="asset-details">
                                            {asset.rationale && (
                                                <div className="detail-field">
                                                    <span className="detail-label">{t('josoor.sector.rationale')}</span>
                                                    <span className="detail-value">{asset.rationale}</span>
                                                </div>
                                            )}
                                            {asset.fiscal_action && (
                                                <div className="detail-field">
                                                    <span className="detail-label">{t('josoor.sector.fiscalActionLabel')}</span>
                                                    <span className="detail-value">{asset.fiscal_action}</span>
                                                </div>
                                            )}
                                            {asset.investment && (
                                                <div className="detail-field">
                                                    <span className="detail-label">{t('josoor.sector.investmentLabel')}</span>
                                                    <span className="detail-value">{asset.investment}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Back to National Button - Moved to Bottom */}
            {onBackToNational && (
                <div className="details-footer">
                    <button onClick={onBackToNational} className="back-to-national-button">
                        {t('josoor.sector.backToNational')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SectorDetailsPanel;
