import React from 'react';
import { motion } from 'framer-motion';

// SVG Icons
// SVG Icons (Legend Style - Circular)
import iconMining from '../../../assets/map-markers/lmining.svg';
import iconWater from '../../../assets/map-markers/lwater.svg';
import iconEnergy from '../../../assets/map-markers/lenergy.svg';
import iconIndustry from '../../../assets/map-markers/lindustry.svg';
import iconTransportation from '../../../assets/map-markers/ltransport.svg';
import iconGiga from '../../../assets/map-markers/lgiga.svg';

// Fallback for others (using Industry icon for now, dimmed)
const iconDefault = iconIndustry;

const PILLARS = {
    'society': {
        label: 'Vibrant Society',
        color: '#10b981',
        sectors: ['health', 'education', 'livability', 'water', 'culture', 'hajj']
    },
    'economy': {
        label: 'Thriving Economy',
        color: '#3b82f6',
        sectors: ['energy', 'mining', 'industry', 'logistics', 'tourism', 'digital', 'finance', 'giga']
    },
    'nation': {
        label: 'Ambitious Nation',
        color: '#a855f7',
        sectors: ['gov', 'nonprofit']
    }
};

const SECTORS: Record<string, { label: string; icon: string; supported?: boolean }> = {
    // Society
    'health': { label: 'Health', icon: iconDefault, supported: false },
    'education': { label: 'Education', icon: iconDefault, supported: false },
    'livability': { label: 'Urban Quality', icon: iconDefault, supported: false },
    'water': { label: 'Water & Env.', icon: iconWater, supported: true },
    'culture': { label: 'Culture & Ent.', icon: iconDefault, supported: false },
    'hajj': { label: 'Hajj & Umrah', icon: iconDefault, supported: false },

    // Economy
    'energy': { label: 'Energy', icon: iconEnergy, supported: true },
    'mining': { label: 'Mining', icon: iconMining, supported: true },
    'industry': { label: 'Industry', icon: iconIndustry, supported: true },
    'logistics': { label: 'Logistics', icon: iconTransportation, supported: true },
    'tourism': { label: 'Tourism', icon: iconDefault, supported: false },
    'digital': { label: 'Digital Econ', icon: iconDefault, supported: false },
    'finance': { label: 'Finance', icon: iconDefault, supported: false },
    'giga': { label: 'Giga Projects', icon: iconGiga, supported: true },

    // Nation
    'gov': { label: 'Gov Effective', icon: iconDefault, supported: false },
    'nonprofit': { label: 'Non-Profit', icon: iconDefault, supported: false }
};

interface PillarSectorNavProps {
    selectedPillar: string;
    selectedSector: string;
    onSelectPillar: (id: string) => void;
    onSelectSector: (id: string) => void;
}

const PillarSectorNav: React.FC<PillarSectorNavProps> = ({
    selectedPillar,
    selectedSector,
    onSelectPillar,
    onSelectSector
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Brand Header with KSA Vision */}
            <div className="nav-header">
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <img
                        alt="Energy"
                        loading="lazy"
                        src="/src/assets/map-markers/lenergy.svg"
                        style={{
                            display: 'block',
                            height: '40px',
                            width: '40px',
                        }}
                    />
                    <h1 className="nav-title" style={{ margin: 0 }}>KSA Vision 2030</h1>
                </div>
            </div>

            {/* Pillar Tabs */}
            <div className="pillar-tabs" style={{ background: 'var(--component-panel-bg)', borderRadius: '12px', padding: '4px', border: '1px solid var(--component-panel-border)', marginBottom: '1.5rem' }}>
                {Object.entries(PILLARS).map(([key, pillar]: [string, any]) => {
                    const isActive = selectedPillar === key;
                    return (
                        <button
                            key={key}
                            onClick={() => onSelectPillar(key)}
                            className={`pillar-tab ${isActive ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                padding: '8px 4px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isActive ? 'var(--component-bg-primary)' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: isActive ? pillar.color : 'var(--component-text-muted)',
                                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {pillar.label.split(' ')[1]}
                        </button>
                    );
                })}
            </div>

            {/* Sector List */}
            <div className="sector-list custom-scrollbar">
                <h3 className="sector-list-title">
                    {PILLARS[selectedPillar as keyof typeof PILLARS]?.label} Sectors
                </h3>

                {PILLARS[selectedPillar as keyof typeof PILLARS]?.sectors.map((sectorId: string) => {
                    const sector = SECTORS[sectorId as keyof typeof SECTORS];
                    const isSelected = selectedSector === sectorId;
                    const isSupported = sector.supported;
                    const pillarColor = PILLARS[selectedPillar as keyof typeof PILLARS]?.color;

                    return (
                        <motion.button
                            key={sectorId}
                            onClick={() => isSupported && onSelectSector(sectorId)}
                            whileHover={isSupported ? { scale: 1.02, x: 5 } : {}}
                            whileTap={isSupported ? { scale: 0.98 } : {}}
                            className={`sector-item ${isSelected ? 'active' : ''}`}
                            style={{
                                borderColor: isSelected ? pillarColor : 'transparent',
                                opacity: isSupported ? 1 : 0.5,
                                cursor: isSupported ? 'pointer' : 'not-allowed'
                            }}
                        >
                            <div
                                className="sector-icon"
                                style={{
                                    backgroundColor: isSelected ? 'var(--component-bg-primary)' : 'rgba(255,255,255,0.03)',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    border: isSelected ? `1px solid ${pillarColor}` : '1px solid transparent'
                                }}
                            >
                                <img
                                    src={sector.icon}
                                    alt={sector.label}
                                    style={{
                                        width: '100%', height: '100%',
                                        filter: isSupported ? (isSelected ? 'none' : 'grayscale(100%) opacity(0.6)') : 'grayscale(100%) opacity(0.2)'
                                    }}
                                />
                            </div>

                            <div style={{ textAlign: 'left', flex: 1 }}>
                                <div className="sector-label" style={{ color: isSupported ? (isSelected ? 'var(--component-text-primary)' : 'var(--component-text-secondary)') : 'var(--component-text-muted)', fontWeight: isSelected ? 800 : 500, fontSize: '0.9rem' }}>
                                    {sector.label}
                                </div>
                                <div className="sector-status" style={{ color: isSelected ? pillarColor : 'var(--component-text-muted)', fontSize: '0.65rem', fontWeight: 600, opacity: 0.8, marginTop: '2px' }}>
                                    {isSupported
                                        ? (isSelected ? 'ACTIVE VIEW' : 'CLICK TO EXPLORE')
                                        : 'DEVELOPMENT IN PROGRESS'}
                                </div>
                            </div>

                            {isSelected && (
                                <div className="active-indicator" style={{ backgroundColor: pillarColor }} />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer / Legend - DISCLAIMER REPLACING NEO4J INFO */}
            <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--component-panel-border)', fontSize: '10px', color: 'var(--component-text-muted)', opacity: 0.8 }}>
                <p style={{ margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>
                    <strong>CONFIDENTIAL DATA</strong><br />
                    • Publicly available V2030 dataset snapshots<br />
                    • Non-comprehensive representative simulation<br />
                    • Authorized personnel only
                </p>
            </div>
        </div>
    );
};

export default PillarSectorNav;
