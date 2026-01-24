// KSA Sector Desk - Neo4j Import Script
// Generated: 2025-01-22
// Total statements: 186


CREATE (asset1:SectorGovEntity {
  id: 'A-001',
  name: 'Jubail Industrial City',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Petrochemicals',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 27.0112,
  longitude: 49.6105,
  
  status: 'Existing',
  capacity: '>1000 sq km',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'MAINTAIN',
  rationale: 'CORE ENGINE: Revenue generator; keep stable.',
  description: 'World\'s largest industrial city; SABIC & Aramco hub'
})

CREATE (asset2:SectorGovEntity {
  id: 'A-002',
  name: 'Yanbu Industrial City',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Refining & Downstream',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Madinah',
  latitude: 23.9536,
  longitude: 38.2267,
  
  status: 'Existing',
  capacity: '606 sq km',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Red Sea energy hub; terminus of East-West pipeline'
})

CREATE (asset3:SectorGovEntity {
  id: 'A-003',
  name: 'Ras Al-Khair Industrial City',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Mining & Maritime',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 27.5367,
  longitude: 49.1708,
  
  status: 'Existing',
  capacity: 'Integrated Maritime Yard',
  investment: 'SAR 26 Billion',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Mining capital; Aluminium & Phosphate complex. Specific investment for King Salman International Marine Industries.'
})

CREATE (asset4:SectorGovEntity {
  id: 'A-004',
  name: 'Jazan City (JCPDI)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Heavy Industry',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Jazan',
  latitude: 17.2586,
  longitude: 42.4764,
  
  status: 'Under Construction',
  capacity: 'Port & Refinery',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'LIFELINE: The only non-oil job engine in a high-unemployment region.',
  description: 'Refining and heavy industry gateway to Africa'
})

CREATE (asset5:SectorGovEntity {
  id: 'A-005',
  name: 'Wa\'ad Al-Shamal',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Phosphate Mining',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Northern Borders',
  latitude: 31.6447,
  longitude: 38.7617,
  
  status: 'Existing',
  capacity: '440 sq km',
  investment: 'SAR 85 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.',
  description: 'Phosphate city; Ma\'aden fertilizer complex. NIDLP launched with SAR 85B investment.'
})

CREATE (asset6:SectorGovEntity {
  id: 'A-006',
  name: 'Sudair City for Industry',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Mixed Manufacturing',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 25.6593,
  longitude: 45.6214,
  
  status: 'Existing',
  capacity: '265 sq km',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Steady economic engine.',
  description: 'Relief valve for Riyadh; light industry & logistics'
})

CREATE (asset7:SectorGovEntity {
  id: 'A-007',
  name: 'Riyadh 2nd Industrial City',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Manufacturing',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.567,
  longitude: 46.852,
  
  status: 'Existing',
  capacity: 'MODON Main Hub',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Steady economic engine.',
  description: 'Major manufacturing hub for Central region'
})

CREATE (asset8:SectorGovEntity {
  id: 'A-008',
  name: 'Dammam 2nd Industrial City',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Manufacturing',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 26.2361,
  longitude: 49.9576,
  
  status: 'Existing',
  capacity: 'MODON Main Hub',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Steady economic engine.',
  description: 'Oil & Gas support industries; IKTVA hub'
})

CREATE (asset9:SectorGovEntity {
  id: 'A-009',
  name: 'Jeddah 1st Industrial City',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Light Industry',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 21.4367,
  longitude: 39.243,
  
  status: 'Existing',
  capacity: 'MODON Main Hub',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'CORE ENGINE: Revenue generator; keep stable.',
  description: 'Consumer goods and food processing'
})

CREATE (asset10:SectorGovEntity {
  id: 'A-010',
  name: 'Oxagon (NEOM)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial City',
  asset_category: 'Advanced Mfg',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Tabuk',
  latitude: 27.9366,
  longitude: 35.1587,
  
  status: 'Planned',
  capacity: 'Clean Industry Hub',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.',
  description: 'Floating industrial city; Hydrogen hub'
})

CREATE (asset11:SectorGovEntity {
  id: 'A-011',
  name: 'King Abdullah Economic City',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Special Zone',
  asset_category: 'Logistics & Light Ind',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Makkah',
  latitude: 22.4107,
  longitude: 39.12,
  
  status: 'Existing',
  capacity: '173 sq km',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Supports religious tourism capacity.',
  description: 'Port-centric logistics and pharmaceuticals'
})

CREATE (asset12:SectorGovEntity {
  id: 'A-012',
  name: 'SPARK (King Salman Energy Park)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Special Zone',
  asset_category: 'Energy Services',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'ppp',
  ownership_confidence: 'medium',
  
  region: 'Eastern Region',
  latitude: 25.908,
  longitude: 49.539,
  
  status: 'Under Construction',
  capacity: '50 sq km',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Energy supply chain localization (IKTVA)'
})

CREATE (asset13:SectorGovEntity {
  id: 'A-013',
  name: 'Ras Al-Khair Power Plant',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination/Power',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 27.55,
  longitude: 49.2,
  
  status: 'Existing',
  capacity: '2.9M m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'World\'s largest hybrid desalination plant'
})

CREATE (asset14:SectorGovEntity {
  id: 'A-014',
  name: 'Shoaiba Power Plant',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination/Power',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 20.672,
  longitude: 39.525,
  
  status: 'Existing',
  capacity: 'Thermal/RO Complex',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Major supplier to Makkah & Jeddah'
})

CREATE (asset15:SectorGovEntity {
  id: 'A-015',
  name: 'Jubail Power Plant',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination/Power',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 27.03,
  longitude: 49.63,
  
  status: 'Existing',
  capacity: 'Integrated Complex',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Supplies Jubail Industrial City & Riyadh'
})

CREATE (asset16:SectorGovEntity {
  id: 'A-016',
  name: 'Ghazlan Power Plant',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Power Generation',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 26.839,
  longitude: 49.923,
  
  status: 'Existing',
  capacity: '4000+ MW',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Major gas-fired plant supporting Eastern grid'
})

CREATE (asset17:SectorGovEntity {
  id: 'A-017',
  name: 'Qurayyah IPP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Power Generation',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 25.86,
  longitude: 50.11,
  
  status: 'Existing',
  capacity: '3927 MW',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Combined cycle gas turbine plant'
})

CREATE (asset18:SectorGovEntity {
  id: 'A-018',
  name: 'Rabigh 3 IWP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 22.68,
  longitude: 39.02,
  
  status: 'Existing',
  capacity: '600k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Supports religious tourism capacity.',
  description: 'Major Reverse Osmosis (RO) facility'
})

CREATE (asset19:SectorGovEntity {
  id: 'A-019',
  name: 'Yanbu 4 IWP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Madinah',
  latitude: 23.85,
  longitude: 38.15,
  
  status: 'Under Construction',
  capacity: '450k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Supplies Madinah and Yanbu region'
})

CREATE (asset20:SectorGovEntity {
  id: 'A-020',
  name: 'Ras Al Khair 2 IWP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 27.56,
  longitude: 49.18,
  
  status: 'Tendering',
  capacity: '600k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'New SWRO plant to supply Riyadh (COD 2028)'
})

CREATE (asset21:SectorGovEntity {
  id: 'A-021',
  name: 'Tabuk 1 IWP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Tabuk',
  latitude: 27.3517,
  longitude: 35.6901,
  
  status: 'Tendering',
  capacity: '400k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Supplies NEOM & Madinah region (COD 2028)'
})

CREATE (asset22:SectorGovEntity {
  id: 'A-022',
  name: 'Ras Mohaisen IWP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 19.5,
  longitude: 40.5,
  
  status: 'Awarded',
  capacity: '300k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Supports religious tourism capacity.',
  description: 'Anchor supply for Makkah/Baha; Awarded to ACWA'
})

