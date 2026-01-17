/**
 * GAUGE & RADAR CHARTS COMPONENT
 * Handles:
 * 1. Strategic Impact & Transformation Health Radars
 * 2. L1 & L2 Objective Gauges (Side Layout)
 */

// ==========================================
// 1. RADAR CHART HELPERS
// ==========================================

function createRadarOption(title, indicatorData, value, color) {
    // Determine radar size based on number of indicators
    const isLargeRadar = indicatorData.length > 6;
    
    return {
        backgroundColor: 'transparent',
        title: {
            text: title,
            left: 'center',
            top: 12,
            textStyle: {
                color: '#fff',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'Inter'
            }
        },
        graphic: [
            {
                type: 'text',
                right: 20,
                top: 12,
                style: {
                    text: value,
                    fill: color,
                    fontSize: 28,
                    fontWeight: 'bold',
                    fontFamily: 'Inter'
                }
            }
        ],
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#475569',
            textStyle: { color: '#fff' },
            formatter: function(params) {
                const indicator = params.name;
                const actualValue = params.value;
                const planValue = indicatorData[params.dataIndex].plan || actualValue;
                return `
                    <div style="font-weight: 700; margin-bottom: 4px;">${indicator}</div>
                    <div style="color: ${color};">Actual: ${actualValue}%</div>
                    <div style="color: #64748b;">Plan: ${planValue}%</div>
                `;
            }
        },
        legend: {
            data: ['Actual', 'Plan'],
            bottom: 5,
            textStyle: {
                color: '#94a3b8',
                fontSize: 10
            }
        },
        radar: {
            indicator: indicatorData,
            center: ['50%', isLargeRadar ? '52%' : '60%'],
            radius: isLargeRadar ? '65%' : '50%',
            splitNumber: 4,
            axisName: {
                color: '#cbd5e1',
                fontSize: isLargeRadar ? 10 : 9,
                fontFamily: 'Inter'
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            splitArea: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        series: [
            {
                name: 'Plan',
                type: 'radar',
                symbol: 'circle',
                symbolSize: 4,
                data: [
                    {
                        value: indicatorData.map(i => i.plan || i.val),
                        name: 'Plan',
                        lineStyle: {
                            color: '#64748b',
                            width: 2,
                            type: 'dashed'
                        },
                        itemStyle: {
                            color: '#64748b'
                        },
                        areaStyle: {
                            color: 'rgba(100, 116, 139, 0.1)'
                        }
                    }
                ]
            },
            {
                name: 'Actual',
                type: 'radar',
                symbol: 'circle',
                symbolSize: 5,
                data: [
                    {
                        value: indicatorData.map(i => i.val),
                        name: 'Actual',
                        lineStyle: {
                            color: color,
                            width: 2
                        },
                        itemStyle: {
                            color: color
                        },
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: color },
                                { offset: 1, color: 'rgba(0,0,0,0)' }
                            ]),
                            opacity: 0.4
                        }
                    }
                ]
            }
        ]
    };
}

function renderRadars() {
    // 1. Strategic Impact Radar (Row 1)
    const chart1 = echarts.init(document.getElementById('radar-strategic'));
    const option1 = createRadarOption(
        'Strategic Impact',
        [
            { name: 'GDP\n23%', max: 100, val: 23, plan: 30 },
            { name: 'Jobs\n23%', max: 100, val: 23, plan: 25 },
            { name: 'UX\n60%', max: 100, val: 60, plan: 55 },
            { name: 'Security\n23%', max: 100, val: 23, plan: 28 },
            { name: 'Regulations\n60%', max: 100, val: 60, plan: 65 }
        ],
        '38%',
        '#10b981' // Green
    );
    chart1.setOption(option1);

    // 2. Transformation Health Radar (Row 2)
    const chart2 = echarts.init(document.getElementById('radar-transform'));
    const option2 = createRadarOption(
        'Transformation Health',
        [
            { name: 'Strategy\n97%', max: 100, val: 97, plan: 95 },
            { name: 'Ops\n96%', max: 100, val: 96, plan: 90 },
            { name: 'Risk\n95%', max: 100, val: 95, plan: 93 },
            { name: 'Investments\n49%', max: 100, val: 49, plan: 60 },
            { name: 'Investors\n89%', max: 100, val: 89, plan: 85 },
            { name: 'Employees\n63%', max: 100, val: 63, plan: 70 },
            { name: 'Projects\n91%', max: 100, val: 91, plan: 88 },
            { name: 'Tech\n91%', max: 100, val: 91, plan: 92 }
        ],
        '84%',
        '#f59e0b' // Gold/Yellow
    );
    chart2.setOption(option2);
    
    window.addEventListener('resize', () => {
        chart1.resize();
        chart2.resize();
    });
}

