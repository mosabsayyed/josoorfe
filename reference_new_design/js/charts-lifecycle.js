document.addEventListener('DOMContentLoaded', () => {
    initLifecycle();
});

let funnelChart = null;

function initLifecycle() {
    renderBuildZone();
    renderTransitionZone();
    renderOperateZone();

    funnelChart = echarts.init(document.getElementById('adoption-funnel'));
    renderFunnelChart();
    window.addEventListener('resize', () => funnelChart && funnelChart.resize());
}

function renderBuildZone() {
    const container = document.getElementById('zone-build');
    container.innerHTML = '';

    // Filter Capabilities in 'Build' stage or with Projects < 100%
    // Actually, look at projects inside ksaData.capabilities

    const buildingCaps = ksaData.capabilities.filter(c => c.stage === 'Build' || (c.projects && c.projects.some(p => p.progress < 100)));

    if (buildingCaps.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-500 normal mt-10">No active build projects.</div>';
        return;
    }

    buildingCaps.forEach(cap => {
        cap.projects.forEach(proj => {
            if (proj.progress < 100) {
                const color = cap.weight === 'Critical' ? 'border-red-500' : (cap.weight === 'High' ? 'border-amber-500' : 'border-blue-500');
                const badge = cap.weight === 'Critical' ? '<span class="text-[10px] bg-red-500 text-white px-1 rounded">CRITICAL</span>' : '';

                const div = document.createElement('div');
                div.className = `bg-slate-800 p-3 rounded border-l-4 ${color} relative`;
                div.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="text-[10px] text-slate-400 uppercase">${cap.domain}</p>
                            <h4 class="font-bold text-slate-200 text-sm">${proj.name}</h4>
                        </div>
                        ${badge}
                    </div>
                    <div class="w-full bg-slate-700 h-2 rounded-full mb-1">
                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${proj.progress}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span class="font-mono text-white">${proj.progress}%</span>
                    </div>
                `;
                container.appendChild(div);
            }
        });
    });
}

function renderTransitionZone() {
    const container = document.getElementById('zone-transition');
    container.innerHTML = '';

    // Stuck in Transition: Progress high (>90) but Adoption != Complete
    const stuckCaps = ksaData.capabilities.filter(c => c.stage === 'Transition' || (c.projects && c.projects.some(p => p.progress > 90 && p.adoption !== 'Complete')));

    if (stuckCaps.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-500 normal mt-4">No transition bottlenecks.</div>';
        return;
    }

    stuckCaps.forEach(cap => {
        cap.projects.forEach(proj => {
            if (proj.progress > 90 && proj.adoption !== 'Complete') {
                const div = document.createElement('div');
                div.className = "bg-slate-800/50 p-3 rounded border border-slate-700 flex items-center justify-between";
                div.innerHTML = `
                    <div>
                        <h4 class="font-bold text-slate-300 text-sm">${proj.name}</h4>
                        <p class="text-xs text-red-400"><i class="fas fa-exclamation-circle"></i> Adoption Pending</p>
                    </div>
                    <button class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white">Investigate</button>
                `;
                container.appendChild(div);
            }
        });
    });
}

function renderFunnelChart() {
    // Aggregate all projects
    let launched = 0;
    let delivered = 0;
    let adopted = 0;

    ksaData.capabilities.forEach(c => {
        c.projects.forEach(p => {
            launched++;
            if (p.progress >= 90) delivered++;
            if (p.adoption === 'Complete') adopted++;
        });
    });

    const option = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        series: [
            {
                name: 'Funnel',
                type: 'funnel',
                left: '10%',
                top: 10,
                bottom: 10,
                width: '80%',
                min: 0,
                max: launched,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: {
                    show: true,
                    position: 'inside',
                    formatter: '{b} ({c})',
                    color: '#fff',
                    fontSize: 10
                },
                itemStyle: {
                    borderColor: '#1e293b',
                    borderWidth: 1
                },
                data: [
                    { value: launched, name: 'Launched', itemStyle: { color: '#3b82f6' } },
                    { value: delivered, name: 'Delivered', itemStyle: { color: '#a855f7' } },
                    { value: adopted, name: 'Adopted', itemStyle: { color: '#10b981' } }
                ]
            }
        ]
    };

    funnelChart.setOption(option);
}

function renderOperateZone() {
    const container = document.getElementById('zone-operate');
    container.innerHTML = '';

    // Operating Capabilities with Trends/Risks
    const operatingCaps = ksaData.capabilities.filter(c => c.stage === 'Operate');

    operatingCaps.forEach(cap => {
        const isRegression = cap.trend === 'Declining';
        const colorClass = isRegression ? 'text-red-400' : (cap.status === 'Amber' ? 'text-amber-400' : 'text-emerald-400');
        const icon = isRegression ? 'fa-chart-line-down' : (cap.trend === 'Rising' ? 'fa-chart-line' : 'fa-minus');
        const iconRot = isRegression ? 'transform rotate-180' : ''; // Fontawesome chart-line goes up usually

        const div = document.createElement('div');
        div.className = "bg-slate-800 p-3 rounded border border-slate-700 flex flex-col";

        let riskHtml = '';
        if (cap.risks.length > 0) {
            riskHtml = `<div class="mt-2 pt-2 border-t border-slate-700">
                ${cap.risks.map(r => `<div class="flex items-center text-[10px] text-red-300"><i class="fas fa-bolt mr-1"></i> ${r.name}</div>`).join('')}
            </div>`;
        }

        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-[10px] text-slate-500 uppercase">${cap.region}</span>
                    <h4 class="font-bold text-slate-200 text-sm">${cap.name}</h4>
                </div>
                <div class="text-right">
                    <div class="${colorClass} text-xs font-bold"><i class="fas ${isRegression ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up'}"></i> ${cap.trend}</div>
                </div>
            </div>
            ${riskHtml}
        `;
        container.appendChild(div);
    });
}