CREATE (asset23:SectorGovEntity {
  id: 'A-023',
  name: 'Jazan 1 IWP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Jazan',
  latitude: 17.26,
  longitude: 42.1,
  
  status: 'Planned',
  capacity: '300k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Replacing dams/groundwater in South (COD 2028)'
})

CREATE (asset24:SectorGovEntity {
  id: 'A-024',
  name: 'Riyadh-Qassim IWTP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Transmission',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 25.5,
  longitude: 45.0,
  
  status: 'Awarded',
  capacity: '685k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Pipeline connecting Riyadh to Qassim (Vision Invest)'
})

CREATE (asset25:SectorGovEntity {
  id: 'A-025',
  name: 'Jubail-Buraidah IWTP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Transmission',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 26.5,
  longitude: 47.0,
  
  status: 'Under Construction',
  capacity: '650k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'East-to-West water transmission bridge'
})

CREATE (asset26:SectorGovEntity {
  id: 'A-026',
  name: 'Jazan SSTP (Cluster)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Wastewater',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Jazan',
  latitude: 16.89,
  longitude: 42.55,
  
  status: 'Awarded',
  capacity: '75k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Integrated treatment plants and network (Alkhorayef)'
})

CREATE (asset27:SectorGovEntity {
  id: 'A-027',
  name: 'Khobar 2 Desalination',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 26.18,
  longitude: 50.2,
  
  status: 'Existing',
  capacity: '600k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Supplies Eastern Province'
})

CREATE (asset28:SectorGovEntity {
  id: 'A-028',
  name: 'Jubail 3A (Jazlah)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 26.96,
  longitude: 49.6,
  
  status: 'Under Construction',
  capacity: '600k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Independent Water Project (IWP)'
})

CREATE (asset29:SectorGovEntity {
  id: 'A-029',
  name: 'Jubail 3B',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 27.05,
  longitude: 49.65,
  
  status: 'Under Construction',
  capacity: '570k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Independent Water Project (IWP)'
})

CREATE (asset30:SectorGovEntity {
  id: 'A-030',
  name: 'Shuqaiq 3 IWP',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Desalination',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Jazan',
  latitude: 17.66,
  longitude: 42.06,
  
  status: 'Existing',
  capacity: '450k m3/day',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Major SWRO plant for southern region'
})

CREATE (asset31:SectorGovEntity {
  id: 'A-031',
  name: 'Juranah ISWR',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'Water Storage',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 21.52,
  longitude: 39.8,
  
  status: 'Planned',
  capacity: '2.5M m3 Storage',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Independent Strategic Water Reservoir; Tender Phase'
})

CREATE (asset32:SectorGovEntity {
  id: 'A-032',
  name: 'NEOM (The Line)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Future City',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Tabuk',
  latitude: 28.0,
  longitude: 35.0,
  
  status: 'Under Construction',
  capacity: '26500 sq km',
  investment: '$500 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'DIVERSIFICATION: High strategic value; critical path project.',
  description: 'The Linear City & Oxagon Industrial Zone. $500B region.'
})

CREATE (asset33:SectorGovEntity {
  id: 'A-033',
  name: 'Red Sea Global',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Tourism/Utilities',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Tabuk',
  latitude: 25.63,
  longitude: 36.8,
  
  status: 'Under Construction',
  capacity: '28000 sq km',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'DIVERSIFICATION: Critical for tourism targets.',
  description: 'Regenerative tourism & renewable utility grid'
})

CREATE (asset34:SectorGovEntity {
  id: 'A-034',
  name: 'Qiddiya',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Entertainment',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Riyadh',
  latitude: 24.583,
  longitude: 46.333,
  
  status: 'Under Construction',
  capacity: '334 sq km',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'OPTIMIZE',
  rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.',
  description: 'Entertainment & Sports capital; Six Flags'
})

CREATE (asset35:SectorGovEntity {
  id: 'A-035',
  name: 'Trojena (NEOM)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Tourism',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Tabuk',
  latitude: 28.7292,
  longitude: 35.3957,
  
  status: 'Planned',
  capacity: 'Ski Village',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'OPTIMIZE',
  rationale: 'DIVERSIFICATION: High strategic value but exacerbates Riyadh traffic/housing pressure.',
  description: 'Mountain tourism; Asian Winter Games 2029 host'
})

CREATE (asset36:SectorGovEntity {
  id: 'A-036',
  name: 'Diriyah Gate',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Culture/Heritage',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Riyadh',
  latitude: 24.7333,
  longitude: 46.575,
  
  status: 'Under Construction',
  capacity: 'Cultural District',
  investment: 'SAR 8 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'GROWTH: Key branding and cultural pillar.',
  description: 'Historic capital redevelopment; UNESCO site. Includes Wadi Safar luxury destination.'
})

CREATE (asset37:SectorGovEntity {
  id: 'A-037',
  name: 'Al-Ula (Journey Through Time)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Tourism',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 26.61,
  longitude: 37.92,
  
  status: 'Existing',
  capacity: 'Heritage Site',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.',
  description: 'Living museum and heritage tourism'
})

CREATE (asset38:SectorGovEntity {
  id: 'A-038',
  name: 'Amaala',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Tourism/Wellness',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Tabuk',
  latitude: 26.65,
  longitude: 36.2,
  
  status: 'Under Construction',
  capacity: '3000 Hotel Keys',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'OPTIMIZE',
  rationale: 'DIVERSIFICATION: High strategic value but exacerbates Riyadh traffic/housing pressure.',
  description: 'Luxury wellness destination (Red Sea Global)'
})

CREATE (asset39:SectorGovEntity {
  id: 'A-039',
  name: 'THE RIG.',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Tourism/Adventure',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Eastern Region',
  latitude: 27.19,
  longitude: 49.8,
  
  status: 'Planned',
  capacity: 'Tourism',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'OPTIMIZE',
  rationale: 'COMMERCIAL HIT: Matches high regional purchasing power.',
  description: 'Offshore oil rig themed adventure park'
})

CREATE (asset40:SectorGovEntity {
  id: 'A-040',
  name: 'New Murabba (The Mukaab)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Giga Project',
  asset_category: 'Mixed Use',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Riyadh',
  latitude: 24.78,
  longitude: 46.6,
  
  status: 'Planned',
  capacity: 'Urban Dev',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'OPTIMIZE',
  rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.',
  description: 'New downtown Riyadh & world\'s largest structure'
})

CREATE (asset41:SectorBusiness {
  id: 'A-041',
  name: 'Roshn (Sedra)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Real Estate',
  asset_category: 'Housing',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.8387,
  longitude: 46.746,
  
  status: 'Under Construction',
  capacity: '30k Homes',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Integrated community living; PIF backed'
})

CREATE (asset42:SectorBusiness {
  id: 'A-042',
  name: 'Saudi Downtown (12 Cities)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Real Estate',
  asset_category: 'Mixed Use',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Multiple',
  latitude: 24.0,
  longitude: 45.0,
  
  status: 'Planned',
  capacity: 'Urban Regeneration',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Projects in 12 cities (Arar; Dombat; etc.)'
})

CREATE (asset43:SectorBusiness {
  id: 'A-043',
  name: 'Konoz (Box of Treasures)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Real Estate',
  asset_category: 'Mixed Use',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.69,
  longitude: 46.66,
  
  status: 'Planned',
  capacity: 'Commercial',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'OPTIMIZE',
  rationale: 'GROWTH: Adds brand value but exacerbates Riyadh traffic/housing pressure.',
  description: 'Entertainment & commercial city by Abdullah Al Othaim'
})

