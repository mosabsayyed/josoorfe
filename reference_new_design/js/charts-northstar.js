document.addEventListener('DOMContentLoaded', () => {
    if (typeof ksaData === 'undefined') return;
    initCommandCenter();
});

let mapChartInstance = null;
const ZOOM_THRESHOLD = 3.5;
let isZoomedIn = false;
let currentRegion = null;

function initCommandCenter() {
    renderWaterMap();
    window.addEventListener('resize', () => mapChartInstance && mapChartInstance.resize());
    
    // Close panel handler
    document.addEventListener('click', (e) => {
        if (e.target.closest('.panel-close')) {
            document.getElementById('details-panel').classList.remove('active');
        }
    });
}

function renderWaterMap() {
    const chartEl = document.getElementById('geo-map');
    if (!chartEl) {
        console.error('Map container #geo-map not found!');
        return;
    }
    
    // Force dimensions check after DOM is fully painted
    setTimeout(() => {
        const rect = chartEl.getBoundingClientRect();
        console.log('Map container dimensions:', rect.width, 'x', rect.height);
        
        if (!mapChartInstance) {
            mapChartInstance = echarts.init(chartEl);
            console.log('ECharts map instance initialized');
            
            // Force resize after init
            setTimeout(() => {
                mapChartInstance.resize();
                console.log('Map resized, new dimensions:', chartEl.getBoundingClientRect().width, 'x', chartEl.getBoundingClientRect().height);
                setupMap();
            }, 200);
        } else {
            mapChartInstance.resize();
        }
    }, 300);
}

