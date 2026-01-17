import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Plus,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import {
    fetchSettings,
    saveSettings,
    AdminSettings,
    MCPEntry,
} from '../../../../services/adminSettingsService';
import './Settings.css';

const TOOL_OPTIONS = ['recall_memory', 'retrieve_instructions', 'read_neo4j_cypher'];

export default function AdminSetting() {
    const { user, token } = useAuth();
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [draftSettings, setDraftSettings] = useState<AdminSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const cfg = await fetchSettings(token);
            setSettings(cfg);
            setDraftSettings(cfg);
        } catch (err: any) {
            setError(err.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [token]);

    const onSave = async () => {
        if (!draftSettings) return;
        setError(null);
        setSaveLoading(true);
        try {
            const saved = await saveSettings(draftSettings, token);
            setSettings(saved);
            setDraftSettings(saved);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaveLoading(false);
        }
    };

    const updateProvider = (key: keyof AdminSettings['provider'], value: any) => {
        if (!draftSettings) return;
        setDraftSettings({
            ...draftSettings,
            provider: { ...draftSettings.provider, [key]: value },
        });
    };

    const updateBinding = (persona: string, label: string) => {
        if (!draftSettings) return;
        setDraftSettings({
            ...draftSettings,
            mcp: {
                ...draftSettings.mcp,
                persona_bindings: { ...draftSettings.mcp.persona_bindings, [persona]: label },
            },
        });
    };

    const updateEndpoint = (idx: number, key: keyof MCPEntry, value: any) => {
        if (!draftSettings) return;
        const endpoints = [...(draftSettings.mcp.endpoints || [])];
        endpoints[idx] = { ...endpoints[idx], [key]: value };
        setDraftSettings({ ...draftSettings, mcp: { ...draftSettings.mcp, endpoints } });
    };

    const toggleTool = (idx: number, tool: string) => {
        if (!draftSettings) return;
        const endpoints = [...(draftSettings.mcp.endpoints || [])];
        const entry = endpoints[idx];
        const next = entry.allowed_tools.includes(tool)
            ? entry.allowed_tools.filter((t) => t !== tool)
            : [...entry.allowed_tools, tool];
        endpoints[idx] = { ...entry, allowed_tools: next };
        setDraftSettings({ ...draftSettings, mcp: { ...draftSettings.mcp, endpoints } });
    };

    const addEndpoint = () => {
        if (!draftSettings) return;
        const endpoints = [...(draftSettings.mcp.endpoints || [])];
        endpoints.push({ label: 'new-mcp', url: '/mcp/new', allowed_tools: TOOL_OPTIONS });
        setDraftSettings({ ...draftSettings, mcp: { ...draftSettings.mcp, endpoints } });
    };

    const removeEndpoint = (idx: number) => {
        if (!draftSettings) return;
        const endpoints = [...(draftSettings.mcp.endpoints || [])];
        endpoints.splice(idx, 1);
        setDraftSettings({ ...draftSettings, mcp: { ...draftSettings.mcp, endpoints } });
    };

    if (!draftSettings) {
        return (
            <div className="detail-panel" style={{ padding: '24px' }}>
                {error && (
                    <div className="observability-error" style={{ marginBottom: '12px' }}>
                        <AlertCircle className="icon-md" />
                        <p>{error}</p>
                    </div>
                )}
                <button className="trace-list-refresh" onClick={loadSettings} disabled={loading}>
                    <RefreshCw className="icon-md" />
                    {loading ? 'Loading...' : 'Load Settings'}
                </button>
            </div>
        );
    }

    return (
        <div className="observability-page">
            <div className="observability-header">
                <div className="observability-header-left">
                    <SettingsIcon className="observability-header-icon" />
                    <div>
                        <h1 className="observability-header-title">Admin Settings</h1>
                        <p className="observability-header-subtitle">
                            Configure system behavior, LLM providers, and MCP tool bindings
                        </p>
                    </div>
                </div>
                <button
                    className="trace-list-refresh"
                    onClick={onSave}
                    disabled={saveLoading}
                    style={{
                        background: 'var(--component-text-accent)',
                        color: 'var(--component-text-on-accent)',
                        padding: '8px 16px'
                    }}
                >
                    {saveLoading ? <RefreshCw className="spinning icon-sm" /> : <SettingsIcon className="icon-sm" />}
                    Save Changes
                </button>
            </div>

            <div className="admin-settings-container">
                {error && (
                    <div className="observability-error" style={{ marginBottom: '12px' }}>
                        <AlertCircle className="icon-md" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="admin-settings-grid">
                    <div className="admin-card">
                        <h3>Provider & Models</h3>
                        <label className="admin-field">
                            <span>Base URL</span>
                            <input
                                type="text"
                                value={draftSettings.provider.base_url || ''}
                                onChange={(e) => updateProvider('base_url', e.target.value)}
                                placeholder="http://127.0.0.1:9090"
                            />
                        </label>
                        <label className="admin-field">
                            <span>Model</span>
                            <input
                                type="text"
                                value={draftSettings.provider.model || ''}
                                onChange={(e) => updateProvider('model', e.target.value)}
                                placeholder="meta-llama-3.1-8b-instruct"
                            />
                        </label>
                        <label className="admin-field">
                            <span>Timeout (s)</span>
                            <input
                                type="number"
                                value={draftSettings.provider.timeout || 60}
                                onChange={(e) => updateProvider('timeout', Number(e.target.value))}
                            />
                        </label>
                        <label className="admin-field">
                            <span>Endpoint Path</span>
                            <input
                                type="text"
                                value={draftSettings.provider.endpoint_path || '/v1/chat/completions'}
                                onChange={(e) => updateProvider('endpoint_path', e.target.value)}
                                placeholder="/v1/chat/completions"
                            />
                        </label>
                        <label className="admin-field">
                            <span>Enable MCP Tools</span>
                            <input
                                type="checkbox"
                                checked={draftSettings.provider.enable_mcp_tools ?? true}
                                onChange={(e) => updateProvider('enable_mcp_tools', e.target.checked)}
                            />
                        </label>
                        <label className="admin-field">
                            <span>Enable Response Schema</span>
                            <input
                                type="checkbox"
                                checked={draftSettings.provider.enable_response_schema ?? false}
                                onChange={(e) => updateProvider('enable_response_schema', e.target.checked)}
                            />
                        </label>
                        <label className="admin-field">
                            <span>Max Output Tokens</span>
                            <input
                                type="number"
                                value={draftSettings.provider.max_output_tokens || 8000}
                                onChange={(e) => updateProvider('max_output_tokens', Number(e.target.value))}
                            />
                        </label>
                        <label className="admin-field">
                            <span>Temperature</span>
                            <input
                                type="number"
                                step="0.1"
                                value={draftSettings.provider.temperature ?? 0.1}
                                onChange={(e) => updateProvider('temperature', Number(e.target.value))}
                            />
                        </label>
                    </div>

                    <div className="admin-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--component-panel-border)', paddingBottom: '12px' }}>
                            <h3 style={{ border: 'none', padding: 0, margin: 0 }}>MCP Endpoints</h3>
                            <button className="trace-list-refresh" onClick={addEndpoint} type="button">
                                <Plus className="icon-sm" /> Add
                            </button>
                        </div>

                        <div className="admin-mcp-list" style={{ marginTop: '12px' }}>
                            {(draftSettings.mcp.endpoints || []).map((ep, idx) => (
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
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="trace-list-refresh"
                                            onClick={() => removeEndpoint(idx)}
                                            type="button"
                                            style={{ color: 'var(--component-color-danger)' }}
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

                        <div className="admin-card" style={{ marginTop: '24px' }}>
                            <h3>Persona Bindings</h3>
                            <div style={{ padding: '0 8px' }}>
                                {['noor', 'maestro', 'default'].map((persona) => (
                                    <label key={persona} className="admin-field" style={{ marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 600 }}>{persona}</span>
                                        <select
                                            value={draftSettings.mcp.persona_bindings?.[persona] || ''}
                                            onChange={(e) => updateBinding(persona, e.target.value)}
                                        >
                                            <option value="">Select endpoint</option>
                                            {(draftSettings.mcp.endpoints || []).map((ep) => (
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', padding: '12px', background: 'var(--component-bg-secondary)', borderRadius: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                        Last updated: {settings?.updated_at || 'n/a'} by {settings?.updated_by || 'n/a'}
                    </p>
                </div>
            </div>
        </div>
    );
}
