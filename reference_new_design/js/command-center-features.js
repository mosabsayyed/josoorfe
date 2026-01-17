/**
 * COMMAND CENTER - ALL 4 FEATURES
 * Feature 1.1: Cross-Domain Integration Matrix
 * Feature 1.2: Dual-Layer Health Status
 * Feature 1.3: Level Flow Diagram
 * Feature 1.4: Critical Jeopardy Alerts
 */

let csvData = null;
let flowChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load CSV data
    csvData = await CSVParser.loadAllData();
    
    if (csvData) {
        renderDualHealthStatus();
        renderIntegrationMatrix();
        renderFlowDiagram();
        renderJeopardyAlerts();
    }
});

// ============================================
// FEATURE 1.2: DUAL-LAYER HEALTH STATUS
// ============================================

function renderDualHealthStatus() {
    const year = '2025';
    
    // Sector Health: ObjectiveL1 status
    const objL1 = csvData.objectives.filter(o => o.year === year && o.level === 'L1');
    const perfL1 = csvData.performance.filter(p => p.year === year && p.level === 'L1');
    
    let sectorGreen = 0;
    objL1.forEach(obj => {
        const perf = perfL1.find(p => p.id === obj.id);
        if (perf) {
            const achievement = (parseFloat(perf.actual) / parseFloat(perf.target)) * 100;
            if (achievement >= 90) sectorGreen++;
        }
    });
    
    const sectorPct = Math.round((sectorGreen / objL1.length) * 100);
    document.getElementById('sector-health-value').textContent = sectorPct + '%';
    document.getElementById('sector-health-bar').style.width = sectorPct + '%';
    document.getElementById('sector-detail').textContent = 
        `${sectorGreen} of ${objL1.length} Strategic Objectives on track`;
    
    // Color
    const sectorColor = sectorPct >= 75 ? 'var(--component-color-success)' : 
                       sectorPct >= 50 ? 'var(--component-color-warning)' : 
                       'var(--component-color-danger)';
    document.getElementById('sector-health-value').style.color = sectorColor;
    document.getElementById('sector-health-bar').style.background = sectorColor;
    
    // Entity Health: CapabilityL2 maturity
    const capL2 = csvData.capabilities.filter(c => c.year === year && c.level === 'L2');
    const entityMature = capL2.filter(c => 
        parseFloat(c.maturity_level) >= parseFloat(c.target_maturity_level)
    ).length;
    
    const entityPct = Math.round((entityMature / capL2.length) * 100);
    document.getElementById('entity-health-value').textContent = entityPct + '%';
    document.getElementById('entity-health-bar').style.width = entityPct + '%';
    document.getElementById('entity-detail').textContent = 
        `${entityMature} of ${capL2.length} Functional Capabilities at target maturity`;
    
    const entityColor = entityPct >= 75 ? 'var(--component-color-success)' : 
                       entityPct >= 50 ? 'var(--component-color-warning)' : 
                       'var(--component-color-danger)';
    document.getElementById('entity-health-value').style.color = entityColor;
    document.getElementById('entity-health-bar').style.background = entityColor;
    
    // Integration Alerts
    const alertsContainer = document.getElementById('integration-alerts');
    if (sectorPct < 75 && entityPct >= 75) {
        alertsContainer.innerHTML = `
            <div class="integration-alert">
                <strong>⚠️ EXECUTION FAILURE DETECTED</strong><br/>
                <span style="font-size: 0.85rem;">
                    Entity capabilities are strong (${entityPct}%) but Sector objectives are underperforming (${sectorPct}%).
                    <br/>Possible cause: Policy tool execution issues or market conditions.
                </span>
            </div>
        `;
    } else if (sectorPct >= 75 && entityPct < 75) {
        alertsContainer.innerHTML = `
            <div class="integration-alert" style="border-left-color: var(--component-color-warning);">
                <strong>⚠️ HOLLOW VICTORY RISK</strong><br/>
                <span style="font-size: 0.85rem;">
                    Sector objectives appear healthy (${sectorPct}%) but Entity capabilities lag (${entityPct}%).
                    <br/>Risk: Results may not be sustainable without capability maturity.
                </span>
            </div>
        `;
    }
}

// ============================================
// FEATURE 1.1: CROSS-DOMAIN INTEGRATION MATRIX
// ============================================

