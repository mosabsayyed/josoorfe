import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Filter,
    Play,
    FileText,
    Activity,
    Network,
    Eye
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
    'GAPS_SCOPE', 'CLOSE_GAPS', 'ADOPTION_RISKS', 'INCREASE_ADOPTION',
    // Global
    'PARENT_OF'
];

const BUSINESS_CHAINS = [
    { id: 'sector_value_chain', name: 'Sector Value Chain' },
    { id: 'setting_strategic_initiatives', name: 'Setting Strategic Initiatives' },
    { id: 'setting_strategic_priorities', name: 'Setting Strategic Priorities' },
    { id: 'build_oversight', name: 'Build Oversight' },
    { id: 'operate_oversight', name: 'Operate Oversight' },
    { id: 'sustainable_operations', name: 'Sustainable Operations' },
    { id: 'integrated_oversight', name: 'Integrated Oversight' }
];

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
    // Ignore dynamic props, use SST authoritatively
    availableLabels = SST_LABELS,
    availableRelationships = SST_RELATIONSHIPS,
    isDark = true
}: ExplorerFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(true);

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

    return (
        <div className={`explorer-filters-overlay ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="filters-card">
                <div
                    className="filters-header"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="filters-header-title">
                        <Filter className={`w-4 h-4 ${isDark ? 'text-gold' : 'text-primary'}`} />
                        {isExpanded && <span className="text-sm font-semibold">Graph Controls</span>}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>

                {isExpanded && (
                    <div className="filters-body custom-scrollbar">
                        {/* Business Chains */}
                        <div className="filter-section">
                            <label className="filter-section-label">
                                <Network className="w-3 h-3" /> Business Chains
                            </label>
                            <select
                                className="native-select"
                                value={selectedChain || "custom"}
                                onChange={(e) => onChainChange(e.target.value === "custom" ? null : e.target.value)}
                            >
                                <option value="custom">Custom Selection</option>
                                {BUSINESS_CHAINS.map(chain => (
                                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Query Mode */}
                        <div className="filter-section">
                            <label className="filter-section-label">
                                <Activity className="w-3 h-3" /> Query Mode
                            </label>
                            <div className="mode-toggle-group">
                                <button
                                    className={`btn-reset mode-toggle-btn ${queryType === 'narrative' ? 'active' : ''}`}
                                    onClick={() => onQueryTypeChange('narrative')}
                                >
                                    <FileText className="w-3 h-3 mr-1" /> Narrative
                                </button>
                                <button
                                    className={`btn-reset mode-toggle-btn ${queryType === 'diagnostic' ? 'active' : ''}`}
                                    onClick={() => onQueryTypeChange('diagnostic')}
                                >
                                    <Activity className="w-3 h-3 mr-1" /> Diagnostic
                                </button>
                            </div>
                        </div>

                        {/* Visualization Mode */}
                        <div className="filter-section">
                            <label className="filter-section-label">
                                <Eye className="w-3 h-3" /> Visualization
                            </label>
                            <div className="mode-toggle-group">
                                <button
                                    className={`btn-reset mode-toggle-btn ${vizMode === '3d' ? 'active' : ''}`}
                                    onClick={() => onVizModeChange('3d')}
                                >
                                    3D Force Graph
                                </button>
                                <button
                                    className={`btn-reset mode-toggle-btn ${vizMode === 'sankey' ? 'active' : ''}`}
                                    onClick={() => onVizModeChange('sankey')}
                                >
                                    Sankey Flow
                                </button>
                            </div>
                        </div>

                        {/* Nodes */}
                        <div className="filter-section">
                            <label className="filter-section-label">Ontology Nodes</label>

                            <div className="ontology-group">
                                {sectorLabels.length > 0 && (
                                    <div>
                                        <div className="ontology-subgroup-header">
                                            <p className="ontology-subgroup-title">Sector Layer</p>
                                            <button
                                                className="btn-reset select-all-btn"
                                                onClick={() => selectAllNodesInGroup(sectorLabels)}
                                            >
                                                {sectorLabels.every(l => selectedLabels.includes(l)) ? 'Deselect All' : 'Select All'}
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
                                            <p className="ontology-subgroup-title">Enterprise Layer</p>
                                            <button
                                                className="btn-reset select-all-btn"
                                                onClick={() => selectAllNodesInGroup(entityLabels)}
                                            >
                                                {entityLabels.every(l => selectedLabels.includes(l)) ? 'Deselect All' : 'Select All'}
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
                                            <p className="ontology-subgroup-title">Other Nodes</p>
                                            <button
                                                className="btn-reset select-all-btn"
                                                onClick={() => selectAllNodesInGroup(otherLabels)}
                                            >
                                                {otherLabels.every(l => selectedLabels.includes(l)) ? 'Deselect All' : 'Select All'}
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
                            <div className="filter-section-header">
                                <label className="filter-section-label">Relationships</label>
                                <button
                                    className="btn-reset select-all-btn"
                                    onClick={selectAllRels}
                                >
                                    {selectedRelationships.length === availableRelationships.length ? 'Deselect All' : 'Select All'}
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
                            <label className="filter-section-label">Node Limit: {limit}</label>
                            <input
                                type="range"
                                min="50"
                                max="1000"
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
                                <Play className="w-4 h-4 mr-2" /> Fetch Live Graph
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
