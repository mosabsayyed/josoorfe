import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronDown,
    ChevronUp,
    Filter,
    Play,
    FileText,
    Activity,
    Network,
    Eye,
    Info
} from 'lucide-react';

interface ExplorerFiltersProps {
    selectedLabels: string[];
    selectedRelationships: string[];
    limit: number;
    queryType: 'narrative' | 'diagnostic';
    selectedChain: string | null;
    vizMode: '3d' | 'sankey';
    onLabelsChange: (labels: string[]) => void;
    onRelationshipsChange: (rels: string[]) => void;
    onLimitChange: (limit: number) => void;
    onQueryTypeChange: (type: 'narrative' | 'diagnostic') => void;
    onChainChange: (chain: string | null) => void;
    onVizModeChange: (mode: '3d' | 'sankey') => void;
    onApply: () => void;
    availableLabels?: string[];
    availableRelationships?: string[];
    isDark?: boolean;
    selectedNode?: any;
}

// Authoritative Ontology Labels (SST v1.1)
const SST_LABELS = [
    // Sector Layer
    'SectorObjective', 'SectorPolicyTool', 'SectorPerformance',
    'SectorAdminRecord', 'SectorGovEntity', 'SectorBusiness',
    'SectorCitizen', 'SectorDataTransaction',
    // Enterprise Layer
    'EntityProject', 'EntityCapability', 'EntityRisk',
    'EntityOrgUnit', 'EntityProcess', 'EntityITSystem',
    'EntityChangeAdoption', 'EntityCultureHealth', 'EntityVendor'
];

const SST_RELATIONSHIPS = [
    // Sector Operations
    'REALIZED_VIA', 'GOVERNED_BY', 'CASCADED_VIA',
    'REFERS_TO', 'APPLIED_ON', 'TRIGGERS_EVENT', 'MEASURED_BY', 'AGGREGATES_TO',
    // Risk & Steering
    'INFORMS', 'MONITORED_BY',
    'SETS_PRIORITIES', 'SETS_TARGETS', 'EXECUTES', 'REPORTS',
    // Internal Operations
    'ROLE_GAPS', 'KNOWLEDGE_GAPS', 'AUTOMATION_GAPS',
    'OPERATES', 'MONITORS_FOR', 'APPLY', 'AUTOMATION', 'DEPENDS_ON',
    // Transformation
    'GAPS_SCOPE', 'CLOSE_GAPS', 'GAP_STATUS', 'ADOPTION_RISKS', 'INCREASE_ADOPTION',
    // Global
    'PARENT_OF'
];

const BUSINESS_CHAINS = [
    { id: 'sector_value_chain', key: 'sector_value_chain' },
    { id: 'setting_strategic_initiatives', key: 'setting_strategic_initiatives' },
    { id: 'setting_strategic_priorities', key: 'setting_strategic_priorities' },
    { id: 'build_oversight', key: 'build_oversight' },
    { id: 'operate_oversight', key: 'operate_oversight' },
    { id: 'sustainable_operations', key: 'sustainable_operations' },
    { id: 'integrated_oversight', key: 'integrated_oversight' }
];

// Keys to hide from the details panel — internal/rendering fields only
const HIDDEN_PROPS = new Set([
    'id', 'elementId', 'color', 'val', 'value', 'x', 'y', 'z',
    'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', '__indexColor',
    '_val', 'nProps', 'properties', 'name', 'labels'
]);

// Priority fields shown at the top in fixed order
const PRIORITY_FIELDS = ['domain_id', 'label', 'group', 'level', 'year', 'status', 'sector', 'domain'];