function renderIntegrationMatrix() {
    const year = '2025';
    const table = document.getElementById('integration-matrix');
    
    // Get ObjL1 (rows) and CapL2 (columns)
    const objL1 = csvData.objectives.filter(o => o.year === year && o.level === 'L1');
    const capL2 = csvData.capabilities.filter(c => c.year === year && c.level === 'L2');
    
    // Build header
    let html = '<thead><tr><th>Sector Objectives L1</th>';
    capL2.forEach(cap => {
        html += `<th><div style="font-size: 0.75rem;">${cap.name}</div><div style="font-size: 0.65rem; color: var(--component-text-muted);">[${cap.id}]</div></th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Build rows
    objL1.forEach(obj => {
        html += `<tr><td style="text-align: left; font-weight: 600;"><div>${obj.name}</div><div style="font-size: 0.7rem; color: var(--component-text-muted);">[${obj.id}]</div></td>`;
        
        capL2.forEach(cap => {
            // Calculate connection strength via PerfL1 → PerfL2 → CapL2
            const strength = calculateConnectionStrength(obj, cap);
            const strengthClass = strength >= 70 ? 'strength-strong' : 
                                 strength >= 40 ? 'strength-medium' : 'strength-weak';
            const strengthLabel = strength >= 70 ? 'Strong' : 
                                 strength >= 40 ? 'Medium' : 'Weak';
            
            html += `
                <td class="matrix-cell" onclick="drillIntoConnection('${obj.id}', '${cap.id}')">
                    <div style="font-weight: 700; font-size: 0.9rem;">${strength}%</div>
                    <div class="strength-bar ${strengthClass}"></div>
                    <div style="font-size: 0.7rem; color: var(--component-text-muted);">${strengthLabel}</div>
                </td>
            `;
        });
        
        html += '</tr>';
    });
    html += '</tbody>';
    
    table.innerHTML = html;
}

function calculateConnectionStrength(objL1, capL2) {
    // Path: ObjL1 → PerfL1 → PerfL2 → CapL2
    // Find PerfL1 for this objective
    const perfL1 = csvData.performance.find(p => 
        p.id === objL1.id && p.level === 'L1' && p.year === objL1.year
    );
    
    if (!perfL1) return 0;
    
    // Find PerfL2s under this PerfL1
    const perfL2s = csvData.performance.filter(p => 
        p.level === 'L2' && p.parent_id === perfL1.id && p.year === perfL1.year
    );
    
    // Check if any PerfL2 targets this CapL2 (via Sets_Targets relationship)
    // For now, use a simple heuristic: capability maturity affects connection
    const capMaturity = parseFloat(capL2.maturity_level) || 0;
    const capTarget = parseFloat(capL2.target_maturity_level) || 5;
    const maturityPct = (capMaturity / capTarget) * 100;
    
    // Also factor in performance achievement
    const perfAchievement = (parseFloat(perfL1.actual) / parseFloat(perfL1.target)) * 100;
    
    // Connection strength = average of capability maturity and performance
    return Math.round((maturityPct + perfAchievement) / 2);
}

function drillIntoConnection(objId, capId) {
    alert(`Drill into: Objective [${objId}] ↔ Capability [${capId}]\n\nWould show:\n- Performance L1/L2 bridge\n- Policy tools involved\n- Project gaps`);
}

// ============================================
// FEATURE 1.3: LEVEL FLOW DIAGRAM (Sankey)
// ============================================

function renderFlowDiagram() {
    const container = document.getElementById('flow-diagram');
    flowChart = echarts.init(container);
    
    const year = '2025';
    
    // Simplified Sankey showing 5 paths
    const option = {
        backgroundColor: 'var(--component-panel-bg)',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            borderColor: 'var(--component-panel-border)',
            textStyle: { color: 'var(--component-text-primary)' }
        },
        series: [{
            type: 'sankey',
            layout: 'none',
            emphasis: { focus: 'adjacency' },
            data: [
                { name: 'Objectives L1', depth: 0, itemStyle: { color: '#FFD700' } },
                { name: 'Performance L1', depth: 1, itemStyle: { color: '#10B981' } },
                { name: 'PolicyTools L1', depth: 1, itemStyle: { color: '#3b82f6' } },
                { name: 'Performance L2', depth: 2, itemStyle: { color: '#10B981' } },
                { name: 'PolicyTools L2', depth: 2, itemStyle: { color: '#3b82f6' } },
                { name: 'Capabilities L2', depth: 3, itemStyle: { color: '#8b5cf6' } },
                { name: 'Risks L3', depth: 4, itemStyle: { color: '#ef4444' } }
            ],
            links: [
                { source: 'Objectives L1', target: 'Performance L1', value: 10 },
                { source: 'Objectives L1', target: 'PolicyTools L1', value: 8 },
                { source: 'Performance L1', target: 'Performance L2', value: 10 },
                { source: 'PolicyTools L1', target: 'PolicyTools L2', value: 8 },
                { source: 'Performance L2', target: 'Capabilities L2', value: 10 },
                { source: 'PolicyTools L2', target: 'Capabilities L2', value: 8 },
                { source: 'Capabilities L2', target: 'Risks L3', value: 5 },
                { source: 'Risks L3', target: 'Performance L2', value: 5 }
            ],
            lineStyle: {
                color: 'gradient',
                curveness: 0.5
            },
            label: {
                color: 'var(--component-text-primary)',
                fontSize: 12
            }
        }]
    };
    
    flowChart.setOption(option);
    window.addEventListener('resize', () => flowChart && flowChart.resize());
}

// ============================================
// FEATURE 1.4: CRITICAL JEOPARDY ALERTS
// ============================================

function renderJeopardyAlerts() {
    const year = '2025';
    const container = document.getElementById('jeopardy-feed');
    
    // Find high-severity risks
    const risks = csvData.capabilities.filter(c => 
        c.year === year && c.level === 'L3' && parseFloat(c.maturity_level || 0) < 2
    );
    
    // Trace impact to objectives
    const alerts = [];
    
    risks.slice(0, 3).forEach(risk => {
        // Find parent CapL2
        const capL2 = csvData.capabilities.find(c => 
            c.id === risk.parent_id && c.year === year && c.level === 'L2'
        );
        
        if (!capL2) return;
        
        // Find related PerfL2 (simplified: use parent relationship)
        const perfL2 = csvData.performance.find(p => 
            p.level === 'L2' && p.year === year
        );
        
        // Find PerfL1
        const perfL1 = perfL2 ? csvData.performance.find(p => 
            p.id === perfL2.parent_id && p.level === 'L1' && p.year === year
        ) : null;
        
        // Find ObjL1
        const objL1 = perfL1 ? csvData.objectives.find(o => 
            o.id === perfL1.id && o.level === 'L1' && o.year === year
        ) : null;
        
        if (objL1) {
            alerts.push({
                risk: risk,
                capability: capL2,
                performance: perfL1,
                objective: objL1,
                score: 10 - parseFloat(risk.maturity_level || 0)
            });
        }
    });
    
    if (alerts.length === 0) {
        container.innerHTML = '<p style="color: var(--component-text-muted); text-align: center; padding: 2rem;">No critical jeopardies detected</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="jeopardy-alert">
            <div class="jeopardy-header">
                <strong style="color: var(--component-color-danger);">🔴 CRITICAL JEOPARDY</strong>
                <span class="jeopardy-score">Risk Score: ${alert.score.toFixed(1)}</span>
            </div>
            
            <div class="impact-chain">
                <div class="chain-step">
                    <span class="chain-node node-risk">${alert.risk.name} [${alert.risk.id}]</span>
                    <span class="chain-arrow">↓ threatens</span>
                </div>
                <div class="chain-step">
                    <span class="chain-node node-capability">${alert.capability.name} [${alert.capability.id}]</span>
                    <span class="chain-arrow">↓ impacts</span>
                </div>
                <div class="chain-step">
                    <span class="chain-node node-performance">${alert.performance.name} [${alert.performance.id}]</span>
                    <span class="chain-arrow">↓ endangers</span>
                </div>
                <div class="chain-step">
                    <span class="chain-node node-objective">${alert.objective.name} [${alert.objective.id}]</span>
                </div>
            </div>
            
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--component-panel-border); font-size: 0.8rem; color: var(--component-text-muted);">
                <strong>ACTION REQUIRED:</strong> Address capability gap to prevent strategic objective failure
            </div>
        </div>
    `).join('');
}

// Make functions global
window.drillIntoConnection = drillIntoConnection;
