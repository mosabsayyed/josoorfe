/**
 * WATER SECTOR DATA STRUCTURE
 * Integrates CSV data with Water sector extensions
 * - Geographic locations (approximate)
 * - FDI plants (Q4 2025)
 * - Water capacity by sector (agriculture/industry/urban)
 * - Sector consumption splits
 */

const WaterData = {
    
    // Geographic Regions for Water Sector
    regions: [
        {
            id: 'R-01',
            name: 'Jubail Industrial City',
            type: 'East Coast - Processing Hub',
            lat: 27.0,
            long: 49.5,
            description: 'Major desalination and petrochemical hub',
            infrastructure: 'existing'
        },
        {
            id: 'R-02',
            name: 'Dammam',
            type: 'East Coast - Distribution',
            lat: 26.4,
            long: 50.1,
            description: 'Eastern province distribution center',
            infrastructure: 'existing'
        },
        {
            id: 'R-03',
            name: 'Jeddah',
            type: 'West Coast - Processing Hub',
            lat: 21.5,
            long: 39.2,
            description: 'Red Sea desalination hub',
            infrastructure: 'existing'
        },
        {
            id: 'R-04',
            name: 'Yanbu',
            type: 'West Coast - Industrial',
            lat: 24.1,
            long: 38.0,
            description: 'Industrial desalination facility',
            infrastructure: 'existing'
        },
        {
            id: 'R-05',
            name: 'Riyadh',
            type: 'Central - Consumption Hub',
            lat: 24.7,
            long: 46.7,
            description: 'Central distribution and consumption',
            infrastructure: 'existing'
        },
        {
            id: 'R-06',
            name: 'Al-Khobar',
            type: 'East Coast - Urban',
            lat: 26.3,
            long: 50.2,
            description: 'Urban water distribution',
            infrastructure: 'planned'
        },
        {
            id: 'R-07',
            name: 'Tabuk',
            type: 'North - Agriculture',
            lat: 28.4,
            long: 36.6,
            description: 'Agricultural water supply',
            infrastructure: 'planned'
        }
    ],

    // Water Infrastructure Plants
    plants: [
        // EXISTING PLANTS
        {
            id: 'P-001',
            name: 'Jubail Desalination Plant',
            region: 'R-01',
            type: 'Desalination',
            status: 'operational',
            infrastructure: 'existing',
            fundingSource: 'government',
            capacity_m3_day: 250000,
            quarterLaunched: 'Q2 2024',
            sectorSplit: {
                agriculture: 0.15,      // 15%
                industry: 0.60,         // 60%
                urban: 0.25             // 25%
            }
        },
        {
            id: 'P-002',
            name: 'Jeddah Desalination Complex',
            region: 'R-03',
            type: 'Desalination',
            status: 'operational',
            infrastructure: 'existing',
            fundingSource: 'government',
            capacity_m3_day: 180000,
            quarterLaunched: 'Q1 2023',
            sectorSplit: {
                agriculture: 0.05,
                industry: 0.25,
                urban: 0.70
            }
        },
        {
            id: 'P-003',
            name: 'Yanbu Industrial Water Facility',
            region: 'R-04',
            type: 'Desalination',
            status: 'operational',
            infrastructure: 'existing',
            fundingSource: 'FDI',
            capacity_m3_day: 150000,
            quarterLaunched: 'Q4 2025',          // ← FDI, Last Quarter!
            sectorSplit: {
                agriculture: 0.10,
                industry: 0.70,
                urban: 0.20
            }
        },
        {
            id: 'P-004',
            name: 'Riyadh Central Storage',
            region: 'R-05',
            type: 'Storage',
            status: 'operational',
            infrastructure: 'existing',
            fundingSource: 'government',
            capacity_m3_day: 300000,
            quarterLaunched: 'Q3 2022',
            sectorSplit: {
                agriculture: 0.20,
                industry: 0.30,
                urban: 0.50
            }
        },

        // FDI PLANTS (LAST QUARTER - Q4 2025)
        {
            id: 'P-005',
            name: 'Dammam Smart Desalination Plant',
            region: 'R-02',
            type: 'Desalination',
            status: 'operational',
            infrastructure: 'existing',
            fundingSource: 'FDI',                // ← FDI!
            capacity_m3_day: 120000,
            quarterLaunched: 'Q4 2025',          // ← Last Quarter!
            sectorSplit: {
                agriculture: 0.05,
                industry: 0.40,
                urban: 0.55
            }
        },

        // PLANNED PLANTS (FUTURE STATE)
        {
            id: 'P-006',
            name: 'Al-Khobar Coastal Desalination',
            region: 'R-06',
            type: 'Desalination',
            status: 'planned',
            infrastructure: 'planned',
            fundingSource: 'FDI',
            capacity_m3_day: 200000,
            quarterLaunched: 'Q2 2026',
            sectorSplit: {
                agriculture: 0.10,
                industry: 0.30,
                urban: 0.60
            }
        },
        {
            id: 'P-007',
            name: 'Tabuk Agricultural Well System',
            region: 'R-07',
            type: 'Wells',
            status: 'planned',
            infrastructure: 'planned',
            fundingSource: 'government',
            capacity_m3_day: 80000,
            quarterLaunched: 'Q3 2026',
            sectorSplit: {
                agriculture: 0.80,
                industry: 0.05,
                urban: 0.15
            }
        }
    ],

    // Pipeline Infrastructure
    pipelines: [
        {
            id: 'PIPE-001',
            name: 'Jubail to Riyadh Main Pipeline',
            from: 'R-01',
            to: 'R-05',
            status: 'operational',
            infrastructure: 'existing',
            capacity_m3_day: 400000,
            length_km: 380
        },
        {
            id: 'PIPE-002',
            name: 'Jeddah to Riyadh Western Pipeline',
            from: 'R-03',
            to: 'R-05',
            status: 'operational',
            infrastructure: 'existing',
            capacity_m3_day: 300000,
            length_km: 950
        },
        {
            id: 'PIPE-003',
            name: 'Yanbu to Riyadh Industrial Pipeline',
            from: 'R-04',
            to: 'R-05',
            status: 'operational',
            infrastructure: 'existing',
            capacity_m3_day: 200000,
            length_km: 900
        },
        {
            id: 'PIPE-004',
            name: 'Dammam to Jubail Connector',
            from: 'R-02',
            to: 'R-01',
            status: 'operational',
            infrastructure: 'existing',
            capacity_m3_day: 150000,
            length_km: 80
        },
        {
            id: 'PIPE-005',
            name: 'Al-Khobar Extension Pipeline',
            from: 'R-06',
            to: 'R-02',
            status: 'planned',
            infrastructure: 'planned',
            capacity_m3_day: 180000,
            length_km: 45
        },
        {
            id: 'PIPE-006',
            name: 'Tabuk to Riyadh Northern Pipeline',
            from: 'R-07',
            to: 'R-05',
            status: 'planned',
            infrastructure: 'planned',
            capacity_m3_day: 100000,
            length_km: 1100
        }
    ],

    // Helper functions
    getFDIPlants() {
        return this.plants.filter(p => 
            p.fundingSource === 'FDI' && p.quarterLaunched === 'Q4 2025'
        );
    },

    getExistingInfrastructure() {
        return {
            plants: this.plants.filter(p => p.infrastructure === 'existing'),
            pipelines: this.pipelines.filter(p => p.infrastructure === 'existing')
        };
    },

    getFutureInfrastructure() {
        return {
            plants: this.plants.filter(p => p.infrastructure === 'planned'),
            pipelines: this.pipelines.filter(p => p.infrastructure === 'planned')
        };
    },

    getCapacityByRegion(regionId) {
        const regionPlants = this.plants.filter(p => p.region === regionId);
        const totalCapacity = regionPlants.reduce((sum, p) => sum + p.capacity_m3_day, 0);
        
        // Aggregate sector splits
        let agriculture = 0, industry = 0, urban = 0;
        regionPlants.forEach(p => {
            agriculture += p.capacity_m3_day * p.sectorSplit.agriculture;
            industry += p.capacity_m3_day * p.sectorSplit.industry;
            urban += p.capacity_m3_day * p.sectorSplit.urban;
        });

        return {
            total: totalCapacity,
            agriculture: Math.round(agriculture),
            industry: Math.round(industry),
            urban: Math.round(urban)
        };
    },

    getTotalCapacityBySector() {
        let agriculture = 0, industry = 0, urban = 0;
        
        this.plants.forEach(p => {
            if (p.infrastructure === 'existing') {
                agriculture += p.capacity_m3_day * p.sectorSplit.agriculture;
                industry += p.capacity_m3_day * p.sectorSplit.industry;
                urban += p.capacity_m3_day * p.sectorSplit.urban;
            }
        });

        return {
            agriculture: Math.round(agriculture),
            industry: Math.round(industry),
            urban: Math.round(urban),
            total: Math.round(agriculture + industry + urban)
        };
    }
};

// Make available globally
window.WaterData = WaterData;
