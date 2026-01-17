/**
 * ONTOLOGY-GROUNDED DATA MODEL v2.0
 * KSA National Industrial Ecosystem Platform
 * 
 * ID PATTERN RULES (Ontology compliant):
 * - L1 nodes: x.0 (1.0, 2.0, 3.0)
 * - L2 nodes: x.y (1.1, 2.3, 4.5)
 * - L3 nodes: x.y.z (1.1.1, 3.2.4, 2.5.2)
 * 
 * All properties from ontology schemas
 * Explicit relationship definitions
 */

const ontologyData = {
    // ========================================
    // SECTOR LAYER (External/Stakeholder)
    // ========================================
    
    sectorObjectives: [
        {
            id: '1.0',  // L1 pattern
            name: 'Industrial Value Addition',
            year: 2025,
            level: 'L1',
            status: 'Amber',
            target: 100,
            baseline: 60,
            priority_level: 'Critical',
            indicator_type: 'Strategic',
            frequency: 'Annual',
            timeframe: '2025-2030',
            budget_allocated: 50000000000,
            rationale: 'Increase non-oil GDP contribution',
            expected_outcomes: 'Diversified economy, reduced oil dependence'
        },
        {
            id: '1.1',  // L2 pattern (child of 1.0)
            name: 'Manufacturing Growth',
            year: 2025,
            level: 'L2',
            status: 'Red',
            target: 80,
            baseline: 35,
            priority_level: 'Critical',
            indicator_type: 'Strategic',
            frequency: 'Quarterly',
            timeframe: '2025-2027',
            budget_allocated: 30000000000,
            rationale: 'Build globally competitive manufacturing sector',
            expected_outcomes: 'Increased exports, job creation',
            parent_id: '1.0',
            parent_year: 2025
        },
        {
            id: '1.1.1',  // L3 pattern (child of 1.1)
            name: 'Production Efficiency',
            year: 2025,
            level: 'L3',
            status: 'Red',
            target: 15,
            baseline: 8,
            priority_level: 'High',
            indicator_type: 'Process',
            frequency: 'Monthly',
            timeframe: '2025',
            budget_allocated: 5000000000,
            rationale: 'Improve manufacturing output per unit',
            expected_outcomes: 'Higher productivity',
            parent_id: '1.1',
            parent_year: 2025
        },
        {
            id: '2.0',  // L1 pattern
            name: 'Downstream Integration',
            year: 2025,
            level: 'L1',
            status: 'Green',
            target: 90,
            baseline: 82,
            priority_level: 'High',
            indicator_type: 'Strategic',
            frequency: 'Annual',
            timeframe: '2025-2030',
            budget_allocated: 20000000000,
            rationale: 'Maximize value from raw materials',
            expected_outcomes: 'Higher margins, local value capture'
        },
        {
            id: '2.1',  // L2 pattern (child of 2.0)
            name: 'Mining Production Volume',
            year: 2025,
            level: 'L2',
            status: 'Green',
            target: 100,
            baseline: 95,
            priority_level: 'High',
            indicator_type: 'Operational',
            frequency: 'Quarterly',
            timeframe: '2025',
            budget_allocated: 10000000000,
            rationale: 'Increase mining output',
            expected_outcomes: 'More raw material supply',
            parent_id: '2.0',
            parent_year: 2025
        }
    ],
    
    sectorPolicyTools: [
        {
            id: '1.0',  // L1 pattern
            name: 'Investment Incentives',
            year: 2025,
            level: 'L1',
            status: 'Active',
            quarter: 'Q2',
            tool_type: 'Financial Instrument',
            delivery_channel: 'MISA',
            impact_target: 'Foreign Direct Investment',
            cost_of_implementation: 5000000000
        },
        {
            id: '1.1',  // L2 pattern (child of 1.0)
            name: 'Manufacturing Subsidies',
            year: 2025,
            level: 'L2',
            status: 'Active',
            quarter: 'Q2',
            tool_type: 'Financial Instrument',
            delivery_channel: 'SIDF',
            impact_target: 'Domestic Production',
            cost_of_implementation: 3000000000,
            parent_id: '1.0',
            parent_year: 2025
        },
        {
            id: '2.0',  // L1 pattern
            name: 'Mining Regulations',
            year: 2025,
            level: 'L1',
            status: 'Active',
            quarter: 'Q2',
            tool_type: 'Regulation',
            delivery_channel: 'MIMAR',
            impact_target: 'Resource Extraction',
            cost_of_implementation: 500000000
        },
        {
            id: '2.1',  // L2 pattern (child of 2.0)
            name: 'Environmental Compliance',
            year: 2025,
            level: 'L2',
            status: 'Active',
            quarter: 'Q2',
            tool_type: 'Regulation',
            delivery_channel: 'MIMAR',
            impact_target: 'Sustainable Mining',
            cost_of_implementation: 200000000,
            parent_id: '2.0',
            parent_year: 2025
        }
    ],
    
    sectorPerformance: [
        {
            id: '1.0',  // L1 - Strategic KPI
            name: 'Non-Oil GDP Contribution',
            year: 2025,
            level: 'L1',
            quarter: 'Q2',
            status: 'Green',
            target: 50,
            actual: 48,
            kpi_type: 'Strategic',
            description: 'Percentage of GDP from non-oil sectors',
            calculation_formula: '(Non-Oil GDP / Total GDP) * 100',
            measurement_frequency: 'Quarterly',
            data_source: 'SAMA',
            thresholds: { green: 48, amber: 45, red: 42 },
            unit: 'Percentage',
            frequency: 'Quarterly'
        },
        {
            id: '1.1',  // L2 - Operational KPI (child of 1.0)
            name: 'Manufacturing Output Growth',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Red',
            target: 15,
            actual: 8,
            kpi_type: 'Operational',
            description: 'YoY growth in manufacturing output',
            calculation_formula: '((Current - Previous) / Previous) * 100',
            measurement_frequency: 'Quarterly',
            data_source: 'GASTAT',
            thresholds: { green: 14, amber: 10, red: 8 },
            unit: 'Percentage',
            frequency: 'Quarterly',
            parent_id: '1.0',
            parent_year: 2025
        },
        {
            id: '1.1.1',  // L3 - Transactional Metric (child of 1.1)
            name: 'Daily Production Volume',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Red',
            target: 10000,
            actual: 7500,
            kpi_type: 'Transactional',
            description: 'Daily manufacturing output in units',
            calculation_formula: 'SUM(daily_output)',
            measurement_frequency: 'Daily',
            data_source: 'Factory Systems',
            thresholds: { green: 9500, amber: 8500, red: 7500 },
            unit: 'Units',
            frequency: 'Daily',
            parent_id: '1.1',
            parent_year: 2025
        },
        {
            id: '2.0',  // L1 - Strategic KPI
            name: 'Resource Extraction Index',
            year: 2025,
            level: 'L1',
            quarter: 'Q2',
            status: 'Green',
            target: 100,
            actual: 105,
            kpi_type: 'Strategic',
            description: 'Total mining output indexed',
            calculation_formula: '(Actual Tonnage / Baseline) * 100',
            measurement_frequency: 'Quarterly',
            data_source: 'MIMAR',
            thresholds: { green: 95, amber: 85, red: 75 },
            unit: 'Index',
            frequency: 'Quarterly'
        },
        {
            id: '2.1',  // L2 - Operational KPI (child of 2.0)
            name: 'Mining Production Volume',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Green',
            target: 5000000,
            actual: 5250000,
            kpi_type: 'Operational',
            description: 'Total tonnage extracted',
            calculation_formula: 'SUM(extraction_tonnage)',
            measurement_frequency: 'Monthly',
            data_source: 'Mining Systems',
            thresholds: { green: 4750000, amber: 4250000, red: 3750000 },
            unit: 'Tonnes',
            frequency: 'Monthly',
            parent_id: '2.0',
            parent_year: 2025
        },
        {
            id: '1.2',  // L2 - Operational KPI (child of 1.0)
            name: 'Export Volume Growth',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Amber',
            target: 20,
            actual: 12,
            kpi_type: 'Operational',
            description: 'YoY growth in non-oil exports',
            calculation_formula: '((Current - Previous) / Previous) * 100',
            measurement_frequency: 'Quarterly',
            data_source: 'Customs',
            thresholds: { green: 18, amber: 12, red: 8 },
            unit: 'Percentage',
            frequency: 'Quarterly',
            parent_id: '1.0',
            parent_year: 2025
        }
    ],
    
    sectorBusinesses: [
        {
            id: '1.1.1',  // L3 pattern
            name: 'Northern Mining Corp',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            operating_sector: 'Mining',
            location: 'Arar',
            latitude: 30.97,
            longitude: 41.04
        },
        {
            id: '1.1.2',  // L3 pattern
            name: 'Ma\'aden Phosphate',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            operating_sector: 'Mining',
            location: 'Arar',
            latitude: 30.98,
            longitude: 41.05
        },
        {
            id: '2.2.1',  // L3 pattern
            name: 'SABIC Jubail Complex',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            operating_sector: 'Petrochemicals',
            location: 'Jubail',
            latitude: 27.00,
            longitude: 49.66
        },
        {
            id: '2.2.2',  // L3 pattern
            name: 'Yanbu Petrochemical',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            operating_sector: 'Petrochemicals',
            location: 'Yanbu',
            latitude: 24.09,
            longitude: 38.06
        },
        {
            id: '3.3.1',  // L3 pattern
            name: 'Riyadh Auto Assembly',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            operating_sector: 'Manufacturing',
            location: 'Riyadh',
            latitude: 24.71,
            longitude: 46.67
        },
        {
            id: '4.4.1',  // L3 pattern
            name: 'Jeddah Industrial Port',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            operating_sector: 'Logistics',
            location: 'Jeddah',
            latitude: 21.54,
            longitude: 39.20
        }
    ],
    
    sectorDataTransactions: [
        {
            id: '1.1.1',  // L3 pattern
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '1.1',
            parent_year: 2025,
            transaction_type: 'Material Transfer',
            domain: 'Mining',
            department: 'Logistics',
            source_business_id: '1.1.1',
            target_business_id: '2.2.1'
        },
        {
            id: '1.1.2',  // L3 pattern
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '1.1',
            parent_year: 2025,
            transaction_type: 'Material Transfer',
            domain: 'Mining',
            department: 'Logistics',
            source_business_id: '1.1.2',
            target_business_id: '2.2.1'
        },
        {
            id: '2.2.1',  // L3 pattern
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '2.2',
            parent_year: 2025,
            transaction_type: 'Product Transfer',
            domain: 'Petrochemicals',
            department: 'Manufacturing',
            source_business_id: '2.2.1',
            target_business_id: '3.3.1'
        },
        {
            id: '3.3.1',  // L3 pattern
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '3.3',
            parent_year: 2025,
            transaction_type: 'Export Shipment',
            domain: 'Logistics',
            department: 'Export',
            source_business_id: '3.3.1',
            target_business_id: '4.4.1'
        },
        {
            id: '1.1.3',  // L3 pattern
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '1.1',
            parent_year: 2025,
            transaction_type: 'Business Registration',
            domain: 'Licensing',
            department: 'Compliance',
            source_business_id: '1.1.1',
            target_business_id: null
        }
    ],
    
    // ========================================
    // ENTITY LAYER (Internal/Operations)
    // ========================================
    
    entityCapabilities: [
        {
            id: '1.0',  // L1 pattern - Business Domain
            name: 'Investment Services',
            year: 2025,
            level: 'L1',
            quarter: 'Q2',
            status: 'Developing',
            description: 'Ability to attract and manage investments',
            maturity_level: 2,
            target_maturity_level: 4
        },
        {
            id: '1.1',  // L2 pattern - Functional Knowledge
            name: 'FDI Promotion',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Developing',
            description: 'Ability to attract foreign direct investment',
            maturity_level: 2,
            target_maturity_level: 4,
            parent_id: '1.0',
            parent_year: 2025
        },
        {
            id: '1.1.1',  // L3 pattern - Specific Competency
            name: 'Pipeline Management',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Developing',
            description: 'Track and nurture investment opportunities',
            maturity_level: 2,
            target_maturity_level: 4,
            parent_id: '1.1',
            parent_year: 2025
        },
        {
            id: '2.0',  // L1 pattern
            name: 'Manufacturing Services',
            year: 2025,
            level: 'L1',
            quarter: 'Q2',
            status: 'Developing',
            description: 'Technical assistance for manufacturers',
            maturity_level: 1,
            target_maturity_level: 4
        },
        {
            id: '2.1',  // L2 pattern
            name: 'Manufacturing Support',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Developing',
            description: 'Technical assistance for manufacturers',
            maturity_level: 1,
            target_maturity_level: 4,
            parent_id: '2.0',
            parent_year: 2025
        },
        {
            id: '2.1.1',  // L3 pattern
            name: 'Quality Assurance Consulting',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Developing',
            description: 'Help manufacturers meet quality standards',
            maturity_level: 1,
            target_maturity_level: 4,
            parent_id: '2.1',
            parent_year: 2025
        },
        {
            id: '3.0',  // L1 pattern
            name: 'Mining Services',
            year: 2025,
            level: 'L1',
            quarter: 'Q2',
            status: 'Operational',
            description: 'Regulatory oversight of mining operations',
            maturity_level: 4,
            target_maturity_level: 4
        },
        {
            id: '3.1',  // L2 pattern
            name: 'Mining Oversight',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Operational',
            description: 'Regulatory oversight of mining operations',
            maturity_level: 4,
            target_maturity_level: 4,
            parent_id: '3.0',
            parent_year: 2025
        }
    ],
    
    entityProjects: [
        {
            id: '1.0',  // L1 pattern - Portfolio
            name: 'Digital Transformation',
            year: 2025,
            level: 'L1',
            quarter: 'Q2',
            status: 'Active',
            progress_percentage: 70,
            start_date: '2024-01-01',
            end_date: '2026-12-31'
        },
        {
            id: '1.1',  // L2 pattern - Program
            name: 'Stakeholder Engagement Systems',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Active',
            progress_percentage: 75,
            start_date: '2024-03-01',
            end_date: '2025-12-31',
            parent_id: '1.0',
            parent_year: 2025
        },
        {
            id: '1.1.1',  // L3 pattern - Project
            name: 'CRM System Implementation',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Active',
            progress_percentage: 65,
            start_date: '2024-06-01',
            end_date: '2025-12-31',
            parent_id: '1.1',
            parent_year: 2025
        },
        {
            id: '1.1.2',  // L3 pattern - Project
            name: 'Stakeholder Portal Development',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Active',
            progress_percentage: 85,
            start_date: '2024-03-01',
            end_date: '2025-09-30',
            parent_id: '1.1',
            parent_year: 2025
        },
        {
            id: '2.1',  // L2 pattern - Program
            name: 'Capacity Building',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            status: 'Active',
            progress_percentage: 50,
            start_date: '2024-09-01',
            end_date: '2026-06-30',
            parent_id: '1.0',
            parent_year: 2025
        },
        {
            id: '2.1.1',  // L3 pattern - Project
            name: 'Technical Team Hiring',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Delayed',
            progress_percentage: 40,
            start_date: '2024-09-01',
            end_date: '2025-06-30',
            parent_id: '2.1',
            parent_year: 2025
        },
        {
            id: '2.1.2',  // L3 pattern - Project
            name: 'Process Automation Initiative',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Active',
            progress_percentage: 92,
            start_date: '2024-01-01',
            end_date: '2025-05-31',
            parent_id: '2.1',
            parent_year: 2025
        }
    ],
    
    entityRisks: [
        {
            id: '1.0',  // L1 pattern - Risk Domain
            name: 'External Risks',
            year: 2025,
            level: 'L1',
            quarter: 'Q2',
            risk_category: 'External',
            risk_status: 'Active',
            risk_score: 7.5
        },
        {
            id: '1.1',  // L2 pattern - Risk Functional Group
            name: 'Vendor Risks',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            parent_id: '1.0',
            parent_year: 2025,
            risk_category: 'External',
            risk_status: 'Active',
            risk_score: 8.0
        },
        {
            id: '1.1.1',  // L3 pattern - Specific Risk
            name: 'Vendor Delivery Delay',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '1.1',
            parent_year: 2025,
            risk_category: 'External',
            risk_status: 'Active',
            risk_score: 8.5,
            risk_description: 'IT vendor behind schedule on CRM delivery',
            risk_owner: 'IT Director',
            risk_reviewer: 'COO',
            likelihood_of_delay: 'High',
            delay_days: 45,
            mitigation_strategy: 'Activate penalty clauses, engage backup vendor',
            identified_date: '2025-04-15',
            last_review_date: '2025-06-01',
            next_review_date: '2025-07-01',
            kpi: 'Project Completion',
            threshold_red: 90,
            threshold_amber: 75,
            threshold_green: 90,
            operational_health_score: 6.5,
            people_score: 7,
            process_score: 6,
            tools_score: 6
        },
        {
            id: '2.1',  // L2 pattern - Risk Functional Group
            name: 'Internal Capacity Risks',
            year: 2025,
            level: 'L2',
            quarter: 'Q2',
            parent_id: '1.0',
            parent_year: 2025,
            risk_category: 'Internal',
            risk_status: 'Active',
            risk_score: 7.0
        },
        {
            id: '2.1.1',  // L3 pattern - Specific Risk
            name: 'Talent Acquisition Gap',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '2.1',
            parent_year: 2025,
            risk_category: 'Internal',
            risk_status: 'Active',
            risk_score: 7.0,
            risk_description: 'Difficulty hiring specialized technical roles',
            risk_owner: 'HR Director',
            risk_reviewer: 'COO',
            likelihood_of_delay: 'Medium',
            delay_days: 60,
            mitigation_strategy: 'International recruitment, training programs',
            identified_date: '2025-03-01',
            last_review_date: '2025-06-01',
            next_review_date: '2025-07-15',
            kpi: 'Headcount Target',
            threshold_red: 80,
            threshold_amber: 90,
            threshold_green: 100,
            operational_health_score: 7.0,
            people_score: 6,
            process_score: 7,
            tools_score: 8
        }
    ],
    
    entityChangeAdoption: [
        {
            id: '1.1.1',  // L3 pattern
            name: 'CRM User Adoption',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Planned',
            parent_year: 2025
        },
        {
            id: '1.1.2',  // L3 pattern
            name: 'Portal Training Completion',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'In Progress',
            parent_year: 2025
        },
        {
            id: '2.1.2',  // L3 pattern
            name: 'Automation Workflow Adoption',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            status: 'Completed',
            parent_year: 2025
        }
    ],
    
    entityOrgUnits: [
        {
            id: '1.1.1',  // L3 pattern - Team
            name: 'Investment Services Team',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            parent_id: '1.1',
            parent_year: 2025,
            unit_type: 'Operational',
            head_of_unit: 'Ahmed Al-Rashid',
            headcount: 12,
            location: 'Riyadh',
            budget: 5000000,
            annual_budget: 5000000,
            gap: 'Understaffed by 3 FTE'
        }
    ],
    
    entityITSystems: [
        {
            id: '1.1.1',  // L3 pattern - Feature
            name: 'Investment CRM',
            year: 2025,
            level: 'L3',
            quarter: 'Q2',
            system_type: 'Application',
            operational_status: 'Under Development',
            vendor_supplier: 'Oracle',
            technology_stack: 'Cloud SaaS',
            deployment_date: '2025-12-31',
            owner: 'IT Department',
            criticality: 'High',
            licensing: 'Subscription',
            acquisition_cost: 2000000,
            annual_maintenance_costs: 400000,
            number_of_modules: 5
        }
    ],
    
    // ========================================
    // RELATIONSHIPS (Explicit Edges)
    // ========================================
    
    relationships: {
        // Hierarchical (PARENT_OF) - L1 → L2 → L3 within same type
        parent_of: [
            // SectorObjective hierarchy
            { source: '1.0', target: '1.1', year: 2025 },
            { source: '1.1', target: '1.1.1', year: 2025 },
            { source: '2.0', target: '2.1', year: 2025 },
            // SectorPolicyTool hierarchy
            { source: '1.0', target: '1.1', year: 2025, type: 'SectorPolicyTool' },
            { source: '2.0', target: '2.1', year: 2025, type: 'SectorPolicyTool' },
            // SectorPerformance hierarchy
            { source: '1.0', target: '1.1', year: 2025, type: 'SectorPerformance' },
            { source: '1.1', target: '1.1.1', year: 2025, type: 'SectorPerformance' },
            { source: '1.0', target: '1.2', year: 2025, type: 'SectorPerformance' },
            { source: '2.0', target: '2.1', year: 2025, type: 'SectorPerformance' },
            // EntityCapability hierarchy
            { source: '1.0', target: '1.1', year: 2025, type: 'EntityCapability' },
            { source: '1.1', target: '1.1.1', year: 2025, type: 'EntityCapability' },
            { source: '2.0', target: '2.1', year: 2025, type: 'EntityCapability' },
            { source: '2.1', target: '2.1.1', year: 2025, type: 'EntityCapability' },
            { source: '3.0', target: '3.1', year: 2025, type: 'EntityCapability' },
            // EntityProject hierarchy
            { source: '1.0', target: '1.1', year: 2025, type: 'EntityProject' },
            { source: '1.1', target: '1.1.1', year: 2025, type: 'EntityProject' },
            { source: '1.1', target: '1.1.2', year: 2025, type: 'EntityProject' },
            { source: '1.0', target: '2.1', year: 2025, type: 'EntityProject' },
            { source: '2.1', target: '2.1.1', year: 2025, type: 'EntityProject' },
            { source: '2.1', target: '2.1.2', year: 2025, type: 'EntityProject' },
            // EntityRisk hierarchy
            { source: '1.0', target: '1.1', year: 2025, type: 'EntityRisk' },
            { source: '1.1', target: '1.1.1', year: 2025, type: 'EntityRisk' },
            { source: '1.0', target: '2.1', year: 2025, type: 'EntityRisk' },
            { source: '2.1', target: '2.1.1', year: 2025, type: 'EntityRisk' }
        ],
        
        // Sector Operations Chain
        realized_via: [
            { source: '1.0', target: '1.0', year: 2025, sourceType: 'SectorObjective', targetType: 'SectorPolicyTool' },
            { source: '2.0', target: '2.0', year: 2025, sourceType: 'SectorObjective', targetType: 'SectorPolicyTool' }
        ],
        
        governed_by: [
            { source: '1.0', target: '1.0', year: 2025, sourceType: 'SectorPolicyTool', targetType: 'SectorObjective' },
            { source: '2.0', target: '2.0', year: 2025, sourceType: 'SectorPolicyTool', targetType: 'SectorObjective' }
        ],
        
        cascaded_via: [
            { source: '1.0', target: '1.0', year: 2025, sourceType: 'SectorObjective', targetType: 'SectorPerformance' },
            { source: '2.0', target: '2.0', year: 2025, sourceType: 'SectorObjective', targetType: 'SectorPerformance' }
        ],
        
        measured_by: [
            { source: '1.1.1', target: '2.1', year: 2025, sourceType: 'SectorDataTransaction', targetType: 'SectorPerformance' },
            { source: '1.1.2', target: '2.1', year: 2025, sourceType: 'SectorDataTransaction', targetType: 'SectorPerformance' },
            { source: '2.2.1', target: '1.1', year: 2025, sourceType: 'SectorDataTransaction', targetType: 'SectorPerformance' },
            { source: '1.1.3', target: '1.0', year: 2025, sourceType: 'SectorDataTransaction', targetType: 'SectorPerformance' }
        ],
        
        aggregates_to: [
            { source: '1.0', target: '1.0', year: 2025, sourceType: 'SectorPerformance', targetType: 'SectorObjective' },
            { source: '2.0', target: '2.0', year: 2025, sourceType: 'SectorPerformance', targetType: 'SectorObjective' }
        ],
        
        triggers_event: [
            { source: '1.1.1', target: '1.1.1', year: 2025, sourceType: 'SectorBusiness', targetType: 'SectorDataTransaction' },
            { source: '1.1.2', target: '1.1.2', year: 2025, sourceType: 'SectorBusiness', targetType: 'SectorDataTransaction' },
            { source: '2.2.1', target: '2.2.1', year: 2025, sourceType: 'SectorBusiness', targetType: 'SectorDataTransaction' },
            { source: '3.3.1', target: '3.3.1', year: 2025, sourceType: 'SectorBusiness', targetType: 'SectorDataTransaction' },
            { source: '1.1.1', target: '1.1.3', year: 2025, sourceType: 'SectorBusiness', targetType: 'SectorDataTransaction' }
        ],
        
        // Sector-Entity Bridge (Cross-Domain)
        sets_targets: [
            { source: '1.1', target: '2.1', year: 2025, sourceType: 'SectorPerformance', targetType: 'EntityCapability' },
            { source: '1.2', target: '1.1', year: 2025, sourceType: 'SectorPerformance', targetType: 'EntityCapability' },
            { source: '2.1', target: '3.1', year: 2025, sourceType: 'SectorPerformance', targetType: 'EntityCapability' }
        ],
        
        executes: [
            { source: '1.1', target: '1.1', year: 2025, sourceType: 'EntityCapability', targetType: 'SectorPolicyTool' },
            { source: '3.1', target: '2.1', year: 2025, sourceType: 'EntityCapability', targetType: 'SectorPolicyTool' }
        ],
        
        reports: [
            { source: '1.1', target: '1.2', year: 2025, sourceType: 'EntityCapability', targetType: 'SectorPerformance' },
            { source: '2.1', target: '1.1', year: 2025, sourceType: 'EntityCapability', targetType: 'SectorPerformance' },
            { source: '3.1', target: '2.1', year: 2025, sourceType: 'EntityCapability', targetType: 'SectorPerformance' }
        ],
        
        // Entity Internal
        gaps_scope: [
            { source: '1.1', target: '1.1.1', year: 2025, sourceType: 'EntityCapability', targetType: 'EntityProject' },
            { source: '1.1', target: '1.1.2', year: 2025, sourceType: 'EntityCapability', targetType: 'EntityProject' },
            { source: '2.1', target: '2.1.1', year: 2025, sourceType: 'EntityCapability', targetType: 'EntityProject' },
            { source: '2.1', target: '2.1.2', year: 2025, sourceType: 'EntityCapability', targetType: 'EntityProject' }
        ],
        
        close_gaps: [
            { source: '1.1.1', target: '1.1.1', year: 2025, sourceType: 'EntityProject', targetType: 'EntityITSystem' },
            { source: '1.1.2', target: '1.1.1', year: 2025, sourceType: 'EntityProject', targetType: 'EntityITSystem' },
            { source: '2.1.1', target: '1.1.1', year: 2025, sourceType: 'EntityProject', targetType: 'EntityOrgUnit' }
        ],
        
        operates: [
            { source: '1.1.1', target: '1.1', year: 2025, sourceType: 'EntityITSystem', targetType: 'EntityCapability' },
            { source: '1.1.1', target: '1.1', year: 2025, sourceType: 'EntityOrgUnit', targetType: 'EntityCapability' }
        ],
        
        monitored_by: [
            { source: '1.1.1', target: '1.1.1', year: 2025, sourceType: 'EntityCapability', targetType: 'EntityRisk' },
            { source: '2.1', target: '2.1.1', year: 2025, sourceType: 'EntityCapability', targetType: 'EntityRisk' }
        ],
        
        adoption_risks: [
            { source: '1.1.1', target: '1.1.1', year: 2025, sourceType: 'EntityProject', targetType: 'EntityChangeAdoption' },
            { source: '1.1.2', target: '1.1.2', year: 2025, sourceType: 'EntityProject', targetType: 'EntityChangeAdoption' },
            { source: '2.1.2', target: '2.1.2', year: 2025, sourceType: 'EntityProject', targetType: 'EntityChangeAdoption' }
        ],
        
        // Risk Management (Cross-Domain via levels)
        informs: [
            { source: '1.1.1', target: '1.2', year: 2025, sourceType: 'EntityRisk', targetType: 'SectorPerformance' },
            { source: '2.1.1', target: '1.1', year: 2025, sourceType: 'EntityRisk', targetType: 'SectorPerformance' }
        ]
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.ontologyData = ontologyData;
}