CREATE (asset44:SectorBusiness {
  id: 'A-044',
  name: 'Ceer Motors Factory',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial',
  asset_category: 'Automotive',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 22.4844,
  longitude: 39.1534,
  
  status: 'Planned',
  capacity: 'EV Production',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Supports religious tourism capacity.',
  description: 'First Saudi EV brand manufacturing plant (KAEC)'
})

CREATE (asset45:SectorBusiness {
  id: 'A-045',
  name: 'Lucid Motors Factory',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial',
  asset_category: 'Automotive',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 22.4542,
  longitude: 39.1239,
  
  status: 'Under Construction',
  capacity: '155k Vehicles/yr',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Supports religious tourism capacity.',
  description: 'International EV manufacturing hub (KAEC)'
})

CREATE (asset46:SectorGovEntity {
  id: 'A-046',
  name: 'Al-Khnaiguiyah',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Zinc/Copper',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Riyadh',
  latitude: 24.25,
  longitude: 45.0833,
  
  status: 'Opportunity',
  capacity: '25M tonnes ore',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Major exploration license recently auctioned'
})

CREATE (asset47:SectorGovEntity {
  id: 'A-047',
  name: 'Umm Ad Damar',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Copper/Gold',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 23.65,
  longitude: 41.05,
  
  status: 'Opportunity',
  capacity: 'Exploration License',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Mining exploration belt; open for investment'
})

CREATE (asset48:SectorGovEntity {
  id: 'A-048',
  name: 'Jabal Sayid',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Copper',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 23.8505,
  longitude: 40.9411,
  
  status: 'Existing',
  capacity: 'Copper Concentrate',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Underground copper mine; Maaden-Barrick JV'
})

CREATE (asset49:SectorGovEntity {
  id: 'A-049',
  name: 'Al Jalamid',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Phosphate',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Northern Borders',
  latitude: 31.2869,
  longitude: 39.9572,
  
  status: 'Existing',
  capacity: 'Phosphate Rock',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.',
  description: 'Phosphate mine feeding Waad Al Shamal'
})

CREATE (asset50:SectorGovEntity {
  id: 'A-050',
  name: 'Al Baitha',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Bauxite',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Qassim',
  latitude: 27.4642,
  longitude: 43.9167,
  
  status: 'Existing',
  capacity: 'Bauxite Ore',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Bauxite mine feeding Ras Al Khair aluminum'
})

CREATE (asset51:SectorGovEntity {
  id: 'A-051',
  name: 'Muhayil Mining License',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Gold/Copper',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Aseer',
  latitude: 18.55,
  longitude: 42.0,
  
  status: 'Opportunity',
  capacity: 'Exploration Belt',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT (Critical)',
  rationale: 'LIFELINE: The only non-oil job engine in a high-poverty region.',
  description: 'Exploration license up for auction'
})

CREATE (asset52:SectorGovEntity {
  id: 'A-052',
  name: 'Bir Umq Mining License',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Copper',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 23.9,
  longitude: 40.7,
  
  status: 'Opportunity',
  capacity: 'Exploration Belt',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Exploration license up for auction'
})

CREATE (asset53:SectorGovEntity {
  id: 'A-053',
  name: 'Jabal Idsas',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Iron Ore',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Riyadh',
  latitude: 24.3,
  longitude: 45.2,
  
  status: 'Opportunity',
  capacity: 'Iron Ore',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.',
  description: 'Iron ore deposit investment opportunity'
})

CREATE (asset54:SectorGovEntity {
  id: 'A-054',
  name: 'Wadi Sawawin',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Iron Ore',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Tabuk',
  latitude: 28.1,
  longitude: 35.5,
  
  status: 'Opportunity',
  capacity: 'Iron Ore',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT (Critical)',
  rationale: 'JOB FIX: Solves 6.8% unemployment in region with high infra surplus.',
  description: 'Iron ore pellets project opportunity'
})

CREATE (asset55:SectorGovEntity {
  id: 'A-055',
  name: 'Al-Sadawi Solar PV',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Renewable',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Eastern Region',
  latitude: 28.52,
  longitude: 47.45,
  
  status: 'Planned',
  capacity: '2000 MW',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'CORE ENGINE: Revenue generator; keep stable.',
  description: 'NREP Round 5 Solar Project'
})

CREATE (asset56:SectorGovEntity {
  id: 'A-056',
  name: 'Al-Masa\'a Solar PV',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Renewable',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Hail',
  latitude: 27.2,
  longitude: 42.4,
  
  status: 'Planned',
  capacity: '1000 MW',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'NREP Round 5 Solar Project'
})

CREATE (asset57:SectorGovEntity {
  id: 'A-057',
  name: 'Al-Henakiyah Solar PV',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Renewable',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 24.86,
  longitude: 40.5,
  
  status: 'Planned',
  capacity: '1100 MW',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'NREP Round 4 Solar Project'
})

CREATE (asset58:SectorGovEntity {
  id: 'A-058',
  name: 'Tabarjal Solar PV',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Renewable',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Al-Jouf',
  latitude: 30.5,
  longitude: 38.2,
  
  status: 'Planned',
  capacity: '400 MW',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'JOB FIX: New energy jobs for high-unemployment region.',
  description: 'NREP Round 4 Solar Project'
})

CREATE (asset59:SectorGovEntity {
  id: 'A-059',
  name: 'Taiba 1 & 2',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Power Generation',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 24.2,
  longitude: 38.4,
  
  status: 'Planned',
  capacity: '3.6 GW',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'CCGT Power Plants with Carbon Capture readiness'
})

CREATE (asset60:SectorGovEntity {
  id: 'A-060',
  name: 'Qassim 1 & 2',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Power Generation',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Qassim',
  latitude: 26.1,
  longitude: 44.2,
  
  status: 'Planned',
  capacity: '3.6 GW',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'CCGT Power Plants with Carbon Capture readiness'
})

CREATE (asset61:SectorGovEntity {
  id: 'A-061',
  name: 'Riyadh Integrated Logistics Zone',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Logistics',
  asset_category: 'Special Zone',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Riyadh',
  latitude: 24.93,
  longitude: 46.73,
  
  status: 'Under Construction',
  capacity: 'Tax-Free Zone',
  investment: 'SAR 1 Billion',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Special Integrated Logistics Zone at RUH Airport'
})

CREATE (asset62:SectorGovEntity {
  id: 'A-062',
  name: 'Jeddah Logistics Park',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Logistics',
  asset_category: 'Logistics Park',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Makkah',
  latitude: 21.46,
  longitude: 39.18,
  
  status: 'Planned',
  capacity: 'Warehousing',
  investment: 'SAR 2.494 Billion',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Supports religious tourism capacity.',
  description: 'Expansion to increase capacity to 10m TEU.'
})

CREATE (asset63:SectorGovEntity {
  id: 'A-063',
  name: 'King Abdullah Port Logistics',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Logistics',
  asset_category: 'Logistics Park',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Makkah',
  latitude: 22.52,
  longitude: 39.06,
  
  status: 'Existing',
  capacity: 'Petrochem Logistics',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Supports religious tourism capacity.',
  description: 'Logistics park integrated with port'
})

CREATE (asset64:SectorGovEntity {
  id: 'A-064',
  name: 'Dammam Logistics Park',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Logistics',
  asset_category: 'Logistics Park',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Eastern Region',
  latitude: 26.54,
  longitude: 50.18,
  
  status: 'Planned',
  capacity: 'Container Support',
  investment: 'SAR 790.7 Million',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Expansion to increase capacity to 5m TEU.'
})

CREATE (asset65:SectorGovEntity {
  id: 'A-065',
  name: 'Riyadh Metro Main Station',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Transport',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.64,
  longitude: 46.72,
  
  status: 'Under Construction',
  capacity: 'Public Transport',
  investment: '> SAR 200 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'OPERATIONAL CORE: Essential to fix.',
  description: 'KAFD Metro Station; Central node of SAR 200B+ network.'
})