function setupMap() {
    
    // Register Map
    if (window.ksaMapData) {
        echarts.registerMap('KSA', window.ksaMapData);
    }

    const getCoords = (name) => {
        const region = ksaData.regions.find(r => r.name === name);
        if (region) return [region.long, region.lat];
        const district = ksaData.districts ? ksaData.districts.find(d => d.name === name || d.name === name + ' City') : null;
        return district ? [district.long, district.lat] : [45, 25];
    };

    // 3. Plants - MAIN ASSETS with 15% larger size
    const plantMarkers = ksaData.plants.map(p => {
        let icon = 'images/markers/plant-operational.png';
        let glowColor = '#10b981';
        let baseSize = 32;
        
        if (p.status === 'planned') {
            icon = 'images/markers/plant-future.png';
            glowColor = '#f59e0b';
        } else if (p.status === 'at-risk') {
            icon = 'images/markers/plant-operational.png'; 
            glowColor = '#ef4444';
        }

        return {
            name: p.name,
            value: p.coords,
            ...p,
            symbol: `image://${icon}`,
            symbolSize: Math.round(baseSize * 1.15), // 15% increase = 37px
            itemStyle: {
                shadowBlur: 20,
                shadowColor: glowColor
            }
        };
    });

    // 2. Prepare Asset Markers (L3) - INCREASED SIZE by 15%
    let assetMarkers = [];
    ksaData.plants.forEach(p => {
        if (p.assets) {
            p.assets.forEach(a => {
                let icon = 'images/markers/urban-icon.png';
                let baseSize = 20;
                if (a.type === 'rural') icon = 'images/markers/rural-icon.png';
                if (a.type === 'agriculture') icon = 'images/markers/agriculture-icon.png';
                if (a.type === 'industry') icon = 'images/markers/industry-icon.png';

                assetMarkers.push({
                    name: `${a.type.charAt(0).toUpperCase() + a.type.slice(1)} Zone`,
                    value: a.coords,
                    type: a.type,
                    beneficiary: p.name,
                    parentPlant: p.name,
                    symbol: `image://${icon}`,
                    symbolSize: Math.round(baseSize * 1.15) // 15% increase = 23px
                });
            });
        }
    });

    // 3. Pipeline Flows
    const flowLines = ksaData.flows.map(f => ({
        coords: [getCoords(f.source), getCoords(f.target)],
        name: f.name,
        value: f.load,
        sectors: f.sectors,
        lineStyle: {
            color: f.status === 'Green' ? '#10b981' : (f.status === 'Red' ? '#ef4444' : '#f59e0b'),
            width: f.load === 'High' ? 4 : 2,
            curveness: 0.2
        }
    }));

    // 4. Regional Hubs (L1 - 13 Regions)
    const hubs = ksaData.regions.map(r => ({
        name: r.name,
        value: [r.long, r.lat],
        type: r.type,
        itemStyle: { 
            color: '#64748b', // Regions are grey/base
            shadowBlur: 5,
            shadowColor: '#000'
        },
        label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: '#94a3b8',
            fontSize: 9
        }
    }));

    // 5. Districts (L2 - Major Cities)
    const districts = ksaData.districts ? ksaData.districts.map(d => ({
        name: d.name,
        value: [d.long, d.lat],
        type: d.type,
        itemStyle: {
            color: '#3b82f6', // Districts are blue
            shadowBlur: 8,
            shadowColor: '#3b82f6'
        },
        symbolSize: 8,
        label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: '#cbd5e1', // Light slate
            fontSize: 9
        }
    })) : [];

    // 6. HQ Markers - WHITE for normal, GOLD only if issues detected
    // Positioned SLIGHTLY offset from Riyadh center to avoid blocking the clickable region
    // Riyadh is at [46.7, 24.7] - offset HQ slightly NE (0.08 degrees both directions)
    const hasIssues = ksaData.plants.some(p => p.status === 'at-risk');
    
    const hqMarkers = [
        {
            name: hasIssues ? 'Strategic HQ - ATTENTION REQUIRED' : 'Strategic HQ - All Systems Normal',
            value: [46.78, 24.78], // Slightly NE of Riyadh center - subtle offset
            symbol: hasIssues ? 'image://images/markers/hq-gold.png' : 'image://images/markers/hq-white.png',
            symbolSize: hasIssues ? 32 : 28, // Reduced size to avoid blocking clicks
            itemStyle: {
                shadowBlur: hasIssues ? 25 : 0,
                shadowColor: hasIssues ? '#fbbf24' : 'transparent'
            },
            label: {
                show: true,
                formatter: hasIssues ? 'ATTENTION' : 'HQ',
                position: 'right',
                color: hasIssues ? '#fbbf24' : '#e2e8f0',
                fontSize: hasIssues ? 11 : 9,
                fontWeight: 'bold'
            },
            zlevel: 5 // Lower z-level so regions remain clickable above HQ
        }
    ];

    const option = {
        backgroundColor: '#0f172a', // Ensure background matches theme
        geo: {
            map: 'KSA',
            roam: false, // Disable zoom and pan - fixed view
            zoom: 1.2,
            center: [45, 24],
            zlevel: 0, // Base layer - below all series
            z: 0,
            label: { show: false }, 
            itemStyle: {
                areaColor: '#1e293b',
                borderColor: '#94a3b8', // MUCH brighter - light slate
                borderWidth: 2 // Thicker
            },
            emphasis: { 
                itemStyle: { 
                    areaColor: '#334155',
                    borderColor: '#94a3b8', // Lighter border on hover
                    borderWidth: 2
                } 
            },
            select: { 
                itemStyle: { 
                    areaColor: '#475569',
                    borderColor: '#fbbf24', // Gold border when selected
                    borderWidth: 2.5
                } 
            }
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: '#475569',
            textStyle: { color: '#fff' },
            formatter: (params) => {
                // 0: Pipelines, 1: Hubs, 2: Districts, 3: Plants, 4: Assets, 5: HQ
                if (params.seriesIndex === 5) return `<div style="font-weight:bold; color:#fbbf24;">${params.name}</div><div style="font-size:10px; color:#ccc;">National Command Node</div>`;
                if (params.seriesIndex === 4) return `${params.name}<br/><span style="color:#94a3b8; font-size:10px;">Asset</span>`;
                if (params.seriesIndex === 3) return params.name; // Plants
                if (params.seriesIndex === 2) return `${params.name}<br/><span style="color:#94a3b8; font-size:10px;">${params.data.type}</span>`; // Districts
                if (params.seriesIndex === 1) return `${params.name}<br/><span style="color:#94a3b8; font-size:10px;">${params.data.type}</span>`; // Hubs
                if (params.seriesIndex === 0) return `${params.name}<br/><span style="color:#94a3b8; font-size:10px;">Pipeline Flow</span>`;
                return params.name;
            }
        },
        series: [
            // 0. Pipelines - FIXED: Disable effect during zoom to prevent residue
            {
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 1,
                effect: { 
                    show: !isZoomedIn, // Disable animation when zoomed to prevent shadows
                    period: 4, 
                    trailLength: 0.2, 
                    symbol: 'arrow', 
                    symbolSize: 6, 
                    color: '#fff' 
                },
                lineStyle: { opacity: 0.6 },
                data: flowLines
            },
            // 1. Regional Hubs (L1)
            {
                name: 'Regions',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                symbolSize: 10,
                rippleEffect: { scale: 2, brushType: 'stroke', color: '#64748b' },
                data: hubs
            },
            // 2. Districts (L2)
            {
                name: 'Districts',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 3,
                data: districts
            },
            // 3. Plants (Markers)
            {
                name: 'Plants',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 10,
                symbolSize: 32, 
                data: plantMarkers
            },
            // 4. Assets (L3 - Initially Hidden)
            {
                name: 'Assets',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 9,
                symbolSize: 20,
                data: [], 
                itemStyle: { opacity: 0 } 
            },
            // 5. HQ Markers (New Layer)
            {
                name: 'HQ',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 12,
                data: hqMarkers
            }
        ]
    };

    // Ensure map is registered before setting option
    if (echarts.getMap('KSA')) {
        console.log('KSA map already registered, setting options...');
        mapChartInstance.setOption(option);
    } else if (window.ksaMapData) {
        console.log('Registering KSA map data...');
        echarts.registerMap('KSA', window.ksaMapData);
        mapChartInstance.setOption(option);
    } else {
        console.error("KSA Map Data not found!");
        return;
    }
    
    console.log('Map rendered successfully with', plantMarkers.length, 'plants,', flowLines.length, 'flows, and', hubs.length, 'regions');
    
    // Initial render with proper visibility
    updateMapVisibility();

    // Zoom Handler
    mapChartInstance.on('georoam', () => {
        updateMapVisibility();
    });

    // Toggle Handlers
    const futureBtn = document.getElementById('btn-future');
    const futureBtnText = document.getElementById('future-btn-text');
    
    // Initial state: Future Hidden
    futureBtn.classList.remove('active');
    futureBtn.style.background = '#334155';
    futureBtn.style.borderColor = '#f59e0b';
    futureBtn.style.color = '#f59e0b';
    
    futureBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        
        if (this.classList.contains('active')) {
            this.style.background = '#f59e0b';
            this.style.borderColor = '#f59e0b';
            this.style.color = '#0f172a';
            futureBtnText.textContent = 'HIDE FUTURE PLANS';
        } else {
            this.style.background = '#334155';
            this.style.borderColor = '#f59e0b';
            this.style.color = '#f59e0b';
            futureBtnText.textContent = 'SHOW FUTURE PLANS';
        }
        
        updateMapVisibility();
    });

    function updateMapVisibility() {
        const showFuture = document.getElementById('btn-future').classList.contains('active');

        // Filter Plant Markers
        const filteredPlants = plantMarkers.filter(p => {
            if (p.status === 'planned' && !showFuture) return false;
            return true;
        });

        // Filter Flow Lines
        const filteredFlows = flowLines.filter(f => {
            if (!showFuture && f.lineStyle.color === '#f59e0b') return false;
            return true;
        });

        // When zoomed: show main plant + all its auxiliary assets
        let visibleAssets = [];
        if (isZoomedIn && currentRegion) {
            // Find plants in the current region
            const regionPlants = filteredPlants.filter(p => {
                const [pLong, pLat] = p.coords;
                const [rLong, rLat] = currentRegion.value;
                // Simple proximity check (within ~2 degrees)
                return Math.abs(pLong - rLong) < 2 && Math.abs(pLat - rLat) < 2;
            });
            
            // Get all assets for those plants
            regionPlants.forEach(plant => {
                const plantAssets = assetMarkers.filter(a => a.parentPlant === plant.name);
                visibleAssets = visibleAssets.concat(plantAssets);
            });
            
            console.log(`Showing ${regionPlants.length} plants and ${visibleAssets.length} assets in region`);
        }

        // HQ markers visibility based on zoom
        const visibleHQ = isZoomedIn ? [] : hqMarkers; // Hide HQ when zoomed to avoid clutter

        const series = [
            { 
                data: filteredFlows,
                effect: { show: !isZoomedIn } // Disable animation when zoomed
            }, 
            { data: hubs },      
            { data: districts }, 
            { data: filteredPlants },
            { 
                data: visibleAssets, 
                itemStyle: { opacity: isZoomedIn ? 1 : 0 },
                symbolSize: isZoomedIn ? 23 : 0 // Match the 15% increased size
            },
            { data: visibleHQ }
        ];

        mapChartInstance.setOption({ series: series });
    }


    // Click Handler for Details Panel AND Region Zoom
    mapChartInstance.on('click', (params) => {
        if (params.seriesIndex === 3) { 
            // Plants (index 3)
            showDetailsPanel(params.data);
        } else if (params.seriesIndex === 1 && !isZoomedIn) { 
            // Regions (index 1) - only if not already zoomed
            zoomToRegion(params.data);
        }
    });

    // Back button handler
    const backBtn = document.getElementById('btn-back-map');
    backBtn.addEventListener('click', () => {
        zoomOut();
    });

}

