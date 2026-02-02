import React from 'react';
import { motion } from 'framer-motion';

// SVG Icons (Legend Style - Circular)
import iconMining from '../../../assets/map-markers/lmining.svg';
import iconWater from '../../../assets/map-markers/lwater.svg';
import iconEnergy from '../../../assets/map-markers/lenergy.svg';
import iconIndustry from '../../../assets/map-markers/lindustry.svg';
import iconTransport from '../../../assets/map-markers/ltransport.svg';
import iconGiga from '../../../assets/map-markers/lgiga.svg';
import iconAll from '../../../assets/map-markers/all.svg';

// Pin icons for filters
import majorUnlockPin from '../../../assets/map-markers/lPriority.svg';

import { PolicyToolCounts } from '../../desks/sector/SectorPolicyClassifier';

const SECTORS = [
    { id: 'all', label: 'All', icon: iconAll },
    { id: 'water', label: 'Water', icon: iconWater },
    { id: 'energy', label: 'Energy', icon: iconEnergy },
    { id: 'mining', label: 'Mining', icon: iconMining },
    { id: 'industry', label: 'Industry', icon: iconIndustry },
    { id: 'logistics', label: 'Logistics', icon: iconTransport },
    { id: 'giga', label: 'Giga', icon: iconGiga }
];

// Update Props Interface
interface SectorHeaderNavProps {
    selectedSector: string;
    onSelectSector: (id: string) => void;
    timelineFilter?: 'current' | 'future' | 'both';
    onTimelineFilterChange?: (filter: 'current' | 'future' | 'both') => void;
    priorityFilter?: 'major' | 'strategic' | 'both';
    onPriorityFilterChange?: (filter: 'major' | 'strategic' | 'both') => void;

    // Year Context
    year?: string;
    onYearChange?: (year: string) => void;

    existingCount?: number;
    plannedCount?: number;
    nationalKpis?: any;
    selectedRegionName?: string | null;
    onBackToNational?: () => void;

    // Updated Policy Tools Counts (6 Categories)
    policyCounts?: PolicyToolCounts;
    onStrategyClick?: () => void;
}

