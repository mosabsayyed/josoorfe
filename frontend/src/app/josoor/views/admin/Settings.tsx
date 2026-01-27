import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    RefreshCw,
    AlertCircle,
    Check,
    Plus,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import {
    fetchSettings,
    saveSettings,
} from '../../../../services/adminSettingsService';
import { adminService } from '../../../../services/adminService';
import './Settings.css';

export default function AdminSettings() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);

    // Provider state
    const [providers, setProviders] = useState<any[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [providerDetail, setProviderDetail] = useState<any>(null);
    const [providerDraft, setProviderDraft] = useState<any>(null);

    // System settings state
    const [systemSettings, setSystemSettings] = useState<any>(null);
    const [systemDraft, setSystemDraft] = useState<any>(null);

    // UI state
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        provider_basic: true,
        provider_advanced: false,
        mcp: true,
        graphrag: true
    });

    // Load providers
    const loadProviders = async () => {
        try {
            const data = await adminService.getProviders();
            setProviders(data);
            setProviders(data);
            const active = data.find((p: any) => p.is_active);
            if (active) {
                setSelectedProviderId(active.id);
            } else if (data.length > 0) {
                setSelectedProviderId(data[0].id);
            }
        } catch (err: any) {
            console.error('Failed to load providers:', err);
        }
    };

    // Load provider details
    const loadProviderDetail = async (id: string) => {
        try {
            setLoading(true);
            const detail = await adminService.getProvider(id);
            setProviderDetail(detail);
            setProviderDraft(JSON.parse(JSON.stringify(detail)));
        } catch (err: any) {
            setError(err.message || 'Failed to load provider details');
        } finally {
            setLoading(false);
        }
    };

    // Load system settings
    const loadSystemSettings = async () => {
        try {
            setLoading(true);
            const settings = await fetchSettings(token);
            setSystemSettings(settings);
            setSystemDraft(JSON.parse(JSON.stringify(settings)));
        } catch (err: any) {
            setError(err.message || 'Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProviders();
        loadSystemSettings();
    }, [token]);

    useEffect(() => {
        if (selectedProviderId) {
            loadProviderDetail(selectedProviderId);
        }
    }, [selectedProviderId]);

    const updateProviderField = (key: string, value: any) => {
        setProviderDraft({ ...providerDraft, [key]: value });
    };

    const updateSystemField = (key: string, value: any) => {
        setSystemDraft({ ...systemDraft, [key]: value });
    };

    const saveProvider = async () => {
        if (!selectedProviderId || !providerDraft) return;
        setSaveLoading(true);
        setError(null);
        try {
            const { id, is_active, ...editableFields } = providerDraft;
            await adminService.updateProvider(selectedProviderId, editableFields);
            await loadProviderDetail(selectedProviderId);
            await loadProviders();
        } catch (err: any) {
            setError(err.message || 'Failed to save provider');
        } finally {
            setSaveLoading(false);
        }
    };

    const activateProvider = async () => {
        if (!selectedProviderId) return;
        setSaveLoading(true);
        setError(null);
        try {
            await adminService.activateProvider(selectedProviderId);
            await loadProviders();
            await loadProviderDetail(selectedProviderId);
        } catch (err: any) {
            setError(err.message || 'Failed to activate provider');
        } finally {
            setSaveLoading(false);
        }
    };

    // Test provider
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testLoading, setTestLoading] = useState(false);

    const testProvider = async () => {
        if (!selectedProviderId || !providerDraft?.default_model) return;
        setTestLoading(true);
        setTestResult(null);
        try {
            await adminService.testProvider(selectedProviderId, providerDraft.default_model);
            setTestResult({ success: true, message: 'Provider test successful' });
        } catch (err: any) {
            setTestResult({ success: false, message: err.message || 'Provider test failed' });
        } finally {
            setTestLoading(false);
        }
    };

    const saveSystemSettings = async () => {
        if (!systemDraft) return;
        setSaveLoading(true);
        setError(null);
        try {
            await saveSettings(systemDraft, token);
            await loadSystemSettings();
        } catch (err: any) {
            setError(err.message || 'Failed to save system settings');
        } finally {
            setSaveLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // MCP endpoint management
    const addMcpEndpoint = () => {
        if (!systemDraft?.s_mcp_config) return;
        const endpoints = [...(systemDraft.s_mcp_config.endpoints || [])];
        endpoints.push({ label: '', url: '', allowed_tools: [] });
        updateSystemField('s_mcp_config', {
            ...systemDraft.s_mcp_config,
            endpoints
        });
    };

    const removeMcpEndpoint = (index: number) => {
        if (!systemDraft?.s_mcp_config) return;
        const endpoints = [...systemDraft.s_mcp_config.endpoints];
        endpoints.splice(index, 1);
        updateSystemField('s_mcp_config', {
            ...systemDraft.s_mcp_config,
            endpoints
        });
    };

    const updateMcpEndpoint = (index: number, field: string, value: any) => {
        if (!systemDraft?.s_mcp_config) return;
        const endpoints = [...systemDraft.s_mcp_config.endpoints];
        endpoints[index] = { ...endpoints[index], [field]: value };
        updateSystemField('s_mcp_config', {
            ...systemDraft.s_mcp_config,
            endpoints
        });
    };

    if (loading && !providerDetail && !systemSettings) {
        return (
            <div className="detail-panel" style={{ padding: '24px' }}>
                <RefreshCw className="spinning icon-md" style={{ margin: '0 auto', display: 'block' }} />
            </div>
        );
    }

    return (
        <div className="detail-panel">
            <div className="observability-header">
                <div>
                    <h1 className="observability-header-title">Admin Settings</h1>
                    <p className="observability-header-subtitle">
                        Configure LLM providers and system settings
                    </p>
                </div>
            </div>

            {error && (
                <div className="observability-error" style={{ marginBottom: '16px' }}>
                    <AlertCircle className="icon-md" />
                    <p>{error}</p>
                </div>
            )}

            <div className="settings-layout">
                {/* LEFT COLUMN - Provider Configuration */}
                <div className="settings-column">
                    <div className="settings-card">
                        <div className="card-header">
                            <div>
                                <h3>LLM Provider Configuration</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--component-text-secondary)', opacity: 0.8 }}>
                                    Configure and manage LLM provider connections
                                </p>
                            </div>
                            {providerDraft?.is_active && (
                                <span className="status-badge active">
                                    <Check className="icon-sm" /> Active
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Select Provider</label>
                            <select
                                value={selectedProviderId}
                                onChange={(e) => setSelectedProviderId(e.target.value)}
                                className="form-select"
                            >
                                {providers.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                        {p.display_name || p.name} {p.is_active ? '●' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {providerDraft && (
                            <>
                                {/* Basic Settings */}
                                <div className="section-divider">
                                    <button
                                        className="section-toggle"
                                        onClick={() => toggleSection('provider_basic')}
                                    >
                                        Basic Settings
                                        {expandedSections.provider_basic ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
                                    </button>
                                </div>

                                {expandedSections.provider_basic && (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Display Name</label>
                                            <input
                                                type="text"
                                                value={providerDraft.display_name || ''}
                                                onChange={(e) => updateProviderField('display_name', e.target.value)}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Base URL</label>
                                            <input
                                                type="url"
                                                value={providerDraft.base_url || ''}
                                                onChange={(e) => updateProviderField('base_url', e.target.value)}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Endpoint Path</label>
                                            <input
                                                type="text"
                                                value={providerDraft.endpoint_path_template || ''}
                                                onChange={(e) => updateProviderField('endpoint_path_template', e.target.value)}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Default Model</label>
                                            <select
                                                value={providerDraft.default_model || ''}
                                                onChange={(e) => updateProviderField('default_model', e.target.value)}
                                                className="form-select"
                                            >
                                                {(providerDraft.supported_models || []).map((m: string) => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Timeout (seconds)</label>
                                            <input
                                                type="number"
                                                value={providerDraft.timeout || 120}
                                                onChange={(e) => updateProviderField('timeout', Number(e.target.value))}
                                                className="form-input"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Capabilities */}
                                <div className="section-divider">
                                    <button
                                        className="section-toggle"
                                        onClick={() => toggleSection('provider_advanced')}
                                    >
                                        Capabilities
                                        {expandedSections.provider_advanced ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
                                    </button>
                                </div>

                                {expandedSections.provider_advanced && (
                                    <div className="capabilities-grid">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={providerDraft.supports_streaming || false}
                                                onChange={(e) => updateProviderField('supports_streaming', e.target.checked)}
                                            />
                                            <span>Streaming</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={providerDraft.supports_tool_calling || false}
                                                onChange={(e) => updateProviderField('supports_tool_calling', e.target.checked)}
                                            />
                                            <span>Tool Calling</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={providerDraft.supports_reasoning || false}
                                                onChange={(e) => updateProviderField('supports_reasoning', e.target.checked)}
                                            />
                                            <span>Reasoning</span>
                                        </label>
                                    </div>
                                )}

                                <div className="action-row">
                                    <button
                                        className="btn-primary"
                                        onClick={saveProvider}
                                        disabled={saveLoading || testLoading}
                                    >
                                        {saveLoading ? <RefreshCw className="spinning icon-sm" /> : <Check className="icon-sm" />}
                                        Save Provider
                                    </button>

                                    <button
                                        className="btn-secondary"
                                        onClick={testProvider}
                                        disabled={saveLoading || testLoading}
                                    >
                                        {testLoading ? <RefreshCw className="spinning icon-sm" /> : <AlertCircle className="icon-sm" />}
                                        Test Connection
                                    </button>

                                    {!providerDraft.is_active && (
                                        <button
                                            className="btn-secondary"
                                            onClick={activateProvider}
                                            disabled={saveLoading || testLoading}
                                        >
                                            Set as Active
                                        </button>
                                    )}
                                </div>

                                {testResult && (
                                    <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                                        {testResult.success ? <Check className="icon-sm" /> : <AlertCircle className="icon-sm" />}
                                        {testResult.message}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - System Settings */}
                <div className="settings-column">
                    {/* GraphRAG */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div>
                                <h3>GraphRAG Context</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--component-text-secondary)', opacity: 0.8 }}>
                                    Semantic graph-based context enhancement
                                </p>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={systemDraft?.s_enable_graphrag_context || false}
                                    onChange={(e) => updateSystemField('s_enable_graphrag_context', e.target.checked)}
                                />
                                <span>Enable GraphRAG Semantic Context</span>
                            </label>
                            <p className="help-text">
                                Inject graph communities into queries (~300ms latency)
                            </p>
                        </div>
                    </div>

                    {/* MCP Endpoints */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div style={{ flex: 1 }}>
                                <h3>MCP Endpoints</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--component-text-secondary)', opacity: 0.8 }}>
                                    Model Context Protocol router connections
                                </p>
                            </div>
                            <button className="btn-icon" onClick={addMcpEndpoint}>
                                <Plus className="icon-sm" />
                            </button>
                        </div>

                        <div className="mcp-list">
                            {(systemDraft?.s_mcp_config?.endpoints || []).map((endpoint: any, idx: number) => (
                                <div key={idx} className="mcp-endpoint">
                                    <div className="form-row">
                                        <div className="form-group flex-1">
                                            <label>Label</label>
                                            <input
                                                type="text"
                                                value={endpoint.label}
                                                onChange={(e) => updateMcpEndpoint(idx, 'label', e.target.value)}
                                                className="form-input"
                                                placeholder="e.g., noor-router"
                                            />
                                        </div>
                                        <button
                                            className="btn-icon-danger"
                                            onClick={() => removeMcpEndpoint(idx)}
                                        >
                                            <X className="icon-sm" />
                                        </button>
                                    </div>
                                    <div className="form-group">
                                        <label>URL</label>
                                        <input
                                            type="url"
                                            value={endpoint.url}
                                            onChange={(e) => updateMcpEndpoint(idx, 'url', e.target.value)}
                                            className="form-input"
                                            placeholder="https://betaBE.aitwintech.com/2/mcp/"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="action-row">
                        <button
                            className="btn-primary"
                            onClick={saveSystemSettings}
                            disabled={saveLoading}
                        >
                            {saveLoading ? <RefreshCw className="spinning icon-sm" /> : <SettingsIcon className="icon-sm" />}
                            Save System Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
