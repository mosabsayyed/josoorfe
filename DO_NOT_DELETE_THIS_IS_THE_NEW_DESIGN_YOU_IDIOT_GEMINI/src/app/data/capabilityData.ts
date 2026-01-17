/**
 * CAPABILITY MATRIX DATA
 * 3-Level hierarchy: L1 (Capability Domain) → L2 (Capability Area) → L3 (Specific Capability)
 */

export interface L3Capability {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'at-risk';
  maturity_level: number; // 1-5
  target_maturity_level: number; // 1-5
  staff_gap: number; // Number of additional staff needed
  tools_gap: number; // Number of missing IT tools
  docs_complete: number; // Percentage 0-100
  team_health: number; // Score 0-100
  change_adoption: number; // Percentage 0-100 (for Change Adoption overlay)
  // New fields for Build vs Execute mode
  mode: 'build' | 'execute'; // Determines if capability is in build or execute phase
  build_status?: 'not-due' | 'planned' | 'in-progress-ontrack' | 'in-progress-atrisk' | 'in-progress-issues';
  execute_status?: 'ontrack' | 'at-risk' | 'issues';
  year: number; // 2025-2029
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  
  // NEW OVERLAY FIELDS
  // 1. Risk Exposure (mode-aware)
  expected_delay_days?: number; // BUILD mode: Expected delay in days
  exposure_percent?: number; // Both modes: Risk exposure percentage
  exposure_trend?: 'improving' | 'stable' | 'declining'; // EXECUTE mode: Trend direction
  
  // 2. External Pressure
  policy_tool_count?: number; // Count of policy tools setting priorities
  performance_target_count?: number; // Count of performance targets
  
  // 3. Footprint Stress (Org/Process/IT imbalance)
  org_gap?: number; // 0-100% - People gaps (leader + staff)
  process_gap?: number; // 0-100% - Deep knowledge/know-how gaps
  it_gap?: number; // 0-100% - Automation + auxiliary tools gaps
  
  // 4. Change Saturation
  active_projects_count?: number; // Number of active projects touching this capability
  adoption_load?: 'low' | 'medium' | 'high'; // Change adoption load band
  adoption_load_percent?: number; // Exact percentage for hover (0-100)
  
  // 5. Trend Early Warning
  health_history?: number[]; // Last 3 cycles health scores for trend detection
}

export interface L2Capability {
  id: string;
  name: string;
  description: string;
  maturity_level: number;
  target_maturity_level: number;
  l3: L3Capability[];
}

export interface L1Capability {
  id: string;
  name: string;
  description: string;
  maturity_level: number;
  target_maturity_level: number;
  l2: L2Capability[];
}

