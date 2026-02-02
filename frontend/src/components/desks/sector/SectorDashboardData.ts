export const dashboardData = {
    "national_kpis": {
        "production_capacity": { "value": "16.6 Million m³/day", "source": "SWA Report 2024" },
        "strategic_storage": { "value": "21.8 Million m³", "target": ">7 Days", "source": "Budget 2025" },
        "reuse_rate": { "value": "26%", "target": "70%", "status": "lagging", "source": "SWA Sustainability" },
        "localization_impact": { "value": "SAR 114 Billion", "source": "NIDLP" }
    },
    "regions": [
        {
            "id": "east",
            "name": "Eastern Region",
            "tagline": "The Production Engine",
            "strategic_context": {
                "unemployment": "Low",
                "service_coverage": "High",
                "diversification": "Leading"
            },
            "sector_kpis": [
                { "label": "Water", "value": "7.2M m³", "trend": "up" },
                { "label": "Energy", "value": "12.4 GW", "trend": "up" },
                { "label": "Mining", "value": "Medium", "trend": "stable" },
                { "label": "Industry", "value": "High", "trend": "up" },
                { "label": "Logis.", "value": "High", "trend": "stable" },
                { "label": "Giga", "value": "Low", "trend": "stable" }
            ],
            "radar_scores": { "security": 95, "efficiency": 80, "sustainability": 60, "innovation": 85, "localization": 90 },
            "drill_down": {
                "assets": [
                    { "name": "Ras Al-Khair Plant", "type": "Hard Asset", "detail": "World's largest hybrid plant (2.9M m³/day)", "status": "Operational" },
                    { "name": "Ras Al-Khair 2 (IWP)", "type": "Investment", "detail": "600k m³/day SWRO (2028 Target)", "status": "Tendering" }
                ],
                "policies": [
                    { "name": "Principal Buyer Model", "type": "Regulatory Tool", "detail": "SWPC guarantees purchase to de-risk private CAPEX." }
                ],
                "supply_chain": [
                    { "name": "Membrane Localization", "type": "Economic", "detail": "Domestic manufacturing of RO elements (SAR 114bn impact)." }
                ]
            }
        },
        {
            "id": "central",
            "name": "Central Region",
            "tagline": "The Consumption Hub",
            "strategic_context": {
                "unemployment": "Low",
                "service_coverage": "Low (Water Gap)",
                "diversification": "Leading"
            },
            "sector_kpis": [
                { "label": "Water", "value": "4.1M m³", "trend": "down" },
                { "label": "Energy", "value": "8.2 GW", "trend": "up" },
                { "label": "Mining", "value": "Low", "trend": "stable" },
                { "label": "Industry", "value": "Medium", "trend": "up" },
                { "label": "Logis.", "value": "High", "trend": "up" },
                { "label": "Giga", "value": "Qiddiya", "trend": "up" }
            ],
            "radar_scores": { "security": 88, "efficiency": 40, "sustainability": 50, "innovation": 70, "localization": 60 },
            "drill_down": {
                "assets": [
                    { "name": "Riyadh Main Reservoirs", "type": "Hard Asset", "detail": "World's largest storage (4.79M m³)", "status": "Operational" },
                    { "name": "Riyadh-Qassim IWTP", "type": "Pipeline", "detail": "685k m³/day transmission bridge", "status": "Construction" }
                ],
                "policies": [
                    { "name": "Qatrah Program", "type": "Behavioral Tool", "detail": "Mandating consumption caps to reduce per capita usage (272 L/day)." }
                ],
                "supply_chain": [
                    { "name": "Kashif Program", "type": "Service Chain", "detail": "48 independent auditors certified for leak detection." }
                ]
            }
        },
        {
            "id": "west",
            "name": "Western Region",
            "tagline": "The Gateway",
            "strategic_context": {
                "unemployment": "Moderate",
                "service_coverage": "High",
                "diversification": "Leading"
            },
            "sector_kpis": [
                { "label": "Water", "value": "3.8M m³", "trend": "up" },
                { "label": "Energy", "value": "9.1 GW", "trend": "down" },
                { "label": "Mining", "value": "High", "trend": "up" },
                { "label": "Industry", "value": "Medium", "trend": "stable" },
                { "label": "Logis.", "value": "V. High", "trend": "up" },
                { "label": "Giga", "value": "Red Sea", "trend": "up" }
            ],
            "radar_scores": { "security": 90, "efficiency": 85, "sustainability": 75, "innovation": 60, "localization": 70 },
            "drill_down": {
                "assets": [
                    { "name": "Jeddah Airport", "type": "Transport", "detail": "New Terminal Expansion", "status": "Operational" }
                ],
                "policies": [], "supply_chain": []
            }
        },
        {
            "id": "north",
            "name": "Northern Region",
            "tagline": "New Frontiers",
            "strategic_context": {
                "unemployment": "High (Crisis)",
                "service_coverage": "Low",
                "diversification": "Lagging"
            },
            "sector_kpis": [
                { "label": "Water", "value": "1.2M m³", "trend": "up" },
                { "label": "Energy", "value": "4.5 GW", "trend": "up" },
                { "label": "Mining", "value": "Phosphate", "trend": "up" },
                { "label": "Industry", "value": "Low", "trend": "stable" },
                { "label": "Logis.", "value": "Low", "trend": "stable" },
                { "label": "Giga", "value": "NEOM", "trend": "rub" }
            ],
            "radar_scores": { "security": 70, "efficiency": 60, "sustainability": 90, "innovation": 95, "localization": 50 },
            "drill_down": {
                "assets": [], "policies": [], "supply_chain": []
            }
        }
    ],
    "financial_context": {
        "budget_trend": "decreasing",
    }
};

export const DASHBOARD_TO_DATA_REGIONS: Record<string, string[]> = {
    'Western Region': ['Makkah', 'Madinah', 'Tabuk', 'Western', 'Jazan', 'Aseer', 'Al-Baha', 'Najran'],
    'Northern Region': ['Northern Borders', 'Al-Jouf', 'Hail', 'Tabuk', 'Northern', 'The Line', 'NEOM'], // Added NEOM/The Line cover
    'Central Region': ['Riyadh', 'Qassim', 'Hail', 'Central'],
    'Eastern Region': ['Eastern Region', 'Eastern Province', 'Eastern', 'Ras Al-Khair', 'Jubail'], // Enhanced coverage
    'Southern Region': ['Asir', 'Jazan', 'Najran', 'Southern']
};
