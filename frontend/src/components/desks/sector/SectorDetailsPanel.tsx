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
    allPolicyNodes?: any[];
    onPolicyToolClose?: () => void;
    onRiskAssessment?: (tool: any, riskData: any) => void;
    onNavigateToCapability?: (capId: string) => void;
    onStrategyClick?: () => void;
    waterL3Items?: Array<{ id: string; title: string; value: string }>;
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

// Helper to parse capacity metrics from mixed text+number strings.
// Data contains formats like: "2.9M m3/day", "600k m3/day", "4000+ MW", "3.6 GW",
// "30k Homes", "155k Vehicles/yr", "400k bpd", "25M tonnes ore", "92760 seats", etc.
function parseCapacityMetric(metric?: string): number {
    if (!metric) return 0;

    const cleaned = metric.toLowerCase().trim()
        .replace(/,/g, '').replace(/~/g, '').replace(/–/g, '-')
        .replace(/\+/g, '').replace(/>/g, '').replace(/</g, '')
        .replace(/\s+/g, ' ');

    // No digits at all → purely descriptive text (e.g. "Copper Concentrate", "Gold Ore")
    if (!/\d/.test(cleaned)) return 0;

    // Step 1: Extract number + optional multiplier suffix (M/k/G/B)
    // Try range first: "0.5-3M", "100-200k"
    let value = 0;
    let multiplier = 1;

    const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*([mkgb])?/i);
    const singleMatch = cleaned.match(/(\d+\.?\d*)\s*([mkgb])?\b/i);

    if (rangeMatch && cleaned.includes('-') && rangeMatch[1] !== rangeMatch[2]) {
        value = Math.max(parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2]));
        const suffix = (rangeMatch[3] || '').toLowerCase();
        multiplier = suffix === 'm' ? 1000000 : suffix === 'k' ? 1000 : suffix === 'g' ? 1000000000 : suffix === 'b' ? 1000000000 : 1;
    } else if (singleMatch) {
        value = parseFloat(singleMatch[1]);
        const suffix = (singleMatch[2] || '').toLowerCase();
        multiplier = suffix === 'm' ? 1000000 : suffix === 'k' ? 1000 : suffix === 'g' ? 1000000000 : suffix === 'b' ? 1000000000 : 1;
    }

    if (value === 0 || isNaN(value)) return 0;

    // Step 2: Unit-specific parsing (some units need special multiplier handling)

    // Water: "2.9M m3/day", "600k m3/day", "2.5M m3 Storage", "5000 m3/day"
    if (cleaned.includes('m3') || cleaned.includes('m³')) {
        const waterMatch = cleaned.match(/(\d+\.?\d*)\s*([mk])?\s*m[3³]/i);
        if (waterMatch) {
            const num = parseFloat(waterMatch[1]);
            const pfx = (waterMatch[2] || '').toLowerCase();
            return pfx === 'm' ? num * 1000000 : pfx === 'k' ? num * 1000 : num;
        }
        return value * multiplier;
    }

    // Power: "3927 MW", "3.6 GW", "4000 MW" — GW converted to MW
    if (cleaned.includes('gw')) {
        const gwMatch = cleaned.match(/(\d+\.?\d*)\s*gw/);
        return gwMatch ? parseFloat(gwMatch[1]) * 1000 : value * 1000;
    }
    if (cleaned.includes('mw')) {
        const mwMatch = cleaned.match(/(\d+\.?\d*)\s*mw/);
        return mwMatch ? parseFloat(mwMatch[1]) : value;
    }

    // For all remaining unit types, the multiplier is already captured above
    const result = value * multiplier;

    // Barrels per day: "400k bpd"
    if (cleaned.includes('bpd') || cleaned.includes('barrels')) return result;

    // Vehicles: "155k Vehicles/yr"
    if (cleaned.includes('vehicle') || cleaned.includes('cars')) return result;

    // Passengers: "3m Pax"
    if (cleaned.includes('pax') || cleaned.includes('passenger')) return result;

    // Housing: "30k Homes", "units", "residential"
    if (cleaned.includes('home') || cleaned.includes('units') || cleaned.includes('residential')) return result;

    // Hotels: "3000 Hotel Keys"
    if (cleaned.includes('keys') || cleaned.includes('hotel')) return result;

    // Seats: "92760 seats"
    if (cleaned.includes('seats')) return result;

    // Area: "440 sq km", "40000 m2"
    if (cleaned.includes('km') || cleaned.includes('sq') || cleaned.includes('m2') || cleaned.includes('m²') || cleaned.includes('sqm')) return result;

    // Material: "10000 MT Daily", "25M tonnes ore"
    if (cleaned.includes('mt') || cleaned.includes('tonne') || cleaned.includes('ton') || cleaned.includes('mtpa') || cleaned.includes('ore')) return result;

    // Fallback: return extracted number (never silently drop valid numeric data)
    return result;
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
    allPolicyNodes = [],
    onPolicyToolClose,
    onRiskAssessment,
    onNavigateToCapability,
    onStrategyClick,
    waterL3Items = []
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isWaterSector = String(selectedSector || '').toLowerCase() === 'water';

    const getLocalizedSectorName = (sector: string): string => {
        const value = String(sector || '').trim();
        if (!value) return value;
        const key = `josoor.sector.sector${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`;
        const localized = t(key);
        return localized === key ? value : localized;
    };

    const localizeCapabilityName = (name?: string): string => {
        const value = String(name || '').trim();
        const map: Record<string, string> = {
            'Policy & Regulation Capability': t('josoor.sector.waterExec.swaRegulator.cap', 'Policy & Regulation Capability'),
            'Integrated Water Management Capability': t('josoor.sector.waterExec.specializedEntities.cap', 'Integrated Water Management Capability'),
            'Supply Reliability Capability': t('josoor.sector.waterExec.desalCapacity.cap', 'Supply Reliability Capability'),
            'Network Operations Capability': t('josoor.sector.waterExec.transmission.cap', 'Network Operations Capability'),
            'Circular Water Management Capability': t('josoor.sector.waterExec.reuse70.cap', 'Circular Water Management Capability'),
            'Resource Sustainability Capability': t('josoor.sector.waterExec.groundwater.cap', 'Resource Sustainability Capability'),
            'Digital Planning Capability': t('josoor.sector.waterExec.twin.cap', 'Digital Planning Capability'),
            'AI Monitoring Capability': t('josoor.sector.waterExec.observatory.cap', 'AI Monitoring Capability'),
            'Smart Operations Capability': t('josoor.sector.waterExec.automation.cap', 'Smart Operations Capability'),
            'Climate Transition Capability': t('josoor.sector.waterExec.carbon2045.cap', 'Climate Transition Capability'),
            'R&D Translation Capability': t('josoor.sector.waterExec.oasis.cap', 'R&D Translation Capability'),
            'Applied Innovation Capability': t('josoor.sector.waterExec.watera.cap', 'Applied Innovation Capability')
        };
        return map[value] || value || '—';
    };

    const handleCapabilityNavigation = (capId?: string) => {
        const targetCapId = String(capId || '').trim();
        if (!targetCapId) return;
        onPolicyToolClose?.();
        if (onNavigateToCapability) {
            onNavigateToCapability(targetCapId);
            return;
        }
        navigate(`/josoor?cap=${encodeURIComponent(targetCapId)}`);
    };
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

    // Normalize ID: "8.0" (string) and 8.0 (number→"8") must match
    // Converts to canonical "X.Y" format so all comparisons are consistent
    const nid = (v: any): string => {
        if (v == null) return '';
        const s = String(v);
        const n = parseFloat(s);
        if (isNaN(n)) return s;
        // Ensure "8" becomes "8.0", "3.1" stays "3.1"
        return s.includes('.') ? s : n.toFixed(1);
    };

    // PRIORITY 0: Policy Tool View
    if (selectedPolicyTool) {
        if (selectedPolicyTool.source === 'water-family') {
            const programs = Array.isArray(selectedPolicyTool.waterPrograms) ? selectedPolicyTool.waterPrograms : [];
            return (
                <div className="sector-details-panel drawer">
                    <div className="details-header">
                        <div className="header-content">
                            <div className="header-text">
                                <h2 className="details-title">{(() => {
                                    const candidate = selectedPolicyTool.id || selectedPolicyTool.domain_id || selectedPolicyTool.trace_id;
                                    const idText = String(candidate || '').trim();
                                    const isNumericId = /^\d+(?:\.\d+)?$/.test(idText);
                                    return `${isNumericId ? `${idText} • ` : ''}${selectedPolicyTool.name}`;
                                })()}</h2>
                                <div className="details-subtitle" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span>{selectedPolicyTool.branch || t('josoor.sector.policyTools')}</span>
                                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--component-text-secondary)', fontWeight: 700 }}>
                                        {programs.length}
                                    </span>
                                </div>
                            </div>
                            <button onClick={onPolicyToolClose} className="back-button">✕</button>
                        </div>
                    </div>

                    <div className="details-content">
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {programs.length === 0 ? (
                                <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.45)', padding: '10px 12px', fontSize: '13px', color: 'var(--component-text-muted)' }}>
                                    {t('josoor.sector.policy.noData', 'No data')}
                                </div>
                            ) : programs.map((program: any) => (
                                <div key={program.id} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.45)', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--component-text-primary)', fontWeight: 700, marginBottom: '8px', lineHeight: 1.35 }}>
                                        {(() => {
                                            const mappedId = String(program.mappedProgramId || '').trim();
                                            const isNumericId = /^\d+(?:\.\d+)?$/.test(mappedId);
                                            return `${isNumericId ? `${mappedId} • ` : ''}${program.label}`;
                                        })()}
                                    </div>
                                    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderLeft: '4px solid var(--component-text-accent)', background: 'rgba(15,23,42,0.55)', padding: '8px', marginBottom: '8px' }}>
                                        <div className="water-policy-field-value">
                                            {(program.mappedL2Id || '—')} • {(program.mappedL2Name || '—')}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '8px' }}>
                                        <div className="water-policy-linked-title">
                                            {t('josoor.sector.policy.linkedCapabilities', 'Linked Capabilities')}
                                        </div>
                                        {(program.linkedCapabilities || []).length > 0 ? (
                                            <div style={{ display: 'grid', gap: '4px' }}>
                                                {(program.linkedCapabilities || []).map((cap: any) => (
                                                    <div
                                                        key={`${program.id}-${cap.capId}`}
                                                        onClick={() => handleCapabilityNavigation(cap.capId)}
                                                        style={{
                                                            padding: '8px 10px',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderLeft: '4px solid var(--component-color-success)',
                                                            background: 'rgba(20,30,48,0.55)',
                                                            borderRadius: '4px',
                                                            cursor: cap.capId ? 'pointer' : 'default',
                                                            color: 'var(--component-text-primary)'
                                                        }}
                                                        className="water-policy-linked-item"
                                                        title={cap.capId ? t('josoor.sector.policy.navigateToEnterprise') : ''}
                                                    >
                                                        {(cap.capId || '—')} • {localizeCapabilityName(cap.capName)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ border: '1px dashed rgba(244,187,48,0.35)', background: 'rgba(244,187,48,0.08)', padding: '8px 10px' }}>
                                                <div className="water-policy-empty-title">
                                                    {t('josoor.sector.policy.noLinkedCaps', 'No linked capabilities from DB yet')}
                                                </div>
                                                <div className="water-policy-empty-capability">
                                                    {t('josoor.sector.policy.capability', 'Capability')}: {localizeCapabilityName(program.capability)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (selectedPolicyTool.source === 'water-exec') {
            return (
                <div className="sector-details-panel drawer">
                    <div className="details-header">
                        <div className="header-content">
                            <div className="header-text">
                                <h2 className="details-title">{selectedPolicyTool.name}</h2>
                                <div className="details-subtitle" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span>{selectedPolicyTool.category || t('josoor.sector.policyTools')}</span>
                                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--component-text-secondary)', fontWeight: 600 }}>
                                        {selectedPolicyTool.status || '—'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={onPolicyToolClose} className="back-button">✕</button>
                        </div>
                    </div>

                    <div className="details-content">
                        <div style={{ display: 'grid', gap: '10px' }}>
                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.45)', padding: '10px 12px' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.4px', marginBottom: '4px' }}>
                                    {t('josoor.sector.policy.toolType', 'Tool Type')}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--component-text-primary)' }}>{selectedPolicyTool.tool_type || '—'}</div>
                            </div>

                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.45)', padding: '10px 12px' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.4px', marginBottom: '4px' }}>
                                    {t('josoor.sector.policy.deliveryChannel', 'Delivery Channel')}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-primary)' }}>{selectedPolicyTool.delivery_channel || '—'}</div>
                            </div>

                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.45)', padding: '10px 12px' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.4px', marginBottom: '4px' }}>
                                    {t('josoor.sector.policy.impactTarget', 'Impact Target')}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-primary)' }}>{selectedPolicyTool.impact_target || '—'}</div>
                            </div>

                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.45)', padding: '10px 12px' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.4px', marginBottom: '4px' }}>
                                    {t('josoor.sector.policy.description', 'Description')}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-secondary)', lineHeight: 1.5 }}>{selectedPolicyTool.description || '—'}</div>
                            </div>

                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.45)', padding: '10px 12px' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.4px', marginBottom: '4px' }}>
                                    {t('josoor.sector.policy.strategicObjective', 'Strategic Objective')}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-accent)', lineHeight: 1.5 }}>{selectedPolicyTool.strategic_objective || '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Look up risk data — try both raw id and normalized id
        const rawId = String(selectedPolicyTool.domain_id || selectedPolicyTool.id);
        const normId = nid(rawId);
        const riskData = policyRiskByL1?.get(rawId) || policyRiskByL1?.get(normId);
        console.log(`[STRIP DEBUG] L1 id=${rawId} normId=${normId} riskMapKeys=${JSON.stringify([...(policyRiskByL1?.keys() || [])])} found=${!!riskData} band=${riskData?.worstBand}`);
        const worstBand = riskData?.worstBand || 'none';
        const riskL2Details = riskData?.l2Details || [];

        // Build COMPLETE L2 list from all SectorPolicyTool nodes (parent_id match only — no year filter)
        const toolNormId = normId;

        // DEBUG: Log what we're looking for and what's available
        const l2Candidates = allPolicyNodes.filter((n: any) => n.level === 'L2' && (n._labels || []).includes('SectorPolicyTool'));
        const parentIdSamples = l2Candidates.slice(0, 15).map((n: any) =>
            `id=${n.domain_id||n.id} parent_id=${n.parent_id}(${typeof n.parent_id}) nid=${nid(n.parent_id)} name="${n.name}"`
        );
        console.log(`[DEBUG L2] tool=${toolNormId} | allPolicyNodes=${allPolicyNodes.length} | L2candidates=${l2Candidates.length}`);
        // Targeted: find ALL nodes related to this tool's id
        const relatedNodes = allPolicyNodes.filter((n: any) => {
            const pid = String(n.parent_id || '');
            const nidVal = String(n.domain_id || n.id || '');
            return pid.startsWith(rawId.split('.')[0] + '.') || nidVal.startsWith(rawId.split('.')[0] + '.');
        });
        console.log(`[DEBUG L2] Nodes with id or parent_id starting with "${rawId.split('.')[0]}.":`);
        relatedNodes.forEach((n: any) => console.log(`  id=${n.domain_id||n.id} parent_id=${n.parent_id} level=${n.level} labels=${(n._labels||[]).join(',')} name="${n.name}"`));

        const allL2Raw = allPolicyNodes.filter((n: any) =>
            n.level === 'L2' &&
            (n._labels || []).includes('SectorPolicyTool') &&
            nid(n.parent_id) === toolNormId
        );
        console.log(`[DEBUG L2 LOOKUP] Matched ${allL2Raw.length} L2 children for ${toolNormId}`);

        // Deduplicate by L2 id (same tool appears across multiple year snapshots) and sort by id
        const l2Seen = new Set<string>();
        const allL2Children = allL2Raw.filter((n: any) => {
            const lid = nid(n.domain_id || n.id);
            if (l2Seen.has(lid)) return false;
            l2Seen.add(lid);
            return true;
        }).sort((a: any, b: any) => {
            const aId = parseFloat(String(a.domain_id || a.id)) || 0;
            const bId = parseFloat(String(b.domain_id || b.id)) || 0;
            return aId - bId;
        });

        // Build lookup from allL2Children by normalized id
        const l2NodeMap = new Map<string, any>();
        for (const l2 of allL2Children) {
            l2NodeMap.set(nid(l2.domain_id || l2.id), l2);
        }

        // Start with risk L2s (these have capabilities attached), enrich with node ref
        const l2Details: any[] = riskL2Details.map((rd: any) => ({
            ...rd,
            node: l2NodeMap.get(nid(rd.l2Id)) || null
        }));
        const seenIds = new Set(riskL2Details.map((rd: any) => nid(rd.l2Id)));

        for (const l2 of allL2Children) {
            const l2Id = nid(l2.domain_id || l2.id);
            if (!seenIds.has(l2Id)) {
                l2Details.push({ l2Id: String(l2.domain_id || l2.id), l2Name: l2.name, worstBand: null, caps: [], node: l2 });
                seenIds.add(l2Id);
            }
        }

        // Sort by id
        l2Details.sort((a: any, b: any) => parseFloat(String(a.l2Id)) - parseFloat(String(b.l2Id)));
        const bandColor = worstBand === 'red' ? 'var(--component-color-danger)' : worstBand === 'amber' ? 'var(--component-color-warning)' : worstBand === 'green' ? 'var(--component-color-success)' : 'var(--component-text-tertiary)';
        const objectiveGauge = worstBand === 'red' ? 25 : worstBand === 'amber' ? 60 : worstBand === 'green' ? 85 : 40;
        const startedL2 = l2Details.filter((d: any) => !!d.worstBand).length;
        const l1KpiGauge = l2Details.length > 0 ? Math.round((startedL2 / l2Details.length) * 100) : 0;

        const ragColor = (band: string | null | undefined) => {
            const b = (band || '').toLowerCase();
            if (b === 'red') return 'var(--component-color-danger)';
            if (b === 'amber') return 'var(--component-color-warning)';
            if (b === 'green') return 'var(--component-color-success)';
            return 'var(--component-text-tertiary)';
        };

        const riskLabel = (band: string | null | undefined): string => {
            const b = (band || '').toLowerCase();
            if (b === 'red') return t('josoor.sector.policy.riskHigh', 'High');
            if (b === 'amber') return t('josoor.sector.policy.riskModerate', 'Moderate');
            if (b === 'green') return t('josoor.sector.policy.riskLow', 'Low');
            return t('josoor.sector.policy.notStarted', 'Not Started');
        };

        const cardBorder = '1px solid rgba(255,255,255,0.1)';

        return (
            <div className="sector-details-panel drawer">
                {/* Header */}
                <div className="details-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h2 className="details-title">{selectedPolicyTool.domain_id || selectedPolicyTool.id} • {selectedPolicyTool.name}</h2>
                            <div className="details-subtitle" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span>{t('josoor.sector.' + (selectedPolicyTool.category || '').toLowerCase(), selectedPolicyTool.category)}</span>
                                <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', color: 'var(--component-text-secondary)', fontWeight: 600 }}>{selectedPolicyTool.status || '—'}</span>
                            </div>
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

                <div className={`details-content ${isWaterSector ? 'water-sector-panel' : ''}`}>
                    {/* L1 Policy Properties */}
                    <div style={{ padding: '10px 12px', borderInlineStart: `3px solid ${bandColor}`, background: 'rgba(30,41,59,0.5)', borderRadius: '0 4px 4px 0', border: cardBorder, marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)' }}>{t('josoor.sector.objectivesLabel', 'Top Objectives')}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${objectiveGauge}%`, height: '100%', background: bandColor }} />
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--component-text-primary)' }}>{objectiveGauge}%</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)' }}>{t('josoor.sector.kpiLabel', 'L1 KPI')}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${l1KpiGauge}%`, height: '100%', background: 'var(--component-color-success)' }} />
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--component-text-primary)' }}>{l1KpiGauge}%</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>{t('josoor.sector.policy.riskStatus', 'Risk Status')}</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: bandColor }}>{riskLabel(worstBand)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>{t('josoor.sector.policy.toolType', 'Tool Type')}</div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-primary)', fontWeight: 600 }}>{selectedPolicyTool.tool_type || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>{t('josoor.sector.policy.impactTarget', 'Impact Target')}</div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-primary)', fontWeight: 600 }}>{selectedPolicyTool.impact_target || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>{t('josoor.sector.policy.deliveryChannel', 'Delivery Channel')}</div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-primary)', fontWeight: 600 }}>{selectedPolicyTool.delivery_channel || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>{t('josoor.sector.policy.costOfImplementation', 'Cost')}</div>
                                <div style={{ fontSize: '14px', color: 'var(--component-text-primary)', fontWeight: 600 }}>{selectedPolicyTool.cost_of_implementation || '—'}</div>
                            </div>
                        </div>
                        {selectedPolicyTool.description && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>{t('josoor.sector.policy.description', 'Description')}</div>
                                <div style={{ fontSize: '13px', color: 'var(--component-text-secondary)', lineHeight: '1.5' }}>{selectedPolicyTool.description}</div>
                            </div>
                        )}
                        {(selectedPolicyTool.strategic_objective || selectedPolicyTool.governed_by) && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.5px' }}>{t('josoor.sector.policy.strategicObjective', 'Strategic Objective')}</div>
                                <div style={{ fontSize: '13px', color: 'var(--component-text-accent)', lineHeight: '1.5' }}>{selectedPolicyTool.strategic_objective || selectedPolicyTool.governed_by}</div>
                            </div>
                        )}
                    </div>

                    {/* L2 Children with linked capabilities */}
                    <div>
                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--component-text-muted)', marginBottom: '12px' }}>
                            {t('josoor.sector.policy.l2Children')} ({l2Details.length})
                        </h3>
                        {l2Details.map((l2: any) => {
                            const l2Band = l2.worstBand?.toLowerCase() || 'none';
                            const l2Color = ragColor(l2Band);
                            const capsForThisL2 = Array.from(new Map(
                                (l2.caps || []).map((cap: any) => [String(cap.capId), cap])
                            ).values());
                            return (
                                <details key={l2.l2Id} style={{ marginBottom: '16px' }}>
                                    <summary style={{ cursor: 'pointer', marginBottom: '6px', color: 'var(--component-text-muted)', fontSize: '11px' }}>
                                        {t('josoor.sector.policy.drilldownHint', 'Open to drill down')}
                                    </summary>
                                    {/* L2 Policy Card */}
                                    <div style={{ padding: '8px 10px', background: 'rgba(30,41,59,0.5)', borderRadius: '0 4px 4px 0', borderTop: cardBorder, borderBottom: cardBorder, borderInlineEnd: cardBorder, borderInlineStart: `3px solid ${l2Color}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '1px 6px',
                                                borderRadius: '3px',
                                                fontSize: '9px',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px',
                                                background: 'rgba(244,187,48,0.12)',
                                                color: 'var(--component-text-accent)',
                                                border: '1px solid rgba(244,187,48,0.25)',
                                                flexShrink: 0
                                            }}>
                                                {t('josoor.sector.policy.policyTag', 'POLICY')}
                                            </span>
                                            <span style={{ fontSize: '14px', color: 'var(--component-text-primary)', fontWeight: 600, flex: 1 }}>{l2.l2Id} • {l2.l2Name}</span>
                                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: l2Band === 'none' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)', color: l2Band === 'none' ? 'var(--component-text-muted)' : l2Color, fontWeight: 600 }}>{l2Band === 'none' ? t('josoor.sector.policy.notStarted', 'Not Started') : riskLabel(l2Band)}</span>
                                        </div>
                                        {/* L2 Properties */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div><div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.3px' }}>{t('josoor.sector.policy.toolType', 'Tool Type')}</div><div style={{ fontSize: '12px', color: 'var(--component-text-primary)' }}>{l2.node?.tool_type || '—'}</div></div>
                                            <div><div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.3px' }}>{t('josoor.sector.policy.impactTarget', 'Impact Target')}</div><div style={{ fontSize: '12px', color: 'var(--component-text-primary)' }}>{l2.node?.impact_target || '—'}</div></div>
                                            <div><div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.3px' }}>{t('josoor.sector.policy.deliveryChannel', 'Channel')}</div><div style={{ fontSize: '12px', color: 'var(--component-text-primary)' }}>{l2.node?.delivery_channel || '—'}</div></div>
                                            <div><div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.3px' }}>{t('josoor.sector.policy.costOfImplementation', 'Cost')}</div><div style={{ fontSize: '12px', color: 'var(--component-text-primary)' }}>{l2.node?.cost_of_implementation || '—'}</div></div>
                                        </div>
                                    </div>

                                    {/* Linked Capabilities — separate cards with RAG strip */}
                                    {capsForThisL2.length > 0 && (
                                        <div style={{ marginTop: '6px', marginInlineStart: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {capsForThisL2.map((cap: any) => {
                                                const capBandColor = ragColor(cap.buildBand);
                                                return (
                                                    <div
                                                        key={cap.capId}
                                                        onClick={() => handleCapabilityNavigation(cap.capId)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: 'rgba(20,30,48,0.6)',
                                                            borderRadius: '0 4px 4px 0',
                                                            borderTop: cardBorder,
                                                            borderBottom: cardBorder,
                                                            borderInlineEnd: cardBorder,
                                                            borderInlineStart: `3px solid ${capBandColor}`,
                                                            cursor: cap.capId ? 'pointer' : 'default',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            transition: 'background 0.15s ease'
                                                        }}
                                                        title={cap.capId ? t('josoor.sector.policy.navigateToEnterprise') : ''}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(30,45,65,0.8)'; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(20,30,48,0.6)'; }}
                                                    >
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    padding: '1px 6px',
                                                                    borderRadius: '3px',
                                                                    fontSize: '9px',
                                                                    fontWeight: 700,
                                                                    letterSpacing: '0.5px',
                                                                    background: 'rgba(6,182,212,0.12)',
                                                                    color: 'var(--sector-water)',
                                                                    border: '1px solid rgba(6,182,212,0.25)',
                                                                    flexShrink: 0
                                                                }}>
                                                                    {t('josoor.sector.policy.capabilityTag', 'CAPABILITY')}
                                                                </span>
                                                                <span style={{ fontSize: '14px', color: 'var(--component-text-primary)' }}>{cap.capId} • {cap.capName}</span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                                <div><div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.3px' }}>{t('josoor.sector.policy.level', 'Level')}</div><div style={{ fontSize: '12px', color: 'var(--component-text-primary)' }}>{cap.capLevel || '—'}</div></div>
                                                                <div><div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--component-text-muted)', letterSpacing: '0.3px' }}>{t('josoor.sector.policy.riskStatus', 'Risk')}</div><div style={{ fontSize: '12px', fontWeight: 600, color: capBandColor }}>{riskLabel(cap.buildBand)}</div></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {(capsForThisL2.length === 0) && (
                                        <div style={{ fontSize: '13px', color: 'var(--component-text-muted)', marginTop: '6px', marginInlineStart: '14px', fontStyle: 'italic' }}>
                                            {t('josoor.sector.policy.noLinkedCaps', 'No linked capabilities')}
                                        </div>
                                    )}
                                </details>
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
                                <span style={{ opacity: 0.6, marginRight: '8px' }}>{selectedAsset.domain_id || selectedAsset.id}</span>
                                {selectedAsset.name}
                            </h2>
                            {onStrategyClick && (
                                <button
                                    onClick={onStrategyClick}
                                    style={{
                                        marginTop: '6px',
                                        marginBottom: '6px',
                                        background: 'rgba(244,187,48,0.15)',
                                        border: '1px solid rgba(244,187,48,0.3)',
                                        color: 'var(--component-text-accent)',
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    title={t('josoor.sector.generateStrategy', 'Generate AI Strategy Brief')}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>
                                    {t('josoor.sector.aiStrategyBrief')}
                                </button>
                            )}
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
                <div className={`details-content ${isWaterSector ? 'water-sector-panel' : ''}`}>
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
                                    {t('josoor.sector.region_' + (selectedAsset.region || '').toLowerCase(), selectedAsset.region)}
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
                                {selectedAsset.completion_date ? t('josoor.sector.completionDate') : t('josoor.sector.launchDate')}
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
                                {t('josoor.sector.ownershipType')}
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
                        {selectedSector === 'all' || selectedSector === 'All Factors' ? t('josoor.sector.allSectors') : t('josoor.sector.sectorSuffix', { sector: getLocalizedSectorName(selectedSector) })}
                    </h2>
                    <p className="details-subtitle">{t('josoor.sector.nationalPerspective')}</p>
                </div>

                {/* Show Sector Outputs on L1 */}
                <div className="details-content">
                    {isWaterSector && waterL3Items.length > 0 && (
                        <div className="sector-outputs-section" style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {waterL3Items.map((item) => (
                                    <div key={item.id} style={{ border: '1px solid var(--component-panel-border)', background: 'rgba(255,255,255,0.02)', padding: '8px' }}>
                                        <div className="water-panel-item-title">{item.title}</div>
                                        <div className="water-panel-item-value">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                            {selectedSector === 'all' || selectedSector === 'All Factors' ? t('josoor.sector.allSectors') : t('josoor.sector.sectorSuffix', { sector: getLocalizedSectorName(selectedSector) })}
                        </h2>
                        <p className="details-subtitle">{t('josoor.sector.regionLabel', { region: t('josoor.sector.region_' + (selectedRegion || '').toLowerCase(), selectedRegion || '') })}</p>
                        {onStrategyClick && (
                            <button
                                onClick={onStrategyClick}
                                style={{
                                    width: '100%',
                                    marginTop: '10px',
                                    background: 'rgba(238, 201, 4, 1)',
                                    border: '1px solid rgba(238, 201, 4, 1)',
                                    color: 'var(--component-bg-primary)',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                title={t('josoor.sector.generateStrategy', 'Generate AI Strategy Brief')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>
                                {t('josoor.sector.aiStrategyBrief')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`details-content ${isWaterSector ? 'water-sector-panel' : ''}`}>
                {isWaterSector && waterL3Items.length > 0 && (
                    <div className="sector-outputs-section" style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {waterL3Items.map((item) => (
                                <div key={item.id} style={{ border: '1px solid var(--component-panel-border)', background: 'rgba(255,255,255,0.02)', padding: '8px' }}>
                                    <div className="water-panel-item-title">{item.title}</div>
                                    <div className="water-panel-item-value">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                                            <span style={{ opacity: 0.6, marginRight: '6px' }}>{asset.domain_id || asset.id}</span>
                                            {asset.name}
                                        </div>
                                        {(asset.priority === 'HIGH' || asset.priority === 'MAJOR' || asset.priority === 'URGENT' || asset.priority === 'CRITICAL') && (
                                            <span className="priority-badge">{asset.priority}</span>
                                        )}
                                    </div>

                                    <div className="asset-meta">
                                        <span className="asset-type">{asset.asset_type || asset.category || t('josoor.sector.asset', 'Asset')}</span>
                                        <span
                                            className="asset-status"
                                            style={{
                                                color: asset.status?.toLowerCase() === 'existing' || asset.status?.toLowerCase() === 'operational'
                                                    ? 'var(--component-color-success)'
                                                    : 'var(--component-color-info)'
                                            }}
                                        >
                                            ● {asset.status || t('josoor.sector.unknown', 'Unknown')}
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
