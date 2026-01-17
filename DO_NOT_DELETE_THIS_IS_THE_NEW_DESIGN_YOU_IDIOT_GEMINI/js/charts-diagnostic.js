document.addEventListener('DOMContentLoaded', () => {
    initDiagnostic();
});

let chainChart = null;
let simulationActive = false;

function initDiagnostic() {
    chainChart = echarts.init(document.getElementById('chain-graph'));
    renderChain();
    
    document.getElementById('scenario-toggle').addEventListener('change', (e) => {
        simulationActive = e.target.checked;
        renderChain();
        updateRCA();
    });

    window.addEventListener('resize', () => chainChart && chainChart.resize());
}

function renderChain() {
    // Chain: Capability Dependencies
    // Mining -> Petrochem -> Manufacturing
    
    const nodes = ksaData.capabilities.map((c, i) => {
        // Calculate status dynamically based on simulation
        let status = c.status;
        if(simulationActive && c.id === 'CAP-02') status = 'Red'; // Simulate Petrochem failure

        const color = status === 'Green' ? '#10b981' : (status === 'Red' ? '#ef4444' : '#f59e0b');
        
        return {
            id: c.id,
            name: c.name,
            category: c.domain,
            symbolSize: c.weight === 'Critical' ? 40 : 25,
            itemStyle: { color: color },
            x: i * 200, // Simple Layout
            y: (i % 2) * 100
        };
    });

    const links = ksaData.dependencies.map(d => {
        return {
            source: d.source,
            target: d.target,
            label: { show: true, formatter: d.type, fontSize: 8, color: '#64748b' },
            lineStyle: {
                color: '#64748b',
                curveness: 0.2,
                width: 2
            }
        };
    });

    const option = {
        tooltip: { trigger: 'item' },
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes,
            links: links,
            roam: true,
            label: { show: true, position: 'bottom', color: '#cbd5e1' },
            force: { repulsion: 1000, edgeLength: 150 }
        }]
    };

    chainChart.setOption(option);
}

function updateRCA() {
    const container = document.getElementById('rca-content');
    if(simulationActive) {
        container.innerHTML = `
             <div class="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded mb-4 animate-pulse">
                <h4 class="font-bold text-amber-400 text-sm">Simulation Active: Petrochem Delay</h4>
                <p class="text-xs text-slate-300 mt-1">If "Feedstock Processing" fails...</p>
                <ul class="list-disc list-inside text-xs text-slate-400 mt-2 space-y-1">
                    <li><strong>Impact:</strong> "Automated Assembly Lines" (Manufacturing) halts due to lack of raw material.</li>
                    <li><strong>Result:</strong> "Expand Auto Manufacturing" Objective moves from Red to Critical Failure.</li>
                </ul>
            </div>
        `;
    } else {
        // Default View
        container.innerHTML = `
            <div class="p-4 bg-red-500/10 border-l-4 border-red-500 rounded mb-4">
                <h4 class="font-bold text-red-400 text-sm">Critical Failure: Riyadh Cluster</h4>
                <p class="text-xs text-slate-300 mt-1">Goal "Expand Auto Manufacturing" is blocked.</p>
                <ul class="list-disc list-inside text-xs text-slate-400 mt-2 space-y-1">
                    <li><strong>Direct Cause:</strong> Factory Automation Cap is immature.</li>
                    <li><strong>Root Cause:</strong> "Robotics Rollout" Project stuck in Transition (Adoption failure).</li>
                    <li><strong>Enabler Gap:</strong> Investment in Training Platform delayed.</li>
                </ul>
            </div>
        `;
    }
}
