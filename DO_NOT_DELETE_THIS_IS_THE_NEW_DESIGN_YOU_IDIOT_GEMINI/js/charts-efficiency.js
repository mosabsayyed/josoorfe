document.addEventListener('DOMContentLoaded', () => {
    initEfficiencyCharts();
    window.addEventListener('yearChanged', (e) => updateEfficiencyCharts(e.detail.year));
});

let chainChart = null;
let automationChart = null;
let cultureChart = null;

function initEfficiencyCharts() {
    chainChart = echarts.init(document.getElementById('dependency-chain'));
    automationChart = echarts.init(document.getElementById('automation-chart'));
    cultureChart = echarts.init(document.getElementById('culture-chart'));
    updateEfficiencyCharts('2024');
    window.addEventListener('resize', () => {
        chainChart && chainChart.resize();
        automationChart && automationChart.resize();
        cultureChart && cultureChart.resize();
    });
}

function updateEfficiencyCharts(year) {
    const { nodes, links } = ontologyData;

    // --- Dependency Chain (Strict Swimlanes) ---
    // Culture (0) -> Org (1) -> Process (2) -> IT (3) -> Vendor (4)
    
    const chainNodes = [];
    const chainLinks = [];
    const nodeIds = new Set();
    
    // Group nodes by type for swimlanes
    const swimlanes = {
        'EntityCultureHealth': [],
        'EntityOrgUnit': [],
        'EntityProcess': [],
        'EntityITSystem': [],
        'EntityVendor': []
    };

    // Populate Swimlanes
    nodes.forEach(n => {
        if (swimlanes[n.category]) {
            swimlanes[n.category].push(n);
        }
    });

    const xPos = {
        'EntityCultureHealth': 0,
        'EntityOrgUnit': 200,
        'EntityProcess': 400,
        'EntityITSystem': 600,
        'EntityVendor': 800
    };

    const colors = {
        'EntityCultureHealth': '#3b82f6',
        'EntityOrgUnit': '#10b981',
        'EntityProcess': '#f59e0b',
        'EntityITSystem': '#a855f7',
        'EntityVendor': '#ef4444'
    };

    // Calculate Layout
    Object.keys(swimlanes).forEach(cat => {
        const group = swimlanes[cat];
        const count = group.length;
        group.forEach((n, i) => {
            // Count incoming links for Vendor Criticality sizing
            const incoming = links.filter(l => l.target === n.id).length;
            const size = (cat === 'EntityVendor' && incoming > 1) ? 50 : 30; // Highlight bottleneck
            
            // Y Calculation
            const y = (i - (count-1)/2) * 80;

            chainNodes.push({
                id: n.id, name: n.name, category: cat,
                x: xPos[cat], y: y,
                symbolSize: size,
                itemStyle: { 
                    color: colors[cat],
                    shadowBlur: (cat === 'EntityVendor' && incoming > 1) ? 20 : 0,
                    shadowColor: '#ef4444'
                },
                label: { show: true, position: 'bottom', fontSize: 10, color: '#cbd5e1' }
            });
            nodeIds.add(n.id);
        });
    });

    links.forEach(l => {
        if (nodeIds.has(l.source) && nodeIds.has(l.target)) {
            chainLinks.push({
                source: l.source, target: l.target,
                lineStyle: { color: '#475569', curveness: 0.1 }
            });
        }
    });

    chainChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
            type: 'graph',
            layout: 'none',
            data: chainNodes,
            links: chainLinks,
            roam: true,
            zoom: 0.8
        }]
    });


    // --- Automation Gap & Culture (Simplified Update) ---
    // (Keeping logic mostly same but refreshing data)
    
    // Automation: Process -> IT ?
    const procData = swimlanes['EntityProcess'].map(p => {
        const isAuto = links.some(l => l.source === p.id && l.type === 'DEPENDS_ON');
        return { name: p.name, value: isAuto ? 100 : 20, color: isAuto ? '#a855f7' : '#f59e0b' };
    });

    automationChart.setOption({
        tooltip: { trigger: 'item' },
        xAxis: { type: 'category', data: procData.map(d => d.name), axisLabel: { fontSize: 9, rotate: 30 } },
        yAxis: { max: 100 },
        series: [{ type: 'bar', data: procData.map(d => ({ value: d.value, itemStyle: { color: d.color } })) }]
    });

    // Culture Scatter
    // Simple logic: Culture Score vs Process Count (via Org)
    const cultData = [];
    swimlanes['EntityCultureHealth'].forEach(c => {
        // Find Org
        const orgLink = links.find(l => l.source === c.id);
        if(orgLink) {
            const orgId = orgLink.target;
            const procCount = links.filter(l => l.source === orgId && l.type === 'OPERATES').length;
            cultData.push([c.score, procCount]);
        }
    });
    
    cultureChart.setOption({
        tooltip: { trigger: 'item' },
        xAxis: { name: 'Culture', min: 0, max: 5 },
        yAxis: { name: 'Processes', min: 0 },
        series: [{ type: 'scatter', data: cultData, itemStyle: { color: '#3b82f6' } }]
    });
}
