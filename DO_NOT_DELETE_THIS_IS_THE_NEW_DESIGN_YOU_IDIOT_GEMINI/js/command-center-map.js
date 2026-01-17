/**
 * COMMAND CENTER MAP VISUALIZATION
 * Water Sector Geographic Infrastructure Display
 */

let currentState = 'current'; // 'current' or 'future'
let csvData = null;
let selectedYear = '2025';

document.addEventListener('DOMContentLoaded', async () => {
    // Load CSV data
    csvData = await CSVParser.loadAllData();
    
    if (csvData) {
        renderObjectives();
        renderMap();
        setupEventListeners();
    } else {
        console.error('Failed to load CSV data');
    }
});

function setupEventListeners() {
    // State toggle
    document.getElementById('state-current').addEventListener('click', () => switchState('current'));
    document.getElementById('state-future').addEventListener('click', () => switchState('future'));
}

function switchState(state) {
    currentState = state;
    
    // Update button states
    document.getElementById('state-current').classList.toggle('active', state === 'current');
    document.getElementById('state-future').classList.toggle('active', state === 'future');
    
    // Re-render map
    renderMap();
}

function renderObjectives() {
    if (!csvData) return;

    const objectives = CSVParser.filterByYearAndLevel(csvData.objectives, selectedYear);
    const performance = csvData.performance.filter(p => p.year === selectedYear);

    // L1 Objectives (Strategic Goals - Lagging)
    const l1Container = document.getElementById('l1-objectives');
    const l1Objectives = objectives.filter(o => o.level === 'L1');
    
    l1Container.innerHTML = l1Objectives.map(obj => {
        const perf = performance.find(p => p.id === obj.id && p.level === 'L1');
        const actual = perf ? parseFloat(perf.actual) : 0;
        const target = parseFloat(obj.target);
        const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
        const status = percentage >= 90 ? 'Green' : percentage >= 70 ? 'Amber' : 'Red';
        const statusColor = status === 'Green' ? 'emerald' : status === 'Amber' ? 'amber' : 'red';

        return `
            <div class="objective-card glass-panel p-4 rounded-lg border-l-4 border-${statusColor}-500">
                <div class="text-[10px] text-slate-500 mb-1 font-mono">[${obj.id}] L1 Strategic Goal</div>
                <h4 class="font-bold text-white text-sm mb-2">${obj.name}</h4>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-400">Lagging Outcome</span>
                    <span class="text-lg font-bold text-${statusColor}-400">${percentage}%</span>
                </div>
                <div class="mt-2 w-full bg-slate-700 h-1.5 rounded-full">
                    <div class="bg-${statusColor}-500 h-1.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    // L2 Objectives (Strategic Targets - Leading)
    const l2Container = document.getElementById('l2-objectives');
    const l2Objectives = objectives.filter(o => o.level === 'L2');
    
    l2Container.innerHTML = l2Objectives.slice(0, 6).map(obj => {
        const perf = performance.find(p => p.id === obj.id && p.level === 'L2');
        const actual = perf ? parseFloat(perf.actual) : 0;
        const target = parseFloat(obj.target);
        const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
        const status = percentage >= 90 ? 'Green' : percentage >= 70 ? 'Amber' : 'Red';
        const statusColor = status === 'Green' ? 'emerald' : status === 'Amber' ? 'amber' : 'red';

        return `
            <div class="objective-card glass-panel p-3 rounded-lg">
                <div class="text-[10px] text-slate-500 mb-1 font-mono">[${obj.id}] L2</div>
                <h5 class="font-medium text-white text-xs mb-1">${obj.name}</h5>
                <div class="text-xs text-slate-400 mb-2">Leading Outcome</div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-slate-700 h-1 rounded-full">
                        <div class="bg-${statusColor}-500 h-1 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                    <span class="text-xs font-bold text-${statusColor}-400">${percentage}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderMap() {
    const svg = document.getElementById('saudi-map');
    svg.innerHTML = ''; // Clear existing

    // Map projection (simplified)
    const mapBounds = {
        minLat: 16, maxLat: 32,
        minLong: 34, maxLong: 56
    };

    function projectToSVG(lat, long) {
        const x = ((long - mapBounds.minLong) / (mapBounds.maxLong - mapBounds.minLong)) * 900 + 50;
        const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 500 + 50;
        return { x, y };
    }

    // Draw Saudi Arabia outline (simplified)
    const outline = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
    outline.setAttribute('d', 'M 100 400 L 200 500 L 400 550 L 700 520 L 850 400 L 900 250 L 850 100 L 650 80 L 400 100 L 200 150 L 100 300 Z');
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', '#334155');
    outline.setAttribute('stroke-width', '2');
    outline.setAttribute('opacity', '0.3');

    // Draw regions (cities)
    WaterData.regions.forEach(region => {
        if (region.infrastructure === 'planned' && currentState === 'current') return;

        const pos = projectToSVG(region.lat, region.long);
        
        // City marker
        const circle = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', region.infrastructure === 'planned' ? '#6b7280' : '#64748b');
        circle.setAttribute('opacity', region.infrastructure === 'planned' ? '0.5' : '1');

        // City label
        const text = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
        text.setAttribute('x', pos.x);
        text.setAttribute('y', pos.y - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', '500');
        text.textContent = region.name;
    });

    // Draw pipelines
    WaterData.pipelines.forEach(pipeline => {
        if (pipeline.infrastructure === 'planned' && currentState === 'current') return;

        const fromRegion = WaterData.regions.find(r => r.id === pipeline.from);
        const toRegion = WaterData.regions.find(r => r.id === pipeline.to);

        if (fromRegion && toRegion) {
            const from = projectToSVG(fromRegion.lat, fromRegion.long);
            const to = projectToSVG(toRegion.lat, toRegion.long);

            const line = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
            line.setAttribute('x1', from.x);
            line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x);
            line.setAttribute('y2', to.y);
            line.classList.add('pipeline');
            if (pipeline.infrastructure === 'planned') {
                line.classList.add('planned');
            }

            // Tooltip
            line.addEventListener('mouseenter', (e) => showPipelineTooltip(e, pipeline));
            line.addEventListener('mouseleave', hideTooltip);
        }
    });

    // Draw plants
    WaterData.plants.forEach(plant => {
        if (plant.infrastructure === 'planned' && currentState === 'current') return;

        const region = WaterData.regions.find(r => r.id === plant.region);
        if (!region) return;

        const pos = projectToSVG(region.lat, region.long);
        
        // Offset plants around city
        const offset = Math.random() * 20 - 10;

        const marker = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
        marker.setAttribute('cx', pos.x + offset);
        marker.setAttribute('cy', pos.y + offset);
        marker.setAttribute('r', '8');
        marker.classList.add('plant-marker');
        
        if (plant.infrastructure === 'planned') {
            marker.classList.add('planned');
        } else if (plant.fundingSource === 'FDI') {
            marker.classList.add('fdi');
        } else {
            marker.classList.add('government');
        }

        // Add icon
        const icon = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
        icon.setAttribute('x', pos.x + offset);
        icon.setAttribute('y', pos.y + offset + 4);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('fill', 'white');
        icon.setAttribute('font-size', '10');
        icon.setAttribute('font-weight', 'bold');
        icon.setAttribute('pointer-events', 'none');
        icon.textContent = plant.type === 'Desalination' ? 'D' : plant.type === 'Storage' ? 'S' : 'W';

        // Tooltip
        marker.addEventListener('mouseenter', (e) => showPlantTooltip(e, plant));
        marker.addEventListener('mouseleave', hideTooltip);
    });

    // Update capacity summary
    renderCapacitySummary();
}

function showPlantTooltip(event, plant) {
    const tooltip = document.getElementById('map-tooltip');
    
    // Get L3 Performance, L3 PolicyTool, L2 Capability data
    const l3Perf = csvData.performance.find(p => 
        p.level === 'L3' && p.year === selectedYear
    );
    
    const l3Policy = csvData.policyTools.find(pt => 
        pt.level === 'L3' && pt.year === selectedYear
    );
    
    const l2Cap = csvData.capabilities.find(c => 
        c.level === 'L2' && c.year === selectedYear
    );

    // Calculate sector breakdown
    const agri = Math.round(plant.capacity_m3_day * plant.sectorSplit.agriculture);
    const industry = Math.round(plant.capacity_m3_day * plant.sectorSplit.industry);
    const urban = Math.round(plant.capacity_m3_day * plant.sectorSplit.urban);

    let html = `
        <div class="text-sm">
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold text-white">${plant.name}</h4>
                ${plant.fundingSource === 'FDI' ? '<span class="px-2 py-0.5 rounded text-xs bg-emerald-500 text-white">FDI</span>' : ''}
            </div>
            
            <div class="text-xs text-slate-400 mb-3">
                <div>Type: ${plant.type}</div>
                <div>Status: ${plant.status}</div>
                <div>Launched: ${plant.quarterLaunched}</div>
            </div>

            <div class="border-t border-slate-700 pt-2 mb-2">
                <div class="text-[10px] text-blue-400 font-bold mb-1">WATER CAPACITY</div>
                <div class="text-lg font-bold text-white mb-1">${plant.capacity_m3_day.toLocaleString()} m³/day</div>
                <div class="flex gap-1">
                    <span class="sector-badge sector-agriculture">Agri: ${agri.toLocaleString()}</span>
                    <span class="sector-badge sector-industry">Industry: ${industry.toLocaleString()}</span>
                    <span class="sector-badge sector-urban">Urban: ${urban.toLocaleString()}</span>
                </div>
            </div>
    `;

    // Add L3 Performance if available
    if (l3Perf) {
        html += `
            <div class="border-t border-slate-700 pt-2 mb-2">
                <div class="text-[10px] text-emerald-400 font-bold mb-1">L3 PERFORMANCE</div>
                <div class="text-xs text-slate-300">${l3Perf.name}</div>
                <div class="text-sm">Actual: <span class="font-bold text-white">${l3Perf.actual}</span> / Target: ${l3Perf.target}</div>
            </div>
        `;
    }

    // Add L3 PolicyTool if available
    if (l3Policy) {
        html += `
            <div class="border-t border-slate-700 pt-2 mb-2">
                <div class="text-[10px] text-amber-400 font-bold mb-1">L3 POLICY TOOL</div>
                <div class="text-xs text-slate-300">${l3Policy.name}</div>
                <div class="text-xs text-slate-400">Impact: ${l3Policy.impact_target}</div>
            </div>
        `;
    }

    // Add L2 Capability ONLY if L3 tool AND L2 capability exist (operational)
    if (l3Policy && l2Cap) {
        html += `
            <div class="border-t border-slate-700 pt-2">
                <div class="text-[10px] text-cyan-400 font-bold mb-1">L2 CAPABILITY</div>
                <div class="text-xs text-slate-300">${l2Cap.name}</div>
                <div class="text-xs text-slate-400">Maturity: ${l2Cap.maturity_level}/${l2Cap.target_maturity_level}</div>
            </div>
        `;
    }

    html += '</div>';
    
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 20) + 'px';
    tooltip.style.top = (event.pageY - 50) + 'px';
}

function showPipelineTooltip(event, pipeline) {
    const tooltip = document.getElementById('map-tooltip');
    
    const html = `
        <div class="text-sm">
            <h4 class="font-bold text-white mb-2">${pipeline.name}</h4>
            <div class="text-xs text-slate-400">
                <div>Capacity: ${pipeline.capacity_m3_day.toLocaleString()} m³/day</div>
                <div>Length: ${pipeline.length_km} km</div>
                <div>Status: ${pipeline.status}</div>
            </div>
        </div>
    `;
    
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 20) + 'px';
    tooltip.style.top = (event.pageY - 50) + 'px';
}

