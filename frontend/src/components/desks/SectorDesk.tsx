import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import SectorHeaderNav from './sector/SectorHeaderNav';
import SectorMap from './sector/SectorMap';
import SectorDetailsPanel from './sector/SectorDetailsPanel';
import { SectorSidebar } from './sector/SectorSidebar';
import StrategyReportModal from './sector/StrategyReportModal';
import './sector/SectorDesk.css';
import { dashboardData } from './sector/SectorDashboardData';
import { chatService } from '../../services/chatService';
import { Artifact } from '../../types/api';
// Removed: buildArtifactsFromTags, extractDatasetBlocks - now handled by chatService
import { fetchSectorGraphData, L1_CATEGORY_MAP, extractPolicyRiskFromChain, extractOperateRiskForPolicyTools, aggregatePolicyRiskByL1, appendDirectPolicyCapRows, L1RiskAggregation } from '../../services/neo4jMcpService';
import { SECTOR_POLICY_MOCK_DATA } from './sector/data/SectorPolicyMock';
import { PolicyToolCounts } from './sector/SectorPolicyClassifier';

// Approximate coordinates for Saudi Arabian regions
const SAUDI_REGION_COORDS: Record<string, { lat: number; long: number }> = {
  // Mega regions (actual data uses these names)
  'Central': { lat: 24.0, long: 45.0 },
  'Western': { lat: 22.0, long: 39.5 },
  'Eastern': { lat: 25.5, long: 49.5 },
  'Northern': { lat: 28.5, long: 39.0 },
  // Constituent regions (for backward compatibility)
  'Riyadh': { lat: 24.7136, long: 46.6753 },
  'Makkah': { lat: 21.3891, long: 39.8579 },
  'Madinah': { lat: 24.5247, long: 39.5692 },
  'Qassim': { lat: 26.3260, long: 43.9750 },
  'Asir': { lat: 18.2164, long: 42.5053 },
  'Tabuk': { lat: 28.3998, long: 36.5790 },
  'Hail': { lat: 27.5219, long: 41.7000 },
  'Jazan': { lat: 16.8892, long: 42.5511 },
  'Najran': { lat: 17.5400, long: 44.2260 },
  'Baha': { lat: 20.0130, long: 41.4677 },
  'Jawf': { lat: 29.8, long: 40.2 }
};

// Type definition for shared data
interface GraphNode {
    id: string;
    name?: string;
    sector?: string; // Key Differentiator
    asset_type?: string;
    status?: string;
    priority?: string;
    region?: string;
    level?: string;
    parent_id?: string; // Key for Hierarchy
    [key: string]: any;
}

interface GraphConnection {
    id: string;
    source: string;
    target: string;
    type: string;
    [key: string]: any;
}

interface SectorDeskProps {
    year?: string;
    quarter?: string;
    onNavigateToCapability?: (capId: string) => void;
    onContinueInChat?: (conversationId: number) => void;
}

