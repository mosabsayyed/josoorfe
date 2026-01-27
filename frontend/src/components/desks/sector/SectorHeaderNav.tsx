import React from 'react';
import { motion } from 'framer-motion';

// SVG Icons (Legend Style - Circular)
import iconMining from '../../../assets/map-markers/lmining.svg';
import iconWater from '../../../assets/map-markers/lwater.svg';
import iconEnergy from '../../../assets/map-markers/lenergy.svg';
import iconIndustry from '../../../assets/map-markers/lindustry.svg';
import iconTransportation from '../../../assets/map-markers/ltransport.svg';
import iconGiga from '../../../assets/map-markers/lgiga.svg';
import iconAll from '../../../assets/map-markers/all.svg';

// Pin icons for filters
import majorUnlockPin from '../../../assets/map-markers/lPriority.svg'; // Major Unlock (gold filled)
import strategicImpactPin from '../../../assets/map-markers/lnormal.svg'; // Strategic Impact (white/normal)

const PILLARS = {
    'society': {
        label: 'Vibrant Society',
        shortLabel: 'Society',
        color: 'var(--component-color-success)',
        sectors: ['health', 'education', 'livability', 'water', 'culture', 'hajj']
    },
    'economy': {
        label: 'Thriving Economy',
        shortLabel: 'Economy',
        color: 'var(--component-color-info)',
        sectors: ['energy', 'mining', 'industry', 'logistics', 'tourism', 'digital', 'finance', 'giga']
    },
    'nation': {
        label: 'Ambitious Nation',
        shortLabel: 'Nation',
        color: 'var(--component-text-accent)',
        sectors: ['all', 'nonprofit']
    }
};

const SECTORS: Record<string, { label: string; shortLabel: string; icon: string; supported?: boolean }> = {
    // All Sectors
    'all': { label: 'All Sectors', shortLabel: 'All', icon: iconAll, supported: true },

    // Active Sectors (6)
    'water': { label: 'Water & Env.', shortLabel: 'Water', icon: iconWater, supported: true },
    'energy': { label: 'Energy', shortLabel: 'Energy', icon: iconEnergy, supported: true },
    'mining': { label: 'Mining', shortLabel: 'Mining', icon: iconMining, supported: true },
    'industry': { label: 'Industry', shortLabel: 'Indus', icon: iconIndustry, supported: true },
    'logistics': { label: 'Logistics', shortLabel: 'Logis', icon: iconTransportation, supported: true },
    'giga': { label: 'Giga Projects', shortLabel: 'Giga', icon: iconGiga, supported: true },

    // Inactive Sectors (9)
    'health': { label: 'Health', shortLabel: 'Health', icon: iconEnergy, supported: false },
    'education': { label: 'Education', shortLabel: 'Educ', icon: iconEnergy, supported: false },
    'livability': { label: 'Urban Quality', shortLabel: 'Quality', icon: iconEnergy, supported: false },
    'culture': { label: 'Culture & Ent.', shortLabel: 'Culture', icon: iconEnergy, supported: false },
    'hajj': { label: 'Hajj & Umrah', shortLabel: 'Hajj', icon: iconEnergy, supported: false },
    'tourism': { label: 'Tourism', shortLabel: 'Tourism', icon: iconEnergy, supported: false },
    'digital': { label: 'Digital Econ', shortLabel: 'Digital', icon: iconEnergy, supported: false },
    'finance': { label: 'Finance', shortLabel: 'Finance', icon: iconEnergy, supported: false },
    'nonprofit': { label: 'Non-Profit', shortLabel: 'NonProf', icon: iconEnergy, supported: false }
};

interface SectorHeaderNavProps {
    selectedPillar: string;
    selectedSector: string;
    onSelectPillar: (id: string) => void;
    onSelectSector: (id: string) => void;
    timelineFilter: 'current' | 'future' | 'both';
    onTimelineFilterChange: (filter: 'current' | 'future' | 'both') => void;
    priorityFilter: 'major' | 'strategic' | 'both';
    onPriorityFilterChange: (filter: 'major' | 'strategic' | 'both') => void;
    existingCount: number;
    plannedCount: number;
}