CREATE (asset66:SectorGovEntity {
  id: 'A-066',
  name: 'Jeddah Metro (Planned)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Transport',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 21.5,
  longitude: 39.15,
  
  status: 'Planned',
  capacity: 'Public Transport',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'CRITICAL: Solves mobility friction & health access.',
  description: 'Future metro network for Jeddah'
})

CREATE (asset67:SectorGovEntity {
  id: 'A-067',
  name: 'Saudi Landbridge',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Transport',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Multiple',
  latitude: 23.5,
  longitude: 43.5,
  
  status: 'Planned',
  capacity: 'Freight/Passenger',
  investment: 'SAR 34.485 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.',
  description: 'Jeddah-Jubail railway link (SAR 34.485B).'
})

CREATE (asset68:SectorGovEntity {
  id: 'A-068',
  name: 'Riyadh Air Operations Center',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Aviation',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.95,
  longitude: 46.7,
  
  status: 'Planned',
  capacity: 'Aviation',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'OPTIMIZE',
  rationale: 'Growth Asset: Adds value.',
  description: 'HQ for new national airline (at RUH)'
})

CREATE (asset69:SectorGovEntity {
  id: 'A-073',
  name: 'Jeddah-Jizan Railway',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Transport',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Western',
  latitude: 19.5,
  longitude: 40.5,
  
  status: 'Planned',
  capacity: 'Transport',
  investment: 'SAR 15.20 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.',
  description: 'Coastal rail link development.'
})

CREATE (asset70:SectorGovEntity {
  id: 'A-074',
  name: 'Jeddah-Yanbu Railway',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Transport',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Western',
  latitude: 22.5,
  longitude: 38.8,
  
  status: 'Planned',
  capacity: 'Transport',
  investment: 'SAR 9.215 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.',
  description: 'Industrial rail link connecting Western hubs.'
})

CREATE (asset71:SectorGovEntity {
  id: 'A-075',
  name: 'Medinah-Yanbu Railway',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Transport',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Western',
  latitude: 24.2,
  longitude: 38.6,
  
  status: 'Planned',
  capacity: 'Transport',
  investment: 'SAR 4.648 Billion',
  priority: 'HIGH',
  fiscal_action: 'PROTECT',
  rationale: 'STRATEGIC BACKBONE: Essential for inter-state connectivity.',
  description: 'Link C9 connecting holy city to industrial hub.'
})

CREATE (asset72:SectorGovEntity {
  id: 'A-076',
  name: 'Tabuk Airport Expansion',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Aviation',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Tabuk',
  latitude: 28.3653,
  longitude: 36.6189,
  
  status: 'Planned',
  capacity: '3m Pax',
  investment: 'SAR 867.9 Million',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Expansion to 3m passengers.'
})

CREATE (asset73:SectorGovEntity {
  id: 'A-077',
  name: 'Al-Ahsa Airport Expansion',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Aviation',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 25.2853,
  longitude: 49.4867,
  
  status: 'Planned',
  capacity: '1m Pax',
  investment: 'SAR 347.2 Million',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Expansion to 1m passengers.'
})

CREATE (asset74:SectorGovEntity {
  id: 'A-078',
  name: 'Farasan Airport',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Aviation',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Jazan',
  latitude: 16.7092,
  longitude: 42.1275,
  
  status: 'Planned',
  capacity: '0.5m Pax',
  investment: 'SAR 264.8 Million',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Development to 0.5m passengers.'
})

CREATE (asset75:SectorGovEntity {
  id: 'A-079',
  name: 'Qaisumah Airport Expansion',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Infrastructure',
  asset_category: 'Aviation',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 28.3353,
  longitude: 46.1253,
  
  status: 'Planned',
  capacity: '0.5m Pax',
  investment: 'SAR 208.6 Million',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Expansion to 0.5m passengers.'
})

CREATE (asset76:SectorGovEntity {
  id: 'A-080',
  name: 'Water Sector Projects',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Utilities',
  asset_category: 'National',
  sector: 'water',
  pillar: 'society',
  
  ownership_type: 'government',
  ownership_confidence: 'high',
  
  region: 'National',
  latitude: 24.7,
  longitude: 46.7,
  
  status: 'Active',
  capacity: 'National',
  investment: 'SAR 179 Billion',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Approved funding until 2030.'
})

CREATE (asset77:SectorGovEntity {
  id: 'A-081',
  name: 'Logistics Zones Contract',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Logistics',
  asset_category: 'National',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.8,
  longitude: 46.6,
  
  status: 'Active',
  capacity: 'National',
  investment: 'SAR 200 Billion',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Standard strategic alignment; optimize for efficiency.',
  description: 'Total investment contracts signed.'
})

CREATE (asset78:SectorGovEntity {
  id: 'A-069',
  name: 'CST Coverage Map',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Investor Tool',
  asset_category: 'Digital Service',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.71,
  longitude: 46.67,
  
  status: 'Active',
  capacity: 'Coverage Check',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic asset',
  description: 'Source: www.cst.gov.sa (Check 5G/Fiber coverage)'
})

CREATE (asset79:SectorGovEntity {
  id: 'A-070',
  name: 'NWC Pumping Map',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Investor Tool',
  asset_category: 'Digital Service',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.71,
  longitude: 46.67,
  
  status: 'Active',
  capacity: 'Coverage Check',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic asset',
  description: 'Source: e.nwc.com.sa (Check water schedule/network)'
})

CREATE (asset80:SectorGovEntity {
  id: 'A-071',
  name: 'Balady Excavation Map',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Investor Tool',
  asset_category: 'Digital Service',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.71,
  longitude: 46.67,
  
  status: 'Active',
  capacity: 'Coverage Check',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic asset',
  description: 'Source: balady.gov.sa (Check infra permits/digging)'
})

CREATE (asset81:SectorGovEntity {
  id: 'A-072',
  name: 'SEC Wasalah',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Investor Tool',
  asset_category: 'Digital Service',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.71,
  longitude: 46.67,
  
  status: 'Active',
  capacity: 'Connection Request',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'National strategic interest.',
  description: 'Source: se.com.sa (Check electrical capacity)'
})

CREATE (asset82:SectorGovEntity {
  id: 'A-082',
  name: 'YASREF Refinery',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial',
  asset_category: 'Refining',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 24.0,
  longitude: 38.0,
  
  status: 'Existing',
  capacity: '400k bpd',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Yanbu Aramco Sinopec Refining Company'
})

CREATE (asset83:SectorGovEntity {
  id: 'A-083',
  name: 'SAMREF Refinery',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial',
  asset_category: 'Refining',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 23.9,
  longitude: 38.1,
  
  status: 'Existing',
  capacity: '400k bpd',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Saudi Aramco Mobil Yanbu Refinery'
})

CREATE (asset84:SectorGovEntity {
  id: 'A-084',
  name: 'SASREF Refinery',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial',
  asset_category: 'Refining',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Eastern Region',
  latitude: 27.0,
  longitude: 49.6,
  
  status: 'Existing',
  capacity: '305k bpd',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Saudi Aramco Shell Refinery'
})

CREATE (asset85:SectorGovEntity {
  id: 'A-085',
  name: 'Luberef (Jeddah)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial',
  asset_category: 'Refining',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Makkah',
  latitude: 21.4,
  longitude: 39.2,
  
  status: 'Existing',
  capacity: 'Base Oils',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Saudi Aramco Base Oil Company'
})

