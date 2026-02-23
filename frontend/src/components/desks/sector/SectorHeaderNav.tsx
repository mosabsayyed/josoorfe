import React, { useEffect, useMemo, useState } from 'react';
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

import { PolicyToolCounts } from '../../desks/sector/SectorPolicyClassifier';
import { PolicyToolsDrawer, PolicyToolItem } from './PolicyToolsDrawer';
import { L1_CATEGORY_MAP } from '../../../services/neo4jMcpService';
import { buildWaterHighLevelHierarchy, getWaterProgramFamilies } from './data/waterHighLevelHierarchy';

function parsePercentLike(value?: string): number | null {
    if (!value) return null;
    const direct = value.match(/(\d+(?:\.\d+)?)\s*%/);
    if (direct) return Number(direct[1]);
    return null;
}

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
    visionPillars?: Array<{ pillar: string; objective: string }>;
    selectedRegionName?: string | null;
    onBackToNational?: () => void;

    // Updated Policy Tools Counts (6 Categories)
    policyCounts?: PolicyToolCounts;
    policyNodes?: any[]; // Raw policy nodes for drawer

    // Filtering context for drawer
    selectedYear?: string;

    // Real risk data from Neo4j
    categoryRiskColors?: Record<string, string>;
    policyRiskByL1?: Map<string, any>;
    onPolicyToolClick?: (tool: any) => void;
    categoryById?: Map<string, string>;
    onWaterCascadeL3Change?: (items: Array<{ id: string; title: string; value: string }>) => void;
}

