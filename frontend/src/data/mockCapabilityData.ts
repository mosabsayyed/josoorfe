// Mock capability data for Enterprise Desk (simplified from reference design)
import type { L1Capability } from '../types/enterprise';

export const mockCapabilityMatrix: L1Capability[] = [
    {
        id: '1.0',
        name: 'Strategic Planning',
        description: 'Strategic direction and planning capabilities',
        maturity_level: 3,
        target_maturity_level: 5,
        l2: [
            {
                id: '1.1',
                name: 'Vision & Strategy',
                description: 'Define strategic vision',
                maturity_level: 3,
                target_maturity_level: 4,
                l3: [
                    {
                        id: '1.1.1',
                        name: 'Strategic Planning',
                        status: 'active',
                        maturity_level: 4,
                        target_maturity_level: 5,
                        staff_gap: 2,
                        tools_gap: 1,
                        docs_complete: 85,
                        team_health: 90,
                        change_adoption: 88,
                        mode: 'execute',
                        execute_status: 'ontrack',
                        year: 2025,
                        quarter: 'Q1',
                        exposure_percent: 12,
                        exposure_trend: 'stable',
                        policy_tool_count: 2,
                        performance_target_count: 3,
                        org_gap: 15,
                        process_gap: 10,
                        it_gap: 8,
                        active_projects_count: 2,
                        adoption_load: 'low',
                        adoption_load_percent: 25,
                        health_history: [88, 89, 90]
                    }
                ]
            }
        ]
    },
    {
        id: '2.0',
        name: 'Operational Excellence',
        description: 'Optimize operations',
        maturity_level: 2,
        target_maturity_level: 4,
        l2: [
            {
                id: '2.1',
                name: 'Process Management',
                description: 'Manage business processes',
                maturity_level: 2,
                target_maturity_level: 4,
                l3: [
                    {
                        id: '2.1.1',
                        name: 'Process Optimization',
                        status: 'at-risk',
                        maturity_level: 2,
                        target_maturity_level: 4,
                        staff_gap: 8,
                        tools_gap: 4,
                        docs_complete: 45,
                        team_health: 55,
                        change_adoption: 50,
                        mode: 'build',
                        build_status: 'in-progress-atrisk',
                        year: 2025,
                        quarter: 'Q2',
                        expected_delay_days: 45,
                        exposure_percent: 65,
                        policy_tool_count: 4,
                        performance_target_count: 3,
                        org_gap: 45,
                        process_gap: 35,
                        it_gap: 28,
                        active_projects_count: 5,
                        adoption_load: 'high',
                        adoption_load_percent: 78,
                        health_history: [60, 57, 55]
                    }
                ]
            }
        ]
    }
];
