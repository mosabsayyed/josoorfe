document.addEventListener('DOMContentLoaded', () => {
    initFeedbackCharts();
    window.addEventListener('yearChanged', (e) => updateFeedbackCharts(e.detail.year));
});

let loopChart = null;
let funnelChart = null;

function initFeedbackCharts() {
    loopChart = echarts.init(document.getElementById('loop-chart'));
    funnelChart = echarts.init(document.getElementById('funnel-chart'));
    updateFeedbackCharts('2024');
    window.addEventListener('resize', () => {
        loopChart && loopChart.resize();
        funnelChart && funnelChart.resize();
    });
}

function updateFeedbackCharts(year) {
    const { nodes, links } = ontologyData;

    // --- Circular Loop Graph ---
    // Transformation Cycle: Cap -> Project -> Adoption -> Cap
    
    const loopNodes = [];
    const loopLinks = [];
    const nodeIds = new Set();
    const brokenProjects = [];

    // Filter Transformation Group
    const transNodes = nodes.filter(n => n.group === 'Transformation');
    
    transNodes.forEach(n => {
        // Special Visuals for "Broken" projects
        // Project is broken if it is EP, has GAPS_SCOPE, but NO CLOSE_GAPS
        let isBroken = false;
        if (n.category === 'EntityProject') {
            const hasClose = links.some(l => l.source === n.id && l.type === 'CLOSE_GAPS');
            if (!hasClose) {
                isBroken = true;
                brokenProjects.push(n);
            }
        }

        loopNodes.push({
            id: n.id,
            name: n.name,
            category: n.category,
            symbolSize: n.category === 'EntityProject' ? 30 : 20,
            itemStyle: {
                color: isBroken ? '#ef4444' : (n.category === 'EntityProject' ? '#a855f7' : (n.category === 'EntityCapability' ? '#10b981' : '#f59e0b')),
                borderColor: isBroken ? '#fff' : 'transparent',
                borderWidth: isBroken ? 2 : 0
            },
            label: { show: true, position: 'right', fontSize: 10, color: '#cbd5e1' }
        });
        nodeIds.add(n.id);
    });

    links.forEach(l => {
        if(nodeIds.has(l.source) && nodeIds.has(l.target)) {
            loopLinks.push({
                source: l.source, target: l.target,
                lineStyle: {
                    curveness: 0.3,
                    color: l.type === 'CLOSE_GAPS' ? '#10b981' : '#64748b',
                    width: l.type === 'CLOSE_GAPS' ? 3 : 1
                }
            });
        }
    });

    loopChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
            type: 'graph',
            layout: 'circular',
            data: loopNodes,
            links: loopLinks,
            roam: true,
            label: { position: 'right', formatter: '{b}' },
            lineStyle: { opacity: 0.7 }
        }]
    });

    // --- Funnel Chart (Risk) ---
    // Project Progress vs Adoption (Mapped 0-100)
    const funnelData = [];
    const projs = nodes.filter(n => n.category === 'EntityProject');
    
    projs.forEach(p => {
        let adoptScore = 0;
        if (p.adoption === 'Complete') adoptScore = 100;
        else if (p.adoption === 'High') adoptScore = 80;
        else if (p.adoption === 'On Track') adoptScore = 50;
        else adoptScore = 10; // Pending

        funnelData.push({
            name: p.name,
            progress: p.progress,
            adoption: adoptScore,
            risk: (p.progress > 80 && adoptScore < 50) // High progress, low adoption
        });
    });

    funnelChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: {type: 'shadow'} },
        legend: { data: ['Progress', 'Adoption'], textStyle: {color: '#cbd5e1'} },
        xAxis: { type: 'category', data: funnelData.map(d => d.name), axisLabel: {rotate: 30, fontSize: 9} },
        yAxis: { max: 100 },
        series: [
            { name: 'Progress', type: 'bar', data: funnelData.map(d => d.progress), itemStyle: {color: '#a855f7'} },
            { name: 'Adoption', type: 'bar', data: funnelData.map(d => ({ value: d.adoption, itemStyle: {color: d.risk ? '#ef4444' : '#f59e0b'} })) }
        ]
    });

    // Update Metrics
    document.getElementById('broken-loops-count').textContent = brokenProjects.length;
    const table = document.getElementById('loop-table-body');
    table.innerHTML = brokenProjects.length ? '' : '<tr><td colspan="3" class="p-4 text-center text-emerald-500">All loops closed.</td></tr>';
    brokenProjects.forEach(p => {
        table.innerHTML += `
            <tr class="border-b border-slate-700">
                <td class="p-2 text-slate-300 font-medium">${p.name}</td>
                <td class="p-2 text-slate-400">${p.progress}%</td>
                <td class="p-2 text-red-400 font-mono text-xs"><i class="fas fa-link-slash"></i> MISSING CLOSE</td>
            </tr>
        `;
    });
}
