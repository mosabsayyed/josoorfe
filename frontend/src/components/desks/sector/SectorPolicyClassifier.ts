import { GraphNode, GraphConnection } from '../../admin/visualizations/GraphVisualization';

export interface PolicyToolCounts {
    enforce: number;
    incentive: number;
    license: number;
    services: number;
    regulate: number;
    awareness: number;
    total: number;
    // Risk-based status for each category
    enforceStatus?: 'high' | 'medium' | 'low' | 'none';
    incentiveStatus?: 'high' | 'medium' | 'low' | 'none';
    licenseStatus?: 'high' | 'medium' | 'low' | 'none';
    servicesStatus?: 'high' | 'medium' | 'low' | 'none';
    regulateStatus?: 'high' | 'medium' | 'low' | 'none';
    awarenessStatus?: 'high' | 'medium' | 'low' | 'none';
}

// 6 Categories
export type PolicyCategory = 'Enforce' | 'Incentive' | 'License' | 'Services' | 'Regulate' | 'Awareness';

// L1 Name -> Category Mapping
// Based on analysis of 22 L1 Water Sector Tools
const L1_CATEGORY_MAP: Record<string, PolicyCategory> = {
    // Enforce (3)
    'Policy Tool for Compliance Rate': 'Enforce',
    'Policy Tool for Environmental Compliance Rate': 'Enforce',
    'Policy Tool for Resource Efficiency': 'Enforce',

    // Incentive (7)
    'Water Human Capital Program': 'Incentive',
    'Water Innovation & R&D': 'Incentive',
    'Water Innovation Ecosystem': 'Incentive',
    'Policy Tool for Employment Generation': 'Incentive',
    'Policy Tool for Investment Agreement Value': 'Incentive',

    // License (3)
    'Water Inspection & Compliance': 'License',
    'Policy Tool for Licensing Coverage': 'License',

    // Services (11)
    'Water Digital Platforms': 'Services',
    'Water Logistics & Service Delivery': 'Services',
    'Policy Tool for Processing Time Reduction': 'Services',
    'Policy Tool for Service Reliability': 'Services',
    'Policy Tool for Customer Satisfaction Rate': 'Services',
    'Policy Tool for Complaint Resolution Rate': 'Services',

    // Regulate (5)
    'Water Monitoring & Regulation': 'Regulate',
    'Policy Tool for GDP Contribution Rate': 'Regulate',
    'Policy Tool for Sustainability Index': 'Regulate',

    // Awareness (3)
    'Policy Tool for Waste Reduction': 'Awareness',
    'Policy Tool for Water Loss Reduction': 'Awareness',
    'Policy Tool for Stakeholder Engagement Rate': 'Awareness'
};

export const classifyPolicyTools = (nodes: GraphNode[], edges: GraphConnection[]): PolicyToolCounts => {
    const counts: PolicyToolCounts = {
        enforce: 0,
        incentive: 0,
        license: 0,
        services: 0,
        regulate: 0,
        awareness: 0,
        total: 0
    };

    // 1. Filter for SectorPolicyTool L1 nodes that are Non-Physical
    // Logic: merged_asset_count is blank AND old_region is blank
    const l1Nodes = nodes.filter(n =>
        n.group === 'SectorPolicyTool' &&
        n.level === 'L1' &&
        (!n.merged_asset_count || n.merged_asset_count === '' || n.merged_asset_count === 'null') &&
        (!n.old_region || n.old_region === '' || n.old_region === 'null')
    );

    // 2. Identify L2 children for each L1 parent via PARENT_OF edges
    const l1ChildrenCount: Record<string, number> = {}; // l1Id -> count

    l1Nodes.forEach(l1 => {
        // Find outgoing PARENT_OF edges to L2 nodes
        const children = edges.filter(e =>
            e.source === l1.id &&
            e.type === 'PARENT_OF' &&
            nodes.find(n => n.id === e.target)?.level === 'L2'
        );
        l1ChildrenCount[l1.id] = children.length;
    });

    // 3. Iterate L1s, classify, and add to counts
    l1Nodes.forEach(l1 => {
        const category = L1_CATEGORY_MAP[l1.name] || 'Services'; // Default fallback
        const countToAdd = l1ChildrenCount[l1.id] > 0 ? l1ChildrenCount[l1.id] : 1;

        switch (category) {
            case 'Enforce': counts.enforce += countToAdd; break;
            case 'Incentive': counts.incentive += countToAdd; break;
            case 'License': counts.license += countToAdd; break;
            case 'Services': counts.services += countToAdd; break;
            case 'Regulate': counts.regulate += countToAdd; break;
            case 'Awareness': counts.awareness += countToAdd; break;
        }
    });

    // Calculate total
    counts.total = counts.enforce + counts.incentive + counts.license + counts.services + counts.regulate + counts.awareness;

    return counts;
};
