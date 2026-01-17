document.addEventListener('DOMContentLoaded', () => {
    initLandingCharts();
    window.addEventListener('yearChanged', (e) => updateLandingCharts(e.detail.year));
});

let integrityChart = null;
let heatmapChart = null;

function initLandingCharts() {
    integrityChart = echarts.init(document.getElementById('integrity-graph'));
    heatmapChart = echarts.init(document.getElementById('interface-heatmap'));
    updateLandingCharts('2024');
    window.addEventListener('resize', () => {
        integrityChart && integrityChart.resize();
        heatmapChart && heatmapChart.resize();
    });
}

function updateLandingCharts(year) {
    const { nodes, links } = ontologyData;

    // --- Data Processing for Hub ---
    
    // 1. Identify Orphans (Temporal) & Dangling (Structural)
    let orphanCount = 0;
    const danglers = [];
    const nodeStatus = {}; // id -> 'orphan' | 'dangling' | 'ok'

    nodes.forEach(n => {
        // Temporal Check
        if (n.year && String(n.year) !== String(year)) {
            orphanCount++;
            nodeStatus[n.id] = 'orphan';
        } 
        // Dangling Check (SectorObjective only)
        else if (n.category === 'SectorObjective') {
            const hasPath = links.some(l => l.source === n.id && l.type === 'REALIZED_VIA');
            if (!hasPath) {
                danglers.push(n);
                nodeStatus[n.id] = 'dangling';
            } else {
                nodeStatus[n.id] = 'ok';
            }
        } else {
            nodeStatus[n.id] = 'ok';
        }
    });

    // Update DOM
    document.getElementById('total-nodes-count').textContent = nodes.length;
    document.getElementById('temporal-orphans-count').textContent = orphanCount;
    document.getElementById('dangling-nodes-count').textContent = danglers.length;
    updateDiagnosticList(danglers, orphanCount);

    // 2. Prepare Graph Data
    const colors = { 'Strategy': '#3b82f6', 'Risk': '#ef4444', 'Internal': '#10b981', 'Efficiency': '#f59e0b', 'Transformation': '#a855f7' };
    
    const graphNodes = nodes.map(n => {
        const isOrphan = nodeStatus[n.id] === 'orphan';
        const isDangling = nodeStatus[n.id] === 'dangling';
        
        return {
            id: n.id,
            name: n.name,
            value: n.category,
            symbolSize: isDangling ? 40 : 25,
            itemStyle: {
                color: isOrphan ? '#1e293b' : colors[n.group] || '#64748b',
                borderColor: isDangling ? '#ef4444' : (isOrphan ? '#475569' : 'transparent'),
                borderWidth: isDangling ? 3 : (isOrphan ? 2 : 0),
                borderType: isOrphan ? 'dashed' : 'solid',
                opacity: isOrphan ? 0.3 : 1
            },
            label: { show: !isOrphan && (n.category === 'SectorObjective' || n.category === 'EntityRisk'), color: '#fff', fontSize: 10 }
        };
    });

    const graphLinks = links.map(l => {
        // Temporal Mismatch on Links?
        // If source or target is orphan, link is ghosted.
        // If both exist but years differ (handled by node check usually, but let's check explicitly)
        const s = nodes.find(n => n.id === l.source);
        const t = nodes.find(n => n.id === l.target);
        
        // Check strict temporal mismatch (e.g. 2024 linking to 2022)
        let isMismatch = false;
        if(s && t && s.year && t.year && s.year !== t.year) isMismatch = true;

        return {
            source: l.source, target: l.target,
            lineStyle: {
                color: isMismatch ? '#f97316' : '#475569', // Orange for mismatch
                width: isMismatch ? 3 : 1,
                type: isMismatch ? 'dashed' : 'solid',
                opacity: 0.6
            }
        };
    });

    integrityChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { data: Object.keys(colors), textStyle: {color: '#cbd5e1'}, bottom: 0 },
        series: [{
            type: 'graph',
            layout: 'force',
            data: graphNodes,
            links: graphLinks,
            categories: Object.keys(colors).map(n => ({name: n})),
            roam: true,
            force: { repulsion: 250, edgeLength: 60, gravity: 0.1 }
        }]
    });

    // --- Heatmap (KPI vs Capability) ---
    // (Existing logic is fine, just re-running with new data)
    const kpis = nodes.filter(n => n.category === 'SectorPerformance');
    const caps = nodes.filter(n => n.category === 'EntityCapability');
    const hmData = [];
    
    caps.forEach((c, y) => {
        kpis.forEach((k, x) => {
            const linked = links.some(l => (l.source === k.id && l.target === c.id) || (l.source === c.id && l.target === k.id));
            hmData.push([x, y, linked ? 1 : 0]);
        });
    });

    heatmapChart.setOption({
        tooltip: { position: 'top' },
        xAxis: { type: 'category', data: kpis.map(k => k.name.substring(0,8)+'...'), axisLabel: {rotate:45, fontSize:9, color: '#64748b'} },
        yAxis: { type: 'category', data: caps.map(c => c.name), axisLabel: {fontSize:9, color: '#64748b'} },
        visualMap: { min: 0, max: 1, show: false, inRange: { color: ['#1e293b', '#10b981'] } },
        series: [{ type: 'heatmap', data: hmData, itemStyle: {borderColor: '#0f172a'} }]
    });
}

function updateDiagnosticList(dangling, orphans) {
    const list = document.getElementById('diagnostic-list');
    list.innerHTML = '';
    dangling.forEach(n => {
        list.innerHTML += `<li class="p-2 bg-red-500/10 border-l-4 border-red-500 text-xs text-red-200 mb-2"><strong>DANGLING:</strong> ${n.name}</li>`;
    });
    if(orphans > 0) {
        list.innerHTML += `<li class="p-2 bg-orange-500/10 border-l-4 border-orange-500 text-xs text-orange-200"><strong>TEMPORAL:</strong> ${orphans} nodes out of context.</li>`;
    }
    if(!dangling.length && !orphans) list.innerHTML = '<li class="text-emerald-500 text-sm">System Healthy.</li>';
}
