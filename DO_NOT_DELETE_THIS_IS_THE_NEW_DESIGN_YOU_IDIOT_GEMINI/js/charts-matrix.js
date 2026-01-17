document.addEventListener('DOMContentLoaded', () => {
    initMatrix();
});

let currentMode = 'maturity';

function initMatrix() {
    renderMatrix('maturity');
}

function setMatrixMode(mode) {
    currentMode = mode;

    // Update Buttons
    document.getElementById('btn-maturity').className = `px-3 py-1 rounded text-xs font-medium transition-colors ${mode === 'maturity' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`;
    document.getElementById('btn-risk').className = `px-3 py-1 rounded text-xs font-medium transition-colors ${mode === 'risk' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`;

    renderMatrix(mode);
}

function renderMatrix(mode) {
    const { nodes, links } = ontologyData;
    const tbody = document.getElementById('matrix-body');
    tbody.innerHTML = '';

    // 1. Build Hierarchy Tree
    // Find L1s
    const l1Nodes = nodes.filter(n => n.level === 1 && n.category === 'EntityCapability');

    // Sort L1s by Name
    l1Nodes.sort((a, b) => a.name.localeCompare(b.name));

    l1Nodes.forEach(l1 => {
        // Find Children L2s
        const l2Links = links.filter(l => l.source === l1.id && l.type === 'PARENT_OF');
        const l2Nodes = l2Links.map(l => nodes.find(n => n.id === l.target)).filter(n => n);
        l2Nodes.sort((a, b) => a.name.localeCompare(b.name));

        if (l2Nodes.length === 0) {
            // Edge case: L1 with no children
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="p-3 border border-slate-700 bg-slate-800/20 align-top">${renderCell(l1, mode)}</td><td class="p-3 border border-slate-700 bg-slate-900/50 normal text-slate-500">No L2</td><td class="p-3 border border-slate-700 bg-slate-900/50 normal text-slate-500">No L3</td>`;
            tbody.appendChild(tr);
            return;
        }

        // Calculate Total Rows for L1 Rowspan
        let l1RowSpan = 0;
        const l2Struct = [];

        l2Nodes.forEach(l2 => {
            // Find Children L3s
            const l3Links = links.filter(l => l.source === l2.id && l.type === 'PARENT_OF');
            const l3Nodes = l3Links.map(l => nodes.find(n => n.id === l.target)).filter(n => n);
            l3Nodes.sort((a, b) => a.name.localeCompare(b.name));

            const rowCount = Math.max(l3Nodes.length, 1); // At least 1 row even if no L3
            l1RowSpan += rowCount;

            l2Struct.push({ node: l2, children: l3Nodes, rowSpan: rowCount });
        });

        // Render Rows
        l2Struct.forEach((l2Data, l2Index) => {
            const l2 = l2Data.node;
            const l3s = l2Data.children;
            const rows = l2Data.rowSpan;

            // Iterate through rows (L3s)
            for (let i = 0; i < rows; i++) {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-800/30 transition-colors";

                // L1 Cell (Only on first row of first L2)
                if (l2Index === 0 && i === 0) {
                    const tdL1 = document.createElement('td');
                    tdL1.className = "p-3 border border-slate-700 align-top relative";
                    tdL1.rowSpan = l1RowSpan;
                    tdL1.innerHTML = renderCell(l1, mode);
                    tdL1.style.backgroundColor = getBgColor(l1, mode, 0.1);
                    tr.appendChild(tdL1);
                }

                // L2 Cell (Only on first row of this L2)
                if (i === 0) {
                    const tdL2 = document.createElement('td');
                    tdL2.className = "p-3 border border-slate-700 align-top relative";
                    tdL2.rowSpan = rows;
                    tdL2.innerHTML = renderCell(l2, mode);
                    tdL2.style.backgroundColor = getBgColor(l2, mode, 0.15);
                    tr.appendChild(tdL2);
                }

                // L3 Cell
                const tdL3 = document.createElement('td');
                tdL3.className = "p-3 border border-slate-700 relative";
                if (l3s[i]) {
                    tdL3.innerHTML = renderCell(l3s[i], mode);
                    tdL3.style.backgroundColor = getBgColor(l3s[i], mode, 0.2);
                } else {
                    tdL3.innerHTML = '<span class="text-slate-600 normal">No L3 definition</span>';
                    tdL3.style.backgroundColor = 'rgba(15, 23, 42, 0.5)';
                }
                tr.appendChild(tdL3);

                tbody.appendChild(tr);
            }
        });
    });

    updateLegend(mode);
}

function renderCell(node, mode) {
    let badge = '';

    if (mode === 'maturity') {
        const m = node.maturity_level || 0;
        // Generate simplified blocks for maturity (1-5)
        let blocks = '';
        for (let i = 0; i < 5; i++) {
            blocks += `<div class="w-1.5 h-3 rounded-sm ${i < m ? 'bg-emerald-400' : 'bg-slate-700'} mr-0.5"></div>`;
        }
        badge = `<div class="flex mt-2">${blocks}</div>`;
    } else if (mode === 'risk') {
        // Find connected risks to calculate score if not present
        // Or assume data.js has derived logic. 
        // For visual sim, let's look for connected EntityRisk nodes.
        const { links, nodes } = ontologyData;
        const risks = links.filter(l => l.source === node.id && l.type === 'MONITORED_BY')
            .map(l => nodes.find(n => n.id === l.target));

        let maxRisk = 0;
        if (risks.length > 0) {
            maxRisk = Math.max(...risks.map(r => r.risk_score || 0));
        }

        if (maxRisk > 0) {
            badge = `<div class="mt-2 text-xs font-bold ${maxRisk > 70 ? 'text-red-400' : 'text-orange-400'}"><i class="fas fa-exclamation-triangle mr-1"></i> Risk: ${maxRisk}</div>`;
        } else {
            badge = `<div class="mt-2 text-xs text-slate-500"><i class="fas fa-check-circle mr-1"></i> Low Risk</div>`;
        }
    }

    return `
        <div class="flex flex-col h-full justify-between">
            <span class="font-medium text-slate-200">${node.name}</span>
            <div class="text-xs text-slate-400 font-mono mt-1">${node.id}</div>
            ${badge}
        </div>
    `;
}

function getBgColor(node, mode, opacity) {
    if (mode === 'maturity') {
        // Emerald for high maturity
        const m = node.maturity_level || 1;
        // Scale opacity by maturity? No, scale color.
        // Let's use opacity passed in as base, but tint based on score.
        // Actually, heatmaps usually color the whole cell.
        // Let's return a subtle gradient or solid color based on score.
        if (m >= 4) return `rgba(16, 185, 129, ${opacity * 1.5})`; // Green
        if (m === 3) return `rgba(59, 130, 246, ${opacity * 1.5})`; // Blue
        return `rgba(245, 158, 11, ${opacity * 1.5})`; // Orange/Yellow
    }

    if (mode === 'risk') {
        // Red for high risk
        const { links, nodes } = ontologyData;
        const risks = links.filter(l => l.source === node.id && l.type === 'MONITORED_BY')
            .map(l => nodes.find(n => n.id === l.target));
        let maxRisk = 0;
        if (risks.length > 0) maxRisk = Math.max(...risks.map(r => r.risk_score || 0));

        if (maxRisk > 80) return `rgba(239, 68, 68, ${opacity * 2})`; // Red
        if (maxRisk > 50) return `rgba(249, 115, 22, ${opacity * 2})`; // Orange
        return `rgba(30, 41, 59, ${opacity})`; // Default Slate
    }

    return `rgba(30, 41, 59, ${opacity})`;
}

function updateLegend(mode) {
    const el = document.getElementById('matrix-legend');
    if (mode === 'maturity') {
        el.innerHTML = `
            <div class="flex items-center"><span class="w-3 h-3 rounded bg-emerald-500/50 mr-2"></span> High Maturity (4-5)</div>
            <div class="flex items-center"><span class="w-3 h-3 rounded bg-blue-500/50 mr-2"></span> Medium (3)</div>
            <div class="flex items-center"><span class="w-3 h-3 rounded bg-orange-500/50 mr-2"></span> Low (1-2)</div>
        `;
    } else {
        el.innerHTML = `
            <div class="flex items-center"><span class="w-3 h-3 rounded bg-red-500/50 mr-2"></span> Critical Risk (>80)</div>
            <div class="flex items-center"><span class="w-3 h-3 rounded bg-orange-500/50 mr-2"></span> Warning (50-80)</div>
            <div class="flex items-center"><span class="w-3 h-3 rounded bg-slate-700 mr-2"></span> Safe / No Data</div>
        `;
    }
}
