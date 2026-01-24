/**
 * KSA STRATEGIC ASSETS DATA FOR MAP VISUALIZATION
 * Source: docs/final mapping/saudi_assets.csv + heatmap.csv
 * Generated: 2026-01-18
 */

// Asset Categories (original detailed)
export type AssetCategory =
    | 'Industrial City'
    | 'Special Zone'
    | 'Utilities'
    | 'Giga Project'
    | 'Real Estate'
    | 'Industrial'
    | 'Mining'
    | 'Energy'
    | 'Logistics'
    | 'Infrastructure'
    | 'Investor Tool'
    | 'Sports'
    | 'Entertainment'
    | 'Agriculture'
    | 'Food';

// Main Categories (simplified for map display - 6 categories)
export type MainCategory = 'Mining' | 'Water' | 'Energy' | 'Industry' | 'Transportation' | 'Giga';

// Map AssetCategory to MainCategory
export const CATEGORY_TO_MAIN: Record<AssetCategory, MainCategory | null> = {
    'Mining': 'Mining',
    'Utilities': 'Water',  // Default to Water, but check subCategory for power
    'Energy': 'Energy',
    'Industrial City': 'Industry',
    'Industrial': 'Industry',
    'Special Zone': 'Industry',
    'Logistics': 'Transportation',
    'Infrastructure': 'Transportation',
    'Giga Project': 'Giga',
    'Real Estate': 'Giga',
    'Investor Tool': null,  // Hidden from map
    'Sports': 'Giga',
    'Entertainment': 'Giga',
    'Agriculture': 'Industry',
    'Food': 'Transportation'
};

// Get main category (with Utilities power → Energy override)
export const getMainCategory = (category: AssetCategory, subCategory: string): MainCategory | null => {
    // Special case: Utilities with power-related subCategory → Energy
    if (category === 'Utilities' &&
        (subCategory.toLowerCase().includes('power') ||
            subCategory.toLowerCase().includes('generation'))) {
        return 'Energy';
    }
    return CATEGORY_TO_MAIN[category];
};

// Asset Status (original detailed)
export type AssetStatus =
    | 'Existing'
    | 'Under Construction'
    | 'Planned'
    | 'Tendering'
    | 'Awarded'
    | 'Opportunity'
    | 'Active';

// Simple Status (binary for map display)
export type SimpleStatus = 'Running' | 'Future';

// Map AssetStatus to SimpleStatus
export const getSimpleStatus = (status: AssetStatus): SimpleStatus => {
    return ['Existing', 'Active'].includes(status) ? 'Running' : 'Future';
};

// Status Groups for filtering (legacy)
export const STATUS_GROUPS = {
    operational: ['Existing', 'Active'],
    inProgress: ['Under Construction', 'Tendering', 'Awarded'],
    planned: ['Planned', 'Opportunity']
};

export interface StrategicAsset {
    id: string;
    name: string;
    category: AssetCategory;
    subCategory: string;
    status: AssetStatus;
    lat: number;
    long: number;
    region: string;
    description: string;
    capacity: string;
    investment?: string;
    priority?: string;
    fiscalAction?: string;
    rationale?: string;
    ownership_type?: 'Government' | 'Private' | 'PPP';
    ownership_confidence?: 'High' | 'Medium' | 'Low';
    sector_split?: Record<string, number>; // e.g., { 'Urban': 40, 'Agri': 50, 'Ind': 10 }
}

