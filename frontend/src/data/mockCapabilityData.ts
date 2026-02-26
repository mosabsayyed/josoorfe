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
                        mode: 'execute',
                        execute_status: 'ontrack',
                        year: 2025,
                        quarter: 'Q1',
                        exposure_percent: 12,
                        dependency_count: 3,
                        people_score: 4,
                        process_score: 3,
                        tools_score: 4,
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
                        mode: 'build',
                        build_status: 'in-progress-atrisk',
                        year: 2025,
                        quarter: 'Q2',
                        exposure_percent: 65,
                        dependency_count: 5,
                        people_score: 2,
                        process_score: 2,
                        tools_score: 1,
                    }
                ]
            }
        ]
    }
];
