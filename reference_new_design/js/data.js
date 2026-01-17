/**
 * WATER SECTOR DATA FOR KSA COMMAND CENTER
 * Uses existing ECharts map structure
 */

const ksaData = {
    // Water Regions (13 Administrative Regions - L1)
    regions: [
        { id: 'REG-01', name: 'Riyadh', type: 'Region', lat: 24.7136, long: 46.6753, focus: 'Central Governance' },
        { id: 'REG-02', name: 'Makkah', type: 'Region', lat: 21.3891, long: 39.8579, focus: 'Holy Sites Water Security' },
        { id: 'REG-03', name: 'Madinah', type: 'Region', lat: 24.5247, long: 39.5692, focus: 'Pilgrim Support' },
        { id: 'REG-04', name: 'Eastern Province', type: 'Region', lat: 26.4207, long: 50.0888, focus: 'Industrial Hub' },
        { id: 'REG-05', name: 'Asir', type: 'Region', lat: 19.0, long: 42.5, focus: 'Rainfall Harvesting' },
        { id: 'REG-06', name: 'Tabuk', type: 'Region', lat: 28.38, long: 36.57, focus: 'NEOM Integration' },
        { id: 'REG-07', name: 'Qassim', type: 'Region', lat: 26.32, long: 43.97, focus: 'Agriculture Core' },
        { id: 'REG-08', name: 'Ha\'il', type: 'Region', lat: 27.51, long: 41.72, focus: 'Groundwater Reserves' },
        { id: 'REG-09', name: 'Jazan', type: 'Region', lat: 16.88, long: 42.55, focus: 'Coastal Desalination' },
        { id: 'REG-10', name: 'Najran', type: 'Region', lat: 17.49, long: 44.12, focus: 'Border Security' },
        { id: 'REG-11', name: 'Al Bahah', type: 'Region', lat: 20.01, long: 41.46, focus: 'Dams & Reservoirs' },
        { id: 'REG-12', name: 'Northern Borders', type: 'Region', lat: 30.0, long: 41.0, focus: 'Remote Distribution' },
        { id: 'REG-13', name: 'Al Jawf', type: 'Region', lat: 29.8, long: 39.5, focus: 'Strategic Reserves' }
    ],

    // Districts (L2) - Major Cities/Hubs
    districts: [
        { id: 'DST-01', name: 'Jubail', regionId: 'REG-04', lat: 27.0, long: 49.5, type: 'Industrial City' },
        { id: 'DST-02', name: 'Dammam', regionId: 'REG-04', lat: 26.4, long: 50.1, type: 'Urban Center' },
        { id: 'DST-03', name: 'Jeddah', regionId: 'REG-02', lat: 21.5, long: 39.2, type: 'Urban Center' },
        { id: 'DST-04', name: 'Yanbu', regionId: 'REG-03', lat: 24.1, long: 38.0, type: 'Industrial City' },
        { id: 'DST-05', name: 'Riyadh City', regionId: 'REG-01', lat: 24.6, long: 46.8, type: 'Capital' }
    ],

    
    // Water Pipeline Flows
    flows: [
        { 
            source: 'Jubail', 
            target: 'Riyadh', 
            name: 'Main Pipeline - 400k m³/day', 
            type: 'Pipeline', 
            status: 'Green', 
            load: 'High',
            sectors: { agriculture: 60000, industry: 240000, urban: 100000 }
        },
        { 
            source: 'Jeddah', 
            target: 'Riyadh', 
            name: 'Western Pipeline - 300k m³/day', 
            type: 'Pipeline', 
            status: 'Green', 
            load: 'High',
            sectors: { agriculture: 45000, industry: 105000, urban: 150000 }
        },
        { 
            source: 'Yanbu', 
            target: 'Riyadh', 
            name: 'Industrial Pipeline - 200k m³/day', 
            type: 'Pipeline', 
            status: 'Amber', 
            load: 'Medium',
            sectors: { agriculture: 20000, industry: 140000, urban: 40000 }
        },
        { 
            source: 'Dammam', 
            target: 'Jubail', 
            name: 'Connector - 150k m³/day', 
            type: 'Pipeline', 
            status: 'Green', 
            load: 'Medium',
            sectors: { agriculture: 7500, industry: 60000, urban: 82500 }
        }
    ],

    // Strategic Objectives (Water Sector)
    // L1 - Strategic Goals (Lagging Outcomes)
    objectivesL1: [
        { 
            id: '1.0', 
            name: 'Water Security GDP', 
            status: 'green', 
            values: {
                base: 76,
                q_minus_1: 80,
                actual: 92,
                q_plus_1: 95,
                end: 100
            },
            delta: 16,
            verified: true, 
            type: 'Strategic Goal',
            description: 'Water sector contribution to national GDP',
            children: ['1.1', '1.2']
        },
        { 
            id: '2.0', 
            name: 'Infrastructure Resilience', 
            status: 'amber', 
            values: {
                base: 70,
                q_minus_1: 72,
                actual: 75,
                q_plus_1: 78,
                end: 85
            },
            delta: 5,
            verified: true, 
            type: 'Strategic Goal',
            description: 'Infrastructure reliability and disaster recovery',
            children: ['2.1', '2.2']
        }
    ],

    // L2 - Strategic Targets (Leading Outcomes)
    objectivesL2: [
        { 
            id: '1.1', 
            name: 'FDI in Water', 
            parent: '1.0',
            status: 'green', 
            values: {
                base: 80,
                q_minus_1: 85,
                actual: 88,
                q_plus_1: 90,
                end: 95
            },
            delta: 8,
            verified: true, 
            type: 'Strategic Target',
            description: 'Foreign Direct Investment attracted',
            value: '2 plants Q4 2025'
        },
        { 
            id: '1.2', 
            name: 'Jobs Created', 
            parent: '1.0',
            status: 'green', 
            values: {
                base: 90,
                q_minus_1: 92,
                actual: 95,
                q_plus_1: 97,
                end: 100
            },
            delta: 5,
            verified: true, 
            type: 'Strategic Target',
            description: 'Employment growth in sector',
            value: '1,250 new jobs'
        },
        { 
            id: '2.1', 
            name: 'Desalination Capacity', 
            parent: '2.0',
            status: 'amber', 
            values: {
                base: 65,
                q_minus_1: 68,
                actual: 72,
                q_plus_1: 76,
                end: 85
            },
            delta: 7,
            verified: true, 
            type: 'Strategic Target',
            description: 'New capacity coming online',
            value: '+280k m³/day planned'
        },
        { 
            id: '2.2', 
            name: 'Pipeline Network', 
            parent: '2.0',
            status: 'amber', 
            values: {
                base: 60,
                q_minus_1: 64,
                actual: 68,
                q_plus_1: 72,
                end: 80
            },
            delta: 8,
            verified: true, 
            type: 'Strategic Target',
            description: 'Infrastructure upgrades',
            value: '2 new pipelines'
        }
    ],

    // Transformation Health Insights (Correlation KPIs for 2nd Radar)
    transformationInsights: [
        {
            id: 'T-001',
            name: 'Projects & Operations Integration',
            type: 'bar',
            currentQ: 100,
            projectVelocity: 88,
            opsEfficiency: 93,
            description: 'Current Q operations aligned with project delivery'
        },
        {
            id: 'T-002',
            name: 'Investment Portfolio Health',
            type: 'scatter',
            data: [
                { risk: 0, alignment: 2 },
                { risk: 2, alignment: 5 },
                { risk: 2, alignment: 3 },
                { risk: 4, alignment: 5 },
                { risk: 4, alignment: 3 },
                { risk: 5, alignment: 5 }
            ],
            description: 'Risk vs strategic alignment distribution'
        },
        {
            id: 'T-003',
            name: 'Partnerships',
            type: 'radial',
            actual: 74,
            target: 72,
            description: 'Public-private partnership effectiveness'
        },
        {
            id: 'T-004',
            name: 'Infrastructure Coverage',
            type: 'comparison',
            water: { coverage: 92, quality: 84 },
            transport: { coverage: 78, quality: 71 },
            description: 'Multi-sector coverage and quality'
        },
        {
            id: 'T-005',
            name: 'Economic Impact Correlation',
            type: 'dual-bar',
            quarters: ['Last Q', 'Current Q', 'Next Q'],
            primary: [100, 100, 100],
            secondary: [14, 16, 16],
            description: 'Projected vs actual economic contribution'
        },
        {
            id: 'T-006',
            name: 'Economic Impact',
            type: 'category-bar',
            categories: ['FDI', 'Trade', 'Jobs'],
            values: [4, 2, 22],
            description: 'Economic impact by category'
        },
        {
            id: 'T-007',
            name: 'Community Engagement',
            type: 'radial',
            actual: 52,
            target: 57,
            description: 'Stakeholder satisfaction and participation'
        }
    ],

    // Water Infrastructure Plants (for map markers)
    plants: [
        {
            id: 'P-001',
            name: 'Jubail Desalination Complex',
            region: 'R-01',
            type: 'Desalination',
            capacity: 250000,
            revenue: '1.2B SAR',
            jobs: '4500',
            fundingSource: 'government',
            status: 'operational',
            quarterLaunched: 'Q2 2024',
            coords: [49.5, 27.0],
            sectors: { agriculture: 37500, industry: 150000, urban: 62500 },
            assets: [
                { type: 'urban', coords: [49.6, 27.1] },
                { type: 'industry', coords: [49.4, 26.9] }
            ]
        },
        {
            id: 'P-002',
            name: 'Dammam Smart Desalination',
            region: 'R-02',
            type: 'Desalination',
            capacity: 120000,
            revenue: '800M SAR',
            jobs: '3200',
            fundingSource: 'FDI', 
            status: 'planned',
            quarterLaunched: 'Q4 2025',
            coords: [50.1, 26.5],
            sectors: { agriculture: 6000, industry: 48000, urban: 66000 },
            assets: [
                { type: 'urban', coords: [50.2, 26.6] },
                { type: 'urban', coords: [50.0, 26.4] }
            ]
        },
        {
            id: 'P-003',
            name: 'Jeddah Coastal Desalination',
            region: 'R-03',
            type: 'Desalination',
            capacity: 180000,
            revenue: '950M SAR',
            jobs: '3800',
            fundingSource: 'government',
            status: 'operational',
            quarterLaunched: 'Q1 2023',
            coords: [39.2, 21.5],
            sectors: { agriculture: 9000, industry: 45000, urban: 126000 },
            assets: [
                { type: 'urban', coords: [39.3, 21.6] },
                { type: 'rural', coords: [39.1, 21.4] }
            ]
        },
        {
            id: 'P-004',
            name: 'Yanbu Industrial Water Facility',
            region: 'R-04',
            type: 'Desalination',
            capacity: 150000,
            revenue: '1.1B SAR',
            jobs: '5000',
            fundingSource: 'FDI', 
            status: 'planned',
            quarterLaunched: 'Q4 2025',
            coords: [38.0, 24.1],
            sectors: { agriculture: 15000, industry: 105000, urban: 30000 },
            assets: [
                { type: 'industry', coords: [38.1, 24.2] },
                { type: 'industry', coords: [37.9, 24.0] }
            ]
        },
        {
            id: 'P-005',
            name: 'Riyadh Central Storage',
            region: 'R-05',
            type: 'Storage',
            capacity: 300000,
            revenue: 'N/A (Gov)',
            jobs: '2000',
            fundingSource: 'government',
            status: 'at-risk',
            quarterLaunched: 'Q3 2022',
            coords: [46.7, 24.7],
            sectors: { agriculture: 60000, industry: 90000, urban: 150000 },
            assets: [
                { type: 'urban', coords: [46.8, 24.8] },
                { type: 'rural', coords: [46.6, 24.6] }
            ]
        },
        {
            id: 'P-006',
            name: 'Jazan South Plant',
            region: 'R-09',
            type: 'Desalination',
            capacity: 90000,
            revenue: '400M SAR',
            jobs: '1500',
            fundingSource: 'government',
            status: 'operational',
            quarterLaunched: 'Q1 2024',
            coords: [42.55, 16.88],
            sectors: { agriculture: 20000, industry: 10000, urban: 60000 },
            assets: [
                { type: 'agriculture', coords: [42.6, 16.9] }
            ]
        },
        {
            id: 'P-007',
            name: 'Tabuk North Station',
            region: 'R-06',
            type: 'Distribution',
            capacity: 80000,
            revenue: '350M SAR',
            jobs: '1200',
            fundingSource: 'government',
            status: 'operational',
            quarterLaunched: 'Q2 2023',
            coords: [36.57, 28.38],
            sectors: { agriculture: 30000, industry: 5000, urban: 45000 },
            assets: [
                { type: 'rural', coords: [36.6, 28.4] }
            ]
        }
    ],

    // Capacity Summary
    getTotalCapacity() {
        return {
            agriculture: 127500,
            industry: 438000,
            urban: 334500,
            total: 900000,
            fdiPlants: 2,
            fdiCapacity: 270000
        };
    }
};

// Precise Coordinates Helper
function getRegionCoords(regionId) {
    const region = ksaData.regions.find(r => r.id === regionId);
    return region ? [region.long, region.lat] : [45.0, 24.0];
}

// Export to window
if (typeof window !== 'undefined') {
    window.ksaData = ksaData;
}