const SectorHeaderNav: React.FC<SectorHeaderNavProps> = ({
    selectedSector,
    onSelectSector,
    timelineFilter = 'both',
    onTimelineFilterChange,
    priorityFilter = 'both',
    onPriorityFilterChange,
    year = '2029',
    onYearChange,
    existingCount = 0,
    plannedCount = 0,
    nationalKpis,
    visionPillars = [],
    selectedRegionName,
    onBackToNational,
    policyCounts,
    policyNodes = [],
    selectedYear = '2029',
    categoryRiskColors = {},
    policyRiskByL1,
    onPolicyToolClick,
    categoryById = new Map(),
    onWaterCascadeL3Change
}) => {
    const { t } = useTranslation();
    const isWaterSector = String(selectedSector || '').toLowerCase() === 'water';
    const uiFont = {
        label: '12px',
        body: '12px',
        sub: '11px',
        title: '13px'
    };

    type CascadeL3 = { id: string; title: string; value: string };
    type CascadeL2 = { id: string; title: string; value: string; l3: CascadeL3[] };
    type CascadeL1 = { id: string; title: string; value: string; l2: CascadeL2[] };
    type CascadePillar = { id: string; title: string; value: string; l1: CascadeL1[] };
    type CascadeL2Option = CascadeL1;
    type CascadeL3Option = CascadeL2;

    const waterCascade = useMemo<CascadePillar[]>(() => buildWaterHighLevelHierarchy(t) as CascadePillar[], [t]);

    const [activePillarId, setActivePillarId] = useState<string>('vibrant');
    const [activeL2Id, setActiveL2Id] = useState<string>('sustainable-use');
    const [activeL3Id, setActiveL3Id] = useState<string>('reuse');

    useEffect(() => {
        if (!isWaterSector) return;
        const firstPillar = waterCascade[0];
        const firstL2 = firstPillar?.l1[0];
        const firstL3 = firstL2?.l2[0];
        setActivePillarId(firstPillar?.id || 'vibrant');
        setActiveL2Id(firstL2?.id || 'sustainable-use');
        setActiveL3Id(firstL3?.id || 'reuse');
    }, [isWaterSector, waterCascade]);

    const activePillar = useMemo(() => {
        return waterCascade.find((p) => p.id === activePillarId) || waterCascade[0];
    }, [waterCascade, activePillarId]);

    const availableL2Options = useMemo<CascadeL2Option[]>(() => {
        if (!activePillar) return [];
        return activePillar.l1;
    }, [activePillar]);

    const activeL2 = useMemo(() => {
        return availableL2Options.find((item) => item.id === activeL2Id) || availableL2Options[0];
    }, [availableL2Options, activeL2Id]);

    const availableL3Options = useMemo<CascadeL3Option[]>(() => {
        return activeL2?.l2 || [];
    }, [activeL2]);

    const activeL3 = useMemo(() => {
        return availableL3Options.find((item) => item.id === activeL3Id) || availableL3Options[0];
    }, [availableL3Options, activeL3Id]);

    const waterProgramFamilyList = useMemo(() => getWaterProgramFamilies(t), [t]);
    const waterProgramFamilies = waterProgramFamilyList;

    const nid = (v: any): string => {
        if (v == null) return '';
        const s = String(v);
        const n = parseFloat(s);
        if (isNaN(n)) return s;
        return s.includes('.') ? s : n.toFixed(1);
    };

    const waterMappedProgramNodes = useMemo(() => {
        return policyNodes.filter((node: any) => {
            const nodeYear = String(node.year || node.parent_year || '');
            const isPolicyTool = (node._labels || []).includes('SectorPolicyTool');
            const isL1 = node.level === 'L1';
            const hasMappedProgramId = String(node.mapped_program_id || '').trim().length > 0;
            const hasMappedProgramLabel = String(node.mapped_program_label || '').trim().length > 0;
            return nodeYear === selectedYear && isPolicyTool && isL1 && hasMappedProgramId && hasMappedProgramLabel;
        });
    }, [policyNodes, selectedYear]);

    const waterProgramsByFamily = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        waterProgramFamilyList.forEach((family) => {
            grouped[family.id] = [];
        });

        waterMappedProgramNodes.forEach((node: any) => {
            const familyId = String(node.mapped_family || '').trim();
            const programId = String(node.mapped_program_id || '').trim();
            const programLabel = String(node.mapped_program_label || node.name || '').trim();
            if (!familyId || !programId || !programLabel || !grouped[familyId]) return;

            grouped[familyId].push({
                id: programId,
                familyId,
                label: programLabel,
                team: String(node.delivery_channel || '').trim(),
                output: String(node.description || '').trim(),
                kpi: String(node.impact_target || '').trim(),
                capability: String(node.mapped_capability || '').trim(),
                mappedL1Id: nid(node.domain_id || node.id),
                mappedL1Name: String(node.name || '').trim()
            });
        });

        Object.keys(grouped).forEach((familyId) => {
            const uniqueById = new Map<string, any>();
            grouped[familyId].forEach((program) => {
                if (!uniqueById.has(program.id)) {
                    uniqueById.set(program.id, program);
                }
            });
            grouped[familyId] = Array.from(uniqueById.values());
        });

        return grouped;
    }, [waterMappedProgramNodes, waterProgramFamilyList]);

    const waterProgramDbLinks = useMemo(() => {
        const normalize = (value: any) => String(value || '').trim().toLowerCase();
        const dedupeCaps = (caps: any[]) =>
            Array.from(
                new Map(
                    (caps || [])
                        .filter((cap: any) => cap && String(cap.capId || '').trim().length > 0)
                        .map((cap: any) => [String(cap.capId), cap])
                ).values()
            );

        const result: Record<string, { l2Id?: string; l2Name?: string; l1Band?: string; l2Band?: string; capabilities: any[] }> = {};

        waterMappedProgramNodes.forEach((node: any) => {
            const programId = String(node.mapped_program_id || '').trim();
            if (!programId) return;

            const l1Id = nid(node.domain_id || node.id);
            const riskEntry = policyRiskByL1?.get(l1Id);
            const l2Details = riskEntry?.l2Details || [];
            const mappedCapability = normalize(node.mapped_capability);
            const mappedProgramLabel = normalize(node.mapped_program_label || node.name);

            let matchedL2 = l2Details.find((detail: any) =>
                (detail?.caps || []).some((cap: any) => normalize(cap?.capName).includes(mappedCapability) || mappedCapability.includes(normalize(cap?.capName)))
            );

            if (!matchedL2 && mappedProgramLabel) {
                matchedL2 = l2Details.find((detail: any) => normalize(detail?.l2Name).includes(mappedProgramLabel));
            }

            if (!matchedL2 && l2Details.length > 0) {
                matchedL2 = l2Details[0];
            }

            const uniqueCaps = dedupeCaps((matchedL2?.caps || []) as any[]);

            result[programId] = {
                l2Id: matchedL2 ? nid(matchedL2.l2Id) : undefined,
                l2Name: matchedL2 ? String(matchedL2.l2Name || '').trim() : undefined,
                l1Band: String(riskEntry?.worstBand || '').toLowerCase() || undefined,
                l2Band: String(matchedL2?.worstBand || '').toLowerCase() || undefined,
                capabilities: uniqueCaps
            };
        });

        return result;
    }, [waterMappedProgramNodes, policyRiskByL1]);

    const activeWaterProgramIds = useMemo<Set<string>>(() => {
        return new Set(activeL3?.linkedPrograms || []);
    }, [activeL3]);

    const linkedWaterFamilyIds = useMemo<Set<string>>(() => {
        if (activeWaterProgramIds.size === 0) {
            return new Set(waterProgramFamilyList.map((family) => family.id));
        }
        const linked = new Set<string>();
        Object.entries(waterProgramsByFamily).forEach(([familyId, programs]) => {
            if ((programs || []).some((program: any) => activeWaterProgramIds.has(program.id))) {
                linked.add(familyId);
            }
        });
        return linked;
    }, [activeWaterProgramIds, waterProgramsByFamily, waterProgramFamilyList]);

    useEffect(() => {
        const nextL2 = availableL2Options[0];
        setActiveL2Id((prev) => (availableL2Options.some((item) => item.id === prev) ? prev : (nextL2?.id || '')));
    }, [availableL2Options]);

    useEffect(() => {
        const nextL3 = availableL3Options[0];
        setActiveL3Id((prev) => (availableL3Options.some((item) => item.id === prev) ? prev : (nextL3?.id || '')));
    }, [availableL3Options]);

    useEffect(() => {
        if (!isWaterSector) {
            onWaterCascadeL3Change?.([]);
            return;
        }
        onWaterCascadeL3Change?.(activeL3?.l3 || []);
    }, [isWaterSector, activeL3, onWaterCascadeL3Change]);
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
        // 1. Filter by Year: Exact match (each year has its own intentional PT distribution)
        const yearlyNodes = policyNodes.filter(n => {
            const nodeYear = String(n.year || n.parent_year || '');
            return nodeYear === selectedYear;
        });

        // 2. Filter by Sector (matching SectorDesk.tsx)
        const sectorFilteredNodes = (selectedSector === 'all' || selectedSector === 'water')
            ? yearlyNodes
            : [];

        // 3. Filter L1 SectorPolicyTool nodes for this category (by domain_id)
        const l1Nodes = sectorFilteredNodes.filter(n => {
            const isL1 = n.level === 'L1';
            const isPolicyTool = (n._labels || []).includes('SectorPolicyTool');
            const isNonPhysical = !n.sector || n.sector === '' || n.sector === 'null';
            const did = String(n.domain_id || n.id || '');
            const nodeCategory = categoryById.get(did) || L1_CATEGORY_MAP[n.name] || 'Services';
            return isL1 && isPolicyTool && isNonPhysical && nodeCategory === category;
        });

        // Build tool items with child counts
        const tools: PolicyToolItem[] = l1Nodes.map(node => {
            // Count L2 children (would need edges, simplified for now)
            const childCount = parseInt(node.child_count || '0', 10);
            return {
                ...node,  // Pass all raw Neo4j properties through
                id: String(node.id),
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
        enforce: 0, incentive: 0, license: 0, services: 0, regulate: 0, awareness: 0, total: 0
    };

    // Map risk level to color — visual only, not a status indicator
    const getRiskColor = (riskLevel?: 'red' | 'amber' | 'green' | 'none'): string => {
        switch (riskLevel) {
            case 'red': return 'var(--component-color-danger)';
            case 'amber': return 'var(--component-color-warning)';
            case 'green': return 'var(--component-color-success)';
            case 'none':
            default: return 'var(--component-text-tertiary)';
        }
    };

    const renderItem = (id: string, val: number, riskLevel?: 'red' | 'amber' | 'green' | 'none') => {
        const bandColor = getRiskColor(riskLevel);
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

    const policyObjectiveGauge = useMemo(() => {
        const bands = Object.values(categoryRiskColors || {});
        if (!bands.length) return 40;
        const toScore = (b: string) => b === 'red' ? 25 : b === 'amber' ? 60 : b === 'green' ? 85 : 40;
        return Math.round(bands.reduce((sum, b) => sum + toScore(String(b)), 0) / bands.length);
    }, [categoryRiskColors]);

    const l1KpiGauge = useMemo(() => {
        const entries = Object.values(nationalKpis || {}) as any[];
        const scored = entries.map((kpi: any) => {
            const valuePct = parsePercentLike(kpi?.value);
            const targetPct = parsePercentLike(kpi?.target);
            if (valuePct == null || targetPct == null || targetPct <= 0) return null;
            return Math.max(0, Math.min(100, Math.round((valuePct / targetPct) * 100)));
        }).filter((x): x is number => x != null);
        if (!scored.length) return 0;
        return Math.round(scored.reduce((sum, x) => sum + x, 0) / scored.length);
    }, [nationalKpis]);

    const Gauge = ({ label, value, color }: { label: string; value: number; color: string }) => {
        const angle = Math.max(0, Math.min(100, value)) * 1.8;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(15,23,42,0.45)' }}>
                <div style={{
                    width: '42px', height: '22px',
                    background: `conic-gradient(${color} ${angle}deg, rgba(148,163,184,0.25) ${angle}deg 180deg)`,
                    borderTopLeftRadius: '42px', borderTopRightRadius: '42px', borderBottom: '0', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', inset: '6px 6px 0 6px', background: 'var(--component-bg-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                    <span style={{ fontSize: '10px', color: 'var(--component-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--component-text-primary)' }}>{value}%</span>
                </div>
            </div>
        );
    };

    return (
        <div style={{ position: 'relative' }}>
            <div className="sector-header-nav">

            {/* ROW 1: BRAND + CONTROLS */}
            <div className="sector-header-row">
                {/* 1. CLICKABLE SECTORS */}
                <div className="sector-header-section" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: '10px' }}>
                    <div className="water-label-group">
                        <span className="water-label-pillar">
                            {t('josoor.sector.cascade.water.dropdownLabels.pillar', 'Pillar')}
                        </span>
                        <select
                            value={activePillarId}
                            onChange={(e) => setActivePillarId(e.target.value)}
                            style={{
                                minWidth: '220px',
                                height: '36px',
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(15,23,42,0.55)',
                                color: 'var(--component-text-primary)',
                                fontSize: '12px',
                                padding: '0 8px',
                                borderRadius: '6px'
                            }}
                            title={t('josoor.sector.cascade.water.dropdownLabels.pillar', 'Pillar')}
                        >
                            {waterCascade.map((pillar) => (
                                <option key={pillar.id} value={pillar.id}>
                                    {pillar.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sector-icons-container" style={{ gap: '14px' }}>
                    {SECTORS.map((sector) => {
                        const isSelected = selectedSector === sector.id;
                        const sectorLabel = sector.id === 'all'
                            ? t('josoor.sector.sectors')
                            : t('josoor.sector.sector' + (sector.id.charAt(0).toUpperCase() + sector.id.slice(1)));
                        return (
                            <div key={sector.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--component-text-primary)', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{sectorLabel}</span>
                                <motion.button
                                    onClick={() => onSelectSector(sector.id)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`sector-icon-button ${isSelected ? 'active' : ''} ${sector.id === 'water' && !isSelected ? 'water-subtle-hint' : ''}`}
                                >
                                    <img
                                        src={sector.icon}
                                        className="sector-icon-img"
                                        width={24}
                                        height={24}
                                        alt=""
                                    />
                                </motion.button>
                            </div>
                        );
                    })}
                    </div>
                </div>

                {/* 2. FILTERS */}
                <div className="sector-header-controls">
                    {/* A. STATUS FILTER */}
                    <div className="sector-header-section">
                        <span className="sector-list-title">{t('josoor.sector.status')}</span>
                        <select
                            value={timelineFilter}
                            onChange={(e) => onTimelineFilterChange?.(e.target.value as 'current' | 'future' | 'both')}
                            style={{
                                minWidth: '110px',
                                height: '28px',
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(15,23,42,0.55)',
                                color: 'var(--component-text-primary)',
                                fontSize: '12px',
                                padding: '0 8px',
                                borderRadius: '6px'
                            }}
                            title={t('josoor.sector.status')}
                        >
                            <option value="both">{t('josoor.common.all')}</option>
                            <option value="current">{t('josoor.sector.existing')}</option>
                            <option value="future">{t('josoor.sector.planned')}</option>
                        </select>
                    </div>

                    {/* B. PRIORITY FILTER */}
                    <div className="sector-header-section">
                        <span className="sector-list-title">{t('josoor.sector.priority')}</span>
                        <select
                            value={priorityFilter}
                            onChange={(e) => onPriorityFilterChange?.(e.target.value as 'major' | 'strategic' | 'both')}
                            style={{
                                minWidth: '110px',
                                height: '28px',
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(15,23,42,0.55)',
                                color: 'var(--component-text-primary)',
                                fontSize: '12px',
                                padding: '0 8px',
                                borderRadius: '6px'
                            }}
                            title={t('josoor.sector.priority')}
                        >
                            <option value="both">{t('josoor.common.all')}</option>
                            <option value="major">{t('josoor.sector.major')}</option>
                            <option value="strategic">{t('josoor.sector.strategic', 'Strategic')}</option>
                        </select>
                    </div>

                </div>
            </div>

            {/* ROW 2: POLICY EXECUTION TOOLS (6 CATEGORIES) */}
            <div className="sector-header-section">
                <div className="water-cascade-wrap">
                    <div className="water-cascade-rows">
                        <div className="water-cascade-row" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '320px', flex: 1 }}>
                                <div className="water-cascade-level-label water-label-objective">{t('josoor.sector.cascade.water.levelLabels.l1', 'Sector Objective (Vision L2)')}</div>
                                <select
                                    value={isWaterSector ? (activeL2?.id || '') : ''}
                                    onChange={(e) => setActiveL2Id(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '30px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(15,23,42,0.62)',
                                        color: 'var(--component-text-primary)',
                                        fontSize: uiFont.body,
                                        padding: '0 10px',
                                        borderRadius: '8px'
                                    }}
                                    title={t('josoor.sector.cascade.water.dropdownLabels.visionL2', 'Vision L2')}
                                    disabled={!isWaterSector}
                                >
                                    {!isWaterSector ? (
                                        <option value="">--</option>
                                    ) : availableL2Options.length === 0 ? (
                                        <option value="">--</option>
                                    ) : (
                                        availableL2Options.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.title}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '320px', flex: 1 }}>
                                <div className="water-cascade-level-label water-label-target">{t('josoor.sector.cascade.water.levelLabels.l2', 'Performance Target (Vision L3)')}</div>
                                <select
                                    value={isWaterSector ? (activeL3?.id || '') : ''}
                                    onChange={(e) => setActiveL3Id(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '30px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(15,23,42,0.62)',
                                        color: 'var(--component-text-primary)',
                                        fontSize: uiFont.body,
                                        padding: '0 10px',
                                        borderRadius: '8px'
                                    }}
                                    title={t('josoor.sector.cascade.water.dropdownLabels.visionL3', 'Vision L3')}
                                    disabled={!isWaterSector}
                                >
                                    {!isWaterSector ? (
                                        <option value="">--</option>
                                    ) : availableL3Options.length === 0 ? (
                                        <option value="">--</option>
                                    ) : (
                                        availableL3Options.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.title}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                {isWaterSector && (
                    <>
                <span className="sector-list-title water-label-programs">
                    {t('josoor.sector.policyTools')}
                </span>
                    <div className="policy-tools-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                        {waterProgramFamilyList.map((family) => {
                            const isLinked = linkedWaterFamilyIds.has(family.id);
                            const familyPrograms = (waterProgramsByFamily[family.id] || []).filter((program: any) => {
                                if (activeWaterProgramIds.size === 0) return true;
                                return activeWaterProgramIds.has(program.id);
                            });
                            const tracedPrograms = familyPrograms.map((program, idx) => ({
                                ...program,
                                trace_id: `${family.id}:${idx + 1}`,
                                mappedProgramId: program.mappedL1Id,
                                mappedL2Id: waterProgramDbLinks[program.id]?.l2Id,
                                mappedL2Name: waterProgramDbLinks[program.id]?.l2Name,
                                l1Band: waterProgramDbLinks[program.id]?.l1Band,
                                l2Band: waterProgramDbLinks[program.id]?.l2Band,
                                linkedCapabilities: waterProgramDbLinks[program.id]?.capabilities || []
                            }));
                            return (
                                <div
                                    key={family.id}
                                    className="policy-tool-item water-program-card"
                                    onClick={() => onPolicyToolClick?.({
                                        id: family.id,
                                        domain_id: family.id,
                                        trace_id: family.id,
                                        name: family.label,
                                        category: family.label,
                                        status: t('josoor.sector.policy.active', 'Active'),
                                        tool_type: t('josoor.sector.policy.executionProgram', 'Execution Program'),
                                        impact_target: tracedPrograms.length > 0 ? tracedPrograms.map((p) => p.kpi).join(' • ') : '—',
                                        delivery_channel: tracedPrograms.length > 0 ? tracedPrograms.map((p) => p.team).join(' • ') : '—',
                                        cost_of_implementation: '—',
                                        description: tracedPrograms.length > 0 ? tracedPrograms.map((p) => p.output).join(' • ') : '—',
                                        strategic_objective: tracedPrograms.length > 0 ? tracedPrograms.map((p) => p.capability).join(' • ') : '—',
                                        source: 'water-family',
                                        waterPrograms: tracedPrograms,
                                        branch: activeL3?.title || ''
                                    })}
                                    style={{
                                        cursor: 'pointer',
                                        opacity: isLinked ? 1 : 0.45,
                                        borderColor: isLinked ? 'var(--component-text-accent)' : 'var(--component-panel-border)'
                                    }}
                                >
                                    <div
                                        className="policy-tool-indicator water-program-indicator"
                                        style={{
                                            background: isLinked ? 'var(--component-text-accent)' : 'var(--component-text-tertiary)',
                                            boxShadow: isLinked ? '0 0 8px var(--component-text-accent)' : 'none'
                                        }}
                                    />
                                    <div className="policy-tool-content">
                                        <span className="water-program-title water-program-name">
                                            {family.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}

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