// Zoom to a specific region
function zoomToRegion(regionData) {
    if (!mapChartInstance) return;
    
    // Allow re-zooming even if already zoomed (for different regions)
    if (isZoomedIn && currentRegion && currentRegion.name === regionData.name) {
        return; // Already zoomed to this region
    }
    
    isZoomedIn = true;
    currentRegion = regionData;
    
    // Show back button
    document.getElementById('btn-back-map').style.display = 'block';
    
    // Get region coordinates
    const [long, lat] = regionData.value;
    
    console.log('Zooming into region:', regionData.name);
    
    // Zoom into the region with animation
    mapChartInstance.setOption({
        geo: {
            center: [long, lat],
            zoom: 5, // Increased zoom for better city view
            label: { 
                show: true, // Show region names when zoomed
                color: '#94a3b8',
                fontSize: 11,
                fontWeight: '500'
            },
            itemStyle: {
                areaColor: '#1e293b',
                borderColor: '#475569', // Darker base for other regions
                borderWidth: 1
            },
            // Highlight ONLY the selected region with enhanced borders
            regions: [{
                name: regionData.name,
                label: {
                    show: true,
                    color: '#fbbf24',
                    fontSize: 13,
                    fontWeight: 'bold'
                },
                itemStyle: {
                    areaColor: '#0f172a', // Slightly darker than base to make border pop
                    borderColor: '#fbbf24', // Gold border for city outline
                    borderWidth: 5, // VERY thick border
                    shadowBlur: 25,
                    shadowColor: '#fbbf24', // Full opacity gold glow
                    shadowOffsetX: 0,
                    shadowOffsetY: 0
                }
            }]
        },
        series: [
            // Update pipeline animations - disable during zoom
            {
                effect: { show: false }
            }
        ]
    }, false); // notMerge: false to allow animation
    
    // Update visibility after a short delay to allow zoom animation
    setTimeout(() => {
        updateMapVisibility();
    }, 300);
}

