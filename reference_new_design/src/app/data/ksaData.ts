/**
 * WATER SECTOR DATA FOR KSA COMMAND CENTER
 */

export const ksaData = {
    // Water Regions (13 Administrative Regions - L1)
    regions: [
        { id: 'REG-01', name: 'Riyadh', type: 'Region', lat: 25.3155, long: 45.4091, focus: 'Central Governance' },
        { id: 'REG-02', name: 'Makkah', type: 'Region', lat: 22.2870, long: 40.7769, focus: 'Holy Sites Water Security' },
        { id: 'REG-03', name: 'Madinah', type: 'Region', lat: 25.0502, long: 40.6503, focus: 'Pilgrim Support' },
        { id: 'REG-04', name: 'Eastern Province', type: 'Region', lat: 26.4871, long: 49.0289, focus: 'Industrial Hub' },
        { id: 'REG-05', name: 'Asir', type: 'Region', lat: 20.1427, long: 42.5741, focus: 'Rainfall Harvesting' },
        { id: 'REG-06', name: 'Tabuk', type: 'Region', lat: 27.6588, long: 37.7646, focus: 'NEOM Integration' },
        { id: 'REG-07', name: 'Qassim', type: 'Region', lat: 26.3200, long: 43.9700, focus: 'Agriculture Core' },
        { id: 'REG-08', name: 'Ha\'il', type: 'Region', lat: 28.4104, long: 42.0678, focus: 'Groundwater Reserves' },
        { id: 'REG-09', name: 'Jazan', type: 'Region', lat: 19.7448, long: 44.7763, focus: 'Coastal Desalination' },
        { id: 'REG-10', name: 'Najran', type: 'Region', lat: 19.5016, long: 46.3710, focus: 'Border Security' },
        { id: 'REG-11', name: 'Al Bahah', type: 'Region', lat: 21.2259, long: 41.7388, focus: 'Dams & Reservoirs' },
        { id: 'REG-12', name: 'Northern Borders', type: 'Region', lat: 30.0020, long: 41.4603, focus: 'Remote Distribution' },
        { id: 'REG-13', name: 'Al Jawf', type: 'Region', lat: 29.8000, long: 39.5000, focus: 'Strategic Reserves' }
    ],

    // Strategic Objectives (Water Sector)
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
            description: 'Water sector contribution to national GDP'
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
            description: 'Infrastructure reliability and disaster recovery'
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
            coords: [47.5354, 26.9735],
            sectors: {
                agriculture: 30000,
                industry: 180000,
                urban: 40000
            }
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
            coords: [49.1807, 25.8461],
            sectors: {
                agriculture: 20000,
                industry: 70000,
                urban: 30000
            }
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
            coords: [39.9416, 23.5470],
            sectors: {
                agriculture: 25000,
                industry: 60000,
                urban: 95000
            }
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
            coords: [39.1062, 24.5860],
            sectors: {
                agriculture: 15000,
                industry: 105000,
                urban: 30000
            }
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
            coords: [46.2698, 24.5639],
            sectors: {
                agriculture: 80000,
                industry: 120000,
                urban: 100000
            }
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
            coords: [43.0550, 19.4132],
            sectors: {
                agriculture: 40000,
                industry: 20000,
                urban: 30000
            }
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
            coords: [37.4356, 26.9293],
            sectors: {
                agriculture: 25000,
                industry: 30000,
                urban: 25000
            }
        }
    ],

    // Districts - Major cities
    districts: [
        { name: 'Jeddah', type: 'City', lat: 21.5, long: 39.2 },
        { name: 'Dammam', type: 'City', lat: 26.4, long: 50.1 },
        { name: 'Jubail', type: 'City', lat: 27.0, long: 49.5 },
        { name: 'Yanbu', type: 'City', lat: 24.1, long: 38.0 }
    ],

    // Pipeline Flows - Animated arrows from coast to Riyadh
    flows: [
        {
            name: 'Jubail to Riyadh Pipeline',
            source: 'Jubail Desalination Complex',
            target: 'Riyadh Central Storage',
            load: 'High',
            status: 'Green',
            sectors: ['Industry', 'Urban']
        },
        {
            name: 'Jeddah to Riyadh Pipeline',
            source: 'Jeddah Coastal Desalination',
            target: 'Riyadh Central Storage',
            load: 'High',
            status: 'Green',
            sectors: ['Urban', 'Agriculture']
        },
        {
            name: 'Yanbu to Riyadh Pipeline',
            source: 'Yanbu Industrial Water Facility',
            target: 'Riyadh Central Storage',
            load: 'Medium',
            status: 'Amber',
            sectors: ['Industry']
        },
        {
            name: 'Dammam to Jubail Connector',
            source: 'Dammam Smart Desalination',
            target: 'Jubail Desalination Complex',
            load: 'Medium',
            status: 'Green',
            sectors: ['Industry']
        }
    ]
};

// Saudi Arabia GeoJSON
export const saudiGeoJson = {"type":"FeatureCollection","features":[
{"type":"Feature","id":"SAU","properties":{"name":"Saudi Arabia"},"geometry":{"type":"Polygon","coordinates":[[[42.779332,16.347891],[42.649573,16.774635],[42.347989,17.075806],[42.270888,17.474722],[41.754382,17.833046],[41.221391,18.6716],[40.939341,19.486485],[40.247652,20.174635],[39.801685,20.338862],[39.139399,21.291905],[39.023696,21.986875],[39.066329,22.579656],[38.492772,23.688451],[38.02386,24.078686],[37.483635,24.285495],[37.154818,24.858483],[37.209491,25.084542],[36.931627,25.602959],[36.639604,25.826228],[36.249137,26.570136],[35.640182,27.37652],[35.130187,28.063352],[34.632336,28.058546],[34.787779,28.607427],[34.83222,28.957483],[34.956037,29.356555],[36.068941,29.197495],[36.501214,29.505254],[36.740528,29.865283],[37.503582,30.003776],[37.66812,30.338665],[37.998849,30.5085],[37.002166,31.508413],[39.004886,32.010217],[39.195468,32.161009],[40.399994,31.889992],[41.889981,31.190009],[44.709499,29.178891],[46.568713,29.099025],[47.459822,29.002519],[47.708851,28.526063],[48.416094,28.552004],[48.807595,27.689628],[49.299554,27.461218],[49.470914,27.109999],[50.152422,26.689663],[50.212935,26.277027],[50.113303,25.943972],[50.239859,25.60805],[50.527387,25.327808],[50.660557,24.999896],[50.810108,24.754743],[51.112415,24.556331],[51.389608,24.627386],[51.579519,24.245497],[51.617708,24.014219],[52.000733,23.001154],[55.006803,22.496948],[55.208341,22.70833],[55.666659,22.000001],[54.999982,19.999994],[52.00001,19.000003],[49.116672,18.616668],[48.183344,18.166669],[47.466695,17.116682],[47.000005,16.949999],[46.749994,17.283338],[46.366659,17.233315],[45.399999,17.333335],[45.216651,17.433329],[44.062613,17.410359],[43.791519,17.319977],[43.380794,17.579987],[43.115798,17.08844],[43.218375,16.66689],[42.779332,16.347891]]]}}
]};