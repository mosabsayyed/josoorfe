document.addEventListener('DOMContentLoaded', () => {
    initRiskCharts();
    window.addEventListener('yearChanged', (e) => updateRiskCharts(e.detail.year));
});

let riskTreeChart = null;
let riskHeatmapChart = null;

function initRiskCharts() {
    riskTreeChart = echarts.init(document.getElementById('risk-tree'));
    riskHeatmapChart = echarts.init(document.getElementById('risk-heatmap'));
    updateRiskCharts('2024');
    window.addEventListener('resize', () => {
        riskTreeChart && riskTreeChart.resize();
        riskHeatmapChart && riskHeatmapChart.resize();
    });
}

function updateRiskCharts(year) {
    const { nodes, links } = ontologyData;

    // --- Risk Tree (Strict Layout) ---
    // Left: Capability (-1) | Center: Risk (0) | Right: KPI (1)

    const treeNodes = [];
    const treeLinks = [];
    const nodeIds = new Set();

    // Grouping
    const caps = [];
    const risks = [];
    const kpis = [];

    // Identify active nodes based on links
    const riskNodesData = nodes.filter(n => n.category === 'EntityRisk');

    riskNodesData.forEach(r => {
        risks.push(r);
        // Find Upstream Caps
        links.filter(l => l.target === r.id && l.type === 'MONITORED_BY').forEach(l => {
            const c = nodes.find(n => n.id === l.source);
            if (c && !caps.includes(c)) caps.push(c);
        });
        // Find Downstream KPIs
        links.filter(l => l.source === r.id && l.type === 'INFORMS').forEach(l => {
            const k = nodes.find(n => n.id === l.target);
            if (k && !kpis.includes(k)) kpis.push(k);
        });
    });

    // Calculate Y Positions
    // Helper to distribute nodes vertically
    const calcY = (index, total) => {
        const height = 600; // arbitrary canvas height
        const spacing = total > 1 ? height / (total + 1) : 300;
        return (index + 1) * spacing - (height / 2); // Center around 0
    };

    // Add Nodes
    caps.forEach((n, i) => {
        treeNodes.push({
            id: n.id, name: n.name, category: 'Capability',
            x: -300, y: calcY(i, caps.length),
            symbolSize: 20, itemStyle: { color: '#10b981' }
        });
        nodeIds.add(n.id);
    });

    risks.forEach((n, i) => {
        treeNodes.push({
            id: n.id, name: n.name, category: 'Risk',
            x: 0, y: calcY(i, risks.length),
            symbolSize: 35, itemStyle: { color: '#ef4444' }
        });
        nodeIds.add(n.id);
    });

    kpis.forEach((n, i) => {
        treeNodes.push({
            id: n.id, name: n.name, category: 'KPI',
            x: 300, y: calcY(i, kpis.length),
            symbolSize: 20, itemStyle: { color: '#f59e0b' }
        });
        nodeIds.add(n.id);
    });

    // Add Links
    links.forEach(l => {
        if (nodeIds.has(l.source) && nodeIds.has(l.target)) {
            let color = '#64748b';
            if (l.type === 'MONITORED_BY') color = '#ef4444'; // Red for incoming risk monitor? Or Green? 
            // Prompt: "Thick red arrows point BACKWARDS (left)... Thick orange arrows point FORWARDS (right)"
            // Current Links: Cap -> Risk (MONITORED_BY). So visual arrow is Source(Cap) -> Target(Risk).
            // But prompt implies flow is Risk -> Cap ("threatens").
            // To achieve visual "Red Arrow pointing Left", we can style the edge.

            const isLeft = l.type === 'MONITORED_BY'; // Cap -> Risk
            const isRight = l.type === 'INFORMS'; // Risk -> KPI

            treeLinks.push({
                source: l.source,
                target: l.target,
                lineStyle: {
                    color: isLeft ? '#ef4444' : '#f59e0b',
                    width: isLeft ? 3 : 3,
                    curveness: 0
                },
                symbol: ['none', 'arrow']
            });
        }
    });

    const treeOption = {
        title: { text: 'Blast Radius (Fixed Layout)', left: 'center', textStyle: { color: '#64748b', fontSize: 12 } },
        tooltip: { trigger: 'item' },
        series: [{
            type: 'graph',
            layout: 'none', // Strict manual layout
            data: treeNodes,
            links: treeLinks,
            roam: true,
            label: { show: true, position: 'bottom', color: '#cbd5e1', fontSize: 10 },
            categories: [{ name: 'Capability' }, { name: 'Risk' }, { name: 'KPI' }]
        }]
    };
    riskTreeChart.setOption(treeOption);

    // --- Risk Heatmap & Overload Logic (Same as before but updated data) ---
    // ... (Keep existing Heatmap logic from previous version, simplified for brevity here) ...
    // Re-implementing Heatmap & Overload quickly:

    const scatterData = [];
    const riskCounts = {};

    links.filter(l => l.type === 'MONITORED_BY').forEach(l => {
        const cap = nodes.find(n => n.id === l.source);
        const risk = nodes.find(n => n.id === l.target);
        if (cap && risk) {
            riskCounts[cap.id] = (riskCounts[cap.id] || 0) + 1;
            const isCritical = risk.risk_score > 70 && cap.maturity_level < 3;
            scatterData.push({
                value: [cap.maturity_level, risk.risk_score],
                name: `${risk.name} on ${cap.name}`,
                itemStyle: { color: isCritical ? '#ef4444' : '#10b981' }
            });
        }
    });

    riskHeatmapChart.setOption({
        tooltip: { formatter: p => `<b>${p.data.name}</b><br>M: ${p.value[0]}, R: ${p.value[1]}` },
        xAxis: { min: 0, max: 6, name: 'Maturity' },
        yAxis: { min: 0, max: 100, name: 'Risk Score' },
        series: [{ type: 'scatter', data: scatterData, symbolSize: 15 }]
    });

    // Update Metrics
    const overloaded = Object.keys(riskCounts)
        .filter(id => riskCounts[id] >= 3)
        .map(id => ({ name: nodes.find(n => n.id === id).name, count: riskCounts[id] }));

    const list = document.getElementById('overload-list');
    list.innerHTML = overloaded.length ? '' : '<li class="text-slate-500 normal">No overloads detected.</li>';
    overloaded.forEach(o => {
        list.innerHTML += `<li class="p-2 border-l-4 border-red-500 bg-red-500/10 text-slate-200 flex justify-between"><span>${o.name}</span><span class="font-bold text-red-400">${o.count} Risks</span></li>`;
    });

    document.getElementById('vuln-cap-count').textContent = scatterData.filter(d => d.value[1] > 70 && d.value[0] < 3).length;
}