const SectorHeaderNav: React.FC<SectorHeaderNavProps> = ({
    selectedSector,
    onSelectSector,
    timelineFilter = 'both',
    onTimelineFilterChange,
    priorityFilter = 'both',
    onPriorityFilterChange,
    year = '2030', // Default
    onYearChange,
    existingCount = 0,
    plannedCount = 0,
    nationalKpis,
    selectedRegionName,
    onBackToNational,
    policyCounts,
    onStrategyClick
}) => {

    // Helper to render category item
    const counts = policyCounts || { enforce: 0, incentive: 0, license: 0, services: 0, regulate: 0, awareness: 0, total: 0 };
    const isNA = selectedSector !== 'water' && selectedSector !== 'all';

    // Scaling factor for "All" mock (roughly 4x Water sector)
    const getValue = (val: number) => {
        if (selectedSector === 'water') return val;
        if (selectedSector === 'all') return Math.round(val * 4.2);
        return 0;
    };

    const renderItem = (label: string, val: number, color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isNA ? 0.3 : 1 }}>
            <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isNA ? 'var(--component-panel-border)' : color,
                boxShadow: isNA ? 'none' : `0 0 8px ${color}`
            }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--component-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {label}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isNA ? 'var(--component-text-muted)' : 'var(--component-text-primary)', letterSpacing: '-0.02em' }}>
                    {isNA ? 'N/A' : getValue(val)}
                </span>
            </div>
        </div>
    )

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column', // Stack vertically
            width: '100%',
            height: 'auto', // Allow it to perform natural height or set fixed
            minHeight: '140px',
            background: 'var(--component-bg-primary)',
            borderBottom: '1px solid var(--component-panel-border)',
            padding: '12px 24px',
            gap: '12px',
            overflow: 'visible'
        }}>

            {/* ROW 1: BRAND + CONTROLS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

                {/* 1. BRAND - COMPACT */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 900,
                        color: 'var(--component-text-primary)',
                        lineHeight: '1',
                        letterSpacing: '-1px'
                    }}>
                        KSA VISION 2030
                    </div>
                    <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--component-text-accent)',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginTop: '4px',
                        fontWeight: 700
                    }}>
                        Sector Command Center
                    </div>
                </div>

                {/* 2. CLICKABLE SECTORS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {SECTORS.map((sector) => {
                        const isSelected = selectedSector === sector.id;
                        return (
                            <motion.button
                                key={sector.id}
                                onClick={() => onSelectSector(sector.id)}
                                title={sector.label}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '2px',
                                    background: isSelected ? 'rgba(212,175,55,0.08)' : 'transparent',
                                    border: isSelected ? '1px solid var(--component-text-accent)' : '1px solid transparent',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    opacity: isSelected ? 1 : 0.6,
                                    transition: 'all 0.2s ease',
                                    padding: '8px'
                                }}
                            >
                                <img src={sector.icon} width={24} height={24} alt={sector.label} style={{ filter: isSelected ? 'none' : 'grayscale(1) opacity(0.8)' }} />
                            </motion.button>
                        );
                    })}
                </div>

                {/* 3. MAGIC STRATEGY BUTTON */}
                <motion.button
                    onClick={onStrategyClick}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                        color: 'white',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, lineHeight: 1, letterSpacing: '0.01em' }}>Strategic Briefing</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 500 }}>AI Alignment Check</span>
                    </div>
                </motion.button>

                {/* 4. FILTERS */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {/* A. YEAR FILTER (Left) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--component-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Target Year</span>
                        <select
                            style={{
                                background: 'var(--component-panel-bg)',
                                color: 'var(--component-text-primary)',
                                border: '1px solid var(--component-panel-border)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                outline: 'none',
                                fontWeight: 700,
                                appearance: 'none',
                                textAlign: 'center'
                            }}
                            value={year}
                            onChange={(e) => onYearChange?.(e.target.value)}
                        >
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                            <option value="2028">2028</option>
                            <option value="2029">2029</option>
                            <option value="2030">2030</option>
                            <option value="both">All Years</option>
                        </select>
                    </div>

                    {/* B. STATUS FILTER (Middle) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--component-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Status</span>
                        <div style={{ display: 'flex', background: 'var(--component-panel-bg)', borderRadius: '8px', padding: '3px', border: '1px solid var(--component-panel-border)' }}>
                            <button
                                onClick={() => {
                                    if (timelineFilter === 'both') onTimelineFilterChange?.('future');
                                    else if (timelineFilter === 'future') onTimelineFilterChange?.('both');
                                }}
                                style={{
                                    background: (timelineFilter === 'current' || timelineFilter === 'both') ? 'var(--component-color-info)' : 'transparent',
                                    color: (timelineFilter === 'current' || timelineFilter === 'both') ? 'white' : 'var(--component-text-muted)',
                                    border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s'
                                }}
                                title="Toggle Existing Assets"
                            >
                                Existing
                            </button>
                            <button
                                onClick={() => {
                                    if (timelineFilter === 'both') onTimelineFilterChange?.('current');
                                    else if (timelineFilter === 'current') onTimelineFilterChange?.('both');
                                }}
                                style={{
                                    background: (timelineFilter === 'future' || timelineFilter === 'both') ? 'var(--component-text-accent)' : 'transparent',
                                    color: (timelineFilter === 'future' || timelineFilter === 'both') ? 'black' : 'var(--component-text-muted)',
                                    border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s'
                                }}
                                title="Toggle Planned Assets"
                            >
                                Planned
                            </button>
                        </div>
                    </div>

                    {/* C. PRIORITY FILTER (Right) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--component-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Priority</span>
                        <div style={{ display: 'flex', background: 'var(--component-panel-bg)', borderRadius: '8px', padding: '3px', border: '1px solid var(--component-panel-border)', minWidth: '140px' }}>
                            <button
                                onClick={() => onPriorityFilterChange?.('major')}
                                style={{
                                    flex: 1,
                                    background: priorityFilter === 'major' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                    border: priorityFilter === 'major' ? '1px solid var(--component-text-accent)' : '1px solid transparent',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                                title="Major Unlocks Only"
                            >
                                <img src={majorUnlockPin} width={14} height={14} style={{ filter: priorityFilter === 'major' ? 'none' : 'grayscale(1) opacity(0.5)' }} />
                                <span style={{ fontSize: '0.75rem', color: priorityFilter === 'major' ? 'var(--component-text-accent)' : 'var(--component-text-muted)', whiteSpace: 'nowrap', fontWeight: 700 }}>Major</span>
                            </button>
                            <button
                                onClick={() => onPriorityFilterChange?.('both')}
                                style={{
                                    flex: 1,
                                    background: priorityFilter === 'both' ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    border: '1px solid transparent',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    fontSize: '0.75rem',
                                    color: priorityFilter === 'both' ? 'var(--component-text-primary)' : 'var(--component-text-muted)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 700,
                                    transition: 'all 0.2s'
                                }}
                            >
                                All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 2: POLICY EXECUTION TOOLS (6 CATEGORIES) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)', // Equal 6 columns
                alignItems: 'center',
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '8px 16px',
                marginTop: '4px',
                gap: '12px'
            }}>
                {/* 1. Enforce (Red) */}
                {renderItem('Enforce', counts.enforce, '#ef4444')}

                {/* 2. Incentive (Green) */}
                {renderItem('Incentive', counts.incentive, '#10b981')}

                {/* 3. License (Blue) */}
                {renderItem('License', counts.license, '#3b82f6')}

                {/* 4. Services (Cyan) */}
                {renderItem('Services', counts.services, '#06b6d4')}

                {/* 5. Regulate (Purple) */}
                {renderItem('Regulate', counts.regulate, '#8b5cf6')}

                {/* 6. Awareness (Yellow) */}
                {renderItem('Awareness', counts.awareness, '#f59e0b')}
            </div>

        </div >
    );
};


export default SectorHeaderNav;
