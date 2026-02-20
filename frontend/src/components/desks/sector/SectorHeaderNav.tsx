import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { PolicyToolsDrawer, PolicyToolItem } from './PolicyToolsDrawer';
import { L1_CATEGORY_MAP } from '../../../services/neo4jMcpService';

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
    policyNodes?: any[]; // Raw policy nodes for drawer
    onStrategyClick?: () => void;

    // Filtering context for drawer
    selectedYear?: string;

    // Real risk data from Neo4j
    categoryRiskColors?: Record<string, string>;
    policyRiskByL1?: Map<string, any>;
    onPolicyToolClick?: (tool: any) => void;
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
    policyNodes = [],
    onStrategyClick,
    selectedYear = '2030',
    categoryRiskColors = {},
    policyRiskByL1,
    onPolicyToolClick
}) => {
    const { t } = useTranslation();
    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [categoryTools, setCategoryTools] = useState<PolicyToolItem[]>([]);

    // Category color map
    const CATEGORY_COLORS: Record<string, string> = {
        'Enforce': 'var(--component-color-danger)',
        'Incentive': 'var(--component-color-success)',
        'License': 'var(--component-color-info)',
        'Services': 'var(--sector-water)',
        'Regulate': 'var(--status-planned)',
        'Awareness': 'var(--component-color-warning)'
    };

    // Handle category hover/click
    const handleCategoryHover = (category: string) => {
        // 1. Filter by Year: Exact match (DB has per-year snapshots per ontology rule 1.2)
        const selectedYearNum = parseInt(selectedYear, 10);
        const yearlyNodes = policyNodes.filter(n => {
            const nodeYear = parseInt(String(n.year || n.parent_year || '0'), 10);
            return !isNaN(nodeYear) && nodeYear === selectedYearNum;
        });

        // 2. Filter by Sector (matching SectorDesk.tsx lines 452-456)
        const sectorFilteredNodes = (selectedSector === 'all' || selectedSector === 'water')
            ? yearlyNodes
            : [];

        // 3. Filter L1 nodes for this category
        const l1Nodes = sectorFilteredNodes.filter(n => {
            const isL1 = n.level === 'L1';
            const isNonPhysical = (!n.merged_asset_count || n.merged_asset_count === '' || n.merged_asset_count === 'null') &&
                (!n.old_region || n.old_region === '' || n.old_region === 'null');
            const nodeCategory = L1_CATEGORY_MAP[n.name] || 'Services';
            return isL1 && isNonPhysical && nodeCategory === category;
        });

        // Build tool items with child counts
        const tools: PolicyToolItem[] = l1Nodes.map(node => {
            // Count L2 children (would need edges, simplified for now)
            const childCount = parseInt(node.child_count || '0', 10);
            return {
                id: node.id,
                name: node.name,
                level: node.level,
                childCount: childCount,
                category: category
            };
        });

        setCategoryTools(tools);
        setActiveCategory(category);
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setTimeout(() => {
            setActiveCategory(null);
            setCategoryTools([]);
        }, 300);
    };

    // Helper to render category item
    const counts = policyCounts || {
        enforce: 0, incentive: 0, license: 0, services: 0, regulate: 0, awareness: 0, total: 0,
        enforceStatus: 'none', incentiveStatus: 'none', licenseStatus: 'none',
        servicesStatus: 'none', regulateStatus: 'none', awarenessStatus: 'none'
    };

    // Get risk-based color from real data ONLY — no hardcoded fallbacks
    const getStatusColor = (status?: 'red' | 'amber' | 'green' | 'none'): string => {
        switch (status) {
            case 'red': return 'var(--component-color-danger)';
            case 'amber': return 'var(--component-color-warning)';
            case 'green': return 'var(--component-color-success)';
            case 'none':
            default: return 'var(--component-text-tertiary)';
        }
    };

    const renderItem = (id: string, val: number, status?: 'red' | 'amber' | 'green' | 'none') => {
        const bandColor = getStatusColor(status);
        return (
            <div
                className="policy-tool-item"
                onMouseEnter={() => handleCategoryHover(id)}
                onClick={() => handleCategoryHover(id)}
                style={{ cursor: 'pointer' }}
            >
                <div
                    className="policy-tool-indicator"
                    style={{
                        background: bandColor,
                        boxShadow: `0 0 8px ${bandColor}`
                    }}
                />
                <div className="policy-tool-content">
                    <span className="output-label" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {t('josoor.sector.' + id.toLowerCase())} ({val})
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <div className="sector-header-nav">

            {/* ROW 1: BRAND + CONTROLS */}
            <div className="sector-header-row">

                {/* 1. BRAND - COMPACT */}
                <div className="sector-header-brand">
                    <div className="nav-title">
                        <div>{t('josoor.sector.ksaVision')}</div>
                        <div>2030</div>
                    </div>
                </div>

                {/* 2. CLICKABLE SECTORS */}
                <div className="sector-header-section">
                    <span className="sector-list-title">
                        {t('josoor.sector.sectors')}
                    </span>
                    <div className="sector-icons-container">
                    {SECTORS.map((sector) => {
                        const isSelected = selectedSector === sector.id;
                        const sectorLabel = t('josoor.sector.sector' + (sector.id === 'all' ? 'All' : sector.id.charAt(0).toUpperCase() + sector.id.slice(1)));
                        return (
                            <motion.button
                                key={sector.id}
                                onClick={() => onSelectSector(sector.id)}
                                title={sectorLabel}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`sector-icon-button ${isSelected ? 'active' : ''}`}
                            >
                                <img src={sector.icon} width={24} height={24} alt={sectorLabel} style={{ filter: isSelected ? 'none' : 'grayscale(1) opacity(0.8)' }} />
                            </motion.button>
                        );
                    })}
                    </div>
                </div>

                {/* 3. FILTERS */}
                <div className="sector-header-controls">
                    {/* A. STATUS FILTER */}
                    <div className="sector-header-section">
                        <span className="sector-list-title">{t('josoor.sector.status')}</span>
                        <div className="pillar-tabs">
                            <button
                                onClick={() => {
                                    if (timelineFilter === 'both') onTimelineFilterChange?.('future');
                                    else if (timelineFilter === 'future') onTimelineFilterChange?.('both');
                                }}
                                className={`pillar-tab ${(timelineFilter === 'current' || timelineFilter === 'both') ? 'active' : ''}`}
                                title="Toggle Existing Assets"
                            >
                                {t('josoor.sector.existing')}
                            </button>
                            <button
                                onClick={() => {
                                    if (timelineFilter === 'both') onTimelineFilterChange?.('current');
                                    else if (timelineFilter === 'current') onTimelineFilterChange?.('both');
                                }}
                                className={`pillar-tab ${(timelineFilter === 'future' || timelineFilter === 'both') ? 'active' : ''}`}
                                title="Toggle Planned Assets"
                            >
                                {t('josoor.sector.planned')}
                            </button>
                        </div>
                    </div>

                    {/* B. PRIORITY FILTER */}
                    <div className="sector-header-section">
                        <span className="sector-list-title">{t('josoor.sector.priority')}</span>
                        <div className="pillar-tabs">
                            <button
                                onClick={() => onPriorityFilterChange?.('major')}
                                className={`pillar-tab ${priorityFilter === 'major' ? 'active' : ''}`}
                                title="Major Unlocks Only"
                            >
                                <img src={majorUnlockPin} width={12} height={12} style={{ filter: priorityFilter === 'major' ? 'none' : 'grayscale(1) opacity(0.5)' }} />
                                <span>{t('josoor.sector.major')}</span>
                            </button>
                            <button
                                onClick={() => onPriorityFilterChange?.('both')}
                                className={`pillar-tab ${priorityFilter === 'both' ? 'active' : ''}`}
                            >
                                {t('josoor.common.all')}
                            </button>
                        </div>
                    </div>

                    {/* C. AI STRATEGY BRIEF BUTTON */}
                    <motion.button
                        onClick={onStrategyClick}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="ai-strategy-btn"
                        title="Generate AI Strategy Brief"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{t('josoor.sector.aiStrategyBrief')}</span>
                    </motion.button>
                </div>
            </div>

            {/* ROW 2: POLICY EXECUTION TOOLS (6 CATEGORIES) */}
            <div className="sector-header-section">
                <span className="sector-list-title">
                    {t('josoor.sector.policyTools')}
                </span>
                <div className="policy-tools-grid">
                {renderItem('Enforce', counts.enforce, categoryRiskColors['Enforce'] as any)}
                {renderItem('Incentive', counts.incentive, categoryRiskColors['Incentive'] as any)}
                {renderItem('License', counts.license, categoryRiskColors['License'] as any)}
                {renderItem('Services', counts.services, categoryRiskColors['Services'] as any)}
                {renderItem('Regulate', counts.regulate, categoryRiskColors['Regulate'] as any)}
                {renderItem('Awareness', counts.awareness, categoryRiskColors['Awareness'] as any)}
            </div>

        </div>
    </div>

            <PolicyToolsDrawer
                isOpen={drawerOpen}
                category={activeCategory}
                tools={categoryTools}
                onClose={handleDrawerClose}
                color={activeCategory ? CATEGORY_COLORS[activeCategory] : '#666'}
                onToolClick={onPolicyToolClick}
                toolRiskBands={policyRiskByL1}
            />
        </div>
    );
};


export default SectorHeaderNav;
