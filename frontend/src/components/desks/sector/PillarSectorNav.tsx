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

            {/* Brand Header */}
            <div className="nav-header">
                <h1 className="nav-title">
                    KSA Vision 2030
                </h1>
                <p className="nav-subtitle">Sector Command Center</p>
            </div>

            {/* Pillar Tabs */}
            <div className="pillar-tabs">
                {Object.entries(PILLARS).map(([key, pillar]: [string, any]) => (
                    <button
                        key={key}
                        onClick={() => onSelectPillar(key)}
                        className={`pillar-tab ${selectedPillar === key ? 'active' : ''}`}
                        style={{
                            borderBottomColor: selectedPillar === key ? pillar.color : 'transparent'
                        }}
                    >
                        {pillar.label.split(' ')[1]}
                    </button>
                ))}
            </div>

            {/* Sector List */}
            <div className="sector-list custom-scrollbar">
                <h3 className="sector-list-title">
                    {PILLARS[selectedPillar as keyof typeof PILLARS]?.label} Sectors
                </h3>

                {/* SHOW ALL OPTION */}
                <motion.button
                    onClick={() => onSelectSector('All Factors')}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`sector-item ${selectedSector === 'All Factors' ? 'active' : ''}`}
                    style={{
                        borderColor: selectedSector === 'All Factors' ? '#fbbf24' : 'transparent',
                        opacity: 1,
                        cursor: 'pointer',
                        marginBottom: '8px'
                    }}
                >
                    <div
                        className="sector-icon"
                        style={{
                            backgroundColor: selectedSector === 'All Factors' ? '#334155' : undefined,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>ALL</span>
                    </div>
                    <div className="sector-label" style={{ fontWeight: 700 }}>Show All Assets</div>
                </motion.button>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 4px 8px 4px' }} />

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
                                    backgroundColor: isSelected ? '#334155' : undefined,
                                    padding: '4px'
                                }}
                            >
                                <img
                                    src={sector.icon}
                                    alt={sector.label}
                                    style={{
                                        width: '100%', height: '100%',
                                        filter: isSupported ? (isSelected ? 'none' : 'grayscale(100%) opacity(0.7)') : 'grayscale(100%) opacity(0.3)'
                                    }}
                                />
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <div className="sector-label" style={{ color: isSupported ? 'white' : '#64748b' }}>
                                    {sector.label}
                                </div>
                                <div className="sector-status" style={{ color: '#475569' }}>
                                    {isSupported
                                        ? (isSelected ? 'Active View' : 'Click to View')
                                        : 'Coming Soon'}
                                </div>
                            </div>

                            {isSelected && (
                                <div className="active-indicator" style={{ backgroundColor: pillarColor }} />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer / Legend */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1e293b', fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Data: Neo4j Live</span>
                <span>v2.2.0</span>
            </div>
        </div>
    );
};

export default PillarSectorNav;