// 72 Strategic Assets from saudi_assets.csv
export const strategicAssets: StrategicAsset[] = [
    // Industrial Cities
    { id: 'A-001', name: 'Jubail Industrial City', category: 'Industrial City', subCategory: 'Petrochemicals', status: 'Existing', lat: 27.0112, long: 49.6105, region: 'Eastern Region', description: "World's largest industrial city; SABIC & Aramco hub", capacity: '>1000 sq km', priority: 'HIGH', fiscalAction: 'MAINTAIN', rationale: 'CORE ENGINE: Revenue generator; keep stable.' },
    { id: 'A-002', name: 'Yanbu Industrial City', category: 'Industrial City', subCategory: 'Refining & Downstream', status: 'Existing', lat: 23.9536, long: 38.2267, region: 'Madinah', description: 'Red Sea energy hub; terminus of East-West pipeline', capacity: '606 sq km', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-003', name: 'Ras Al-Khair Industrial City', category: 'Industrial City', subCategory: 'Mining & Maritime', status: 'Existing', lat: 27.5367, long: 49.1708, region: 'Eastern Region', description: 'Mining capital; Aluminium & Phosphate complex. Specific investment for King Salman International Marine Industries.', capacity: 'Integrated Maritime Yard', investment: 'SAR 26 Billion', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-004', name: 'Jazan City (JCPDI)', category: 'Industrial City', subCategory: 'Heavy Industry', status: 'Under Construction', lat: 17.2586, long: 42.4764, region: 'Jazan', description: 'Refining and heavy industry gateway to Africa', capacity: 'Port & Refinery', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'LIFELINE: The only non-oil job engine in a high-unemployment region.' },
    { id: 'A-005', name: "Wa'ad Al-Shamal", category: 'Industrial City', subCategory: 'Phosphate Mining', status: 'Existing', lat: 31.6447, long: 38.7617, region: 'Northern Borders', description: "Phosphate city; Ma'aden fertilizer complex. NIDLP launched with SAR 85B investment.", capacity: '440 sq km', investment: 'SAR 85 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.' },
    { id: 'A-006', name: 'Sudair City for Industry', category: 'Industrial City', subCategory: 'Mixed Manufacturing', status: 'Existing', lat: 25.6593, long: 45.6214, region: 'Riyadh', description: 'Relief valve for Riyadh; light industry & logistics', capacity: '265 sq km', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Steady economic engine.' },
    { id: 'A-007', name: 'Riyadh 2nd Industrial City', category: 'Industrial City', subCategory: 'Manufacturing', status: 'Existing', lat: 24.567, long: 46.852, region: 'Riyadh', description: 'Major manufacturing hub for Central region', capacity: 'MODON Main Hub', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Steady economic engine.' },
    { id: 'A-008', name: 'Dammam 2nd Industrial City', category: 'Industrial City', subCategory: 'Manufacturing', status: 'Existing', lat: 26.2361, long: 49.9576, region: 'Eastern Region', description: 'Oil & Gas support industries; IKTVA hub', capacity: 'MODON Main Hub', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Steady economic engine.' },
    { id: 'A-009', name: 'Jeddah 1st Industrial City', category: 'Industrial City', subCategory: 'Light Industry', status: 'Existing', lat: 21.4367, long: 39.243, region: 'Makkah', description: 'Consumer goods and food processing', capacity: 'MODON Main Hub', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'CORE ENGINE: Revenue generator; keep stable.' },
    { id: 'A-010', name: 'Oxagon (NEOM)', category: 'Industrial City', subCategory: 'Advanced Mfg', status: 'Planned', lat: 27.9366, long: 35.1587, region: 'Tabuk', description: 'Floating industrial city; Hydrogen hub', capacity: 'Clean Industry Hub', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.' },

    // Special Zones
    { id: 'A-011', name: 'King Abdullah Economic City', category: 'Special Zone', subCategory: 'Logistics & Light Ind', status: 'Existing', lat: 22.4107, long: 39.12, region: 'Makkah', description: 'Port-centric logistics and pharmaceuticals', capacity: '173 sq km', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Supports religious tourism capacity.' },
    { id: 'A-012', name: 'SPARK (King Salman Energy Park)', category: 'Special Zone', subCategory: 'Energy Services', status: 'Under Construction', lat: 25.908, long: 49.539, region: 'Eastern Region', description: 'Energy supply chain localization (IKTVA)', capacity: '50 sq km', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },

    // Utilities - Desalination & Power
    { id: 'A-013', name: 'Ras Al-Khair Power Plant', category: 'Utilities', subCategory: 'Desalination/Power', status: 'Existing', lat: 27.55, long: 49.2, region: 'Eastern Region', description: "World's largest hybrid desalination plant", capacity: '2.9M m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-014', name: 'Shoaiba Power Plant', category: 'Utilities', subCategory: 'Desalination/Power', status: 'Existing', lat: 20.672, long: 39.525, region: 'Makkah', description: 'Major supplier to Makkah & Jeddah', capacity: 'Thermal/RO Complex', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-015', name: 'Jubail Power Plant', category: 'Utilities', subCategory: 'Desalination/Power', status: 'Existing', lat: 27.03, long: 49.63, region: 'Eastern Region', description: 'Supplies Jubail Industrial City & Riyadh', capacity: 'Integrated Complex', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-016', name: 'Ghazlan Power Plant', category: 'Utilities', subCategory: 'Power Generation', status: 'Existing', lat: 26.839, long: 49.923, region: 'Eastern Region', description: 'Major gas-fired plant supporting Eastern grid', capacity: '4000+ MW', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-017', name: 'Qurayyah IPP', category: 'Utilities', subCategory: 'Power Generation', status: 'Existing', lat: 25.86, long: 50.11, region: 'Eastern Region', description: 'Combined cycle gas turbine plant', capacity: '3927 MW', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-018', name: 'Rabigh 3 IWP', category: 'Utilities', subCategory: 'Desalination', status: 'Existing', lat: 22.68, long: 39.02, region: 'Makkah', description: 'Major Reverse Osmosis (RO) facility', capacity: '600k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Supports religious tourism capacity.', ownership_type: 'PPP', sector_split: { 'Urban': 70, 'Agri': 20, 'Ind': 10 } },
    { id: 'A-019', name: 'Yanbu 4 IWP', category: 'Utilities', subCategory: 'Desalination', status: 'Under Construction', lat: 23.85, long: 38.15, region: 'Madinah', description: 'Supplies Madinah and Yanbu region', capacity: '450k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.', ownership_type: 'PPP', sector_split: { 'Urban': 60, 'Agri': 30, 'Ind': 10 } },
    { id: 'A-020', name: 'Ras Al Khair 2 IWP', category: 'Utilities', subCategory: 'Desalination', status: 'Tendering', lat: 27.56, long: 49.18, region: 'Eastern Region', description: 'New SWRO plant to supply Riyadh (COD 2028)', capacity: '600k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.', ownership_type: 'PPP', investment: 'SAR 3.5 Billion' },
    { id: 'A-021', name: 'Tabuk 1 IWP', category: 'Utilities', subCategory: 'Desalination', status: 'Tendering', lat: 27.3517, long: 35.6901, region: 'Tabuk', description: 'Supplies NEOM & Madinah region (COD 2028)', capacity: '400k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-022', name: 'Ras Mohaisen IWP', category: 'Utilities', subCategory: 'Desalination', status: 'Awarded', lat: 19.5, long: 40.5, region: 'Makkah', description: 'Anchor supply for Makkah/Baha; Awarded to ACWA', capacity: '300k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Supports religious tourism capacity.' },
    { id: 'A-023', name: 'Jazan 1 IWP', category: 'Utilities', subCategory: 'Desalination', status: 'Planned', lat: 17.26, long: 42.1, region: 'Jazan', description: 'Replacing dams/groundwater in South (COD 2028)', capacity: '300k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-024', name: 'Riyadh-Qassim IWTP', category: 'Utilities', subCategory: 'Transmission', status: 'Awarded', lat: 25.5, long: 45.0, region: 'Riyadh', description: 'Pipeline connecting Riyadh to Qassim (Vision Invest)', capacity: '685k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-025', name: 'Jubail-Buraidah IWTP', category: 'Utilities', subCategory: 'Transmission', status: 'Under Construction', lat: 26.5, long: 47.0, region: 'Eastern Region', description: 'East-to-West water transmission bridge', capacity: '650k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-026', name: 'Jazan SSTP (Cluster)', category: 'Utilities', subCategory: 'Wastewater', status: 'Awarded', lat: 16.89, long: 42.55, region: 'Jazan', description: 'Integrated treatment plants and network (Alkhorayef)', capacity: '75k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-027', name: 'Khobar 2 Desalination', category: 'Utilities', subCategory: 'Desalination', status: 'Existing', lat: 26.18, long: 50.2, region: 'Eastern Region', description: 'Supplies Eastern Province', capacity: '600k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-028', name: 'Jubail 3A (Jazlah)', category: 'Utilities', subCategory: 'Desalination', status: 'Under Construction', lat: 26.96, long: 49.6, region: 'Eastern Region', description: 'Independent Water Project (IWP)', capacity: '600k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-029', name: 'Jubail 3B', category: 'Utilities', subCategory: 'Desalination', status: 'Under Construction', lat: 27.05, long: 49.65, region: 'Eastern Region', description: 'Independent Water Project (IWP)', capacity: '570k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-030', name: 'Shuqaiq 3 IWP', category: 'Utilities', subCategory: 'Desalination', status: 'Existing', lat: 17.66, long: 42.06, region: 'Jazan', description: 'Major SWRO plant for southern region', capacity: '450k m3/day', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-031', name: 'Juranah ISWR', category: 'Utilities', subCategory: 'Water Storage', status: 'Planned', lat: 21.52, long: 39.8, region: 'Makkah', description: 'Independent Strategic Water Reservoir; Tender Phase', capacity: '2.5M m3 Storage', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },

    // Giga Projects
    { id: 'A-032', name: 'NEOM (The Line)', category: 'Giga Project', subCategory: 'Future City', status: 'Under Construction', lat: 28.0, long: 35.0, region: 'Tabuk', description: 'The Linear City & Oxagon Industrial Zone. $500B region.', capacity: '26500 sq km', investment: '$500 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'DIVERSIFICATION: High strategic value; critical path project.' },
    { id: 'A-033', name: 'Red Sea Global', category: 'Giga Project', subCategory: 'Tourism/Utilities', status: 'Under Construction', lat: 25.63, long: 36.8, region: 'Tabuk', description: 'Regenerative tourism & renewable utility grid', capacity: '28000 sq km', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'DIVERSIFICATION: Critical for tourism targets.' },
    { id: 'A-034', name: 'Qiddiya', category: 'Giga Project', subCategory: 'Entertainment', status: 'Under Construction', lat: 24.583, long: 46.333, region: 'Riyadh', description: 'Entertainment & Sports capital; Six Flags', capacity: '334 sq km', priority: 'Medium', fiscalAction: 'OPTIMIZE', rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.' },
    { id: 'A-035', name: 'Trojena (NEOM)', category: 'Giga Project', subCategory: 'Tourism', status: 'Planned', lat: 28.7292, long: 35.3957, region: 'Tabuk', description: 'Mountain tourism; Asian Winter Games 2029 host', capacity: 'Ski Village', priority: 'Medium', fiscalAction: 'OPTIMIZE', rationale: 'DIVERSIFICATION: High strategic value but exacerbates Riyadh traffic/housing pressure.' },
    { id: 'A-036', name: 'Diriyah Gate', category: 'Giga Project', subCategory: 'Culture/Heritage', status: 'Under Construction', lat: 24.7333, long: 46.575, region: 'Riyadh', description: 'Historic capital redevelopment; UNESCO site. Includes Wadi Safar luxury destination.', capacity: 'Cultural District', investment: 'SAR 8 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'GROWTH: Key branding and cultural pillar.' },
    { id: 'A-037', name: 'Al-Ula (Journey Through Time)', category: 'Giga Project', subCategory: 'Tourism', status: 'Existing', lat: 26.61, long: 37.92, region: 'Madinah', description: 'Living museum and heritage tourism', capacity: 'Heritage Site', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.' },
    { id: 'A-038', name: 'Amaala', category: 'Giga Project', subCategory: 'Tourism/Wellness', status: 'Under Construction', lat: 26.65, long: 36.2, region: 'Tabuk', description: 'Luxury wellness destination (Red Sea Global)', capacity: '3000 Hotel Keys', priority: 'Medium', fiscalAction: 'OPTIMIZE', rationale: 'DIVERSIFICATION: High strategic value but exacerbates Riyadh traffic/housing pressure.' },
    { id: 'A-039', name: 'THE RIG.', category: 'Giga Project', subCategory: 'Tourism/Adventure', status: 'Planned', lat: 27.19, long: 49.8, region: 'Eastern Region', description: 'Offshore oil rig themed adventure park', capacity: 'Tourism', priority: 'Medium', fiscalAction: 'OPTIMIZE', rationale: 'COMMERCIAL HIT: Matches high regional purchasing power.' },
    { id: 'A-040', name: 'New Murabba (The Mukaab)', category: 'Giga Project', subCategory: 'Mixed Use', status: 'Planned', lat: 24.78, long: 46.6, region: 'Riyadh', description: "New downtown Riyadh & world's largest structure", capacity: 'Urban Dev', priority: 'Medium', fiscalAction: 'OPTIMIZE', rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.' },

    // Real Estate
    { id: 'A-041', name: 'Roshn (Sedra)', category: 'Real Estate', subCategory: 'Housing', status: 'Under Construction', lat: 24.8387, long: 46.746, region: 'Riyadh', description: 'Integrated community living; PIF backed', capacity: '30k Homes', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-042', name: 'Saudi Downtown (12 Cities)', category: 'Real Estate', subCategory: 'Mixed Use', status: 'Planned', lat: 24.0, long: 45.0, region: 'Multiple', description: 'Projects in 12 cities (Arar; Dombat; etc.)', capacity: 'Urban Regeneration', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-043', name: 'Konoz (Box of Treasures)', category: 'Real Estate', subCategory: 'Mixed Use', status: 'Planned', lat: 24.69, long: 46.66, region: 'Riyadh', description: 'Entertainment & commercial city by Abdullah Al Othaim', capacity: 'Commercial', priority: 'Medium', fiscalAction: 'OPTIMIZE', rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.' },

    // Industrial - Automotive
    { id: 'A-044', name: 'Ceer Motors Factory', category: 'Industrial', subCategory: 'Automotive', status: 'Planned', lat: 22.4844, long: 39.1534, region: 'Makkah', description: 'First Saudi EV brand manufacturing plant (KAEC)', capacity: 'EV Production', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Supports religious tourism capacity.' },
    { id: 'A-045', name: 'Lucid Motors Factory', category: 'Industrial', subCategory: 'Automotive', status: 'Under Construction', lat: 22.4542, long: 39.1239, region: 'Makkah', description: 'International EV manufacturing hub (KAEC)', capacity: '155k Vehicles/yr', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Supports religious tourism capacity.' },

    // Mining
    { id: 'A-046', name: 'Al-Khnaiguiyah', category: 'Mining', subCategory: 'Zinc/Copper', status: 'Opportunity', lat: 24.25, long: 45.0833, region: 'Riyadh', description: 'Major exploration license recently auctioned', capacity: '25M tonnes ore', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-047', name: 'Umm Ad Damar', category: 'Mining', subCategory: 'Copper/Gold', status: 'Opportunity', lat: 23.65, long: 41.05, region: 'Madinah', description: 'Mining exploration belt; open for investment', capacity: 'Exploration License', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-048', name: 'Jabal Sayid', category: 'Mining', subCategory: 'Copper', status: 'Existing', lat: 23.8505, long: 40.9411, region: 'Madinah', description: 'Underground copper mine; Maaden-Barrick JV', capacity: 'Copper Concentrate', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-049', name: 'Al Jalamid', category: 'Mining', subCategory: 'Phosphate', status: 'Existing', lat: 31.2869, long: 39.9572, region: 'Northern Borders', description: 'Phosphate mine feeding Waad Al Shamal', capacity: 'Phosphate Rock', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.' },
    { id: 'A-050', name: 'Al Baitha', category: 'Mining', subCategory: 'Bauxite', status: 'Existing', lat: 27.4642, long: 43.9167, region: 'Qassim', description: 'Bauxite mine feeding Ras Al Khair aluminum', capacity: 'Bauxite Ore', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-051', name: 'Muhayil Mining License', category: 'Mining', subCategory: 'Gold/Copper', status: 'Opportunity', lat: 18.55, long: 42.0, region: 'Aseer', description: 'Exploration license up for auction', capacity: 'Exploration Belt', priority: 'HIGH', fiscalAction: 'PROTECT (Critical)', rationale: 'LIFELINE: The only non-oil job engine in a high-poverty region.' },
    { id: 'A-052', name: 'Bir Umq Mining License', category: 'Mining', subCategory: 'Copper', status: 'Opportunity', lat: 23.9, long: 40.7, region: 'Madinah', description: 'Exploration license up for auction', capacity: 'Exploration Belt', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-053', name: 'Jabal Idsas', category: 'Mining', subCategory: 'Iron Ore', status: 'Opportunity', lat: 24.3, long: 45.2, region: 'Riyadh', description: 'Iron ore deposit investment opportunity', capacity: 'Iron Ore', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.' },
    { id: 'A-054', name: 'Wadi Sawawin', category: 'Mining', subCategory: 'Iron Ore', status: 'Opportunity', lat: 28.1, long: 35.5, region: 'Tabuk', description: 'Iron ore pellets project opportunity', capacity: 'Iron Ore', priority: 'HIGH', fiscalAction: 'PROTECT (Critical)', rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.' },

    // Energy - Renewable
    { id: 'A-055', name: 'Al-Sadawi Solar PV', category: 'Energy', subCategory: 'Renewable', status: 'Planned', lat: 28.52, long: 47.45, region: 'Eastern Region', description: 'NREP Round 5 Solar Project', capacity: '2000 MW', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'CORE ENGINE: Revenue generator; keep stable.' },
    { id: 'A-056', name: "Al-Masa'a Solar PV", category: 'Energy', subCategory: 'Renewable', status: 'Planned', lat: 27.2, long: 42.4, region: 'Hail', description: 'NREP Round 5 Solar Project', capacity: '1000 MW', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-057', name: 'Al-Henakiyah Solar PV', category: 'Energy', subCategory: 'Renewable', status: 'Planned', lat: 24.86, long: 40.5, region: 'Madinah', description: 'NREP Round 4 Solar Project', capacity: '1100 MW', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-058', name: 'Tabarjal Solar PV', category: 'Energy', subCategory: 'Renewable', status: 'Planned', lat: 30.5, long: 38.2, region: 'Al-Jouf', description: 'NREP Round 4 Solar Project', capacity: '400 MW', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'JOB FIX: New energy jobs for high-unemployment region.' },
    { id: 'A-059', name: 'Taiba 1 & 2', category: 'Energy', subCategory: 'Power Generation', status: 'Planned', lat: 24.2, long: 38.4, region: 'Madinah', description: 'CCGT Power Plants with Carbon Capture readiness', capacity: '3.6 GW', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-060', name: 'Qassim 1 & 2', category: 'Energy', subCategory: 'Power Generation', status: 'Planned', lat: 26.1, long: 44.2, region: 'Qassim', description: 'CCGT Power Plants with Carbon Capture readiness', capacity: '3.6 GW', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },

    // Logistics
    { id: 'A-061', name: 'Riyadh Integrated Logistics Zone', category: 'Logistics', subCategory: 'Special Zone', status: 'Under Construction', lat: 24.93, long: 46.73, region: 'Riyadh', description: 'Special Integrated Logistics Zone at RUH Airport', capacity: 'Tax-Free Zone', investment: 'SAR 1 Billion', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-062', name: 'Jeddah Logistics Park', category: 'Logistics', subCategory: 'Logistics Park', status: 'Planned', lat: 21.46, long: 39.18, region: 'Makkah', description: 'Expansion to increase capacity to 10m TEU.', capacity: 'Warehousing', investment: 'SAR 2.494 Billion', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Supports religious tourism capacity.' },
    { id: 'A-063', name: 'King Abdullah Port Logistics', category: 'Logistics', subCategory: 'Logistics Park', status: 'Existing', lat: 22.52, long: 39.06, region: 'Makkah', description: 'Logistics park integrated with port', capacity: 'Petrochem Logistics', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Supports religious tourism capacity.' },
    { id: 'A-064', name: 'Dammam Logistics Park', category: 'Logistics', subCategory: 'Logistics Park', status: 'Planned', lat: 26.54, long: 50.18, region: 'Eastern Region', description: 'Expansion to increase capacity to 5m TEU.', capacity: 'Container Support', investment: 'SAR 790.7 Million', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },

    // Infrastructure
    { id: 'A-065', name: 'Riyadh Metro Main Station', category: 'Infrastructure', subCategory: 'Transport', status: 'Under Construction', lat: 24.64, long: 46.72, region: 'Riyadh', description: 'KAFD Metro Station; Central node of SAR 200B+ network.', capacity: 'Public Transport', investment: '> SAR 200 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'OPERATIONAL CORE: Essential to fix.' },
    { id: 'A-066', name: 'Jeddah Metro (Planned)', category: 'Infrastructure', subCategory: 'Transport', status: 'Planned', lat: 21.5, long: 39.15, region: 'Makkah', description: 'Future metro network for Jeddah', capacity: 'Public Transport', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'CRITICAL: Solves mobility friction & health access.' },
    { id: 'A-067', name: 'Saudi Landbridge', category: 'Infrastructure', subCategory: 'Transport', status: 'Planned', lat: 23.5, long: 43.5, region: 'Multiple', description: 'Jeddah-Jubail railway link (SAR 34.485B).', capacity: 'Freight/Passenger', investment: 'SAR 34.485 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.' },
    { id: 'A-068', name: 'Riyadh Air Operations Center', category: 'Infrastructure', subCategory: 'Aviation', status: 'Planned', lat: 24.95, long: 46.7, region: 'Riyadh', description: 'HQ for new national airline (at RUH)', capacity: 'Aviation', priority: 'Medium', fiscalAction: 'OPTIMIZE', rationale: 'Growth Asset: Adds value.' },
    { id: 'A-073', name: 'Jeddah-Jizan Railway', category: 'Infrastructure', subCategory: 'Transport', status: 'Planned', lat: 19.5, long: 40.5, region: 'Western', description: 'Coastal rail link development.', capacity: 'Transport', investment: 'SAR 15.20 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.' },
    { id: 'A-074', name: 'Jeddah-Yanbu Railway', category: 'Infrastructure', subCategory: 'Transport', status: 'Planned', lat: 22.5, long: 38.8, region: 'Western', description: 'Industrial rail link connecting Western hubs.', capacity: 'Transport', investment: 'SAR 9.215 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.' },
    { id: 'A-075', name: 'Medinah-Yanbu Railway', category: 'Infrastructure', subCategory: 'Transport', status: 'Planned', lat: 24.2, long: 38.6, region: 'Western', description: 'Link C9 connecting holy city to industrial hub.', capacity: 'Transport', investment: 'SAR 4.648 Billion', priority: 'HIGH', fiscalAction: 'PROTECT', rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.' },
    { id: 'A-076', name: 'Tabuk Airport Expansion', category: 'Infrastructure', subCategory: 'Aviation', status: 'Planned', lat: 28.3653, long: 36.6189, region: 'Tabuk', description: 'Expansion to 3m passengers.', capacity: '3m Pax', investment: 'SAR 867.9 Million', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-077', name: 'Al-Ahsa Airport Expansion', category: 'Infrastructure', subCategory: 'Aviation', status: 'Planned', lat: 25.2853, long: 49.4867, region: 'Eastern Region', description: 'Expansion to 1m passengers.', capacity: '1m Pax', investment: 'SAR 347.2 Million', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-078', name: 'Farasan Airport', category: 'Infrastructure', subCategory: 'Aviation', status: 'Planned', lat: 16.7092, long: 42.1275, region: 'Jazan', description: 'Development to 0.5m passengers.', capacity: '0.5m Pax', investment: 'SAR 264.8 Million', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-079', name: 'Qaisumah Airport Expansion', category: 'Infrastructure', subCategory: 'Aviation', status: 'Planned', lat: 28.3353, long: 46.1253, region: 'Eastern Region', description: 'Expansion to 0.5m passengers.', capacity: '0.5m Pax', investment: 'SAR 208.6 Million', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-080', name: 'Water Sector Projects', category: 'Utilities', subCategory: 'National', status: 'Active', lat: 24.7, long: 46.7, region: 'National', description: 'Approved funding until 2030.', capacity: 'National', investment: 'SAR 179 Billion', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },
    { id: 'A-081', name: 'Logistics Zones Contract', category: 'Logistics', subCategory: 'National', status: 'Active', lat: 24.8, long: 46.6, region: 'National', description: 'Total investment contracts signed.', capacity: 'National', investment: 'SAR 200 Billion', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Standard strategic alignment; optimize for efficiency.' },

    // Investor Tools (Digital Services)
    { id: 'A-069', name: 'CST Coverage Map', category: 'Investor Tool', subCategory: 'Digital Service', status: 'Active', lat: 24.71, long: 46.67, region: 'National', description: 'Source: www.cst.gov.sa (Check 5G/Fiber coverage)', capacity: 'Coverage Check' },
    { id: 'A-070', name: 'NWC Pumping Map', category: 'Investor Tool', subCategory: 'Digital Service', status: 'Active', lat: 24.71, long: 46.67, region: 'National', description: 'Source: e.nwc.com.sa (Check water schedule/network)', capacity: 'Coverage Check' },
    { id: 'A-071', name: 'Balady Excavation Map', category: 'Investor Tool', subCategory: 'Digital Service', status: 'Active', lat: 24.71, long: 46.67, region: 'National', description: 'Source: balady.gov.sa (Check infra permits/digging)', capacity: 'Coverage Check' },
    { id: 'A-072', name: 'SEC Wasalah', category: 'Investor Tool', subCategory: 'Digital Service', status: 'Active', lat: 24.71, long: 46.67, region: 'National', description: 'Source: se.com.sa (Check electrical capacity)', capacity: 'Connection Request', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'National strategic interest.' },

    // Additional Refineries & Strategic Sites from mapped data
    { id: 'A-082', name: 'YASREF Refinery', category: 'Industrial', subCategory: 'Refining', status: 'Existing', lat: 24.0, long: 38.0, region: 'Madinah', description: 'Yanbu Aramco Sinopec Refining Company', capacity: '400k bpd', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'A-083', name: 'SAMREF Refinery', category: 'Industrial', subCategory: 'Refining', status: 'Existing', lat: 23.9, long: 38.1, region: 'Madinah', description: 'Saudi Aramco Mobil Yanbu Refinery', capacity: '400k bpd', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'A-084', name: 'SASREF Refinery', category: 'Industrial', subCategory: 'Refining', status: 'Existing', lat: 27.0, long: 49.6, region: 'Eastern Region', description: 'Saudi Aramco Shell Refinery', capacity: '305k bpd', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'A-085', name: 'Luberef (Jeddah)', category: 'Industrial', subCategory: 'Refining', status: 'Existing', lat: 21.4, long: 39.2, region: 'Makkah', description: 'Saudi Aramco Base Oil Company', capacity: 'Base Oils', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'A-086', name: 'Luberef (Yanbu)', category: 'Industrial', subCategory: 'Refining', status: 'Existing', lat: 24.0, long: 38.0, region: 'Madinah', description: 'Saudi Aramco Base Oil Company', capacity: 'Base Oils', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'A-087', name: 'Sakaka Solar PV', category: 'Energy', subCategory: 'Renewable', status: 'Existing', lat: 29.9, long: 40.2, region: 'Al-Jouf', description: 'First large-scale solar project in KSA', capacity: '300 MW', priority: 'HIGH', fiscalAction: 'PROTECT (Critical)', rationale: 'Job Fix: Solves 6.8% unemployment in a region with high infra surplus.' },
    { id: 'A-088', name: 'Dumat Al Jandal Wind Farm', category: 'Energy', subCategory: 'Renewable', status: 'Existing', lat: 29.8, long: 39.9, region: 'Al-Jouf', description: "Region's largest wind farm", capacity: '400 MW', priority: 'HIGH', fiscalAction: 'PROTECT (Critical)', rationale: 'Job Fix: Solves 6.8% unemployment in a region with high infra surplus.' },
    { id: 'A-089', name: 'Mahd Ad Dahab Mine', category: 'Mining', subCategory: 'Gold', status: 'Existing', lat: 23.5, long: 40.9, region: 'Madinah', description: 'Oldest and most famous gold mine in KSA', capacity: 'Gold Ore', priority: 'HIGH', fiscalAction: 'PROTECT (Critical)', rationale: 'Job Fix: Solves 6.8% unemployment in a region with high infra surplus.' },
    { id: 'A-090', name: 'Mansourah-Massarah Gold Mine', category: 'Mining', subCategory: 'Gold', status: 'Existing', lat: 22.5, long: 41.5, region: 'Makkah', description: "Largest of Ma'aden's gold mines", capacity: 'Gold Ore', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'A-091', name: 'Bulghah & Sukhaybarat Gold Mine', category: 'Mining', subCategory: 'Gold', status: 'Existing', lat: 24.7, long: 41.3, region: 'Madinah', description: 'Major gold mine complex', capacity: 'Gold Ore', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'A-092', name: 'Saudi Geological Survey Map', category: 'Investor Tool', subCategory: 'Digital Service', status: 'Active', lat: 24.7, long: 46.7, region: 'National', description: 'Source: sgs.org.sa (Check geological data/maps)', capacity: 'Data Service', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Investor tool; low cost maintain.' },
    { id: 'A-093', name: 'Ministry of Industry Map', category: 'Investor Tool', subCategory: 'Digital Service', status: 'Active', lat: 24.7, long: 46.8, region: 'National', description: 'Source: mim.gov.sa (Check industrial licenses/zones)', capacity: 'Data Service', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Investor tool; low cost maintain.' },
    { id: 'A-094', name: 'Ministry of Municipalities Map', category: 'Investor Tool', subCategory: 'Digital Service', status: 'Active', lat: 24.71, long: 46.9, region: 'National', description: 'Source: momrah.gov.sa (Check land use/zoning maps)', capacity: 'Data Service', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Investor tool; low cost maintain.' },

    // Strategic Projects (from Strategic_Projects_Assets.csv)
    { id: 'SP-001', name: 'King Salman International Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 24.860, long: 46.696, region: 'Riyadh', description: 'Opening and final matches host', capacity: '92760 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-002', name: 'Prince Mohammed bin Salman Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 24.590, long: 46.528, region: 'Riyadh (Qiddiya)', description: 'Retractable roof; Tuwaiq cliff location', capacity: '47000 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-003', name: 'New Murabba Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 24.800, long: 46.550, region: 'Riyadh', description: 'Integrated with Mukaab', capacity: '46000 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-004', name: 'ROSHN Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 24.450, long: 46.600, region: 'Riyadh', description: 'Southwest Riyadh anchor', capacity: '46000 seats', priority: 'Low', fiscalAction: 'OPTIMIZE', rationale: 'MISALIGNED: Secondary stadium prioritzation.' },
    { id: 'SP-005', name: 'Jeddah Central Development Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 21.530, long: 39.130, region: 'Makkah', description: 'Al-Andalus/Al-Balad area', capacity: '45794 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-006', name: 'Qiddiya Coast Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 21.500, long: 39.100, region: 'Makkah', description: 'Distinct from Riyadh Qiddiya', capacity: '46096 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-007', name: 'King Abdullah Economic City Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 22.410, long: 39.180, region: 'Makkah', description: 'KAEC revitalization', capacity: '45700 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-008', name: 'Aramco Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 26.365, long: 50.181, region: 'Eastern Region', description: 'Built by Aramco', capacity: '47000 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-009', name: 'King Khalid University Stadium', category: 'Sports', subCategory: 'World Cup', status: 'Planned', lat: 18.097, long: 42.720, region: 'Aseer', description: 'Highland Tourism strategy', capacity: '45428 seats', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-010', name: 'SEVEN Tabuk', category: 'Entertainment', subCategory: 'SEVEN', status: 'Planned', lat: 28.380, long: 36.560, region: 'Tabuk', description: 'Designed as glass canopy village', capacity: '40000 m2', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-011', name: 'SEVEN Abha', category: 'Entertainment', subCategory: 'SEVEN', status: 'Planned', lat: 18.090, long: 42.720, region: 'Aseer', description: 'Near Airport', capacity: '64000 m2', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-012', name: 'Yanbu Commercial Port', category: 'Food', subCategory: 'Logistics', status: 'Existing', lat: 24.060, long: 38.050, region: 'Madinah', description: 'Grain entry point for Madinah/Makkah', capacity: 'Logistics', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-013', name: 'King Abdul Aziz Port', category: 'Food', subCategory: 'Logistics', status: 'Existing', lat: 26.430, long: 50.100, region: 'Eastern Region', description: 'Linked by rail to Riyadh', capacity: '10000 MT Daily', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-014', name: 'NADEC Haradh Project', category: 'Agriculture', subCategory: 'Food Security', status: 'Existing', lat: 24.140, long: 49.060, region: 'Eastern Region', description: 'Integrated dairy city', capacity: '375000000 m2', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' },
    { id: 'SP-015', name: 'NADEC Wadi Al-Dawasir', category: 'Agriculture', subCategory: 'Food Security', status: 'Existing', lat: 20.460, long: 44.780, region: 'Riyadh', description: 'Potatoes, wheat, feed', capacity: '1000 km2', priority: 'Medium', fiscalAction: 'MAINTAIN', rationale: 'Strategic infrastructure; maintain.' }
];

// Category icons and colors for map markers
export const CATEGORY_CONFIG: Record<AssetCategory, { icon: string; color: string }> = {
    'Industrial City': { icon: 'factory', color: '#3b82f6' },
    'Special Zone': { icon: 'building-2', color: '#6366f1' },
    'Utilities': { icon: 'droplet', color: '#06b6d4' },
    'Giga Project': { icon: 'crown', color: '#eab308' },
    'Real Estate': { icon: 'home', color: '#f97316' },
    'Industrial': { icon: 'cog', color: '#64748b' },
    'Mining': { icon: 'pickaxe', color: '#d97706' },
    'Energy': { icon: 'sun', color: '#22c55e' },
    'Logistics': { icon: 'truck', color: '#a855f7' },
    'Infrastructure': { icon: 'train', color: '#78716c' },
    'Investor Tool': { icon: 'globe', color: '#0ea5e9' },
    'Sports': { icon: 'trophy', color: '#eab308' },
    'Entertainment': { icon: 'star', color: '#f97316' },
    'Agriculture': { icon: 'wheat', color: '#22c55e' },
    'Food': { icon: 'shopping-cart', color: '#3b82f6' }
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
    'Existing': '#10b981',
    'Active': '#10b981',
    'Under Construction': '#f59e0b',
    'Tendering': '#f59e0b',
    'Awarded': '#f59e0b',
    'Planned': '#6366f1',
    'Opportunity': '#8b5cf6'
};

// Saudi Arabia GeoJSON (from original ksaData)
export const saudiGeoJson = {
    "type": "FeatureCollection", "features": [
        { "type": "Feature", "id": "SAU", "properties": { "name": "Saudi Arabia" }, "geometry": { "type": "Polygon", "coordinates": [[[42.779332, 16.347891], [42.649573, 16.774635], [42.347989, 17.075806], [42.270888, 17.474722], [41.754382, 17.833046], [41.221391, 18.6716], [40.939341, 19.486485], [40.247652, 20.174635], [39.801685, 20.338862], [39.139399, 21.291905], [39.023696, 21.986875], [39.066329, 22.579656], [38.492772, 23.688451], [38.02386, 24.078686], [37.483635, 24.285495], [37.154818, 24.858483], [37.209491, 25.084542], [36.931627, 25.602959], [36.639604, 25.826228], [36.249137, 26.570136], [35.640182, 27.37652], [35.130187, 28.063352], [34.632336, 28.058546], [34.787779, 28.607427], [34.83222, 28.957483], [34.956037, 29.356555], [36.068941, 29.197495], [36.501214, 29.505254], [36.740528, 29.865283], [37.503582, 30.003776], [37.66812, 30.338665], [37.998849, 30.5085], [37.002166, 31.508413], [39.004886, 32.010217], [39.195468, 32.161009], [40.399994, 31.889992], [41.889981, 31.190009], [44.709499, 29.178891], [46.568713, 29.099025], [47.459822, 29.002519], [47.708851, 28.526063], [48.416094, 28.552004], [48.807595, 27.689628], [49.299554, 27.461218], [49.470914, 27.109999], [50.152422, 26.689663], [50.212935, 26.277027], [50.113303, 25.943972], [50.239859, 25.60805], [50.527387, 25.327808], [50.660557, 24.999896], [50.810108, 24.754743], [51.112415, 24.556331], [51.389608, 24.627386], [51.579519, 24.245497], [51.617708, 24.014219], [52.000733, 23.001154], [55.006803, 22.496948], [55.208341, 22.70833], [55.666659, 22.000001], [54.999982, 19.999994], [52.00001, 19.000003], [49.116672, 18.616668], [48.183344, 18.166669], [47.466695, 17.116682], [47.000005, 16.949999], [46.749994, 17.283338], [46.366659, 17.233315], [45.399999, 17.333335], [45.216651, 17.433329], [44.062613, 17.410359], [43.791519, 17.319977], [43.380794, 17.579987], [43.115798, 17.08844], [43.218375, 16.66689], [42.779332, 16.347891]]] } }
    ]
};

// 13 Administrative Regions (for label display)
export const ksaRegions = [
    { id: 'REG-01', name: 'Riyadh', lat: 24.7434, long: 46.3184 },
    { id: 'REG-02', name: 'Makkah', lat: 21.6944, long: 39.3523 },
    { id: 'REG-03', name: 'Madinah', lat: 24.3593, long: 39.486 },
    { id: 'REG-04', name: 'Eastern Region', lat: 26.9314, long: 49.5467 },
    { id: 'REG-05', name: 'Aseer', lat: 18.55, long: 42.0 },
    { id: 'REG-06', name: 'Tabuk', lat: 28.3835, long: 36.5662 },
    { id: 'REG-07', name: 'Qassim', lat: 26.1517, long: 44.0268 },
    { id: 'REG-08', name: 'Hail', lat: 27.5114, long: 41.7208 },
    { id: 'REG-09', name: 'Jazan', lat: 17.2586, long: 42.4764 },
    { id: 'REG-10', name: 'Najran', lat: 17.4917, long: 44.1322 },
    { id: 'REG-11', name: 'Al-Baha', lat: 20.0129, long: 41.4677 },
    { id: 'REG-12', name: 'Northern Borders', lat: 30.9753, long: 41.0381 },
    { id: 'REG-13', name: 'Al-Jouf', lat: 29.9697, long: 40.1996 }
];

// Strategic Network Connections (Source -> Target)
// Represents supply chains: Mining -> Industry -> Port
export interface NetworkConnection {
    source: string; // Asset ID
    target: string; // Asset ID
    type: 'Supply Chain' | 'Transport' | 'Power' | 'Water';
}

export const strategicConnections: NetworkConnection[] = [
    // Mining to Processing (Phosphate)
    { source: 'A-049', target: 'A-005', type: 'Supply Chain' }, // Al Jalamid -> Waad Al Shamal

    // Mining to Export (Bauxite/Aluminum)
    { source: 'A-050', target: 'A-003', type: 'Supply Chain' }, // Al Baitha -> Ras Al Khair

    // Energy to Industry
    { source: 'A-013', target: 'A-003', type: 'Power' }, // Ras Al Khair Power -> Ras Al Khair City
    { source: 'A-015', target: 'A-001', type: 'Power' }, // Jubail Power -> Jubail City

    // Water to Cities
    { source: 'A-014', target: 'REG-02', type: 'Water' }, // Shoaiba -> Makkah Region
    { source: 'A-024', target: 'A-041', type: 'Water' }, // Riyadh-Qassim Pipeline -> Roshn (Mock)

    // Logistics/Transport
    { source: 'A-001', target: 'SP-013', type: 'Transport' }, // Jubail -> King Abdul Aziz Port
    { source: 'A-002', target: 'SP-012', type: 'Transport' }, // Yanbu -> Yanbu Port

    // Cross-Regional
    { source: 'A-067', target: 'A-001', type: 'Transport' }, // Landbridge -> Jubail
    { source: 'A-067', target: 'A-009', type: 'Transport' }  // Landbridge -> Jeddah
];