function hideTooltip() {
    document.getElementById('map-tooltip').style.display = 'none';
}

function renderCapacitySummary() {
    const container = document.getElementById('capacity-summary');
    const capacity = WaterData.getTotalCapacityBySector();
    const fdiPlants = WaterData.getFDIPlants();

    container.innerHTML = `
        <div class="glass-panel p-4 rounded-lg">
            <div class="text-xs text-emerald-400 font-bold mb-1">AGRICULTURE</div>
            <div class="text-2xl font-bold text-white">${capacity.agriculture.toLocaleString()}</div>
            <div class="text-xs text-slate-400">m³/day</div>
        </div>
        <div class="glass-panel p-4 rounded-lg">
            <div class="text-xs text-amber-400 font-bold mb-1">INDUSTRY</div>
            <div class="text-2xl font-bold text-white">${capacity.industry.toLocaleString()}</div>
            <div class="text-xs text-slate-400">m³/day</div>
        </div>
        <div class="glass-panel p-4 rounded-lg">
            <div class="text-xs text-blue-400 font-bold mb-1">URBAN</div>
            <div class="text-2xl font-bold text-white">${capacity.urban.toLocaleString()}</div>
            <div class="text-xs text-slate-400">m³/day</div>
        </div>
        <div class="glass-panel p-4 rounded-lg border-l-4 border-emerald-500">
            <div class="text-xs text-emerald-400 font-bold mb-1">FDI PLANTS (Q4 2025)</div>
            <div class="text-2xl font-bold text-white">${fdiPlants.length}</div>
            <div class="text-xs text-slate-400">New plants funded</div>
        </div>
    `;
}