// ==========================================
// 2. GAUGE CHART HELPERS
// ==========================================

function createProperGauge(objective, isLarge = true) {
    // ACTUAL reference design: wider than tall, semicircle at BOTTOM
    const width = isLarge ? 380 : 360;
    const height = isLarge ? 100 : 90;
    
    const cx = width / 2;
    const cy = height * 0.55; // Position arc toward top
    const r = isLarge ? 42 : 38;
    const strokeWidth = isLarge ? 8 : 7;

    const { base, q_minus_1, actual, q_plus_1, end } = objective.values;
    const delta = objective.delta;
    
    // CORRECT Arc angles: BOTTOM semicircle 180° (left) to 0°/360° (right)
    const startAngle = 180;
    const endAngle = 360;
    const totalRange = end - base;
    
    const getAngle = (val) => {
        const v = Math.max(base, Math.min(val, end));
        const pct = (v - base) / totalRange;
        return startAngle + (pct * (endAngle - startAngle));
    };

    const angleBase = startAngle;
    const angleQ1 = getAngle(q_minus_1);
    const angleActual = getAngle(actual);
    const angleQ2 = getAngle(q_plus_1);
    const angleEnd = endAngle;
    
    const trackColor = "#334155";
    const progressColor = objective.status === 'red' ? '#ef4444' : (objective.status === 'amber' ? '#f59e0b' : '#10b981');
    
    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    function describeArc(x, y, radius, startAngle, endAngle) {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    }

    // Get label positions
    const posBase = polarToCartesian(cx, cy, r + 15, angleBase);
    const posQ1 = polarToCartesian(cx, cy, r + 15, angleQ1);
    const posActual = polarToCartesian(cx, cy, r + 15, angleActual);
    const posQ2 = polarToCartesian(cx, cy, r + 15, angleQ2);
    const posEnd = polarToCartesian(cx, cy, r + 15, angleEnd);

    const deltaSign = delta >= 0 ? '+' : '';

    return `
        <div style="width: ${width}px; height: ${height}px; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, rgba(15, 35, 65, 0.9), rgba(20, 50, 70, 0.9)); border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.3); position: relative; overflow: visible;">
            
            <!-- Title Badge Top Left -->
            <div style="position: absolute; top: 8px; left: 12px; background: rgba(51, 65, 85, 0.8); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(148, 163, 184, 0.3);">
                <div style="font-size: 11px; font-weight: 700; color: #e2e8f0;">${objective.name}</div>
            </div>

            <svg width="${width}" height="${height}" style="display: block;">
                <!-- Background Track -->
                <path d="${describeArc(cx, cy, r, startAngle, endAngle)}" 
                      fill="none" stroke="${trackColor}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
                
                <!-- Progress Arc with Gradient -->
                <defs>
                    <linearGradient id="grad-${objective.id.replace('.', '-')}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${progressColor};stop-opacity:0.6" />
                        <stop offset="100%" style="stop-color:${progressColor};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path d="${describeArc(cx, cy, r, startAngle, angleActual)}" 
                      fill="none" stroke="url(#grad-${objective.id.replace('.', '-')})" stroke-width="${strokeWidth}" stroke-linecap="round"/>

                <!-- Large Percentage Value at TOP CENTER -->
                <text x="${cx}" y="${cy - r - 5}" text-anchor="middle" fill="#ffffff" font-size="${isLarge ? 32 : 28}" font-weight="700">
                    ${actual}%
                </text>

                <!-- Delta Badge INSIDE ARC at bottom -->
                <rect x="${cx - 30}" y="${cy + 5}" width="60" height="22" rx="11" 
                      fill="rgba(15, 23, 42, 0.95)" stroke="#fbbf24" stroke-width="1.5" />
                <text x="${cx}" y="${cy + 20}" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">
                    ${deltaSign}${delta}
                </text>

                <!-- Bottom Labels -->
                <text x="${posBase.x}" y="${posBase.y + 5}" text-anchor="start" fill="#94a3b8" font-size="9" font-weight="500">base</text>
                <text x="${posQ1.x}" y="${posQ1.y + 5}" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="500">Q-1</text>
                <text x="${posActual.x}" y="${posActual.y + 8}" text-anchor="middle" fill="#fbbf24" font-size="10" font-weight="700">Actual</text>
                <text x="${posQ2.x}" y="${posQ2.y + 5}" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="500">Q+1</text>
                <text x="${posEnd.x}" y="${posEnd.y + 5}" text-anchor="end" fill="#94a3b8" font-size="9" font-weight="500">end</text>
                
                <!-- Percentage markers on arc -->
                <text x="${posBase.x}" y="${posBase.y - 8}" text-anchor="start" fill="#64748b" font-size="10">${base}%</text>
                <text x="${posQ1.x}" y="${posQ1.y - 8}" text-anchor="middle" fill="#64748b" font-size="10">${q_minus_1}%</text>
                <text x="${posQ2.x}" y="${posQ2.y - 8}" text-anchor="middle" fill="#64748b" font-size="10">${q_plus_1}%</text>
                <text x="${posEnd.x}" y="${posEnd.y - 8}" text-anchor="end" fill="#64748b" font-size="10">${end}%</text>
            </svg>
        </div>
    `;
}