export function ExplorerFilters({
    selectedLabels,
    selectedRelationships,
    limit,
    queryType,
    selectedChain,
    vizMode,
    onLabelsChange,
    onRelationshipsChange,
    onLimitChange,
    onQueryTypeChange,
    onChainChange,
    onVizModeChange,
    onApply,
    availableLabels = SST_LABELS,
    availableRelationships = SST_RELATIONSHIPS,
    isDark = true,
    selectedNode
}: ExplorerFiltersProps) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(true);

    const toggleLabel = (label: string) => {
        if (selectedLabels.includes(label)) {
            onLabelsChange(selectedLabels.filter(l => l !== label));
        } else {
            onLabelsChange([...selectedLabels, label]);
        }
    };

    const toggleRelationship = (rel: string) => {
        if (selectedRelationships.includes(rel)) {
            onRelationshipsChange(selectedRelationships.filter(r => r !== rel));
        } else {
            onRelationshipsChange([...selectedRelationships, rel]);
        }
    };

    const sectorLabels = availableLabels.filter(l => l.startsWith('Sector'));
    const entityLabels = availableLabels.filter(l => l.startsWith('Entity'));
    const otherLabels = availableLabels.filter(l => !l.startsWith('Sector') && !l.startsWith('Entity'));

    const selectAllNodesInGroup = (labels: string[]) => {
        const others = selectedLabels.filter(l => !labels.includes(l));
        const allSelected = labels.every(l => selectedLabels.includes(l));
        if (allSelected) {
            onLabelsChange(others);
        } else {
            onLabelsChange([...others, ...labels]);
        }
    };

    const selectAllRels = () => {
        if (selectedRelationships.length === availableRelationships.length) {
            onRelationshipsChange([]);
        } else {
            onRelationshipsChange([...availableRelationships]);
        }
    };

    // Build structured node details
    const nodeInfo = React.useMemo(() => {
        if (!selectedNode) return null;
        const props = selectedNode.properties || selectedNode.nProps || {};

        // Merge all sources into one flat map
        const all: Record<string, any> = {};
        for (const [k, v] of Object.entries(selectedNode)) {
            if (v !== undefined && v !== null && typeof v !== 'object') all[k] = v;
        }
        for (const [k, v] of Object.entries(props)) {
            const kl = k.toLowerCase();
            if (kl.includes('embedding') || kl.includes('vector') || k === 'embedding_generated_at') continue;
            if (Array.isArray(v) && v.length > 20) continue;
            all[k] = v;
        }

        const domainId = all.domain_id || '';
        const name = selectedNode.name || all.label || all.name || selectedNode.id || 'Node';
        const type = (selectedNode.labels && selectedNode.labels.length > 0)
            ? selectedNode.labels.filter((l: string) => l !== 'Unknown')[0] || ''
            : (all.group || '');

        // Priority rows (only if they exist)
        const priority: { key: string; value: string }[] = [];
        for (const f of PRIORITY_FIELDS) {
            if (all[f] !== undefined && all[f] !== null && String(all[f]).trim()) {
                priority.push({ key: f, value: String(all[f]) });
            }
        }

        // Remaining rows (everything else, skip hidden + priority + embedding)
        const prioritySet = new Set(PRIORITY_FIELDS);
        const rest: { key: string; value: string }[] = [];
        for (const [k, v] of Object.entries(all)) {
            if (HIDDEN_PROPS.has(k) || prioritySet.has(k)) continue;
            rest.push({ key: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) });
        }

        return { domainId, name, type, priority, rest };
    }, [selectedNode]);

    return (
        <div className={`explorer-filters-overlay ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="filters-card">
                <div
                    className="filters-header"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="filters-header-title">
                        <Filter style={{ width: 16, height: 16, color: 'var(--studio-accent)' }} />
                        {isExpanded && <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('josoor.explorerFilters.graphControls')}</span>}
                    </div>
                    {isExpanded ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
                </div>

                {isExpanded && (
                    <div className="filters-body custom-scrollbar">
                        {/* Business Chains */}
                        <div className="filter-section">
                            <label className="filter-section-label">
                                <Network style={{ width: 12, height: 12 }} /> {t('josoor.explorerFilters.businessChains')}
                            </label>
                            <select
                                className="native-select"
                                value={selectedChain || "custom"}
                                onChange={(e) => onChainChange(e.target.value === "custom" ? null : e.target.value)}
                            >
                                <option value="custom">{t('josoor.explorerFilters.customSelection')}</option>
                                {BUSINESS_CHAINS.map(chain => (
                                    <option key={chain.id} value={chain.id}>{t(`josoor.explorerFilters.chains.${chain.key}`)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Query Mode */}
                        <div className="filter-section">
                            <label className="filter-section-label">
                                <Activity style={{ width: 12, height: 12 }} /> {t('josoor.explorerFilters.queryMode')}
                            </label>
                            <div className="mode-toggle-group">
                                <button
                                    className={`btn-reset mode-toggle-btn ${queryType === 'narrative' ? 'active' : ''}`}
                                    onClick={() => onQueryTypeChange('narrative')}
                                >
                                    <FileText style={{ width: 12, height: 12, marginRight: 4 }} /> {t('josoor.explorerFilters.narrative')}
                                </button>
                                <button
                                    className={`btn-reset mode-toggle-btn ${queryType === 'diagnostic' ? 'active' : ''}`}
                                    onClick={() => onQueryTypeChange('diagnostic')}
                                >
                                    <Activity style={{ width: 12, height: 12, marginRight: 4 }} /> {t('josoor.explorerFilters.diagnostic')}
                                </button>
                            </div>
                        </div>

                        {/* Visualization Mode */}
                        <div className="filter-section">
                            <label className="filter-section-label">
                                <Eye style={{ width: 12, height: 12 }} /> {t('josoor.explorerFilters.visualization')}
                            </label>
                            <div className="mode-toggle-group">
                                <button
                                    className={`btn-reset mode-toggle-btn ${vizMode === '3d' ? 'active' : ''}`}
                                    onClick={() => onVizModeChange('3d')}
                                >
                                    {t('josoor.explorerFilters.forceGraph3d')}
                                </button>
                                <button
                                    className={`btn-reset mode-toggle-btn ${vizMode === 'sankey' ? 'active' : ''}`}
                                    onClick={() => onVizModeChange('sankey')}
                                >
                                    {t('josoor.explorerFilters.sankeyFlow')}
                                </button>
                            </div>
                        </div>

                        {/* Nodes */}
                        <div className="filter-section">
                            <label className="filter-section-label">{t('josoor.explorerFilters.ontologyNodes')}</label>

                            <div className="ontology-group">
                                {sectorLabels.length > 0 && (
                                    <div>
                                        <div className="ontology-subgroup-header">
                                            <span className="ontology-subgroup-title">{t('josoor.explorerFilters.sectorLayer')}</span>
                                            <button
                                                className="btn-reset select-all-btn"
                                                onClick={() => selectAllNodesInGroup(sectorLabels)}
                                            >
                                                {sectorLabels.every(l => selectedLabels.includes(l)) ? t('josoor.explorerFilters.deselectAll') : t('josoor.explorerFilters.selectAll')}
                                            </button>
                                        </div>
                                        <div className="ontology-list">
                                            {sectorLabels.map(label => (
                                                <div key={label} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`node-${label}`}
                                                        checked={selectedLabels.includes(label)}
                                                        onChange={() => toggleLabel(label)}
                                                        className="native-checkbox"
                                                    />
                                                    <label htmlFor={`node-${label}`} className="checkbox-label">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {entityLabels.length > 0 && (
                                    <div className="ontology-subgroup">
                                        <div className="ontology-subgroup-header">
                                            <span className="ontology-subgroup-title">{t('josoor.explorerFilters.enterpriseLayer')}</span>
                                            <button
                                                className="btn-reset select-all-btn"
                                                onClick={() => selectAllNodesInGroup(entityLabels)}
                                            >
                                                {entityLabels.every(l => selectedLabels.includes(l)) ? t('josoor.explorerFilters.deselectAll') : t('josoor.explorerFilters.selectAll')}
                                            </button>
                                        </div>
                                        <div className="ontology-list">
                                            {entityLabels.map(label => (
                                                <div key={label} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`node-${label}`}
                                                        checked={selectedLabels.includes(label)}
                                                        onChange={() => toggleLabel(label)}
                                                        className="native-checkbox"
                                                    />
                                                    <label htmlFor={`node-${label}`} className="checkbox-label">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {otherLabels.length > 0 && (
                                    <div className="ontology-subgroup">
                                        <div className="ontology-subgroup-header">
                                            <span className="ontology-subgroup-title">{t('josoor.explorerFilters.otherNodes')}</span>
                                            <button
                                                className="btn-reset select-all-btn"
                                                onClick={() => selectAllNodesInGroup(otherLabels)}
                                            >
                                                {otherLabels.every(l => selectedLabels.includes(l)) ? t('josoor.explorerFilters.deselectAll') : t('josoor.explorerFilters.selectAll')}
                                            </button>
                                        </div>
                                        <div className="ontology-list">
                                            {otherLabels.map(label => (
                                                <div key={label} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`node-${label}`}
                                                        checked={selectedLabels.includes(label)}
                                                        onChange={() => toggleLabel(label)}
                                                        className="native-checkbox"
                                                    />
                                                    <label htmlFor={`node-${label}`} className="checkbox-label">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Relationships */}
                        <div className="filter-section">
                            <div className="ontology-subgroup-header">
                                <span className="filter-section-label">{t('josoor.explorerFilters.relationships')}</span>
                                <button
                                    className="btn-reset select-all-btn"
                                    onClick={selectAllRels}
                                >
                                    {selectedRelationships.length === availableRelationships.length ? t('josoor.explorerFilters.deselectAll') : t('josoor.explorerFilters.selectAll')}
                                </button>
                            </div>
                            <div className="ontology-list">
                                {availableRelationships.map(rel => (
                                    <div key={rel} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            id={`rel-${rel}`}
                                            checked={selectedRelationships.includes(rel)}
                                            onChange={() => toggleRelationship(rel)}
                                            className="native-checkbox"
                                        />
                                        <label htmlFor={`rel-${rel}`} className="checkbox-label">{rel}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Limit */}
                        <div className="filter-section">
                            <label className="filter-section-label">{t('josoor.explorerFilters.nodeLimit')} {limit}</label>
                            <input
                                type="range"
                                min="50"
                                max="20000"
                                step="50"
                                value={limit}
                                onChange={(e) => onLimitChange(parseInt(e.target.value))}
                                className="range-slider"
                            />
                        </div>

                        {/* Actions */}
                        <div className="filter-section">
                            <button
                                onClick={() => {
                                    console.log('[ExplorerFilters] Fetch Live Graph button clicked');
                                    onApply();
                                }}
                                className="btn-reset main-action-btn"
                            >
                                <Play className="w-4 h-4 mr-2" /> {t('josoor.explorerFilters.fetchLiveGraph')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Node Details Panel — persistent, below filters */}
                {isExpanded && (
                    <div className="node-details-panel">
                        <div
                            className="node-details-header"
                            onClick={() => setDetailsOpen(!detailsOpen)}
                        >
                            <div className="node-details-header-title">
                                <Info style={{ width: 16, height: 16, color: 'var(--studio-accent)' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('josoor.explorerFilters.nodeDetails', 'Node Details')}</span>
                            </div>
                            {detailsOpen ? <ChevronDown style={{ width: 16, height: 16 }} /> : <ChevronUp style={{ width: 16, height: 16 }} />}
                        </div>
                        {detailsOpen && (
                            <div className="node-details-body custom-scrollbar">
                                {!nodeInfo ? (
                                    <div className="node-details-empty">
                                        {t('josoor.explorerFilters.clickNodeToInspect', 'Click a node to inspect')}
                                    </div>
                                ) : (
                                    <>
                                        {/* Identity block — domain_id + name + type badge */}
                                        <div className="node-details-identity">
                                            <div className="node-details-name">
                                                {nodeInfo.domainId && <span className="node-details-id">{nodeInfo.domainId}</span>}
                                                {nodeInfo.name}
                                            </div>
                                            {nodeInfo.type && <div className="node-details-type">{nodeInfo.type}</div>}
                                        </div>

                                        {/* Core properties */}
                                        {nodeInfo.priority.length > 0 && (
                                            <table className="node-details-table">
                                                <tbody>
                                                    {nodeInfo.priority.map(({ key, value }) => (
                                                        <tr key={key}>
                                                            <td className="node-details-td-key">{key}</td>
                                                            <td className="node-details-td-val">{value}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}

                                        {/* Additional properties */}
                                        {nodeInfo.rest.length > 0 && (
                                            <div className="node-details-table-rest">
                                                <div className="node-details-section-label">{t('josoor.explorerFilters.additionalProperties', 'Additional')}</div>
                                                <table className="node-details-table">
                                                    <tbody>
                                                        {nodeInfo.rest.map(({ key, value }) => (
                                                            <tr key={key}>
                                                                <td className="node-details-td-key">{key}</td>
                                                                <td className="node-details-td-val">{value}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