export const SectorDesk: React.FC<SectorDeskProps> = ({ year: propYear, quarter: propQuarter, onNavigateToCapability, onContinueInChat }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [selectedPillar, setSelectedPillar] = useState('economy');
    const [selectedSector, setSelectedSector] = useState('all');

    // Interaction State
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
    const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [focusedAssetId, setFocusedAssetId] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<GraphNode | null>(null);
    const [viewLevel, setViewLevel] = useState<'L1' | 'L2'>('L1');

    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastRegionHoverAtRef = useRef<number>(0);

    const [timelineFilter, setTimelineFilter] = useState<'current' | 'future' | 'both'>('both');
    const [priorityFilter, setPriorityFilter] = useState<'major' | 'strategic' | 'both'>('both');

    const navigate = useNavigate();
    const outletContext = useOutletContext<{ year: string; quarter: string } | null>();
    const year = propYear || outletContext?.year;
    const quarter = propQuarter || outletContext?.quarter;

    // Data State
    const [allAssets, setAllAssets] = useState<GraphNode[]>([]); // Physical Assets
    const [filteredAssets, setFilteredAssets] = useState<GraphNode[]>([]);
    const [allConnections, setAllConnections] = useState<GraphConnection[]>([]); // Kept for map lines if any
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>(year || '2026');

    // Sync selectedYear if prop/context year changes
    useEffect(() => {
        if (year && year !== selectedYear) {
            setSelectedYear(year);
        }
    }, [year]);

    // Snapshot nodes for reactive filtering
    const [rawPolicyNodes, setRawPolicyNodes] = useState<GraphNode[]>([]);
    const [allSectorPolicyToolNodes, setAllSectorPolicyToolNodes] = useState<any[]>([]);
    const [policyCounts, setPolicyCounts] = useState<PolicyToolCounts | undefined>(undefined);
    // ID-based category map: domain_id → category (built once from data, stable across years)
    const [categoryById, setCategoryById] = useState<Map<string, string>>(new Map());

    // Risk data from Neo4j (dynamic coloring for policy tool categories)
    const [categoryRiskColors, setCategoryRiskColors] = useState<Record<string, string>>({});
    const [policyRiskByL1, setPolicyRiskByL1] = useState<Map<string, L1RiskAggregation>>(new Map());

    // Chain data for risk extraction (build = projects, operate = KPIs)
    const [buildChainData, setBuildChainData] = useState<{ nodes: any[]; links: any[] } | null>(null);
    const [operateChainData, setOperateChainData] = useState<{ nodes: any[]; links: any[] } | null>(null);
    const [svcChainData, setSvcChainData] = useState<{ nodes: any[]; links: any[] } | null>(null);
    const [policyCapLinks, setPolicyCapLinks] = useState<Array<{ policyId: string; policyYear: string; capId: string; capName: string; capLevel: string; capParentId: string | null }>>([]);

    // Policy tool detail panel state
    const [selectedPolicyTool, setSelectedPolicyTool] = useState<any>(null);
    const [waterCascadeL3Items, setWaterCascadeL3Items] = useState<Array<{ id: string; title: string; value: string }>>([]);

    // Extract risk data from BOTH chains (build + operate)
    useEffect(() => {
        if (!buildChainData && !operateChainData) return;
        try {
            const buildRows = buildChainData ? extractPolicyRiskFromChain(buildChainData, 'build') : [];
            const operateDirectRows = operateChainData ? extractPolicyRiskFromChain(operateChainData, 'operate') : [];
            const operateMappedRows = (operateChainData && svcChainData) ? extractOperateRiskForPolicyTools(operateChainData, svcChainData, allSectorPolicyToolNodes) : [];
            const chainRows = [...buildRows, ...operateDirectRows, ...operateMappedRows];
            const allRows = appendDirectPolicyCapRows(chainRows, policyCapLinks, allSectorPolicyToolNodes);
            const l1RiskMap = aggregatePolicyRiskByL1(allRows);

            // Fill in missing L2s with null band (grey strip, "Not Started" label)
            for (const node of allSectorPolicyToolNodes) {
                if (node.level !== 'L2' || !node.parent_id) continue;
                const l1Id = String(node.parent_id).includes('.') ? String(node.parent_id) : parseFloat(node.parent_id).toFixed(1);
                const l2Id = String(node.domain_id || node.id).includes('.') ? String(node.domain_id || node.id) : parseFloat(node.domain_id || node.id).toFixed(1);
                // Only add L2 entry — do NOT create or alter L1 worstBand
                if (!l1RiskMap.has(l1Id)) continue;
                const agg = l1RiskMap.get(l1Id)!;
                const existing = agg.l2Details.find((d: any) => d.l2Id === l2Id);
                if (!existing) {
                    agg.l2Details.push({ l2Id, l2Name: node.name, worstBand: null, caps: [] });
                }
            }

            setPolicyRiskByL1(l1RiskMap);
        } catch (err) {
            console.error('[SectorDesk] Risk data extraction failed:', err);
        }
    }, [buildChainData, operateChainData, svcChainData, allSectorPolicyToolNodes, policyCapLinks]);

    // Sync sector/pillar
    useEffect(() => {
        const PILLARS_SECTORS: { [key: string]: string[] } = {
            'society': ['health', 'livability', 'water', 'culture'],
            'economy': ['all', 'energy', 'logistics', 'industry', 'mining', 'giga'],
            'nation': ['gov']
        };
        if (PILLARS_SECTORS[selectedPillar] && !PILLARS_SECTORS[selectedPillar].includes(selectedSector)) {
            setSelectedSector(PILLARS_SECTORS[selectedPillar][0]);
        }
    }, [selectedPillar]);

    // Sync View Level
    useEffect(() => {
        if (selectedRegionId) setViewLevel('L2');
        else setViewLevel('L1');
    }, [selectedRegionId]);

    // Region Stats Calculator - NO MAPPING, assets already have mega-region in region field
    const getRegionStats = useCallback((regionId: string) => {
        // Direct match - assets already have mega-region values
        const regionAssets = filteredAssets.filter(a => a.region === regionId);
        
        const stats = {
            name: regionId,
            total: regionAssets.length,
            existing: regionAssets.filter(a => a.status?.toLowerCase() === 'existing').length,
            construction: regionAssets.filter(a => a.status?.toLowerCase() === 'under construction').length,
            planned: regionAssets.filter(a => a.status?.toLowerCase() === 'planned').length
        };
        
        return stats;
    }, [filteredAssets]);

    // Filtering Logic
    useEffect(() => {
        let result = [...allAssets];

        // 1. Year Filter - Cumulative (selecting 2029 = show 2025 through 2029)
        // Keep latest snapshot per asset (dedup by domain_id/id)
        if (selectedYear) {
            const beforeCount = result.length;
            const selectedYearNum = parseInt(selectedYear, 10);
            result = result.filter(asset => {
                const assetYear = parseInt(String(asset.year || asset.parent_year || '0'), 10);
                return !isNaN(assetYear) && assetYear <= selectedYearNum;
            });
            // Deduplicate: keep latest year per asset
            const latestById = new Map<string, any>();
            for (const a of result) {
                const key = `${(a._labels || [])[0] || ''}:${a.domain_id || a.id}`;
                const existing = latestById.get(key);
                const aYear = parseInt(String(a.year || a.parent_year || '0'), 10);
                if (!existing || aYear > parseInt(String(existing.year || existing.parent_year || '0'), 10)) {
                    latestById.set(key, a);
                }
            }
            result = Array.from(latestById.values());
            console.log(`Year filter: ${beforeCount} → ${result.length} (year<=${selectedYear}, deduped)`);
        }

        // 2. Level Filter: ONLY show L1 assets that have NO L2 children
        if (viewLevel === 'L1') {
            // Get all L2 asset parent IDs (use result to respect year filter)
            const l2ParentIds = new Set(
                result
                    .filter(a => a.level === 'L2' && a.parent_id)
                    .map(a => String(a.parent_id))
            );
            
            // Show only policy tools (no sector) OR L1 assets with no L2 children
            result = result.filter(asset => {
                const hasNoSector = !asset.sector || asset.sector === 'null' || asset.sector === '';
                const isL1WithNoChildren = asset.level === 'L1' && !l2ParentIds.has(String(asset.id));
                return hasNoSector || isL1WithNoChildren;
            });
        } else if (viewLevel === 'L2' && selectedRegionId) {
            // At L2 (region view), show ALL physical assets with sector in selected region
            // Assets already have mega-region values in their region field - NO MAPPING NEEDED
            // Edge cases (Mixed, Central/Western) are resolved to a single region via coordinates during data processing
            result = result.filter(asset => {
                // Must have a sector (physical assets)
                if (!asset.sector || asset.sector === 'null' || asset.sector === '') return false;
                // Direct match - assets already have resolved mega-region in their region field
                return asset.region === selectedRegionId;
            });
        }

        // 3. Timeline Filter
        if (timelineFilter !== 'both') {
            result = result.filter(asset => {
                const status = (asset.status || '').toLowerCase();
                const isExisting = status === 'existing' || status === 'active' || status === 'operational';
                return timelineFilter === 'current' ? isExisting : !isExisting;
            });
        }

        // 3. Priority Filter
        if (priorityFilter !== 'both') {
            result = result.filter(asset => {
                const p = (asset.priority || '').toUpperCase();
                const isHigh = p === 'HIGH' || p === 'CRITICAL' || p === 'MAJOR';
                return priorityFilter === 'major' ? isHigh : !isHigh;
            });
        }
        setFilteredAssets(result);

        console.log('=== FILTER RESULTS ===');
        console.log('All assets:', allAssets.length);
        console.log('Filtered assets (passed to map):', result.length);
        console.log('View level:', viewLevel);
        console.log('Selected year:', selectedYear);
        console.log('Timeline filter:', timelineFilter);
        console.log('Priority filter:', priorityFilter);
        console.log('Sample filtered asset:', result[0]);
    }, [allAssets, selectedYear, timelineFilter, priorityFilter, viewLevel, selectedRegionId]);


    // MAIN DATA FETCH: SINGLE SOURCE OF TRUTH (Nodes Only)
    // FETCH ALL YEARS - NO YEAR FILTERING
    useEffect(() => {
        let isMounted = true;
        const loadAllData = async () => {
            setLoading(true);
            try {
                // Fetch ALL nodes from Neo4j via MCP service
                const result = await fetchSectorGraphData();
                const nodes = result.nodes;

                if (!isMounted) return;

                // Store chain data for risk extraction (build + operate)
                setBuildChainData(result.buildChainData);
                setOperateChainData(result.operateChainData);
                setSvcChainData(result.svcChainData);
                setPolicyCapLinks(result.policyCapLinks || []);

                // --- 1. Split Data based on 'sector' field ---
                // Physical Assets have a sector (e.g. "Water", "Transportation")
                // Policy Tools have explicit null/empty sector
                const physicalNodes = nodes.filter((n: any) => n.sector && n.sector !== "null" && n.sector !== "");
                const policyNodes = nodes.filter((n: any) => !n.sector || n.sector === "null" || n.sector === "");

                // Store ALL SectorPolicyTool nodes (physical + non-physical) for L2 child lookup in panel
                setAllSectorPolicyToolNodes(nodes.filter((n: any) => (n._labels || []).includes('SectorPolicyTool')));

                console.log('=== SECTOR DESK DATA FLOW ===');
                console.log('Total nodes from Neo4j:', nodes.length);
                console.log('Physical assets (with sector):', physicalNodes.length);
                console.log('Policy tools (no sector):', policyNodes.length);
                console.log('Sample physical node:', physicalNodes[0]);
                console.log('Sample policy node:', policyNodes[0]);
                
                // Log region distribution
                const regionCounts: Record<string, number> = {};
                physicalNodes.forEach((n: any) => {
                    const region = n.region || 'unknown';
                    regionCounts[region] = (regionCounts[region] || 0) + 1;
                });
                console.log('Region distribution in physical assets:', regionCounts);

                // --- 2. Process Physical Assets (Map) ---
                // Hardcoded city/province to mega region mapping (no formulas)
                // Region calculation: Use DB region if it matches mega-regions exactly
                // Only "Mixed" and "Central/Western" need coordinate fallback
                const VALID_REGIONS = new Set(['Eastern', 'Western', 'Northern', 'Central']);
                
                const calculateNodeRegion = (node: any, csvRegion: string, hasCoords: boolean, parsedLat: number, parsedLng: number): string => {
                    // Debug railways specifically
                    if (node.name && (node.name.includes('Railway') || node.name.includes('railway'))) {
                        console.log('[RAILWAY DEBUG]', node.name, {
                            csvRegion,
                            hasCoords,
                            parsedLat,
                            parsedLng,
                            rawLat: node.latitude,
                            rawLng: node.longitude,
                            rawRegion: node.region
                        });
                    }
                    
                    // TIER 1: COORDINATES ALWAYS WIN - most accurate source of truth
                    if (hasCoords && !isNaN(parsedLat) && !isNaN(parsedLng)) {
                        const calculatedRegion = getRegionFromCoordinates(parsedLat, parsedLng);
                        if (node.name && node.name.includes('Railway')) {
                            console.log('[RAILWAY] TIER 1 - Calculated from coords:', calculatedRegion, `(lat=${parsedLat}, lng=${parsedLng})`);
                        }
                        return calculatedRegion;
                    }
                    
                    // TIER 2: Fallback to CSV region if valid and no coordinates
                    if (csvRegion && VALID_REGIONS.has(csvRegion)) {
                        if (node.name && node.name.includes('Railway')) {
                            console.log('[RAILWAY] TIER 2 - Using CSV region (no coords):', csvRegion);
                        }
                        return csvRegion;
                    }
                    
                    // TIER 3: Default to Central if nothing else works
                    if (node.name && node.name.includes('Railway')) {
                        console.log('[RAILWAY] TIER 3 - Defaulting to Central (no coords, no valid region)');
                    }
                    return 'Central';
                };

                const getRegionFromCoordinates = (lat: number, lng: number): string => {
                    // Calculate distance to each mega-region center and assign to nearest
                    // Accurate geographic centers based on major cities in each mega-region:
                    // Central: Riyadh (24.63, 46.72) - Najd region
                    // Western: Jeddah (21.54, 39.17) - Hejaz/Red Sea coast  
                    // Eastern: Dammam (26.43, 50.10) - Eastern Province
                    // Northern: Tabuk region (~28.40, ~40.50) - Northern provinces
                    const REGION_CENTERS = {
                        'Central': { lat: 24.65, lng: 46.70 },
                        'Western': { lat: 21.50, lng: 39.20 },
                        'Eastern': { lat: 26.43, lng: 50.10 },
                        'Northern': { lat: 28.40, lng: 40.50 }
                    };
                    
                    let nearestRegion = 'Central';
                    let minDistance = Infinity;
                    
                    for (const [region, center] of Object.entries(REGION_CENTERS)) {
                        // Euclidean distance
                        const distance = Math.sqrt(
                            Math.pow(lat - center.lat, 2) + 
                            Math.pow(lng - center.lng, 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestRegion = region;
                        }
                    }
                    
                    return nearestRegion;
                };

                const processedPhysicalAssets = physicalNodes.map((node: any) => {
                    // Sector override for water desalination plants
                    const assetName = (node.name || '').toLowerCase();
                    let overrideSector = node.sector;

                    if (assetName.includes('ras al khair 2 iwp') ||
                        assetName.includes('khobar 2 desalination') ||
                        assetName.includes('jubail 3a') ||
                        assetName.includes('jazlah')) {
                        overrideSector = 'Water';
                    }


                    // SMART PRIORITY LOGIC - Lookup by Name in Mock Data
                    let calculatedPriority = (node.priority || 'NORMAL').toUpperCase(); // Force Uppercase Default
                    let rationale = node.rationale || '';
                    let fiscal_action = node.fiscal_action || '';

                    const mockEntry = SECTOR_POLICY_MOCK_DATA.find((m: any) => m.name === node.name);
                    if (mockEntry) {
                        if (mockEntry.priority) calculatedPriority = mockEntry.priority.toUpperCase();
                        if (mockEntry.rationale) rationale = mockEntry.rationale;
                        if (mockEntry.fiscal_action) fiscal_action = mockEntry.fiscal_action;

                        console.log(`[Priority] ${node.name}: Found in Mock → Priority=${calculatedPriority}, Rationale="${rationale}"`);
                    }

                    // Get coordinates first
                    const parsedLat = parseFloat(node.latitude || '');
                    const parsedLng = parseFloat(node.longitude || '');
                    const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0;
                    
                    // Use memoized 3-tier region assignment (name > coords > CSV)
                    const csvRegion = (node.region || '').trim();
                    const finalRegion = calculateNodeRegion(node, csvRegion, hasCoords, parsedLat, parsedLng);
                    
                    return {
                        ...node,
                        sector: overrideSector,
                        region: finalRegion,  // Assigned region based on coordinates
                        csv_region: csvRegion,  // Original CSV region for reference
                        lat: hasCoords ? parsedLat : null,
                        long: hasCoords ? parsedLng : null,
                        category: node.category || overrideSector || 'Other',
                        subCategory: node.sub_category || node.subCategory || 'General',
                        priority: calculatedPriority,
                        rationale: rationale,
                        fiscal_action: fiscal_action,
                    };
                });

                // --- 3. Process Policy Nodes (No coordinates needed, NO REGION) ---
                const processedPolicyNodes = policyNodes.map((node: any) => ({
                    ...node,
                    category: 'Policy Tool',
                    subCategory: node.sub_category || node.subCategory || 'General',
                    priority: (node.priority || 'NORMAL').toUpperCase(),
                    rationale: node.rationale || '',
                    fiscal_action: node.fiscal_action || '',
                    // Policy tools don't need coordinates or region - they're not shown on map
                    lat: null,
                    long: null,
                    region: null  // NO REGION for policy tools
                }));

                // CRITICAL FIX: Include BOTH physical assets AND policy tools
                const combinedAssets = [...processedPhysicalAssets, ...processedPolicyNodes];
                setAllAssets(combinedAssets);
                setRawPolicyNodes(policyNodes);

                // Build stable domain_id → category map (using 2029 as reference year)
                const idCatMap = new Map<string, string>();
                const refNodes = policyNodes.filter((n: any) =>
                    n.level === 'L1' &&
                    (n._labels || []).includes('SectorPolicyTool') &&
                    String(n.year || '') === '2029'
                );
                for (const n of refNodes) {
                    const did = String(n.domain_id || n.id || '');
                    const cat = L1_CATEGORY_MAP[n.name] || 'Services';
                    if (did) idCatMap.set(did, cat);
                }
                setCategoryById(idCatMap);

                setAllConnections([]);
                setLoading(false);

                console.log('=== ASSET PROCESSING COMPLETE ===');
                console.log('Processed physical assets:', processedPhysicalAssets.length);
                console.log('Processed policy tools:', processedPolicyNodes.length);
                console.log('TOTAL ASSETS (physical + policy):', combinedAssets.length);
                console.log('Sample physical asset:', processedPhysicalAssets[0]);
                
                // Log assets with coordinates by region
                const assetsWithCoords = processedPhysicalAssets.filter(a => a.lat !== null && a.long !== null);
                const coordsByRegion: Record<string, number> = {};
                assetsWithCoords.forEach(a => {
                    const region = a.region || 'unknown';
                    coordsByRegion[region] = (coordsByRegion[region] || 0) + 1;
                });
                console.log('Assets WITH coordinates:', assetsWithCoords.length);
                console.log('Coordinates by region:', coordsByRegion);
                console.log('Sample policy tool:', processedPolicyNodes[0]);
                
                // Year distribution
                const yearCounts = combinedAssets.reduce((acc: any, a: any) => {
                    const y = String(a.year || a.parent_year || 'unknown');
                    acc[y] = (acc[y] || 0) + 1;
                    return acc;
                }, {});
                console.log('Assets by year:', yearCounts);
                
                // Asset type distribution
                console.log('Asset coords check:', processedPhysicalAssets.slice(0, 3).map(a => ({
                    name: a.name,
                    region: a.region,
                    lat: a.lat,
                    long: a.long,
                    hasValidCoords: !!(a.lat && a.long && (Math.abs(a.lat) > 0.1 || Math.abs(a.long) > 0.1))
                })));
                console.log('Policy tools (no coords needed):', processedPolicyNodes.slice(0, 3).map(p => ({
                    name: p.name,
                    lat: p.lat,
                    long: p.long
                })));

            } catch (err: any) {
                console.error("SectorDesk Data Error:", err);
                if (isMounted) {
                    setError(t('josoor.sector.error'));
                    setLoading(false);
                }
            }
        };

        loadAllData();
        return () => { isMounted = false; };
    }, []); // Run once on mount - fetching ALL years

    // --- POLICY AGGREGATION (REACTIVE TO YEAR AND SECTOR) ---
    useEffect(() => {
        if (rawPolicyNodes.length === 0 || categoryById.size === 0) return;

        // 1. Filter by Year: Exact match (each year has its own intentional PT distribution)
        const yearlyNodes = rawPolicyNodes.filter(n => {
            const nodeYear = String(n.year || n.parent_year || '');
            return nodeYear === selectedYear;
        });

        // 2. Filter by Sector
        const sectorFilteredNodes = (selectedSector === 'all' || selectedSector === 'water')
            ? yearlyNodes
            : [];

        // 3. Filter L1 SectorPolicyTool nodes
        const isPolicyTool = (n: any) => (n._labels || []).includes('SectorPolicyTool');
        const isNonPhysical = (n: any) => !n.sector || n.sector === '' || n.sector === 'null';
        const l1PolicyTools = sectorFilteredNodes.filter((n: any) => n.level === 'L1' && isPolicyTool(n) && isNonPhysical(n));

        const counts: PolicyToolCounts = {
            enforce: 0, incentive: 0, license: 0, services: 0, regulate: 0, awareness: 0, total: 0
        };

        // nid: normalize ID to canonical "X.Y" format (8 → "8.0", "3.1" → "3.1")
        const nid = (v: any): string => {
            if (v == null) return '';
            const s = String(v);
            const n = parseFloat(s);
            if (isNaN(n)) return s;
            return s.includes('.') ? s : n.toFixed(1);
        };

        l1PolicyTools.forEach((l1: any) => {
            const did = String(l1.domain_id || l1.id || '');
            const category = categoryById.get(did) || 'Services';
            const categoryKey = category.toLowerCase();

            switch (categoryKey) {
                case 'enforce': counts.enforce += 1; break;
                case 'incentive': counts.incentive += 1; break;
                case 'license': counts.license += 1; break;
                case 'services': counts.services += 1; break;
                case 'regulate': counts.regulate += 1; break;
                case 'awareness': counts.awareness += 1; break;
            }
        });

        counts.total = counts.enforce + counts.incentive + counts.license + counts.services + counts.regulate + counts.awareness;

        // 4. Compute category risk colors from VISIBLE L1 tools only
        const catColors: Record<string, 'red' | 'amber' | 'green' | 'none'> = {
            'Enforce': 'green', 'Incentive': 'green', 'License': 'green',
            'Services': 'green', 'Regulate': 'green', 'Awareness': 'green'
        };
        l1PolicyTools.forEach((l1: any) => {
            const did = String(l1.domain_id || l1.id || '');
            const cat = categoryById.get(did) || 'Services';
            const l1Id = nid(l1.domain_id || l1.id);
            const riskEntry = policyRiskByL1.get(l1Id);
            const band = riskEntry?.worstBand || 'green';
            const current = catColors[cat] || 'green';
            if (band === 'red') catColors[cat] = 'red';
            else if (band === 'amber' && current !== 'red') catColors[cat] = 'amber';
        });
        setCategoryRiskColors(catColors);

        setPolicyCounts(counts);
    }, [rawPolicyNodes, selectedYear, selectedSector, policyRiskByL1, categoryById]);

    // --- EXISTING HANDLERS ---
    const handleRegionHover = useCallback((regionId: string | null) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        if (regionId) {
            lastRegionHoverAtRef.current = Date.now();
            setHoveredRegion(regionId);
        } else {
            // Prevent RTL ping-pong: when drawer opens, layout shift can fire a synthetic leave instantly.
            // Ignore very recent leave events so hover state remains stable.
            if (Date.now() - lastRegionHoverAtRef.current < 450) {
                return;
            }
            hoverTimeoutRef.current = setTimeout(() => {
                setHoveredRegion(null);
            }, 650);
        }
    }, []);

    const handleSectorSelect = useCallback((sectorId: string) => {
        setSelectedSector(sectorId);
    }, []);

    const handleAssetSelect = useCallback((asset: GraphNode | null) => {
        setSelectedAsset(asset);
        if (asset) setSelectedPolicyTool(null);
    }, []);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    const existingCount = useMemo(() => {
        return filteredAssets.filter(a => {
            const status = a.status?.toLowerCase();
            return status === 'existing' || status === 'active' || status === 'operational';
        }).length;
    }, [filteredAssets]);

    const plannedCount = filteredAssets.length - existingCount;

    // --- KPI LOGIC ---
    const currentRadarKPIs = useMemo(() => {
        let base = { ...dashboardData.national_kpis };
        return base; // Simplified for now, logic preserved in previous versions if needed
    }, []);

    const visionPillars = useMemo(() => {
        const base = [
            {
                pillar: t('josoor.sector.pillars.vibrant.title'),
                objective: t('josoor.sector.pillars.vibrant.objective')
            },
            {
                pillar: t('josoor.sector.pillars.thriving.title'),
                objective: t('josoor.sector.pillars.thriving.objective')
            },
            {
                pillar: t('josoor.sector.pillars.ambitious.title'),
                objective: t('josoor.sector.pillars.ambitious.objective')
            }
        ];
        if (selectedSector === 'water') {
            return [
                ...base,
                {
                    pillar: t('josoor.sector.pillars.water.title'),
                    objective: t('josoor.sector.pillars.water.objective')
                }
            ];
        }
        return base;
    }, [selectedSector, t]);

    const headerVisionProps = { visionPillars } as any;

    // --- STRATEGIC AI HANDLER ---
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    const [strategyReportHtml, setStrategyReportHtml] = useState<string>('');
    const [strategyArtifacts, setStrategyArtifacts] = useState<Artifact[]>([]);
    const [strategyConversationId, setStrategyConversationId] = useState<number | null>(null);
    const handleStrategyCheck = async () => {
        setIsStrategyModalOpen(true);
        setStrategyReportHtml(`<div style="display:flex;align-items:center;justify-content:center;height:100%;"><h3 style="color:#60a5fa">${t('josoor.sector.generatingAnalysis')}</h3></div>`);
        setStrategyArtifacts([]);

        try {
            // --- Build contextual prompt from available data ---
            const regionId = selectedRegionId || hoveredRegion || 'National';
            const sector = selectedSector === 'all' ? 'all sectors' : selectedSector;

            const megaRegions: Record<string, string[]> = {
                'Northern': ['Northern', 'Tabuk', 'Jawf', 'Hail'],
                'Western': ['Western', 'Makkah', 'Madinah', 'Jazan'],
                'Eastern': ['Eastern', 'Baha'],
                'Central': ['Central', 'Riyadh', 'Qassim', 'Asir', 'Najran']
            };
            const regionAssets = filteredAssets.filter(a => {
                if (regionId === 'National') return true;
                return megaRegions[regionId]?.includes(a.region || '') ?? false;
            });

            const existing = regionAssets.filter(a => a.status?.toLowerCase() === 'existing').length;
            const construction = regionAssets.filter(a => a.status?.toLowerCase() === 'under construction').length;
            const planned = regionAssets.filter(a => a.status?.toLowerCase() === 'planned').length;

            const topAssets = regionAssets.slice(0, 10).map(a =>
                `- ${a.name || a.id}: ${a.status || '?'} (${a.sector || '?'}${a.capacity_metric ? ', ' + a.capacity_metric : ''})`
            ).join('\n');

            const query = language === 'ar'
                ? `أريد موجزاً استراتيجياً لقطاع ${sector} في منطقة ${regionId} لعام ${selectedYear}. المنطقة تضم ${regionAssets.length} أصلاً: ${existing} قائم، ${construction} تحت الإنشاء، ${planned} مخطط. أبرز الأصول:\n${topAssets || 'لا توجد'}\nقيّم جاهزية الخطط لهذا القطاع في هذه المنطقة، حدد الفجوات والمخاطر، وقدّم توصيات عملية مبنية على الواقع.`
                : `I need a strategy brief for the ${sector} sector in the ${regionId} region for year ${selectedYear}. The region has ${regionAssets.length} assets: ${existing} existing, ${construction} under construction, ${planned} planned. Key assets:\n${topAssets || 'none'}\nAssess plan readiness for this sector in this region, identify gaps and risks, and provide practical evidence-based recommendations.`;

            const response = await chatService.sendMessage({
                query,
                prompt_key: 'strategy_brief',
                language
            });

            if (response.llm_payload?.answer) {
                // Use artifacts already processed by chatService (in processMessagePayload)
                // chatService extracts datasets, builds artifacts, and stores in metadata
                const processedArtifacts = response.metadata?.llm_payload?.artifacts ||
                                          response.llm_payload?.artifacts ||
                                          [];
                const cleanAnswer = response.metadata?.llm_payload?.answer ||
                                   response.llm_payload.answer;

                console.log('[Strategy Report] Using pre-processed artifacts:', processedArtifacts.length);

                setStrategyReportHtml(cleanAnswer);
                setStrategyArtifacts(processedArtifacts);
                if (response.conversation_id) {
                    setStrategyConversationId(response.conversation_id);
                }
                window.dispatchEvent(new Event('josoor_conversation_update'));
            } else {
                setStrategyReportHtml(`<p style="color:red">${t('josoor.sector.analysisFailed')}</p>`);
                setStrategyArtifacts([]);
            }

        } catch (error) {
            console.error("Strategy Check Failed", error);
            setStrategyReportHtml(`<p style="color:red">${t('josoor.sector.analysisError', 'Analysis Error')}: ${(error as Error).message}</p>`);
            setStrategyArtifacts([]);
        }
    };

    return (
        <div className="sector-desk-container-new" style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--component-bg-primary)', position: 'relative' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', minWidth: 0 }}>

                {/* Header: Pass PolicyCounts */}
                <div style={{ flex: '0 0 auto', zIndex: 20 }}>
                    <SectorHeaderNav
                        selectedSector={selectedSector}
                        onSelectSector={handleSectorSelect}
                        year={selectedYear}
                        onYearChange={setSelectedYear}
                        timelineFilter={timelineFilter}
                        onTimelineFilterChange={setTimelineFilter}
                        priorityFilter={priorityFilter}
                        onPriorityFilterChange={setPriorityFilter}
                        existingCount={existingCount}
                        plannedCount={plannedCount}
                        nationalKpis={currentRadarKPIs}
                        {...headerVisionProps}

                        // Pass Aggregated Data
                        policyCounts={policyCounts}
                        policyNodes={rawPolicyNodes}
                        selectedYear={selectedYear}
                        categoryRiskColors={categoryRiskColors}
                        policyRiskByL1={policyRiskByL1}
                        categoryById={categoryById}
                        onPolicyToolClick={(tool: any) => { setSelectedPolicyTool(tool); setSelectedAsset(null); }}
                        onWaterCascadeL3Change={setWaterCascadeL3Items}

                        onBackToNational={() => {
                            setSelectedRegionId(null);
                            setSelectedAsset(null);
                        }}
                    />
                </div>

                {/* Map: Pass filteredAssets (Physical) */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
                    <SectorMap
                        selectedSector={selectedSector}
                        // FIX: Prop name mismatch (SectorMap expects selectedRegion, not selectedRegionId)
                        selectedRegion={selectedRegionId}
                        onRegionSelect={(id) => {
                            setSelectedRegionId(id);
                            setSelectedAsset(null);
                        }}
                        onRegionHover={handleRegionHover}
                        focusAssetId={focusedAssetId}
                        assets={filteredAssets}
                        isLoading={loading}
                        year={Number(selectedYear)}
                        quarter={quarter}
                        timelineFilter={timelineFilter}
                        priorityFilter={priorityFilter}
                        onAssetSelect={handleAssetSelect}
                    />
                </div>
            </div>

            {/* Right Panel: Drawer-style */}
            <div
                className="sector-details-drawer"
                style={{
                    width: selectedPolicyTool || selectedAsset || (viewLevel === 'L2' && (selectedRegionId || hoveredRegion)) || (viewLevel === 'L1' && hoveredRegion) ? '400px' : '0px',
                    boxShadow: (selectedPolicyTool || selectedAsset || (viewLevel === 'L2' && (selectedRegionId || hoveredRegion)) || (viewLevel === 'L1' && hoveredRegion)) ? '-4px 0 20px rgba(0,0,0,0.3)' : 'none'
                }}
                onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                    }
                }}
            >
                <div className="sector-drawer-content">
                    {selectedPolicyTool ? (
                        <SectorDetailsPanel
                            selectedRegion={selectedRegionId}
                            hoveredRegion={hoveredRegion}
                            selectedAsset={null}
                            assets={filteredAssets}
                            selectedSector={selectedSector}
                            year={Number(selectedYear)}
                            selectedPolicyTool={selectedPolicyTool}
                            policyRiskByL1={policyRiskByL1}
                            allPolicyNodes={allSectorPolicyToolNodes}
                            waterL3Items={selectedSector === 'water' ? waterCascadeL3Items : []}
                            onPolicyToolClose={() => setSelectedPolicyTool(null)}
                            onNavigateToCapability={onNavigateToCapability}
                        />
                    ) : selectedAsset ? (
                        <SectorDetailsPanel
                            selectedRegion={selectedRegionId}
                            hoveredRegion={hoveredRegion}
                            selectedAsset={selectedAsset}
                            onBackToNational={() => { setSelectedRegionId(null); setSelectedAsset(null); }}
                            onAssetClick={(asset) => {
                                if (asset) {
                                    setSelectedAsset(asset);
                                } else {
                                    setSelectedAsset(null);
                                }
                            }}
                            assets={filteredAssets}
                            selectedSector={selectedSector}
                            year={Number(selectedYear)}
                            waterL3Items={selectedSector === 'water' ? waterCascadeL3Items : []}
                            onStrategyClick={undefined}
                        />
                    ) : viewLevel === 'L2' && (selectedRegionId || hoveredRegion) ? (
                        <SectorDetailsPanel
                            selectedRegion={selectedRegionId}
                            hoveredRegion={hoveredRegion}
                            selectedAsset={selectedAsset}
                            onBackToNational={() => { setSelectedRegionId(null); setSelectedAsset(null); }}
                            onAssetClick={(asset) => {
                                if (asset) {
                                    setSelectedAsset(asset);
                                } else {
                                    setSelectedAsset(null);
                                }
                            }}
                            assets={filteredAssets}
                            selectedSector={selectedSector}
                            year={Number(selectedYear)}
                            waterL3Items={selectedSector === 'water' ? waterCascadeL3Items : []}
                            onStrategyClick={handleStrategyCheck}
                        />
                    ) : viewLevel === 'L1' && hoveredRegion ? (
                        <SectorDetailsPanel
                            selectedRegion={hoveredRegion}
                            hoveredRegion={hoveredRegion}
                            selectedAsset={null}
                            assets={(() => {
                                // In L1 view, when hovering, show L2 assets for the hovered region
                                let result = allAssets.filter(asset => {
                                    // Must have a sector (physical assets)
                                    if (!asset.sector || asset.sector === 'null' || asset.sector === '') return false;
                                    // Filter by hovered region
                                    if (asset.region !== hoveredRegion) return false;
                                    // Filter by selected year
                                    const assetYear = String(asset.year || asset.parent_year || '');
                                    if (selectedYear && assetYear !== selectedYear) return false;
                                    // Apply timeline filter
                                    if (timelineFilter !== 'both') {
                                        const status = (asset.status || '').toLowerCase();
                                        const isExisting = status === 'existing' || status === 'active' || status === 'operational';
                                        if (timelineFilter === 'current' && !isExisting) return false;
                                        if (timelineFilter === 'future' && isExisting) return false;
                                    }
                                    // Apply priority filter
                                    if (priorityFilter !== 'both') {
                                        const p = (asset.priority || '').toUpperCase();
                                        const isHigh = p === 'HIGH' || p === 'CRITICAL' || p === 'MAJOR';
                                        if (priorityFilter === 'major' && !isHigh) return false;
                                        if (priorityFilter === 'strategic' && isHigh) return false;
                                    }
                                    return true;
                                });
                                // Show L2 assets (all assets for the region, including L2 children)
                                return result;
                            })()}
                            selectedSector={selectedSector}
                            year={Number(selectedYear)}
                            waterL3Items={selectedSector === 'water' ? waterCascadeL3Items : []}
                        />
                    ) : selectedSector === 'water' && waterCascadeL3Items.length > 0 ? (
                        <SectorDetailsPanel
                            selectedRegion={null}
                            hoveredRegion={null}
                            selectedAsset={null}
                            assets={filteredAssets}
                            selectedSector={selectedSector}
                            year={Number(selectedYear)}
                            waterL3Items={waterCascadeL3Items}
                        />
                    ) : (
                        <SectorSidebar year={selectedYear} quarter={quarter} />
                    )}
                </div>

                <div className="sector-details-drawer-footer">
                    <p>
                        • {t('josoor.sector.disclaimerLine1')}<br />
                        • {t('josoor.sector.disclaimerLine2')}
                    </p>
                </div>
            </div>

            <StrategyReportModal
                isOpen={isStrategyModalOpen}
                onClose={() => setIsStrategyModalOpen(false)}
                htmlContent={strategyReportHtml}
                artifacts={strategyArtifacts}
                onContinueInChat={() => {
                    setIsStrategyModalOpen(false);
                    if (strategyConversationId && onContinueInChat) {
                        onContinueInChat(strategyConversationId);
                    }
                }}
            />
        </div>
    );
};