function renderObjectiveGauges() {
    if (typeof window.ksaData === 'undefined') {
        setTimeout(renderObjectiveGauges, 100);
        return;
    }
    
    const { objectivesL1, objectivesL2, transformationInsights } = window.ksaData;
    
    // Target the NEW Containers
    const containerImpact = document.getElementById('gauges-impact');
    const containerHealth = document.getElementById('insights-transform');
    
    if (!containerImpact || !containerHealth) return;
    
    // Clear
    containerImpact.innerHTML = '';
    containerHealth.innerHTML = '';
    
    // STRATEGIC IMPACT TAB: Render in order L1 → its L2 children
    let htmlImpact = '';
    
    // 1.0 Water Security GDP (L1)
    const obj1_0 = objectivesL1.find(o => o.id === '1.0');
    if (obj1_0) htmlImpact += createProperGauge(obj1_0, true);
    
    // 1.1 FDI (L2 child of 1.0)
    const obj1_1 = objectivesL2.find(o => o.id === '1.1');
    if (obj1_1) htmlImpact += createProperGauge(obj1_1, false);
    
    // 1.2 Jobs (L2 child of 1.0)
    const obj1_2 = objectivesL2.find(o => o.id === '1.2');
    if (obj1_2) htmlImpact += createProperGauge(obj1_2, false);
    
    // 2.0 Infrastructure Resilience (L1)
    const obj2_0 = objectivesL1.find(o => o.id === '2.0');
    if (obj2_0) htmlImpact += createProperGauge(obj2_0, true);
    
    // 2.1 Desalination (L2 child of 2.0)
    const obj2_1 = objectivesL2.find(o => o.id === '2.1');
    if (obj2_1) htmlImpact += createProperGauge(obj2_1, false);
    
    // 2.2 Pipeline (L2 child of 2.0)
    const obj2_2 = objectivesL2.find(o => o.id === '2.2');
    if (obj2_2) htmlImpact += createProperGauge(obj2_2, false);
    
    containerImpact.innerHTML = htmlImpact;

    // TRANSFORMATION HEALTH TAB: Render insight cards
    if (transformationInsights && transformationInsights.length > 0) {
        let htmlHealth = '';
        transformationInsights.forEach(insight => {
            htmlHealth += createInsightCard(insight);
        });
        containerHealth.innerHTML = htmlHealth;
    }
}

// ==========================================
// 3. INSIGHT CARD HELPERS (for Transformation Health)
// ==========================================

function createInsightCard(insight) {
    // Placeholder cards for transformation insights
    // These will render mini-charts based on type
    const cardStyle = `
        background: rgba(30, 41, 59, 0.4); 
        border-radius: 6px; 
        border: 1px solid #334155; 
        padding: 12px;
        min-height: 80px;
    `;
    
    return `
        <div style="${cardStyle}">
            <div style="font-size: 11px; font-weight: 700; color: #e2e8f0; margin-bottom: 8px;">${insight.name}</div>
            <div style="font-size: 9px; color: #94a3b8; margin-bottom: 8px;">${insight.description}</div>
            <div style="font-size: 10px; color: #64748b;">[${insight.type} visualization - to be implemented]</div>
        </div>
    `;
}

// ==========================================
// EXPORTS
// ==========================================
if (typeof window !== 'undefined') {
    window.renderObjectiveGauges = renderObjectiveGauges;
    window.renderRadars = renderRadars;
}