export const capabilityMatrix: L1Capability[] = [
  {
    id: '1.0',
    name: 'Water Resource Management',
    description: 'Strategic planning and allocation of water resources',
    maturity_level: 3,
    target_maturity_level: 5,
    l2: [
      {
        id: '1.1',
        name: 'Demand Forecasting',
        description: 'Predict and plan for future water demand',
        maturity_level: 3,
        target_maturity_level: 4,
        l3: [
          {
            id: '1.1.1',
            name: 'Urban Demand',
            status: 'active',
            maturity_level: 5,
            target_maturity_level: 5,
            staff_gap: 0,
            tools_gap: 0,
            docs_complete: 98,
            team_health: 96,
            change_adoption: 97,
            mode: 'execute' as const,
            execute_status: 'ontrack' as const,
            year: 2025,
            quarter: 'Q1' as const,
            // Overlay data
            exposure_percent: 8,
            exposure_trend: 'stable' as const,
            policy_tool_count: 2,
            performance_target_count: 3,
            org_gap: 5,
            process_gap: 10,
            it_gap: 8,
            active_projects_count: 2,
            adoption_load: 'low' as const,
            adoption_load_percent: 25,
            health_history: [94, 95, 96]
          },
          {
            id: '1.1.2',
            name: 'Industrial Demand',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 1,
            tools_gap: 1,
            docs_complete: 92,
            team_health: 90,
            change_adoption: 91,
            mode: 'execute' as const,
            execute_status: 'ontrack' as const,
            year: 2025,
            quarter: 'Q2' as const,
            // Overlay data
            exposure_percent: 12,
            exposure_trend: 'improving' as const,
            policy_tool_count: 3,
            performance_target_count: 2,
            org_gap: 15,
            process_gap: 8,
            it_gap: 12,
            active_projects_count: 3,
            adoption_load: 'medium' as const,
            adoption_load_percent: 45,
            health_history: [88, 89, 90]
          },
          {
            id: '1.1.3',
            name: 'Agricultural Demand',
            status: 'pending',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 88,
            team_health: 87,
            change_adoption: 86,
            mode: 'build' as const,
            build_status: 'planned' as const,
            year: 2026,
            quarter: 'Q1' as const,
            // Overlay data
            expected_delay_days: 25,
            exposure_percent: 35,
            policy_tool_count: 4,
            performance_target_count: 3,
            org_gap: 20,
            process_gap: 30,
            it_gap: 25,
            active_projects_count: 1,
            adoption_load: 'low' as const,
            adoption_load_percent: 20,
            health_history: [87, 87, 87]
          },
          {
            id: '1.1.4',
            name: 'Seasonal Modeling',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 91,
            team_health: 89,
            change_adoption: 90,
            mode: 'execute' as const,
            execute_status: 'at-risk' as const,
            year: 2025,
            quarter: 'Q3' as const,
            // Overlay data
            exposure_percent: 22,
            exposure_trend: 'declining' as const,
            policy_tool_count: 2,
            performance_target_count: 4,
            org_gap: 25,
            process_gap: 18,
            it_gap: 15,
            active_projects_count: 4,
            adoption_load: 'medium' as const,
            adoption_load_percent: 55,
            health_history: [92, 91, 89]
          },
          {
            id: '1.1.5',
            name: 'Climate Impact',
            status: 'at-risk',
            maturity_level: 3,
            target_maturity_level: 5,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 78,
            team_health: 75,
            change_adoption: 77,
            mode: 'build' as const,
            build_status: 'in-progress-issues' as const,
            year: 2026,
            quarter: 'Q2' as const,
            // Overlay data
            expected_delay_days: 65,
            exposure_percent: 72,
            policy_tool_count: 5,
            performance_target_count: 6,
            org_gap: 45,
            process_gap: 55,
            it_gap: 38,
            active_projects_count: 6,
            adoption_load: 'high' as const,
            adoption_load_percent: 82,
            health_history: [75, 75, 75]
          },
          {
            id: '1.1.6',
            name: 'Growth Scenarios',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 1,
            tools_gap: 0,
            docs_complete: 94,
            team_health: 92,
            change_adoption: 93,
            mode: 'execute' as const,
            execute_status: 'ontrack' as const,
            year: 2025,
            quarter: 'Q4' as const,
            // Overlay data
            exposure_percent: 6,
            exposure_trend: 'improving' as const,
            policy_tool_count: 1,
            performance_target_count: 2,
            org_gap: 8,
            process_gap: 5,
            it_gap: 3,
            active_projects_count: 2,
            adoption_load: 'low' as const,
            adoption_load_percent: 18,
            health_history: [90, 91, 92]
          }
        ]
      },
      {
        id: '1.2',
        name: 'Supply Planning',
        description: 'Optimize water supply across sources',
        maturity_level: 4,
        target_maturity_level: 5,
        l3: [
          {
            id: '1.2.1',
            name: 'Desalination Ops',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 1,
            tools_gap: 0,
            docs_complete: 90,
            team_health: 95,
            change_adoption: 90,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2025,
            quarter: 'Q1'
          },
          {
            id: '1.2.2',
            name: 'Groundwater',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 75,
            team_health: 80,
            change_adoption: 80,
            mode: 'execute',
            execute_status: 'at-risk',
            year: 2025,
            quarter: 'Q2'
          },
          {
            id: '1.2.3',
            name: 'Surface Water',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 4,
            staff_gap: 6,
            tools_gap: 3,
            docs_complete: 55,
            team_health: 65,
            change_adoption: 55,
            mode: 'build',
            build_status: 'planned',
            year: 2025,
            quarter: 'Q3'
          },
          {
            id: '1.2.4',
            name: 'Treated Wastewater',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 5,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 70,
            team_health: 75,
            change_adoption: 70,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2025,
            quarter: 'Q4'
          },
          {
            id: '1.2.5',
            name: 'Storage Management',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 85,
            team_health: 90,
            change_adoption: 85,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q1'
          }
        ]
      },
      {
        id: '1.3',
        name: 'Distribution Network',
        description: 'Manage water distribution infrastructure',
        maturity_level: 3,
        target_maturity_level: 5,
        l3: [
          {
            id: '1.3.1',
            name: 'Pipeline Integrity',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 5,
            tools_gap: 2,
            docs_complete: 70,
            team_health: 75,
            change_adoption: 70,
            mode: 'execute',
            execute_status: 'at-risk',
            year: 2025,
            quarter: 'Q2'
          },
          {
            id: '1.3.2',
            name: 'Pressure Control',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 80,
            team_health: 85,
            change_adoption: 80,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2025,
            quarter: 'Q3'
          },
          {
            id: '1.3.3',
            name: 'Leak Detection',
            status: 'at-risk',
            maturity_level: 2,
            target_maturity_level: 5,
            staff_gap: 10,
            tools_gap: 5,
            docs_complete: 45,
            team_health: 55,
            change_adoption: 45,
            mode: 'build',
            build_status: 'in-progress-atrisk',
            year: 2025,
            quarter: 'Q4'
          },
          {
            id: '1.3.4',
            name: 'Flow Monitoring',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 3,
            tools_gap: 2,
            docs_complete: 75,
            team_health: 80,
            change_adoption: 75,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q1'
          },
          {
            id: '1.3.5',
            name: 'Quality Testing',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 90,
            team_health: 92,
            change_adoption: 90,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q2'
          },
          {
            id: '1.3.6',
            name: 'Emergency Response',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 4,
            staff_gap: 7,
            tools_gap: 4,
            docs_complete: 50,
            team_health: 60,
            change_adoption: 50,
            mode: 'build',
            build_status: 'planned',
            year: 2026,
            quarter: 'Q3'
          }
        ]
      }
    ]
  },
  {
    id: '2.0',
    name: 'Asset Performance',
    description: 'Monitor and optimize infrastructure performance',
    maturity_level: 3,
    target_maturity_level: 5,
    l2: [
      {
        id: '2.1',
        name: 'Predictive Maintenance',
        description: 'Anticipate and prevent asset failures',
        maturity_level: 2,
        target_maturity_level: 4,
        l3: [
          {
            id: '2.1.1',
            name: 'Sensor Networks',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 70,
            team_health: 75,
            change_adoption: 70,
            mode: 'execute',
            execute_status: 'at-risk',
            year: 2025,
            quarter: 'Q2'
          },
          {
            id: '2.1.2',
            name: 'Data Analytics',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 5,
            staff_gap: 8,
            tools_gap: 4,
            docs_complete: 45,
            team_health: 55,
            change_adoption: 45,
            mode: 'build',
            build_status: 'planned',
            year: 2025,
            quarter: 'Q3'
          },
          {
            id: '2.1.3',
            name: 'Failure Prediction',
            status: 'at-risk',
            maturity_level: 1,
            target_maturity_level: 4,
            staff_gap: 12,
            tools_gap: 6,
            docs_complete: 30,
            team_health: 40,
            change_adoption: 30,
            mode: 'build',
            build_status: 'in-progress-atrisk',
            year: 2025,
            quarter: 'Q4'
          },
          {
            id: '2.1.4',
            name: 'Work Orders',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 3,
            tools_gap: 1,
            docs_complete: 75,
            team_health: 80,
            change_adoption: 75,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q1'
          },
          {
            id: '2.1.5',
            name: 'Spare Parts',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 80,
            team_health: 85,
            change_adoption: 80,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q2'
          }
        ]
      },
      {
        id: '2.2',
        name: 'Energy Optimization',
        description: 'Reduce energy consumption in water operations',
        maturity_level: 3,
        target_maturity_level: 5,
        l3: [
          {
            id: '2.2.1',
            name: 'Pump Efficiency',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 3,
            tools_gap: 2,
            docs_complete: 70,
            team_health: 75,
            change_adoption: 70,
            mode: 'execute',
            execute_status: 'at-risk',
            year: 2025,
            quarter: 'Q2'
          },
          {
            id: '2.2.2',
            name: 'Renewable Integration',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 5,
            staff_gap: 10,
            tools_gap: 5,
            docs_complete: 40,
            team_health: 50,
            change_adoption: 40,
            mode: 'build',
            build_status: 'planned',
            year: 2025,
            quarter: 'Q3'
          },
          {
            id: '2.2.3',
            name: 'Load Balancing',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 65,
            team_health: 70,
            change_adoption: 65,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2025,
            quarter: 'Q4'
          },
          {
            id: '2.2.4',
            name: 'Energy Monitoring',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 1,
            tools_gap: 0,
            docs_complete: 85,
            team_health: 90,
            change_adoption: 85,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q1'
          },
          {
            id: '2.2.5',
            name: 'Cost Optimization',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 3,
            tools_gap: 1,
            docs_complete: 75,
            team_health: 80,
            change_adoption: 75,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q2'
          },
          {
            id: '2.2.6',
            name: 'Carbon Tracking',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 4,
            staff_gap: 5,
            tools_gap: 3,
            docs_complete: 50,
            team_health: 60,
            change_adoption: 50,
            mode: 'build',
            build_status: 'planned',
            year: 2026,
            quarter: 'Q3'
          }
        ]
      }
    ]
  },
  {
    id: '3.0',
    name: 'Digital Transformation',
    description: 'Leverage technology for operational excellence',
    maturity_level: 2,
    target_maturity_level: 5,
    l2: [
      {
        id: '3.1',
        name: 'SCADA & Control',
        description: 'Real-time monitoring and control systems',
        maturity_level: 3,
        target_maturity_level: 5,
        l3: [
          {
            id: '3.1.1',
            name: 'Real-time Dashboard',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 85,
            team_health: 90,
            change_adoption: 80,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2025,
            quarter: 'Q1'
          },
          {
            id: '3.1.2',
            name: 'Remote Control',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 70,
            team_health: 75,
            change_adoption: 70,
            mode: 'execute',
            execute_status: 'at-risk',
            year: 2025,
            quarter: 'Q2'
          },
          {
            id: '3.1.3',
            name: 'Alarm Management',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 3,
            tools_gap: 1,
            docs_complete: 75,
            team_health: 80,
            change_adoption: 75,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2025,
            quarter: 'Q3'
          },
          {
            id: '3.1.4',
            name: 'Data Historian',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 4,
            staff_gap: 6,
            tools_gap: 3,
            docs_complete: 55,
            team_health: 65,
            change_adoption: 55,
            mode: 'build',
            build_status: 'planned',
            year: 2025,
            quarter: 'Q4'
          },
          {
            id: '3.1.5',
            name: 'Cybersecurity',
            status: 'at-risk',
            maturity_level: 2,
            target_maturity_level: 5,
            staff_gap: 15,
            tools_gap: 7,
            docs_complete: 35,
            team_health: 45,
            change_adoption: 35,
            mode: 'build',
            build_status: 'in-progress-atrisk',
            year: 2026,
            quarter: 'Q1'
          }
        ]
      },
      {
        id: '3.2',
        name: 'Data & Analytics',
        description: 'Transform data into actionable insights',
        maturity_level: 2,
        target_maturity_level: 5,
        l3: [
          {
            id: '3.2.1',
            name: 'Data Collection',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 70,
            team_health: 75,
            change_adoption: 70,
            mode: 'execute',
            execute_status: 'at-risk',
            year: 2025,
            quarter: 'Q2'
          },
          {
            id: '3.2.2',
            name: 'Data Quality',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 4,
            staff_gap: 7,
            tools_gap: 3,
            docs_complete: 50,
            team_health: 60,
            change_adoption: 50,
            mode: 'build',
            build_status: 'planned',
            year: 2025,
            quarter: 'Q3'
          },
          {
            id: '3.2.3',
            name: 'Advanced Analytics',
            status: 'at-risk',
            maturity_level: 1,
            target_maturity_level: 5,
            staff_gap: 12,
            tools_gap: 6,
            docs_complete: 30,
            team_health: 40,
            change_adoption: 30,
            mode: 'build',
            build_status: 'in-progress-atrisk',
            year: 2025,
            quarter: 'Q4'
          },
          {
            id: '3.2.4',
            name: 'Reporting',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 3,
            tools_gap: 1,
            docs_complete: 75,
            team_health: 80,
            change_adoption: 75,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q1'
          },
          {
            id: '3.2.5',
            name: 'AI/ML Models',
            status: 'pending',
            maturity_level: 1,
            target_maturity_level: 5,
            staff_gap: 15,
            tools_gap: 8,
            docs_complete: 25,
            team_health: 35,
            change_adoption: 25,
            mode: 'build',
            build_status: 'planned',
            year: 2026,
            quarter: 'Q2'
          },
          {
            id: '3.2.6',
            name: 'Visualization',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 2,
            tools_gap: 1,
            docs_complete: 80,
            team_health: 85,
            change_adoption: 80,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q3'
          },
          {
            id: '3.2.7',
            name: 'Data Governance',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 4,
            staff_gap: 8,
            tools_gap: 4,
            docs_complete: 45,
            team_health: 55,
            change_adoption: 45,
            mode: 'build',
            build_status: 'planned',
            year: 2026,
            quarter: 'Q4'
          }
        ]
      },
      {
        id: '3.3',
        name: 'GIS & Spatial',
        description: 'Geographic information and spatial analysis',
        maturity_level: 3,
        target_maturity_level: 4,
        l3: [
          {
            id: '3.3.1',
            name: 'Asset Mapping',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 3,
            tools_gap: 1,
            docs_complete: 75,
            team_health: 80,
            change_adoption: 75,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2025,
            quarter: 'Q3'
          },
          {
            id: '3.3.2',
            name: 'Network Analysis',
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 4,
            staff_gap: 4,
            tools_gap: 2,
            docs_complete: 70,
            team_health: 75,
            change_adoption: 70,
            mode: 'execute',
            execute_status: 'at-risk',
            year: 2025,
            quarter: 'Q4'
          },
          {
            id: '3.3.3',
            name: 'Service Areas',
            status: 'active',
            maturity_level: 4,
            target_maturity_level: 5,
            staff_gap: 2,
            tools_gap: 0,
            docs_complete: 85,
            team_health: 90,
            change_adoption: 85,
            mode: 'execute',
            execute_status: 'ontrack',
            year: 2026,
            quarter: 'Q1'
          },
          {
            id: '3.3.4',
            name: 'Mobile GIS',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 4,
            staff_gap: 6,
            tools_gap: 3,
            docs_complete: 50,
            team_health: 60,
            change_adoption: 50,
            mode: 'build',
            build_status: 'planned',
            year: 2026,
            quarter: 'Q2'
          },
          {
            id: '3.3.5',
            name: 'Spatial Analytics',
            status: 'pending',
            maturity_level: 2,
            target_maturity_level: 5,
            staff_gap: 8,
            tools_gap: 4,
            docs_complete: 40,
            team_health: 50,
            change_adoption: 40,
            mode: 'build',
            build_status: 'planned',
            year: 2026,
            quarter: 'Q3'
          }
        ]
      }
    ]
  }
];