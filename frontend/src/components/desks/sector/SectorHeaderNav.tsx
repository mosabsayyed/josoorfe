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

                {/* 3. FILTERS */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {/* A. STATUS FILTER (Left) */}
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

                    {/* C. PRIORITY FILTER */}
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

                    {/* D. STRATEGIC BRIEFING BUTTON */}
                    <motion.button
                        onClick={onStrategyClick}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            background: 'var(--component-text-accent)',
                            border: '1px solid var(--component-text-accent)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginLeft: '8px'
                        }}
                        title="Generate Strategic AI Report"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--component-text-on-accent)" stroke="var(--component-text-on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--component-text-on-accent)', whiteSpace: 'nowrap' }}>Strategy</span>
                    </motion.button>
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
                {/* 1. Enforce */}
                {renderItem('Enforce', counts.enforce, 'var(--component-color-danger)')}

                {/* 2. Incentive */}
                {renderItem('Incentive', counts.incentive, 'var(--component-color-success)')}

                {/* 3. License */}
                {renderItem('License', counts.license, 'var(--component-color-info)')}

                {/* 4. Services */}
                {renderItem('Services', counts.services, 'var(--sector-water)')}

                {/* 5. Regulate */}
                {renderItem('Regulate', counts.regulate, 'var(--status-planned)')}

                {/* 6. Awareness */}
                {renderItem('Awareness', counts.awareness, 'var(--component-color-warning)')}
            </div>

        </div >
    );
};


export default SectorHeaderNav;