const SectorHeaderNav: React.FC<SectorHeaderNavProps> = ({
    selectedPillar,
    selectedSector,
    onSelectPillar,
    onSelectSector,
    timelineFilter,
    onTimelineFilterChange,
    priorityFilter,
    onPriorityFilterChange,
    existingCount,
    plannedCount
}) => {
    // All 16 sectors in specific order: All first, then 6 active, then 9 inactive (2 rows × 8 cols)
    const ALL_SECTORS_ORDERED = [
        // Row 1: All + 6 Active + 1 Inactive
        'all', 'water', 'energy', 'mining', 'industry', 'logistics', 'giga', 'health',
        // Row 2: 8 Inactive
        'education', 'livability', 'culture', 'hajj', 'tourism', 'digital', 'finance', 'nonprofit'
    ];

    return (
        <div style={{
            display: 'flex',
            width: '100%',
            height: '110px',
            background: 'var(--component-bg-primary)',
            borderBottom: '1px solid var(--component-panel-border)',
            padding: '16px 24px',
            gap: '24px',
            boxSizing: 'border-box',
            alignItems: 'stretch',
            overflow: 'hidden'
        }}>
            {/* COLUMN 1: Brand + Pillars */}
            <div style={{
                flex: '0 0 140px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                height: '100%'
            }}>
                {/* Brand Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--component-text-accent)', lineHeight: '1.1', letterSpacing: '-0.5px' }}>Vision 2030</div>
                    <div style={{ fontSize: '9px', fontWeight: 500, color: 'var(--component-text-muted)', lineHeight: '1', marginTop: '2px' }}>Strategic Pillars</div>
                </div>

                {/* Pillar Tabs - Compact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
                    {Object.entries(PILLARS).map(([key, pillar]: [string, any]) => (
                        <button
                            key={key}
                            onClick={() => onSelectPillar(key)}
                            style={{
                                padding: '3px 6px',
                                fontSize: '8px',
                                fontWeight: 600,
                                border: selectedPillar === key ? '1px solid ' + pillar.color : '1px solid transparent',
                                background: selectedPillar === key ? 'color-mix(in srgb, ' + pillar.color + ' 15%, transparent)' : 'transparent',
                                color: selectedPillar === key ? pillar.color : 'var(--component-text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderRadius: '3px',
                                textAlign: 'left',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {pillar.shortLabel}
                        </button>
                    ))}
                </div>
            </div>

            {/* COLUMN 2: 56% - ALL 16 Sectors (2 rows × 8 cols) */}
            <div style={{
                flex: '0 0 56%',
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: '8px',
                alignContent: 'center'
            }}>
                {ALL_SECTORS_ORDERED.map((sectorId: string) => {
                    const sector = SECTORS[sectorId as keyof typeof SECTORS];
                    const isSelected = selectedSector === sectorId;
                    const isSupported = sector.supported;

                    return (
                        <motion.button
                            key={sectorId}
                            onClick={() => isSupported && onSelectSector(sectorId)}
                            whileHover={isSupported ? { scale: 1.05 } : {}}
                            whileTap={isSupported ? { scale: 0.95 } : {}}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 4px',
                                background: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: isSelected ? '1px solid var(--component-text-accent)' : '1px solid transparent',
                                borderRadius: '4px',
                                cursor: isSupported ? 'pointer' : 'not-allowed',
                                opacity: isSupported ? 1 : 0.4,
                                transition: 'all 0.2s'
                            }}
                        >
                            <img
                                src={sector.icon}
                                alt={sector.label}
                                style={{
                                    width: '28px',
                                height: '28px',
                                    filter: isSupported ? (isSelected ? 'none' : 'grayscale(100%) opacity(0.7)') : 'grayscale(100%) opacity(0.3)'
                                }}
                            />
                            <div style={{ fontSize: '8px', fontWeight: 500, color: 'var(--component-text-secondary)', lineHeight: '1' }}>
                                {sector.shortLabel}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* COLUMN 3: Stats Pill */}
            <div style={{
                flex: '0 0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '2px',
                background: 'color-mix(in srgb, var(--component-text-primary) 5%, transparent)',
                padding: '6px 8px',
                borderRadius: '4px',
                minWidth: '70px',
                maxWidth: '80px'
            }}>
                <div style={{ fontSize: '9px', color: 'var(--component-color-success)', fontWeight: 600 }}>Existing</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--component-text-primary)' }}>{existingCount}</div>
                <div style={{ fontSize: '9px', color: 'var(--component-color-info)', fontWeight: 600, marginTop: '4px' }}>Planned</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--component-text-primary)' }}>{plannedCount}</div>
            </div>

            {/* COLUMN 4: Timeline Filter */}
            <div style={{
                flex: '0 0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minWidth: '110px'
            }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--component-text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</div>
                <button
                    onClick={() => onTimelineFilterChange('both')}
                    style={{
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: timelineFilter === 'both' ? 'var(--component-text-accent)' : 'var(--component-panel-bg)',
                        color: timelineFilter === 'both' ? 'var(--component-text-on-accent)' : 'var(--component-text-secondary)',
                        border: '1px solid ' + (timelineFilter === 'both' ? 'var(--component-text-accent)' : 'var(--component-panel-border)'),
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    All Assets
                </button>
                <button
                    onClick={() => onTimelineFilterChange('current')}
                    style={{
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: timelineFilter === 'current' ? 'var(--component-color-success)' : 'var(--component-panel-bg)',
                        color: timelineFilter === 'current' ? 'white' : 'var(--component-text-secondary)',
                        border: '1px solid ' + (timelineFilter === 'current' ? 'var(--component-color-success)' : 'var(--component-panel-border)'),
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Existing
                </button>
                <button
                    onClick={() => onTimelineFilterChange('future')}
                    style={{
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: timelineFilter === 'future' ? 'var(--component-color-info)' : 'var(--component-panel-bg)',
                        color: timelineFilter === 'future' ? 'white' : 'var(--component-text-secondary)',
                        border: '1px solid ' + (timelineFilter === 'future' ? 'var(--component-color-info)' : 'var(--component-panel-border)'),
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Planned
                </button>
            </div>

            {/* COLUMN 5: Priority Filter */}
            <div style={{
                flex: '0 0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minWidth: '140px'
            }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--component-text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority Level</div>
                <button
                    onClick={() => onPriorityFilterChange('both')}
                    style={{
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: priorityFilter === 'both' ? 'var(--component-text-accent)' : 'var(--component-panel-bg)',
                        color: priorityFilter === 'both' ? 'var(--component-text-on-accent)' : 'var(--component-text-secondary)',
                        border: '1px solid ' + (priorityFilter === 'both' ? 'var(--component-text-accent)' : 'var(--component-panel-border)'),
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    All Priorities
                </button>
                <button
                    onClick={() => onPriorityFilterChange('major')}
                    style={{
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: priorityFilter === 'major' ? 'var(--component-color-warning)' : 'var(--component-panel-bg)',
                        color: priorityFilter === 'major' ? 'var(--component-text-on-accent)' : 'var(--component-text-secondary)',
                        border: '1px solid ' + (priorityFilter === 'major' ? 'var(--component-color-warning)' : 'var(--component-panel-border)'),
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '6px'
                    }}
                >
                    <img src={majorUnlockPin} alt="" style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                    <span>Major Unlock</span>
                </button>
                <button
                    onClick={() => onPriorityFilterChange('strategic')}
                    style={{
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: priorityFilter === 'strategic' ? 'var(--component-color-success)' : 'var(--component-panel-bg)',
                        color: priorityFilter === 'strategic' ? 'white' : 'var(--component-text-secondary)',
                        border: '1px solid ' + (priorityFilter === 'strategic' ? 'var(--component-color-success)' : 'var(--component-panel-border)'),
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '6px'
                    }}
                >
                    <img src={strategicImpactPin} alt="" style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                    <span>Strategic Impact</span>
                </button>
            </div>
        </div>
    );
};

export default SectorHeaderNav;
