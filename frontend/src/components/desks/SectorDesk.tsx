import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
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
import { fetchSectorGraphData, L1_CATEGORY_MAP } from '../../services/neo4jMcpService';
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
}

export const SectorDesk: React.FC<SectorDeskProps> = ({ year: propYear, quarter: propQuarter }) => {
    const [selectedPillar, setSelectedPillar] = useState('economy');
    const [selectedSector, setSelectedSector] = useState('all');

    // Interaction State
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
    const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [focusedAssetId, setFocusedAssetId] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<GraphNode | null>(null);
    const [viewLevel, setViewLevel] = useState<'L1' | 'L2'>('L1');

    const [timelineFilter, setTimelineFilter] = useState<'current' | 'future' | 'both'>('both');
    const [priorityFilter, setPriorityFilter] = useState<'major' | 'strategic' | 'both'>('both');

    const outletContext = useOutletContext<{ year: string; quarter: string } | null>();
    const year = propYear || outletContext?.year;
    const quarter = propQuarter || outletContext?.quarter;

    // Data State
    const [allAssets, setAllAssets] = useState<GraphNode[]>([]); // Physical Assets
    const [filteredAssets, setFilteredAssets] = useState<GraphNode[]>([]);
    const [allConnections, setAllConnections] = useState<GraphConnection[]>([]); // Kept for map lines if any
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>(year || '2029'); // FIXED: Changed from 2030 to 2029 (data range: 2025-2029)

    // Sync selectedYear if prop/context year changes
    useEffect(() => {
        if (year && year !== selectedYear) {
            setSelectedYear(year);
        }
    }, [year]);

    // Snapshot nodes for reactive filtering
    const [rawPolicyNodes, setRawPolicyNodes] = useState<GraphNode[]>([]);
    const [policyCounts, setPolicyCounts] = useState<PolicyToolCounts | undefined>(undefined);

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

        // 1. Year Filter - Filter by selected year
        if (selectedYear) {
            const beforeCount = result.length;
            result = result.filter(asset => {
                const assetYear = String(asset.year || asset.parent_year || '');
                return assetYear === selectedYear;
            });
            console.log(`Year filter: ${beforeCount} → ${result.length} (year=${selectedYear})`);
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
                const nodes = await fetchSectorGraphData();

                if (!isMounted) return;

                // --- 1. Split Data based on 'sector' field ---
                // Physical Assets have a sector (e.g. "Water", "Transportation")
                // Policy Tools have explicit null/empty sector
                const physicalNodes = nodes.filter((n: any) => n.sector && n.sector !== "null" && n.sector !== "");
                const policyNodes = nodes.filter((n: any) => !n.sector || n.sector === "null" || n.sector === "");

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
                    setError("Failed to load sector data");
                    setLoading(false);
                }
            }
        };

        loadAllData();
        return () => { isMounted = false; };
    }, []); // Run once on mount - fetching ALL years

    // --- POLICY AGGREGATION (REACTIVE TO YEAR AND SECTOR) ---
    useEffect(() => {
        if (rawPolicyNodes.length === 0) return;

        // 1. Filter by Year
        const yearlyNodes = rawPolicyNodes.filter(n => {
            const nodeYear = String(n.year || n.parent_year || '');
            return nodeYear === selectedYear;
        });

        // 2. Filter by Sector
        // Policy tools have no sector field in DB, but we know they're all water
        const sectorFilteredNodes = (selectedSector === 'all' || selectedSector === 'water')
            ? yearlyNodes
            : []; // Non-water sectors get zero policy tools

        // 3. Reconstruct Hierarchy
        const l1PolicyTools = sectorFilteredNodes.filter((n: any) => n.level === 'L1');
        const l2PolicyTools = sectorFilteredNodes.filter((n: any) => n.level === 'L2');

        const counts: PolicyToolCounts = {
            enforce: 0, incentive: 0, license: 0, services: 0, regulate: 0, awareness: 0, total: 0,
            enforceStatus: 'none', incentiveStatus: 'none', licenseStatus: 'none',
            servicesStatus: 'none', regulateStatus: 'none', awarenessStatus: 'none'
        };

        // Helper to calculate risk status from nodes
        const calculateRiskStatus = (nodes: any[]): 'high' | 'medium' | 'low' | 'none' => {
            if (nodes.length === 0) return 'none';

            // Check for risk-related properties
            const risks = nodes.filter(n =>
                n.risk_level || n.risk_status || n.has_risk ||
                n.risk_severity || n.risk_count
            );

            if (risks.length === 0) return 'low'; // No explicit risks = low risk

            // Aggregate risk levels
            const highRisks = risks.filter(n =>
                String(n.risk_level || n.risk_status || n.risk_severity || '').toLowerCase().includes('high') ||
                String(n.risk_level || n.risk_status || n.risk_severity || '').toLowerCase().includes('critical')
            );
            const mediumRisks = risks.filter(n =>
                String(n.risk_level || n.risk_status || n.risk_severity || '').toLowerCase().includes('medium') ||
                String(n.risk_level || n.risk_status || n.risk_severity || '').toLowerCase().includes('moderate')
            );

            if (highRisks.length > 0) return 'high';
            if (mediumRisks.length > 0) return 'medium';
            return 'low';
        };

        // Track nodes by category for risk calculation
        const categoryNodes: Record<string, any[]> = {
            enforce: [], incentive: [], license: [], services: [], regulate: [], awareness: []
        };

        l1PolicyTools.forEach((l1: any) => {
            const children = l2PolicyTools.filter((l2: any) => String(l2.parent_id) === String(l1.id));
            const childCount = children.length;
            const effectiveCount = childCount > 0 ? childCount : 1;
            const category = L1_CATEGORY_MAP[l1.name] || 'Services';
            const categoryKey = category?.toLowerCase();

            // Add to counts
            switch (categoryKey) {
                case 'enforce': counts.enforce += effectiveCount; break;
                case 'incentive': counts.incentive += effectiveCount; break;
                case 'license': counts.license += effectiveCount; break;
                case 'services': counts.services += effectiveCount; break;
                case 'regulate': counts.regulate += effectiveCount; break;
                case 'awareness': counts.awareness += effectiveCount; break;
            }

            // Collect nodes for risk calculation
            if (categoryNodes[categoryKey]) {
                categoryNodes[categoryKey].push(l1);
                categoryNodes[categoryKey].push(...children);
            }
        });

        // Calculate risk status for each category
        counts.enforceStatus = calculateRiskStatus(categoryNodes.enforce);
        counts.incentiveStatus = calculateRiskStatus(categoryNodes.incentive);
        counts.licenseStatus = calculateRiskStatus(categoryNodes.license);
        counts.servicesStatus = calculateRiskStatus(categoryNodes.services);
        counts.regulateStatus = calculateRiskStatus(categoryNodes.regulate);
        counts.awarenessStatus = calculateRiskStatus(categoryNodes.awareness);

        counts.total = counts.enforce + counts.incentive + counts.license + counts.services + counts.regulate + counts.awareness;
        setPolicyCounts(counts);
    }, [rawPolicyNodes, selectedYear, selectedSector]);

    // --- EXISTING HANDLERS ---
    const handleAssetSelect = useCallback((asset: GraphNode | null) => {
        setSelectedAsset(asset);
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

    // --- STRATEGIC AI HANDLER ---
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    const [strategyReportHtml, setStrategyReportHtml] = useState<string>('');
    const [strategyArtifacts, setStrategyArtifacts] = useState<Artifact[]>([]);

    const handleStrategyCheck = async () => {
        setIsStrategyModalOpen(true);
        setStrategyReportHtml('<div style="display:flex;align-items:center;justify-content:center;height:100%;"><h3 style="color:#60a5fa">Generating Strategic Analysis...</h3></div>');
        setStrategyArtifacts([]);

        try {
            const prompt = `Conduct a comprehensive Strategic Plan Review for our organization's 2024–2029 strategic plan.

**Review Scope:**
- Plan Period: 2024–2029
- Assessment Period: Based on ${selectedYear} data snapshot
- Focus Areas: Economic diversification, employment creation, investment attraction, sectoral transformation

---

**Visualization Requirements:**

Create exactly 3 visualizations using Highcharts format:

1. **Vision 2030 Pillar Performance** (chart id: "vision-pillars")
   - Type: column chart
   - Show 3 pillars: Vibrant Society, Thriving Economy, Ambitious Nation
   - Data: Target % vs Actual % for each

2. **Cross-Sectoral Impact** (chart id: "sector-impact")
   - Type: column or bar chart
   - Show top 5 sectors by investment or economic value
   - Data: SAR amounts or impact scores

3. **Strategic Risk Matrix** (chart id: "risk-matrix")
   - Type: scatter chart
   - Show top risks plotted by probability (x-axis) and impact (y-axis)
   - Data format: [{ x: probability, y: impact, name: "Risk Name" }]

Reference charts inline using: <ui-chart id="chart-id"></ui-chart>

---

**Required Analysis:**

### 1. Executive Summary
Provide an overall assessment of plan performance with your top 3 strategic findings. Quantify each finding with specific metrics (percentages, SAR amounts, timeline impacts). Make a clear recommendation: stay the course, adjust priorities, or pivot strategy.

### 2. Vision 2030 Alignment
Compare our plan's performance against national transformation targets across all three pillars:
- **Vibrant Society:** Quality of life, cultural participation, community engagement
- **Thriving Economy:** Non-oil GDP growth, economic diversification, private sector expansion, employment
- **Ambitious Nation:** Government effectiveness, digital transformation, global competitiveness

For each pillar, identify:
- Our plan's contribution to national targets
- Current performance against those targets  
- Gaps or overperformance
- Strategic implications

Show this comparison in structured format with performance metrics.

### 3. Economic Performance Benchmarking
Analyze our initiatives against national economic indicators. Pull latest data on:
- **GDP:** Total economy size, oil vs non-oil contribution, sectoral breakdowns, growth rates
- **Employment:** Total jobs created, Saudization progress, women's workforce participation, unemployment rates, sector-specific targets
- **Foreign Investment:** FDI inflows total and by sector, progress against annual targets, major projects
- **Local Investment:** Domestic capital deployment, regional headquarters established
- **Trade:** Export performance, trade balance trends, non-oil export growth
- **Vision 2030 Progress:** Milestone achievement across transformation programs

Quantify how our initiatives contribute to or fall short of these national benchmarks.

### 4. Value Chain Impact Assessment
Map how our initiatives create economic multiplier effects across sectors:

Identify our **enabling sector investments** (infrastructure, utilities, logistics) and trace their impact downstream:
- Which enabling investments unlock growth in manufacturing, petrochemicals, tourism, agriculture?
- Quantify economic multipliers: for each SAR invested in enabling infrastructure, how much value is created downstream?
- Identify bottlenecks: which single points of failure could cascade through multiple sectors?
- Highlight cross-sectoral synergies we're capturing or missing

Visualize investment flows from enabling sectors through core industries to economic outcomes (jobs, GDP, exports).

### 5. Strategic Recommendations
Group recommendations into four categories:
1. **Accelerate:** Initiatives behind target requiring additional resources or urgency
2. **Sustain:** On-track initiatives to maintain at current pace
3. **Optimize:** Ahead-of-target initiatives where resources could be reallocated
4. **Pivot:** Misaligned initiatives not contributing meaningfully to Vision 2030

For each recommendation, provide:
- Quantified rationale (% below target, months delayed, SAR shortfall)
- Resource implications (budget adjustments, timeline changes)
- Dependencies (what must happen first)
- Expected impact on Vision 2030 KPIs

### 6. Priority Action Plan
List 5-8 highest-impact actions required over the next 12-18 months. Bold the top 3 critical path actions.

For each action specify:
- **Action:** Clear directive (e.g., "Expand desalination capacity in Eastern Province by 500,000 m³/day by Q4 2026")
- **Rationale:** Why this action matters, backed by analysis above
- **Owner:** Responsible organization/department
- **Dependencies:** Prerequisites or blockers to address first
- **Impact:** Contribution to Vision 2030 targets (jobs created, GDP contribution, FDI attracted)
- **Scope:** Regional / Sectoral / Cross-cutting classification

### 7. Strategic Risks
Identify the top 3 risks to plan execution, with focus on systemic vulnerabilities:
- **Risk:** Specific constraint or bottleneck
- **Impact:** Quantified downstream effect (% reduction in output, jobs at risk, SAR GDP impact)
- **Mitigation:** Specific action from Priority Action Plan addressing this risk
- **Contingency:** Backup plan if primary mitigation fails

### 8. Strategic Insights
Highlight 2-3 non-obvious findings from your analysis:
- Cross-sectoral opportunities not currently captured in the plan
- Hidden dependencies or systemic bottlenecks
- High-leverage, low-dependency initiatives we should prioritize

Label each insight: Regional / Sectoral / Cross-cutting / Systemic

**Presentation Guidelines:**
- Lead with answers, then supporting rationale
- Quantify everything: use percentages, SAR amounts, specific timelines
- Use Vision 2030 terminology: "giga-projects," "economic engines," "enabling sectors," "national transformation"
- Include visual comparisons for Vision 2030 alignment and value chain flows
- Structure all outputs for executive readability
- Include any charts with <ui-chart> tags (not <div class="visualization-placeholder">)
- Title your response: "Strategic Plan Review - Vision 2030 Alignment Analysis"

**CRITICAL: For visualizations, provide data in Highcharts format:**

After narrative, wrap ALL datasets in this marker:
[DATASETS_JSON_START]
{
  "datasets": {
    "your-chart-id": {
      "id": "your-chart-id",
      "title": "Descriptive Chart Title",
      "chart": { "type": "column" },
      "xAxis": {
        "categories": ["Category 1", "Category 2", "Category 3"],
        "title": { "text": "X-Axis Label" }
      },
      "yAxis": {
        "title": { "text": "Y-Axis Label" },
        "min": 0,
        "max": 100
      },
      "series": [{
        "name": "Series Name",
        "data": [value1, value2, value3],
        "color": "#facc15"
      }]
    }
  }
}
[DATASETS_JSON_END]

**Required fields (ALL mandatory):**
- \`id\`: Unique identifier in kebab-case (e.g., "pillar-performance")
- \`title\`: Descriptive title that explains the insight
- \`chart.type\`: MUST be one of these 6 ONLY: "column", "bar", "line", "scatter", "bullet", "pie"
- \`xAxis\`: Object with \`categories\` array OR \`title\` with \`min\`/\`max\` for scatter
- \`yAxis\`: Object with \`title\` object, optionally \`min\`/\`max\` for bounds
- \`series\`: Array (at least 1) with \`name\` (string) and \`data\` (array of numbers)

**Special data formats:**
- **Scatter charts:** \`data\` must be \`[{ "x": 6, "y": 8, "name": "Point Label" }]\`
- **All others:** \`data\` is simple number array \`[10, 20, 30]\`

**Validation checklist before creating dataset:**
1. ✓ Chart type is one of the 6 allowed types (not "bar-chart", "columns", etc.)
2. ✓ id matches the id you use in <ui-chart id="..."> tag
3. ✓ series is an array, not a single object
4. ✓ data values are numbers (or x/y objects for scatter)

**Reference charts inline:** <ui-chart id="your-chart-id"></ui-chart>

**Vision 2030 colors (use these):**
- #facc15 (gold), #10b981 (green), #3b82f6 (blue), #f59e0b (amber)

**Final reminder:** Maximum 10 charts. Each must explain a specific insight. Quality > Quantity.`;

            const response = await chatService.sendMessage({
                query: prompt,
                desk_type: 'sector_desk'
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
                window.dispatchEvent(new Event('josoor_conversation_update'));
            } else {
                setStrategyReportHtml('<p style="color:red">Analysis failed: No content received.</p>');
                setStrategyArtifacts([]);
            }

        } catch (error) {
            console.error("Strategy Check Failed", error);
            setStrategyReportHtml(`<p style="color:red">Analysis Error: ${(error as Error).message}</p>`);
            setStrategyArtifacts([]);
        }
    };

    return (
        <div className="sector-desk-container-new" style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--component-bg-primary)' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', minWidth: 0 }}>

                {/* Header: Pass PolicyCounts */}
                <div style={{ flex: '0 0 auto', zIndex: 20 }}>
                    <SectorHeaderNav
                        selectedSector={selectedSector}
                        onSelectSector={setSelectedSector}
                        year={selectedYear}
                        onYearChange={setSelectedYear}
                        timelineFilter={timelineFilter}
                        onTimelineFilterChange={setTimelineFilter}
                        priorityFilter={priorityFilter}
                        onPriorityFilterChange={setPriorityFilter}
                        existingCount={existingCount}
                        plannedCount={plannedCount}
                        nationalKpis={currentRadarKPIs}

                        // Pass Aggregated Data
                        policyCounts={policyCounts}
                        policyNodes={rawPolicyNodes}
                        selectedYear={selectedYear}

                        onBackToNational={() => {
                            setSelectedRegionId(null);
                            setSelectedAsset(null);
                        }}
                        onStrategyClick={handleStrategyCheck}
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
                        onRegionHover={(regionId) => setHoveredRegion(regionId)}
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
                    width: (viewLevel === 'L2' && (selectedRegionId || selectedAsset || hoveredRegion)) || (viewLevel === 'L1' && hoveredRegion) ? '400px' : '0px',
                    flex: (viewLevel === 'L2' && (selectedRegionId || selectedAsset || hoveredRegion)) || (viewLevel === 'L1' && hoveredRegion) ? '0 0 400px' : '0 0 0px',
                    boxShadow: ((viewLevel === 'L2' && (selectedRegionId || selectedAsset || hoveredRegion)) || (viewLevel === 'L1' && hoveredRegion)) ? '-4px 0 20px rgba(0,0,0,0.3)' : 'none'
                }}
            >
                <div className="sector-drawer-content">
                    {viewLevel === 'L2' && (selectedRegionId || selectedAsset || hoveredRegion) ? (
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
                        />
                    ) : (
                        <SectorSidebar year={selectedYear} quarter={quarter} />
                    )}
                </div>

                <div className="sector-details-drawer-footer">
                    <p>
                        • Publicly available V2030 dataset snapshots<br />
                        • Non-comprehensive representative simulation
                    </p>
                </div>
            </div>

            <StrategyReportModal
                isOpen={isStrategyModalOpen}
                onClose={() => setIsStrategyModalOpen(false)}
                htmlContent={strategyReportHtml}
                artifacts={strategyArtifacts}
                onContinueInChat={() => { setIsStrategyModalOpen(false); }}
            />
        </div>
    );
};