CREATE (asset86:SectorGovEntity {
  id: 'A-086',
  name: 'Luberef (Yanbu)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Industrial',
  asset_category: 'Refining',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 24.0,
  longitude: 38.0,
  
  status: 'Existing',
  capacity: 'Base Oils',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Saudi Aramco Base Oil Company'
})

CREATE (asset87:SectorGovEntity {
  id: 'A-087',
  name: 'Sakaka Solar PV',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Renewable',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Al-Jouf',
  latitude: 29.9,
  longitude: 40.2,
  
  status: 'Existing',
  capacity: '300 MW',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT (Critical)',
  rationale: 'Job Fix: Solves 6.8% unemployment in a region with high infra surplus.',
  description: 'First large-scale solar project in KSA'
})

CREATE (asset88:SectorGovEntity {
  id: 'A-088',
  name: 'Dumat Al Jandal Wind Farm',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Energy',
  asset_category: 'Renewable',
  sector: 'energy',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Al-Jouf',
  latitude: 29.8,
  longitude: 39.9,
  
  status: 'Existing',
  capacity: '400 MW',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT (Critical)',
  rationale: 'Job Fix: Solves 6.8% unemployment in a region with high infra surplus.',
  description: 'Region\'s largest wind farm'
})

CREATE (asset89:SectorGovEntity {
  id: 'A-089',
  name: 'Mahd Ad Dahab Mine',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Gold',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 23.5,
  longitude: 40.9,
  
  status: 'Existing',
  capacity: 'Gold Ore',
  investment: 'N/A',
  priority: 'HIGH',
  fiscal_action: 'PROTECT (Critical)',
  rationale: 'Job Fix: Solves 6.8% unemployment in a region with high infra surplus.',
  description: 'Oldest and most famous gold mine in KSA'
})

CREATE (asset90:SectorGovEntity {
  id: 'A-090',
  name: 'Mansourah-Massarah Gold Mine',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Gold',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Makkah',
  latitude: 22.5,
  longitude: 41.5,
  
  status: 'Existing',
  capacity: 'Gold Ore',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Largest of Ma\'aden\'s gold mines'
})

CREATE (asset91:SectorGovEntity {
  id: 'A-091',
  name: 'Bulghah & Sukhaybarat Gold Mine',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Mining',
  asset_category: 'Gold',
  sector: 'mining',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 24.7,
  longitude: 41.3,
  
  status: 'Existing',
  capacity: 'Gold Ore',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Major gold mine complex'
})

CREATE (asset92:SectorGovEntity {
  id: 'A-092',
  name: 'Saudi Geological Survey Map',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Investor Tool',
  asset_category: 'Digital Service',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.7,
  longitude: 46.7,
  
  status: 'Active',
  capacity: 'Data Service',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Investor tool; low cost maintain.',
  description: 'Source: sgs.org.sa (Check geological data/maps)'
})

CREATE (asset93:SectorGovEntity {
  id: 'A-093',
  name: 'Ministry of Industry Map',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Investor Tool',
  asset_category: 'Digital Service',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.7,
  longitude: 46.8,
  
  status: 'Active',
  capacity: 'Data Service',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Investor tool; low cost maintain.',
  description: 'Source: mim.gov.sa (Check industrial licenses/zones)'
})

CREATE (asset94:SectorGovEntity {
  id: 'A-094',
  name: 'Ministry of Municipalities Map',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Investor Tool',
  asset_category: 'Digital Service',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'National',
  latitude: 24.71,
  longitude: 46.9,
  
  status: 'Active',
  capacity: 'Data Service',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Investor tool; low cost maintain.',
  description: 'Source: momrah.gov.sa (Check land use/zoning maps)'
})

CREATE (asset95:SectorBusiness {
  id: 'SP-001',
  name: 'King Salman International Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.86,
  longitude: 46.696,
  
  status: 'Planned',
  capacity: '92760 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Opening and final matches host'
})

CREATE (asset96:SectorBusiness {
  id: 'SP-002',
  name: 'Prince Mohammed bin Salman Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Riyadh (Qiddiya)',
  latitude: 24.59,
  longitude: 46.528,
  
  status: 'Planned',
  capacity: '47000 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Retractable roof; Tuwaiq cliff location'
})

CREATE (asset97:SectorBusiness {
  id: 'SP-003',
  name: 'New Murabba Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.8,
  longitude: 46.55,
  
  status: 'Planned',
  capacity: '46000 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Integrated with Mukaab'
})

CREATE (asset98:SectorBusiness {
  id: 'SP-004',
  name: 'ROSHN Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Riyadh',
  latitude: 24.45,
  longitude: 46.6,
  
  status: 'Planned',
  capacity: '46000 seats',
  investment: 'N/A',
  priority: 'Low',
  fiscal_action: 'OPTIMIZE',
  rationale: 'MISALIGNED: Secondary stadium prioritzation.',
  description: 'Southwest Riyadh anchor'
})

CREATE (asset99:SectorBusiness {
  id: 'SP-005',
  name: 'Jeddah Central Development Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 21.53,
  longitude: 39.13,
  
  status: 'Planned',
  capacity: '45794 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Al-Andalus/Al-Balad area'
})

CREATE (asset100:SectorBusiness {
  id: 'SP-006',
  name: 'Qiddiya Coast Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 21.5,
  longitude: 39.1,
  
  status: 'Planned',
  capacity: '46096 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Distinct from Riyadh Qiddiya'
})

CREATE (asset101:SectorBusiness {
  id: 'SP-007',
  name: 'King Abdullah Economic City Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Makkah',
  latitude: 22.41,
  longitude: 39.18,
  
  status: 'Planned',
  capacity: '45700 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'KAEC revitalization'
})

CREATE (asset102:SectorBusiness {
  id: 'SP-008',
  name: 'Aramco Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Eastern Region',
  latitude: 26.365,
  longitude: 50.181,
  
  status: 'Planned',
  capacity: '47000 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Built by Aramco'
})

CREATE (asset103:SectorBusiness {
  id: 'SP-009',
  name: 'King Khalid University Stadium',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Sports',
  asset_category: 'World Cup',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Aseer',
  latitude: 18.097,
  longitude: 42.72,
  
  status: 'Planned',
  capacity: '45428 seats',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Highland Tourism strategy'
})

CREATE (asset104:SectorBusiness {
  id: 'SP-010',
  name: 'SEVEN Tabuk',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Entertainment',
  asset_category: 'SEVEN',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Tabuk',
  latitude: 28.38,
  longitude: 36.56,
  
  status: 'Planned',
  capacity: '40000 m2',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Designed as glass canopy village'
})

CREATE (asset105:SectorBusiness {
  id: 'SP-011',
  name: 'SEVEN Abha',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Entertainment',
  asset_category: 'SEVEN',
  sector: 'GIGA',
  pillar: 'economy',
  
  ownership_type: 'private',
  ownership_confidence: 'high',
  
  region: 'Aseer',
  latitude: 18.09,
  longitude: 42.72,
  
  status: 'Planned',
  capacity: '64000 m2',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Near Airport'
})

CREATE (asset106:SectorGovEntity {
  id: 'SP-012',
  name: 'Yanbu Commercial Port',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Food',
  asset_category: 'Logistics',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Madinah',
  latitude: 24.06,
  longitude: 38.05,
  
  status: 'Existing',
  capacity: 'Logistics',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Grain entry point for Madinah/Makkah'
})

CREATE (asset107:SectorGovEntity {
  id: 'SP-013',
  name: 'King Abdul Aziz Port',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Food',
  asset_category: 'Logistics',
  sector: 'logistics',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Eastern Region',
  latitude: 26.43,
  longitude: 50.1,
  
  status: 'Existing',
  capacity: '10000 MT Daily',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Linked by rail to Riyadh'
})

