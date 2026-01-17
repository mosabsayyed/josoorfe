import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RiskTopologyMap } from './RiskTopologyMap';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ArrowLeft, TrendingUp, Activity, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { AIExplainButton } from './AIExplainButton';
import { useQuery } from '@tanstack/react-query';

// Type for the context from JosoorFrame
interface JosoorContext {
    year: string;
    quarter: string;
}

const RiskDesk: React.FC = () => {
    // Get year/quarter from JosoorFrame via Outlet context
    const { year, quarter } = useOutletContext<JosoorContext>();

    const { language } = useLanguage();
    const [selectedView, setSelectedView] = useState<'overview' | 'detail'>('overview');
    const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

    // -- FETCH REAL RISK DATA ONLY --
    const { data: riskGraphData, isLoading } = useQuery({
        queryKey: ['riskNodes', year, quarter],
        queryFn: async () => {
            // Cater for year and quarter filters
            const res = await fetch(`/api/graph?labels=EntityRisk&years=${year}&quarter=${quarter}`);
            if (!res.ok) throw new Error('Failed to fetch risks');
            return res.json();
        }
    });

    // Derive risks list from graph data
    const risks = riskGraphData?.nodes || [];

    // Find active risk from live data
    const activeRisk = risks.find((n: any) => n.id === selectedRiskId || n.props?.id === selectedRiskId);

    const handleRiskSelect = (riskId: string) => {
        setSelectedRiskId(riskId);
        setSelectedView('detail');
    };

    const handleBack = () => {
        setSelectedView('overview');
        setSelectedRiskId(null);
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            direction: language === 'ar' ? 'rtl' : 'ltr'
        }}>
            {/* 1. TOP STRIP - KPI CARDS (DYNAMIC FROM LIVE DATA) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
                flexShrink: 0,
                height: '128px',
                padding: '24px 24px 0 24px'
            }}>
                {isLoading ? (
                    <div style={{ color: '#fff' }}>Loading Risks...</div>
                ) : risks.length === 0 ? (
                    <div style={{ color: '#9CA3AF', gridColumn: 'span 4', textAlign: 'center', padding: '20px', border: '1px dashed #374151', borderRadius: '8px' }}>
                        No Active Risks for {year} {quarter}
                    </div>
                ) : (
                    risks.slice(0, 4).map((risk: any) => (
                        <div key={risk.id}
                            style={{
                                background: '#111827',
                                border: '1px solid #374151',
                                padding: '16px',
                                borderRadius: '8px',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleRiskSelect(risk.id)}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '64px',
                                height: '64px',
                                background: 'linear-gradient(to bottom right, rgba(239,68,68,0.1), transparent)',
                                borderBottomLeftRadius: '100%'
                            }}></div>
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                <div style={{ color: '#9CA3AF', fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                    {risk.title || risk.name || 'Untitled Risk'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                                    <span style={{
                                        fontSize: '1.5rem', // Slightly smaller to fit long names
                                        fontWeight: 'bold',
                                        color: risk.risk_level === 'High' ? '#EF4444' : risk.risk_level === 'Medium' ? '#F59E0B' : '#fff'
                                    }}>{risk.risk_level || 'N/A'}</span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: '#6B7280',
                                        background: '#1F2937',
                                        padding: '4px 8px',
                                        borderRadius: '9999px'
                                    }}>
                                        Prob: {risk.probability}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 2. MAIN SPLIT VIEW */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: '0 24px 24px', display: 'flex', gap: '24px' }}>

                {/* LEFT: RISK HEATMAP AREA */}
                <div style={{
                    flex: 1,
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0, zIndex: 10 }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#D4AF37' }}>■</span> {language === 'ar' ? 'مصفوفة المخاطر' : 'Risk & Outcomes Matrix'}
                        </h3>
                    </div>

                    {/* EMBEDDED COMPONENT */}
                    <div style={{ flex: 1, minHeight: 0, position: 'relative', width: '100%' }}>
                        <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                            <RiskTopologyMap quarter={quarter} year={year} />
                        </div>
                    </div>
                </div>
                {/* RIGHT: DEEP DIVE PANEL (Sliding in) */}
                {selectedView === 'detail' && activeRisk && (
                    <div style={{ width: '50%', height: '100%' }}>
                        <div style={{
                            height: '100%',
                            background: '#1F2937',
                            border: '1px solid rgba(212,175,55,0.5)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                background: 'rgba(15,23,42,0.5)',
                                borderBottom: '1px solid #374151',
                                padding: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#fff' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                background: 'rgba(239,68,68,0.2)',
                                                color: '#EF4444',
                                                border: '1px solid rgba(239,68,68,0.3)'
                                            }}>
                                                {(activeRisk.risk_level || 'UNKNOWN').toUpperCase()} RISK
                                            </span>
                                            <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Prob: {activeRisk.probability || 'N/A'}</span>
                                        </div>
                                        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>{activeRisk.title || activeRisk.name}</h2>
                                        <p style={{ color: '#9CA3AF', marginTop: '4px', fontSize: '0.875rem' }}>{activeRisk.description}</p>
                                    </div>
                                    <button
                                        onClick={handleBack}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#9CA3AF',
                                            cursor: 'pointer',
                                            padding: '8px'
                                        }}
                                    >
                                        <ArrowLeft style={{ width: '20px', height: '20px' }} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* AGENT ANALYSIS SECTION (If Real Data Exists) */}
                                {(activeRisk.build_exposure_pct || activeRisk.ai_analysis) && (
                                    <div style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        border: '1px solid rgba(59,130,246,0.3)',
                                        borderRadius: '6px',
                                        padding: '16px'
                                    }}>
                                        <h4 style={{ color: '#60A5FA', borderBottom: '1px solid rgba(59,130,246,0.3)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Activity size={16} /> Risk Agent Analysis
                                        </h4>
                                        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>Build Exposure</div>
                                                <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: '#fff' }}>
                                                    {activeRisk.build_exposure_pct ? (activeRisk.build_exposure_pct * 100).toFixed(0) : 0}%
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>Operate Exposure</div>
                                                <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: '#fff' }}>
                                                    {activeRisk.operate_exposure_pct ? (activeRisk.operate_exposure_pct * 100).toFixed(0) : 0}%
                                                </div>
                                            </div>
                                            {activeRisk.link_threshold_met && (
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>Link Threshold</div>
                                                    <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        MET <AlertTriangle size={14} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {activeRisk.ai_analysis && (
                                            <p style={{ fontSize: '0.875rem', color: '#DBEAFE', fontStyle: 'normal', margin: 0 }}>
                                                "{activeRisk.ai_analysis}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Impact Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '4px', border: '1px solid #374151' }}>
                                        <div style={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Potential Impact</div>
                                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: '#F87171' }}>{activeRisk.impact || 'Undetermined'}</div>
                                    </div>
                                    <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '4px', border: '1px solid #374151' }}>
                                        <div style={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Exposure Trend</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontFamily: 'monospace', color: '#FBBF24' }}>
                                            <TrendingUp style={{ width: '20px', height: '20px' }} /> {activeRisk.trend || 'Rising'}
                                        </div>
                                    </div>
                                </div>

                                {/* AI Action Block */}
                                <div style={{ marginTop: '12px' }}>
                                    <AIExplainButton
                                        mode="block"
                                        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid #6366F1' }}
                                        contextId={selectedRiskId || 'risk'}
                                        contextTitle={activeRisk.title}
                                        contextData={activeRisk}
                                        isDark={true}
                                        label="Ask AI Analyst to Explain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskDesk;