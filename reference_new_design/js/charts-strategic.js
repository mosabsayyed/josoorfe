document.addEventListener('DOMContentLoaded', () => {
    initStrategicCharts();
    window.addEventListener('yearChanged', (e) => updateStrategicCharts(e.detail.year));
});

let sankeyChart = null;
let alignmentChart = null;

function initStrategicCharts() {
    sankeyChart = echarts.init(document.getElementById('sankey-chart'));
    alignmentChart = echarts.init(document.getElementById('alignment-chart'));
    updateStrategicCharts('2024');
    window.addEventListener('resize', () => {
        sankeyChart && sankeyChart.resize();
        alignmentChart && alignmentChart.resize();
    });
}

function updateStrategicCharts(year) {
    const { nodes, links } = ontologyData;

    // --- Sankey Diagram (Execution Flow) ---
    // Objective -> Policy -> Record -> Transaction
    
    // We need to visually show "Dead Ends".
    // If a Policy has no Record, we add a dummy node "NO RECORD" to show flow stopping?
    // Or just let the Sankey line terminate. ECharts Sankey terminates if no target.
    // To make it explicit (Red Border), we can't easily style individual sankey nodes conditionally based on connectivity in the simple view, 
    // but we can name them distinctively or color them.
    
    // Filter Categories
    const cats = ['SectorObjective', 'SectorPolicyTool', 'SectorAdminRecord', 'SectorDataTransaction'];
    const sNodes = [];
    const sLinks = [];
    const validIds = new Set();
    
    // Collect Nodes
    nodes.filter(n => cats.includes(n.category)).forEach(n => {
        // Check for Dead End (Policy with no outgoing Record link)
        let color = undefined;
        if (n.category === 'SectorPolicyTool') {
            const hasRecord = links.some(l => l.source === n.id && l.type === 'GOVERNED_BY');
            if (!hasRecord) color = '#ef4444'; // Red for dead end
        }

        sNodes.push({ name: n.name, itemStyle: { color: color } });
        validIds.add(n.id);
    });

    // Collect Links
    links.forEach(l => {
        if(validIds.has(l.source) && validIds.has(l.target)) {
            const s = nodes.find(n => n.id === l.source);
            const t = nodes.find(n => n.id === l.target);
            sLinks.push({ source: s.name, target: t.name, value: 1 });
        }
    });

    sankeyChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
            type: 'sankey',
            data: sNodes,
            links: sLinks,
            emphasis: { focus: 'adjacency' },
            label: { color: '#cbd5e1', fontSize: 10 },
            lineStyle: { color: 'gradient', curveness: 0.5 }
        }]
    });

    // --- Capability Alignment (Target vs Maturity) ---
    // KPI (Target) vs Capability (Maturity)
    const alignData = [];
    nodes.filter(n => n.category === 'SectorPerformance').forEach(kpi => {
        // Find Cap
        const link = links.find(l => (l.source === kpi.id || l.target === kpi.id) && l.type === 'MEASURES');
        if (link) {
            const capId = link.source === kpi.id ? link.target : link.source;
            const cap = nodes.find(n => n.id === capId);
            if (cap) {
                // Normalize target (fake logic for demo)
                const target = kpi.target > 10 ? 5 : kpi.target; 
                alignData.push({ kpi: kpi.name, cap: cap.name, t: target, m: cap.maturity_level });
            }
        }
    });

    alignmentChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { textStyle: { color: '#cbd5e1' } },
        xAxis: { type: 'value', max: 5 },
        yAxis: { type: 'category', data: alignData.map(d => d.kpi) },
        series: [
            { name: 'Target', type: 'bar', data: alignData.map(d => d.t), itemStyle: { color: '#3b82f6' } },
            { name: 'Maturity', type: 'bar', data: alignData.map(d => d.m), itemStyle: { color: '#10b981' } }
        ]
    });

    // Update Diagnostics Table (Missing Governance)
    const deadPolicies = nodes.filter(n => n.category === 'SectorPolicyTool' && !links.some(l => l.source === n.id && l.type === 'GOVERNED_BY'));
    const table = document.getElementById('governance-table-body');
    table.innerHTML = deadPolicies.length ? '' : '<tr><td colspan="3" class="text-emerald-500 p-4 text-center">All policies active.</td></tr>';
    deadPolicies.forEach(p => {
        table.innerHTML += `<tr class="border-b border-slate-700 hover:bg-slate-800"><td class="p-2 text-xs text-slate-500">${p.id}</td><td class="p-2 text-slate-300">${p.name}</td><td class="p-2 text-red-400 font-bold">DEAD END</td></tr>`;
    });
}