CREATE (asset108:SectorGovEntity {
  id: 'SP-014',
  name: 'NADEC Haradh Project',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Agriculture',
  asset_category: 'Food Security',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Eastern Region',
  latitude: 24.14,
  longitude: 49.06,
  
  status: 'Existing',
  capacity: '375000000 m2',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Integrated dairy city'
})

CREATE (asset109:SectorGovEntity {
  id: 'SP-015',
  name: 'NADEC Wadi Al-Dawasir',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Agriculture',
  asset_category: 'Food Security',
  sector: 'industry',
  pillar: 'economy',
  
  ownership_type: 'government',
  ownership_confidence: 'medium',
  
  region: 'Riyadh',
  latitude: 20.46,
  longitude: 44.78,
  
  status: 'Existing',
  capacity: '1000 km2',
  investment: 'N/A',
  priority: 'Medium',
  fiscal_action: 'MAINTAIN',
  rationale: 'Strategic infrastructure; maintain.',
  description: 'Potatoes'
})

CREATE (network1:SectorGovEntity {
  id: 'GOV-NETWORK-WATER001',
  name: 'w_jubail to riyadh',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Water Transmission',
  sector: 'water',
  pillar: 'society',
  
  source_asset_name: 'w_jubail',
  destination_asset_name: 'riyadh',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'w_jubail to riyadh'
})

CREATE (network2:SectorGovEntity {
  id: 'GOV-NETWORK-WATER002',
  name: 'w_ras to riyadh',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Water Transmission',
  sector: 'water',
  pillar: 'society',
  
  source_asset_name: 'w_ras',
  destination_asset_name: 'riyadh',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'w_ras to riyadh'
})

CREATE (network3:SectorGovEntity {
  id: 'GOV-NETWORK-WATER003',
  name: 'w_ras to hail',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Water Transmission',
  sector: 'water',
  pillar: 'society',
  
  source_asset_name: 'w_ras',
  destination_asset_name: 'hail',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'w_ras to hail'
})

CREATE (network4:SectorGovEntity {
  id: 'GOV-NETWORK-WATER004',
  name: 'w_yanbu to medina',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Water Transmission',
  sector: 'water',
  pillar: 'society',
  
  source_asset_name: 'w_yanbu',
  destination_asset_name: 'medina',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'w_yanbu to medina'
})

CREATE (network5:SectorGovEntity {
  id: 'GOV-NETWORK-WATER005',
  name: 'w_shuaibah to makkah',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Water Transmission',
  sector: 'water',
  pillar: 'society',
  
  source_asset_name: 'w_shuaibah',
  destination_asset_name: 'makkah',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'w_shuaibah to makkah'
})

CREATE (network6:SectorGovEntity {
  id: 'GOV-NETWORK-WATER006',
  name: 'w_shuqaiq to asir',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Water Transmission',
  sector: 'water',
  pillar: 'society',
  
  source_asset_name: 'w_shuqaiq',
  destination_asset_name: 'asir',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'w_shuqaiq to asir'
})

CREATE (network7:SectorGovEntity {
  id: 'GOV-NETWORK-ENERGY007',
  name: 'i_jubail to i_yanbu',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Energy Transmission',
  sector: 'energy',
  pillar: 'economy',
  
  source_asset_name: 'i_jubail',
  destination_asset_name: 'i_yanbu',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'i_jubail to i_yanbu'
})

CREATE (network8:SectorGovEntity {
  id: 'GOV-NETWORK-ENERGY008',
  name: 'e_neom to i_yanbu',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Energy Transmission',
  sector: 'energy',
  pillar: 'economy',
  
  source_asset_name: 'e_neom',
  destination_asset_name: 'i_yanbu',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'e_neom to i_yanbu'
})

CREATE (network9:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS009',
  name: 'l_dam to l_dry',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'l_dam',
  destination_asset_name: 'l_dry',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'l_dam to l_dry'
})

CREATE (network10:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS010',
  name: 'l_dry to hail',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'l_dry',
  destination_asset_name: 'hail',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'l_dry to hail'
})

CREATE (network11:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS011',
  name: 'hail to jawf',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'hail',
  destination_asset_name: 'jawf',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'hail to jawf'
})

CREATE (network12:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS012',
  name: 'jawf to i_waad',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'jawf',
  destination_asset_name: 'i_waad',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'jawf to i_waad'
})

CREATE (network13:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS013',
  name: 'i_waad to i_ras',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'i_waad',
  destination_asset_name: 'i_ras',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'i_waad to i_ras'
})

CREATE (network14:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS014',
  name: 'l_jed to makkah',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'l_jed',
  destination_asset_name: 'makkah',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'l_jed to makkah'
})

CREATE (network15:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS015',
  name: 'makkah to medina',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'makkah',
  destination_asset_name: 'medina',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'makkah to medina'
})

CREATE (network16:SectorGovEntity {
  id: 'GOV-NETWORK-LOGISTICS016',
  name: 'medina to l_kaec',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  
  asset_type: 'Network Connection',
  asset_category: 'Transmission',
  connection_type: 'Logistics Transmission',
  sector: 'logistics',
  pillar: 'economy',
  
  source_asset_name: 'medina',
  destination_asset_name: 'l_kaec',
  source_lat: 0.0,
  source_long: 0.0,
  dest_lat: 0.0,
  dest_long: 0.0,
  
  status: 'Existing',
  description: 'medina to l_kaec'
})

