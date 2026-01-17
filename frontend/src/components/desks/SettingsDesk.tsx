import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    RefreshCw,
    AlertCircle,
    Plus,
    Database,
    Cpu,
    Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    fetchSettings,
    saveSettings,
    AdminSettings,
    MCPEntry,
} from '../../services/adminSettingsService';
import '../../../pages/ObservabilityPage.css';

const TOOL_OPTIONS = ['recall_memory', 'retrieve_instructions', 'read_neo4j_cypher'];

interface SettingsDeskProps {
    year?: string;
    quarter?: string;
}

export function SettingsDesk({ year, quarter }: SettingsDeskProps) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [draft, setDraft] = useState<AdminSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSettings();
            setSettings(data);
            setDraft(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async () => {
        if (!draft) return;
        setLoading(true);
        setError(null);
        setSaveStatus(null);
        try {
            const updated = await saveSettings(draft);
            setSettings(updated);
            setDraft(updated);
            setSaveStatus('Settings saved successfully');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const updateProvider = (key: keyof AdminSettings['provider'], value: any) => {
        if (!draft) return;
        setDraft({
            ...draft,
            provider: { ...draft.provider, [key]: value },
        });
    };

    const updateBinding = (persona: string, label: string) => {
        if (!draft) return;
        setDraft({
            ...draft,
            mcp: {
                ...draft.mcp,
                persona_bindings: { ...draft.mcp.persona_bindings, [persona]: label },
            },
        });
    };

    const updateEndpoint = (idx: number, key: keyof MCPEntry, value: any) => {
        if (!draft) return;
        const endpoints = [...(draft.mcp.endpoints || [])];
        endpoints[idx] = { ...endpoints[idx], [key]: value };
        setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
    };

    const toggleTool = (idx: number, tool: string) => {
        if (!draft) return;
        const endpoints = [...(draft.mcp.endpoints || [])];
        const entry = endpoints[idx];
        const next = entry.allowed_tools.includes(tool)
            ? entry.allowed_tools.filter((t) => t !== tool)
            : [...entry.allowed_tools, tool];
        endpoints[idx] = { ...entry, allowed_tools: next };
        setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
    };

    const addEndpoint = () => {
        if (!draft) return;
        const endpoints = [...(draft.mcp.endpoints || [])];
        endpoints.push({ label: 'new-mcp', url: '/mcp/new', allowed_tools: TOOL_OPTIONS });
        setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
    };

    const removeEndpoint = (idx: number) => {
        if (!draft) return;
        const endpoints = [...(draft.mcp.endpoints || [])];
        endpoints.splice(idx, 1);
        setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
    };

    if (!draft) {
        return (
            <div style={{ padding: '2rem' }}>
                {error && (
                    <div className="observability-error" style={{ marginBottom: '1rem' }}>
                        <AlertCircle className="icon-md" />
                        <p>{error}</p>
                    </div>
                )}
                <button className="trace-list-refresh" onClick={loadSettings} disabled={loading}>
                    <RefreshCw className="icon-md" />
                    Load Settings
                </button>
            </div>
        );
    }

    return (
        <div className="admin-settings-container" style={{ padding: '1.5rem' }}>
            <div className="observability-header-left" style={{ marginBottom: '1.5rem' }}>
                <SettingsIcon className="observability-header-icon" />
                <div>
                    <h2 className="observability-header-title" style={{ margin: 0 }}>Admin Settings</h2>
                    <p className="observability-header-subtitle" style={{ margin: 0 }}>
                        Configure LLM provider, MCP endpoints, and response schema independently.
                    </p>
                </div>
            </div>

            {error && (
                <div className="observability-error" style={{ marginBottom: '1rem' }}>
                    <AlertCircle className="icon-md" />
                    <p>{error}</p>
                </div>
            )}

            {saveStatus && (
                <div style={{
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#22c55e'
                }}>
                    {saveStatus}
                </div>
            )}

            <div className="admin-settings-grid">
                <div className="admin-card">
                    <h3><Cpu className="icon-md" style={{ display: 'inline', marginRight: '0.5rem' }} />Provider & Models</h3>
                    <label className="admin-field">
                        <span>Base URL</span>
                        <input
                            type="text"
                            value={draft.provider.base_url || ''}
                            onChange={(e) => updateProvider('base_url', e.target.value)}
                            placeholder="http://127.0.0.1:9090"
                        />
                    </label>
                    <label className="admin-field">
                        <span>Model</span>
                        <input
                            type="text"
                            value={draft.provider.model || ''}
                            onChange={(e) => updateProvider('model', e.target.value)}
                            placeholder="meta-llama-3.1-8b-instruct"
                        />
                    </label>
                    <label className="admin-field">
                        <span>Timeout (s)</span>
                        <input
                            type="number"
                            value={draft.provider.timeout || 60}
                            onChange={(e) => updateProvider('timeout', Number(e.target.value))}
                        />
                    </label>
                    <label className="admin-field">
                        <span>Endpoint Path</span>
                        <input
                            type="text"
                            value={draft.provider.endpoint_path || '/v1/chat/completions'}
                            onChange={(e) => updateProvider('endpoint_path', e.target.value)}
                            placeholder="/v1/chat/completions"
                        />
                    </label>
                    <label className="admin-field">
                        <span>Enable MCP Tools</span>
                        <input
                            type="checkbox"
                            checked={draft.provider.enable_mcp_tools ?? true}
                            onChange={(e) => updateProvider('enable_mcp_tools', e.target.checked)}
                        />
                    </label>
                    <label className="admin-field">
                        <span>Enable Response Schema</span>
                        <input
                            type="checkbox"
                            checked={draft.provider.enable_response_schema ?? false}
                            onChange={(e) => updateProvider('enable_response_schema', e.target.checked)}
                        />
                    </label>
                    <label className="admin-field">
                        <span>Max Output Tokens</span>
                        <input
                            type="number"
                            value={draft.provider.max_output_tokens || 8000}
                            onChange={(e) => updateProvider('max_output_tokens', Number(e.target.value))}
                        />
                    </label>
                    <label className="admin-field">
                        <span>Temperature</span>
                        <input
                            type="number"
                            step="0.1"
                            value={draft.provider.temperature ?? 0.1}
                            onChange={(e) => updateProvider('temperature', Number(e.target.value))}
                        />
                    </label>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3><Database className="icon-md" style={{ display: 'inline', marginRight: '0.5rem' }} />MCP Endpoints</h3>
                        <button className="trace-list-refresh" onClick={addEndpoint} type="button">
                            <Plus className="icon-sm" /> Add
                        </button>
                    </div>
                    <div className="admin-mcp-list">
                        {(draft.mcp.endpoints || []).map((ep, idx) => (
                            <div key={`${ep.label}-${idx}`} className="admin-mcp-entry">
                                <div className="admin-mcp-row">
                                    <input
                                        type="text"
                                        value={ep.label}
                                        onChange={(e) => updateEndpoint(idx, 'label', e.target.value)}
                                        placeholder="label"
                                    />
                                    <input
                                        type="text"
                                        value={ep.url}
                                        onChange={(e) => updateEndpoint(idx, 'url', e.target.value)}
                                        placeholder="http://backend-host:8201"
                                    />
                                    <button
                                        className="trace-list-refresh"
                                        onClick={() => removeEndpoint(idx)}
                                        type="button"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="admin-tools-row">
                                    {TOOL_OPTIONS.map((tool) => (
                                        <label key={tool} className="admin-tool-chip">
                                            <input
                                                type="checkbox"
                                                checked={ep.allowed_tools?.includes(tool)}
                                                onChange={() => toggleTool(idx, tool)}
                                            />
                                            {tool}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="admin-card" style={{ marginTop: '1rem' }}>
                        <h4><Zap className="icon-sm" style={{ display: 'inline', marginRight: '0.5rem' }} />Persona Bindings</h4>
                        {['noor', 'maestro', 'default'].map((persona) => (
                            <label key={persona} className="admin-field">
                                <span>{persona} →</span>
                                <select
                                    value={draft.mcp.persona_bindings?.[persona] || ''}
                                    onChange={(e) => updateBinding(persona, e.target.value)}
                                >
                                    <option value="">Select endpoint</option>
                                    {(draft.mcp.endpoints || []).map((ep) => (
                                        <option key={ep.label} value={ep.label}>
                                            {ep.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                    Last updated: {settings?.updated_at || 'n/a'} by {settings?.updated_by || 'n/a'}
                </p>
                <button
                    className="trace-list-refresh"
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        background: '#D4AF37',
                        color: '#000',
                        fontWeight: 700,
                        padding: '0.5rem 1.5rem',
                        border: 'none'
                    }}
                >
                    <Save className="icon-md" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