// Zoom out back to kingdom view
function zoomOut() {
    if (!mapChartInstance) return;
    
    isZoomedIn = false;
    const previousRegion = currentRegion;
    currentRegion = null;
    
    // Hide back button
    document.getElementById('btn-back-map').style.display = 'none';
    
    console.log('Zooming out from:', previousRegion ? previousRegion.name : 'unknown region');
    
    // Reset zoom with animation
    mapChartInstance.setOption({
        geo: {
            center: [45, 24],
            zoom: 1.2,
            label: { show: false }, // Hide labels in full view
            itemStyle: {
                areaColor: '#1e293b',
                borderColor: '#94a3b8', // Bright slate borders
                borderWidth: 2
            },
            regions: [] // Clear region-specific styling
        },
        series: [
            // Re-enable pipeline animations
            {
                effect: { show: true }
            }
        ]
    }, false);
    
    // Update visibility after animation
    setTimeout(() => {
        updateMapVisibility();
    }, 300);
}

function showDetailsPanel(data) {
    const panel = document.getElementById('details-panel');
    const agri = data.sectors.agriculture.toLocaleString();
    const ind = data.sectors.industry.toLocaleString();
    const urb = data.sectors.urban.toLocaleString();
    
    // Status Badge Logic
    let statusClass = 'status-operational';
    let statusLabel = 'OPERATIONAL';
    if (data.status === 'planned') { statusClass = 'status-planned'; statusLabel = 'PLANNED'; }
    if (data.status === 'at-risk') { statusClass = 'status-at-risk'; statusLabel = 'AT RISK'; }

    // Calculate percentages for bar
    const total = data.sectors.agriculture + data.sectors.industry + data.sectors.urban;
    const pAgri = (data.sectors.agriculture / total) * 100;
    const pInd = (data.sectors.industry / total) * 100;
    const pUrb = (data.sectors.urban / total) * 100;

    const html = `
        <div class="panel-header">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-water" style="color: #10b981; font-size: 16px;"></i>
                <div class="panel-title">Plant Details</div>
            </div>
            <div class="panel-close"><i class="fas fa-times"></i></div>
        </div>
        <div class="panel-content">
            <div style="margin-bottom: 1.5rem;">
                <div style="font-size: 1.1rem; font-weight: 700; color: white; line-height: 1.3; margin-bottom: 0.5rem;">
                    ${data.name}
                </div>
                <div class="${statusClass} status-badge">
                    <span style="margin-right: 6px;">●</span> ${statusLabel}
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label"><i class="fas fa-chart-line" style="margin-right: 4px;"></i> Operational Metrics</div>
                <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                    <div style="flex: 1;">
                        <div style="font-size: 0.7rem; color: #94a3b8;">Water Supply</div>
                        <div style="font-size: 0.9rem; font-weight: 600; color: white;">${data.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.7rem; color: #94a3b8;">Jobs</div>
                        <div style="font-size: 0.9rem; font-weight: 600; color: white;">${data.jobs}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.7rem; color: #94a3b8;">Revenue</div>
                        <div style="font-size: 0.9rem; font-weight: 600; color: white;">${data.revenue}</div>
                    </div>
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label"><i class="fas fa-layer-group" style="margin-right: 4px;"></i> Sector Allocation</div>
                <div class="sector-bar" style="margin-bottom: 0.75rem;">
                    <div class="sector-segment" style="width: ${pAgri}%; background: #10b981;" title="Agriculture"></div>
                    <div class="sector-segment" style="width: ${pInd}%; background: #f59e0b;" title="Industry"></div>
                    <div class="sector-segment" style="width: ${pUrb}%; background: #3b82f6;" title="Urban"></div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: #cbd5e1;"><span style="color: #10b981;">●</span> Agriculture</span>
                        <span style="font-weight: 600; font-size: 0.85rem;">${agri}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: #cbd5e1;"><span style="color: #f59e0b;">●</span> Industry</span>
                        <span style="font-weight: 600; font-size: 0.85rem;">${ind}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: #cbd5e1;"><span style="color: #3b82f6;">●</span> Urban</span>
                        <span style="font-weight: 600; font-size: 0.85rem;">${urb}</span>
                    </div>
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i> Investment Status</div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-money-bill-wave" style="color: ${data.fundingSource === 'FDI' ? '#22c55e' : '#94a3b8'};"></i>
                    <span style="color: white; font-weight: 500;">${data.fundingSource.toUpperCase()}</span>
                </div>
                <div style="font-size: 0.85rem; color: #94a3b8;">
                    Launch: <span style="color: white;">${data.quarterLaunched}</span>
                </div>
            </div>
            
             <div class="detail-row" style="border-bottom: none;">
                <div class="detail-label"><i class="fas fa-map-pin" style="margin-right: 4px;"></i> Coordinates</div>
                <div style="font-family: monospace; color: #64748b; font-size: 0.85rem;">
                    ${data.coords[1].toFixed(4)}, ${data.coords[0].toFixed(4)}
                </div>
            </div>

            <button onclick="document.getElementById('details-panel').classList.remove('active')" 
                style="width: 100%; padding: 0.75rem; background: #334155; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 1rem; transition: all 0.2s;">
                <i class="fas fa-times" style="margin-right: 6px;"></i> Close Panel
            </button>
        </div>
    `;

    panel.innerHTML = html;
    panel.classList.add('active');
}