CREATE (objhealth1:SectorObjective {
  id: 'OBJ-HEALTH-001',
  name: 'Ease Access to Healthcare Services',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'health',
  pillar: 'vibrant',
  priority_level: 'Critical',
  baseline: '82% (Urban) / 60% (Rural)',
  target_2030: '100% Coverage (Institutional)',
  metric: 'Percentage of population covered by specialized care',
  status: 'Active',
  expected_outcomes: 'Ease Access to Healthcare Services',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (objhealth2:SectorObjective {
  id: 'OBJ-HEALTH-002',
  name: 'Improve Value of Healthcare Services',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'health',
  pillar: 'vibrant',
  priority_level: 'High',
  baseline: '74 Years (Life Expectancy)',
  target_2030: '80 Years',
  metric: 'Life Expectancy at Birth',
  status: 'Active',
  expected_outcomes: 'Improve Value of Healthcare Services',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (objhealth3:SectorObjective {
  id: 'OBJ-HEALTH-003',
  name: 'Strengthen Prevention Against Health Risks',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'health',
  pillar: 'vibrant',
  priority_level: 'High',
  baseline: '15% (Obesity Rate)',
  target_2030: 'Decrease by 3% (Relative)',
  metric: 'Prevalence of non-communicable diseases',
  status: 'Active',
  expected_outcomes: 'Strengthen Prevention Against Health Risks',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (polhealth1:SectorPolicyTool {
  id: 'POL-HEALTH-001',
  name: 'Health Sector Transformation Program (HSTP)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'health',
  tool_type: 'Strategic Program',
  impact_target: 'Sector-wide',
  delivery_channel: 'Ministry of Health (MoH)',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (polhealth2:SectorPolicyTool {
  id: 'POL-HEALTH-002',
  name: 'Private Health Insurance Program',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'health',
  tool_type: 'Regulatory Framework',
  impact_target: 'Sector-wide',
  delivery_channel: 'Council of Health Insurance (CHI)',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (perfhealth1:SectorPerformance {
  id: 'PERF-HEALTH-001',
  name: 'Life Expectancy at Birth',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'health',
  kpi_type: 'Performance Metric',
  actual: 75.3,
  actual_display: '75.3 Years',
  target_display: '76 Years',
  unit: 'Years',
  frequency: 'Annual',
  description: 'Life Expectancy at Birth',
  data_source: 'GASTAT / MoH',
  status: 'Active'
})

CREATE (perfhealth2:SectorPerformance {
  id: 'PERF-HEALTH-002',
  name: 'Percentage of Beneficiaries with Unified Digital Record',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'health',
  kpi_type: 'Performance Metric',
  actual: 65.0,
  actual_display: '65%',
  target_display: '80%',
  unit: 'Percentage',
  frequency: 'Annual',
  description: 'Percentage of Beneficiaries with Unified Digital Record',
  data_source: 'Seha / MoH',
  status: 'Active'
})

CREATE (txnhealth1:SectorDataTransaction {
  id: 'TXN-HEALTH-001',
  name: 'Patient Referral Request',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'health',
  transaction_type: 'Operational Report',
  domain: 'Health',
  department: 'PHC Center',
  frequency: 'Daily',
  related_asset: 'Seha Virtual Hospital'
})

CREATE (txnhealth2:SectorDataTransaction {
  id: 'TXN-HEALTH-002',
  name: 'Insurance Claim Processing',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'health',
  transaction_type: 'Operational Report',
  domain: 'Health',
  department: 'Private Provider',
  frequency: 'Real-time',
  related_asset: 'NPHIES Platform'
})
CREATE (objhealth1)-[:REALIZED_VIA]->(polhealth1)
CREATE (objhealth2)-[:REALIZED_VIA]->(polhealth2)
CREATE (perfhealth1)-[:AGGREGATES_TO]->(objhealth1)
CREATE (perfhealth2)-[:AGGREGATES_TO]->(objhealth2)

CREATE (objwater1:SectorObjective {
  id: 'OBJ-WATER-001',
  name: 'Ensure Sustainable Water Resources',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'water',
  pillar: 'vibrant',
  priority_level: 'Critical',
  baseline: '416% (Agri Consumption of Renewable Water)',
  target_2030: '350%',
  metric: 'Consumption Rate vs Renewable Rate',
  status: 'Active',
  expected_outcomes: 'Ensure Sustainable Water Resources',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (objwater2:SectorObjective {
  id: 'OBJ-WATER-002',
  name: 'Increase Water Services Coverage',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'water',
  pillar: 'vibrant',
  priority_level: 'High',
  baseline: '82% (2018)',
  target_2030: '95%',
  metric: 'Household Coverage %',
  status: 'Active',
  expected_outcomes: 'Increase Water Services Coverage',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (polwater1:SectorPolicyTool {
  id: 'POL-WATER-001',
  name: 'National Water Strategy 2030 (NWS)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'water',
  tool_type: 'Strategic Program',
  impact_target: 'Sector-wide',
  delivery_channel: 'MEWA',
  cost_of_implementation: 179,
  status: 'Active'
})

CREATE (polwater2:SectorPolicyTool {
  id: 'POL-WATER-002',
  name: 'Qatrah (Conservation Program)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'water',
  tool_type: 'Incentive/Awareness',
  impact_target: 'Sector-wide',
  delivery_channel: 'NWC',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (perfwater1:SectorPerformance {
  id: 'PERF-WATER-001',
  name: 'Urban Water Coverage',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'water',
  kpi_type: 'Performance Metric',
  actual: 86.0,
  actual_display: '86%',
  target_display: '88%',
  unit: 'Percentage',
  frequency: 'Annual',
  description: 'Urban Water Coverage',
  data_source: 'NWC Monthly Report',
  status: 'Active'
})

CREATE (perfwater2:SectorPerformance {
  id: 'PERF-WATER-002',
  name: 'Treated Sewage Effluent (TSE) Reuse',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'water',
  kpi_type: 'Performance Metric',
  actual: 22.0,
  actual_display: '22%',
  target_display: '35%',
  unit: 'Percentage',
  frequency: 'Annual',
  description: 'Treated Sewage Effluent (TSE) Reuse',
  data_source: 'SWA (Saudi Water Authority)',
  status: 'Active'
})

CREATE (txnwater1:SectorDataTransaction {
  id: 'TXN-WATER-001',
  name: 'Smart Meter Reading',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'water',
  transaction_type: 'Operational Report',
  domain: 'Water & Environment',
  department: 'NWC Regional Ops',
  frequency: 'Daily',
  related_asset: 'Smart Meter Grid'
})

CREATE (txnwater2:SectorDataTransaction {
  id: 'TXN-WATER-002',
  name: 'Desalination Production Log',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'water',
  transaction_type: 'Operational Report',
  domain: 'Water & Environment',
  department: 'SWA Plant Manager',
  frequency: 'Daily',
  related_asset: 'Jubail Desalination Plant'
})
CREATE (objwater1)-[:REALIZED_VIA]->(polwater1)
CREATE (objwater2)-[:REALIZED_VIA]->(polwater2)
CREATE (perfwater1)-[:AGGREGATES_TO]->(objwater1)
CREATE (perfwater2)-[:AGGREGATES_TO]->(objwater2)

CREATE (objenergy1:SectorObjective {
  id: 'OBJ-ENERGY-001',
  name: 'Diversify National Energy Mix',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'energy',
  pillar: 'thriving',
  priority_level: 'Critical',
  baseline: '<1% Renewables (2016)',
  target_2030: '50% Renewables / 50% Gas',
  metric: 'Generation Capacity Mix',
  status: 'Active',
  expected_outcomes: 'Diversify National Energy Mix',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (objenergy2:SectorObjective {
  id: 'OBJ-ENERGY-002',
  name: 'Maximize Local Content in Energy',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'energy',
  pillar: 'thriving',
  priority_level: 'High',
  baseline: '35%',
  target_2030: '75%',
  metric: 'Localization Rate',
  status: 'Active',
  expected_outcomes: 'Maximize Local Content in Energy',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (polenergy1:SectorPolicyTool {
  id: 'POL-ENERGY-001',
  name: 'National Renewable Energy Program (NREP)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'energy',
  tool_type: 'Infrastructure Project',
  impact_target: 'Sector-wide',
  delivery_channel: 'Ministry of Energy',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (polenergy2:SectorPolicyTool {
  id: 'POL-ENERGY-002',
  name: 'Liquid Fuel Displacement Program',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'energy',
  tool_type: 'Strategic Program',
  impact_target: 'Sector-wide',
  delivery_channel: 'Ministry of Energy',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (perfenergy1:SectorPerformance {
  id: 'PERF-ENERGY-001',
  name: 'Renewable Energy Capacity',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'energy',
  kpi_type: 'Performance Metric',
  actual: 2.8,
  actual_display: '2.8 GW',
  target_display: '5 GW',
  unit: 'Gigawatts',
  frequency: 'Annual',
  description: 'Renewable Energy Capacity',
  data_source: 'SPPC / MoE',
  status: 'Active'
})

CREATE (perfenergy2:SectorPerformance {
  id: 'PERF-ENERGY-002',
  name: 'Carbon Emissions Reduction',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'energy',
  kpi_type: 'Performance Metric',
  actual: 0.0,
  actual_display: 'N/A',
  target_display: '-278 MTPA (by 2030)',
  unit: 'Million Tonnes',
  frequency: 'Annual',
  description: 'Carbon Emissions Reduction',
  data_source: 'Circular Carbon Economy Center',
  status: 'Active'
})

CREATE (txnenergy1:SectorDataTransaction {
  id: 'TXN-ENERGY-001',
  name: 'Power Purchase Agreement (PPA) Settlement',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'energy',
  transaction_type: 'Operational Report',
  domain: 'Energy',
  department: 'SPPC',
  frequency: 'Monthly',
  related_asset: 'Sakaka Solar Plant'
})

CREATE (txnenergy2:SectorDataTransaction {
  id: 'TXN-ENERGY-002',
  name: 'Grid Load Dispatch Order',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'energy',
  transaction_type: 'Operational Report',
  domain: 'Energy',
  department: 'Saudi Electricity Co (SEC)',
  frequency: 'Real-time',
  related_asset: 'National Grid'
})
CREATE (objenergy1)-[:REALIZED_VIA]->(polenergy1)
CREATE (objenergy2)-[:REALIZED_VIA]->(polenergy2)
CREATE (perfenergy1)-[:AGGREGATES_TO]->(objenergy1)
CREATE (perfenergy2)-[:AGGREGATES_TO]->(objenergy2)

CREATE (objlogistics1:SectorObjective {
  id: 'OBJ-LOGISTICS-001',
  name: 'Global Hub Connection',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'logistics',
  pillar: 'thriving',
  priority_level: 'Critical',
  baseline: 'Rank 49 (LPI)',
  target_2030: 'Top 10 (LPI)',
  metric: 'Logistics Performance Index Rank',
  status: 'Active',
  expected_outcomes: 'Global Hub Connection',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (objlogistics2:SectorObjective {
  id: 'OBJ-LOGISTICS-002',
  name: 'Expand Port Capacity',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'logistics',
  pillar: 'thriving',
  priority_level: 'High',
  baseline: '15M TEU',
  target_2030: '40M TEU',
  metric: 'Annual Throughput Capacity',
  status: 'Active',
  expected_outcomes: 'Expand Port Capacity',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (pollogistics1:SectorPolicyTool {
  id: 'POL-LOGISTICS-001',
  name: 'National Transport & Logistics Strategy (NTLS)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'logistics',
  tool_type: 'Strategic Program',
  impact_target: 'Sector-wide',
  delivery_channel: 'Ministry of Transport & Logistics',
  cost_of_implementation: 500,
  status: 'Active'
})

CREATE (pollogistics2:SectorPolicyTool {
  id: 'POL-LOGISTICS-002',
  name: 'Saudi Logistics Hub',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'logistics',
  tool_type: 'Incentive Scheme',
  impact_target: 'Sector-wide',
  delivery_channel: 'Logistics Committee',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (perflogistics1:SectorPerformance {
  id: 'PERF-LOGISTICS-001',
  name: 'Total Cargo Throughput',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'logistics',
  kpi_type: 'Performance Metric',
  actual: 280.0,
  actual_display: '280M Tons',
  target_display: '300M Tons',
  unit: 'Tons',
  frequency: 'Annual',
  description: 'Total Cargo Throughput',
  data_source: 'Mawani',
  status: 'Active'
})

CREATE (perflogistics2:SectorPerformance {
  id: 'PERF-LOGISTICS-002',
  name: 'Rail Freight Volume',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'logistics',
  kpi_type: 'Performance Metric',
  actual: 18.0,
  actual_display: '18M Tons',
  target_display: '25M Tons',
  unit: 'Tons',
  frequency: 'Annual',
  description: 'Rail Freight Volume',
  data_source: 'SAR (Saudi Arabia Railways)',
  status: 'Active'
})

CREATE (txnlogistics1:SectorDataTransaction {
  id: 'TXN-LOGISTICS-001',
  name: 'Customs Clearance Declaration',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'logistics',
  transaction_type: 'Operational Report',
  domain: 'Logistics',
  department: 'Zakat, Tax and Customs Authority (ZATCA)',
  frequency: 'Daily',
  related_asset: 'Jeddah Islamic Port'
})

CREATE (txnlogistics2:SectorDataTransaction {
  id: 'TXN-LOGISTICS-002',
  name: 'Rail Waybill Generation',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'logistics',
  transaction_type: 'Operational Report',
  domain: 'Logistics',
  department: 'SAR Ops',
  frequency: 'Daily',
  related_asset: 'Riyadh Dry Port'
})
CREATE (objlogistics1)-[:REALIZED_VIA]->(pollogistics1)
CREATE (objlogistics2)-[:REALIZED_VIA]->(pollogistics2)
CREATE (perflogistics1)-[:AGGREGATES_TO]->(objlogistics1)
CREATE (perflogistics2)-[:AGGREGATES_TO]->(objlogistics2)

CREATE (objindustry1:SectorObjective {
  id: 'OBJ-INDUSTRY-001',
  name: 'Localize Military Industries',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'industry',
  pillar: 'thriving',
  priority_level: 'Critical',
  baseline: '2%',
  target_2030: '50%',
  metric: 'Percentage of Military Spending Localized',
  status: 'Active',
  expected_outcomes: 'Localize Military Industries',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (objindustry2:SectorObjective {
  id: 'OBJ-INDUSTRY-002',
  name: 'Increase Non-Oil Exports',
  year: 2025,
  quarter: 'Q1',
  level: 'L1',
  sector: 'industry',
  pillar: 'thriving',
  priority_level: 'High',
  baseline: '16%',
  target_2030: '50%',
  metric: '% of Non-Oil GDP',
  status: 'Active',
  expected_outcomes: 'Increase Non-Oil Exports',
  rationale: 'Vision 2030 Strategic Objective'
})

CREATE (polindustry1:SectorPolicyTool {
  id: 'POL-INDUSTRY-001',
  name: 'National Industrial Development and Logistics Program (NIDLP)',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'industry',
  tool_type: 'Strategic Program',
  impact_target: 'Sector-wide',
  delivery_channel: 'MIM / NIDLP',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (polindustry2:SectorPolicyTool {
  id: 'POL-INDUSTRY-002',
  name: 'Future Factories Program',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'industry',
  tool_type: 'Incentive/Tech',
  impact_target: 'Sector-wide',
  delivery_channel: 'MODON / MIM',
  cost_of_implementation: 0.0,
  status: 'Active'
})

CREATE (perfindustry1:SectorPerformance {
  id: 'PERF-INDUSTRY-001',
  name: 'Number of Factories',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'industry',
  kpi_type: 'Performance Metric',
  actual: 11.0,
  actual_display: '11,500',
  target_display: '12,000',
  unit: 'Count',
  frequency: 'Annual',
  description: 'Number of Factories',
  data_source: 'Ministry of Industry (MIM)',
  status: 'Active'
})

CREATE (perfindustry2:SectorPerformance {
  id: 'PERF-INDUSTRY-002',
  name: 'Industrial Investment Volume',
  year: 2025,
  quarter: 'Q1',
  level: 'L2',
  sector: 'industry',
  kpi_type: 'Performance Metric',
  actual: 1.4,
  actual_display: 'SAR 1.4 Trillion',
  target_display: 'SAR 1.5 Trillion',
  unit: 'SAR',
  frequency: 'Annual',
  description: 'Industrial Investment Volume',
  data_source: 'MISA / MIM',
  status: 'Active'
})

CREATE (txnindustry1:SectorDataTransaction {
  id: 'TXN-INDUSTRY-001',
  name: 'Industrial License Issuance',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'industry',
  transaction_type: 'Operational Report',
  domain: 'Industry',
  department: 'MIM Licensing Dept',
  frequency: 'Weekly',
  related_asset: 'Senaei Platform'
})

CREATE (txnindustry2:SectorDataTransaction {
  id: 'TXN-INDUSTRY-002',
  name: 'Duty Exemption Request',
  year: 2025,
  quarter: 'Q1',
  level: 'L3',
  sector: 'industry',
  transaction_type: 'Operational Report',
  domain: 'Industry',
  department: 'Factory Owner',
  frequency: 'Ad-hoc',
  related_asset: 'ZATCA System'
})
CREATE (objindustry1)-[:REALIZED_VIA]->(polindustry1)
CREATE (objindustry2)-[:REALIZED_VIA]->(polindustry2)
CREATE (perfindustry1)-[:AGGREGATES_TO]->(objindustry1)
CREATE (perfindustry2)-[:AGGREGATES_TO]->(objindustry2)