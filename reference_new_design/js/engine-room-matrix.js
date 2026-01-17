/**
 * ENGINE ROOM - CAPABILITY MATRIX
 * 3-Column Layout: L1 (spans) | L2 (rows) | L3 (inline cells)
 * With heatmap overlays like the React heatmap
 */

let capabilityData = null;
let selectedOverlay = 'none';
let selectedYear = '2025';

document.addEventListener('DOMContentLoaded', async () => {
    // Load CSV data
    const csvData = await CSVParser.loadAllData();
    
    if (csvData && csvData.capabilities) {
        capabilityData = CSVParser.getCapabilityMatrix(csvData.capabilities, selectedYear);
        renderMatrix();
        setupEventListeners();
    } else {
        console.error('Failed to load capability data');
    }
});

function setupEventListeners() {
    // Overlay buttons
    document.querySelectorAll('.overlay-button').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedOverlay = btn.dataset.overlay;
            
            // Update active state
            document.querySelectorAll('.overlay-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Re-render matrix with overlay
            renderMatrix();
        });
    });
}

function renderMatrix() {
    const container = document.getElementById('capability-matrix');
    if (!capabilityData) return;

    let html = '';

    capabilityData.data.forEach((l1, l1Index) => {
        const l2Count = l1.l2.length;
        
        l1.l2.forEach((l2, l2Index) => {
            html += '<div class="matrix-row">';
            
            // L1 Cell (rowspan effect via conditional rendering)
            if (l2Index === 0) {
                html += `
                    <div class="matrix-cell l1-cell" style="vertical-align: top;">
                        <div class="text-[10px] text-slate-500 mb-1 font-mono">[${l1.id}]</div>
                        <div class="font-bold text-blue-400">${l1.name || 'L1 Capability'}</div>
                        <div class="text-xs text-slate-400 mt-1">${l1.description || ''}</div>
                        <div class="mt-2 text-[10px]">
                            <span class="text-slate-500">Maturity:</span> 
                            <span class="text-white font-bold">${l1.maturity_level || 'N/A'}</span>
                            <span class="text-slate-600">/</span>
                            <span class="text-slate-400">${l1.target_maturity_level || 'N/A'}</span>
                        </div>
                        ${l2Count > 1 ? `<div class="text-[10px] text-slate-600 mt-2">(${l2Count} L2 capabilities)</div>` : ''}
                    </div>
                `;
            } else {
                // Empty spacer for rowspan effect
                html += '<div class="matrix-cell l1-cell" style="border: none; background: transparent;"></div>';
            }
            
            // L2 Cell
            html += `
                <div class="matrix-cell l2-cell">
                    <div class="text-[10px] text-slate-500 mb-1 font-mono">[${l2.id}]</div>
                    <div class="font-semibold text-cyan-400">${l2.name || 'L2 Capability'}</div>
                    <div class="text-xs text-slate-400 mt-1">${l2.description || ''}</div>
                    <div class="mt-2 text-[10px]">
                        <span class="text-slate-500">Maturity:</span> 
                        <span class="text-white font-bold">${l2.maturity_level || 'N/A'}</span>
                        <span class="text-slate-600">/</span>
                        <span class="text-slate-400">${l2.target_maturity_level || 'N/A'}</span>
                    </div>
                </div>
            `;
            
            // L3 Container
            html += '<div class="matrix-cell l3-container"><div class="l3-cells-wrapper">';
            
            if (l2.l3 && l2.l3.length > 0) {
                l2.l3.forEach(l3 => {
                    const status = l3.status || 'active';
                    const statusClass = status === 'active' ? 'status-green' : 
                                       status === 'pending' ? 'status-amber' : 'status-red';
                    
                    // Calculate heatmap intensity
                    const heatmapColor = calculateHeatmapColor(l3);
                    
                    html += `
                        <div class="l3-cell ${statusClass}" 
                             data-id="${l3.id}"
                             onmouseenter="showCapabilityTooltip(event, '${l3.id}')"
                             onmouseleave="hideTooltip()">
                            ${selectedOverlay !== 'none' ? `<div class="heatmap-overlay" style="background: ${heatmapColor};"></div>` : ''}
                            <div class="relative z-10">
                                <div class="text-[10px] text-slate-400 mb-1 font-mono">[${l3.id}]</div>
                                <div class="text-xs font-medium text-white truncate">${l3.name || 'L3 Cap'}</div>
                                <div class="text-[10px] text-slate-400 mt-1">
                                    ${l3.maturity_level || 0}/${l3.target_maturity_level || 0}
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                html += '<div class="text-xs text-slate-600 p-4">No L3 capabilities</div>';
            }
            
            html += '</div></div>'; // Close l3-cells-wrapper and l3-container
            html += '</div>'; // Close matrix-row
        });
    });

    container.innerHTML = html;
}

function calculateHeatmapColor(l3) {
    if (selectedOverlay === 'none') return 'transparent';
    
    let intensity = 0;
    
    switch (selectedOverlay) {
        case 'maturity':
            // Maturity gap: red = big gap, green = at target
            const maturity = parseInt(l3.maturity_level) || 0;
            const target = parseInt(l3.target_maturity_level) || 5;
            intensity = maturity / target;
            break;
        
        case 'staff':
            // Simulate staff needs (would come from attributes in real data)
            intensity = Math.random(); // Mock: 0-100%
            break;
        
        case 'tools':
            // Simulate IT tools availability
            intensity = Math.random();
            break;
        
        case 'process':
            // Simulate process documentation
            intensity = Math.random();
            break;
        
        case 'health':
            // Simulate team health
            intensity = Math.random();
            break;
        
        default:
            intensity = 0.5;
    }
    
    return getGradientColor(intensity);
}

function getGradientColor(intensity) {
    // Green -> Yellow -> Red gradient
    // 0 = Red, 0.5 = Yellow, 1 = Green
    
    const t = Math.max(0, Math.min(1, intensity));
    
    if (t < 0.5) {
        // Red to Yellow
        const scaled = t * 2;
        const r = 255;
        const g = Math.round(scaled * 255);
        const b = 0;
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    } else {
        // Yellow to Green
        const scaled = (t - 0.5) * 2;
        const r = Math.round(255 * (1 - scaled));
        const g = 255;
        const b = 0;
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
}

function showCapabilityTooltip(event, capId) {
    const tooltip = document.getElementById('capability-tooltip');
    
    // Find capability in data
    let capability = null;
    capabilityData.data.forEach(l1 => {
        l1.l2.forEach(l2 => {
            l2.l3.forEach(l3 => {
                if (l3.id === capId) {
                    capability = l3;
                }
            });
        });
    });
    
    if (!capability) return;
    
    let html = `
        <div class="text-sm">
            <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] text-slate-500 font-mono">[${capability.id}]</span>
                <span class="px-2 py-0.5 rounded text-xs ${
                    capability.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }">${capability.status || 'N/A'}</span>
            </div>
            
            <h4 class="font-bold text-white mb-2">${capability.name}</h4>
            
            <div class="text-xs text-slate-400 mb-3">
                ${capability.description || 'No description available'}
            </div>
            
            <div class="border-t border-slate-700 pt-2 mb-2">
                <div class="text-[10px] text-blue-400 font-bold mb-1">MATURITY</div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-slate-700 h-2 rounded-full">
                        <div class="h-2 rounded-full bg-blue-500" style="width: ${
                            ((parseInt(capability.maturity_level) || 0) / (parseInt(capability.target_maturity_level) || 5)) * 100
                        }%"></div>
                    </div>
                    <span class="text-sm font-bold text-white">${capability.maturity_level || 0}/${capability.target_maturity_level || 5}</span>
                </div>
            </div>
    `;
    
    // Add overlay-specific data
    if (selectedOverlay !== 'none') {
        html += `
            <div class="border-t border-slate-700 pt-2">
                <div class="text-[10px] text-emerald-400 font-bold mb-1">${selectedOverlay.toUpperCase()}</div>
                <div class="text-sm text-slate-300">Intensity: ${Math.round(Math.random() * 100)}%</div>
            </div>
        `;
    }
    
    html += '</div>';
    
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 20) + 'px';
    tooltip.style.top = (event.pageY - 50) + 'px';
}

function hideTooltip() {
    document.getElementById('capability-tooltip').style.display = 'none';
}

// Make functions global for inline event handlers
window.showCapabilityTooltip = showCapabilityTooltip;
window.hideTooltip = hideTooltip;
