import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { ProviderConfig, ProviderDetail } from '../../types/llm';
import '../../styles/ProviderManagement.css';

const EMPTY_FORM = {
    display_name: '',
    description: '',
    base_url: '',
    endpoint_path_template: '/v1/chat/completions',
    default_model: '',
    auth_scheme: 'bearer',
    context_window_tokens: null as number | null,
    max_output_tokens_limit: null as number | null,
    timeout_seconds: 120,
    is_enabled: true,
    api_key: '',
    supported_models: [] as string[],
    supports_streaming: false,
    supports_tool_calling: false,
    supports_reasoning: false,
};

export const ProviderManagement: React.FC = () => {
    const [providers, setProviders] = useState<ProviderConfig[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [selectedProviderDetail, setSelectedProviderDetail] = useState<ProviderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editForm, setEditForm] = useState<Partial<ProviderDetail> & { api_key?: string; supported_models?: string[] }>({});
    const [testResult, setTestResult] = useState<any | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [newModelInput, setNewModelInput] = useState('');

    useEffect(() => {
        loadProviders();
    }, []);

    useEffect(() => {
        if (selectedProviderId && !isCreating) {
            loadProviderDetail(selectedProviderId);
        } else if (!isCreating) {
            setSelectedProviderDetail(null);
            setTestResult(null);
        }
    }, [selectedProviderId]);

    useEffect(() => {
        if (selectedProviderDetail && !isCreating) {
            setEditForm({
                display_name: selectedProviderDetail.display_name,
                description: selectedProviderDetail.description || '',
                base_url: selectedProviderDetail.base_url,
                endpoint_path_template: selectedProviderDetail.endpoint_path_template,
                default_model: selectedProviderDetail.default_model,
                auth_scheme: selectedProviderDetail.auth_scheme || 'bearer',
                context_window_tokens: selectedProviderDetail.context_window_tokens,
                max_output_tokens_limit: selectedProviderDetail.max_output_tokens_limit,
                timeout_seconds: selectedProviderDetail.timeout_seconds,
                is_enabled: selectedProviderDetail.is_enabled ?? true,
                api_key: '',
                supported_models: selectedProviderDetail.supported_models || [],
                supports_streaming: selectedProviderDetail.supports_streaming || false,
                supports_tool_calling: selectedProviderDetail.supports_tool_calling || false,
                supports_reasoning: selectedProviderDetail.supports_reasoning || false,
            });
            setIsEditing(false);
        }
    }, [selectedProviderDetail]);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const data = await adminService.getProviders();
            setProviders(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadProviderDetail = async (id: string) => {
        setLoading(true);
        try {
            const data = await adminService.getProvider(id);
            setSelectedProviderDetail(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id: string) => {
        if (!window.confirm(`Activate ${selectedProviderDetail?.display_name}? This will deactivate the current provider.`)) return;
        try {
            await adminService.activateProvider(id);
            await loadProviders();
            await loadProviderDetail(id);
        } catch (err: any) {
            alert(`Failed: ${err.message}`);
        }
    };

    const handleSave = async () => {
        if (!selectedProviderId) return;
        setLoading(true);
        try {
            const payload: any = { ...editForm };
            if (!payload.api_key) delete payload.api_key;
            await adminService.updateProvider(selectedProviderId, payload);
            await loadProviderDetail(selectedProviderId);
            setIsEditing(false);
        } catch (err: any) {
            alert(`Save failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!editForm.display_name || !editForm.base_url) {
            alert('Display Name and Base URL are required.');
            return;
        }
        setLoading(true);
        try {
            const payload: any = { ...editForm };
            if (!payload.api_key) delete payload.api_key;
            const created = await adminService.createProvider(payload);
            await loadProviders();
            setIsCreating(false);
            setSelectedProviderId(created?.id || null);
        } catch (err: any) {
            alert(`Create failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const startCreating = () => {
        setIsCreating(true);
        setSelectedProviderId(null);
        setSelectedProviderDetail(null);
        setIsEditing(false);
        setTestResult(null);
        setNewModelInput('');
        setEditForm({ ...EMPTY_FORM, supported_models: [] });
    };

    const cancelCreating = () => {
        setIsCreating(false);
        setEditForm({});
    };

    const handleTest = async () => {
        if (!selectedProviderDetail) return;
        setTestLoading(true);
        setTestResult(null);
        try {
            const result = await adminService.testProvider(
                selectedProviderDetail.id,
                selectedProviderDetail.default_model
            );
            setTestResult(result);
        } catch (err: any) {
            setTestResult({ status: 'error', error: err.message });
        } finally {
            setTestLoading(false);
        }
    };

    const downloadJSON = () => {
        if (!selectedProviderDetail) return;
        const blob = new Blob([JSON.stringify(selectedProviderDetail, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedProviderDetail.id}_config.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const updateField = (field: string, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const addModel = () => {
        const model = newModelInput.trim();
        if (!model) return;
        const current = editForm.supported_models || [];
        if (current.includes(model)) return;
        const updated = [...current, model];
        updateField('supported_models', updated);
        if (!editForm.default_model) {
            updateField('default_model', model);
        }
        setNewModelInput('');
    };

    const removeModel = (model: string) => {
        const current = editForm.supported_models || [];
        const updated = current.filter((m: string) => m !== model);
        updateField('supported_models', updated);
        if (editForm.default_model === model) {
            updateField('default_model', updated[0] || '');
        }
    };

    const p = selectedProviderDetail;
    const models = isCreating || isEditing ? (editForm.supported_models || []) : (p?.supported_models || []);
    const isFormMode = isEditing || isCreating;

    // Shared form fields renderer
    const renderFormFields = () => (
        <div className="form-grid">
            {/* Display Name */}
            <div className="form-group">
                <label>Display Name</label>
                {isFormMode ? (
                    <input className="form-input" value={editForm.display_name || ''} onChange={e => updateField('display_name', e.target.value)} placeholder="e.g. NVIDIA NIM" />
                ) : (
                    <div className="form-value">{p?.display_name}</div>
                )}
            </div>

            {/* Provider ID (Read-only, only for existing) */}
            {!isCreating && (
                <div className="form-group">
                    <label>Provider ID</label>
                    <div className="form-value mono">{p?.id}</div>
                </div>
            )}

            {/* Base URL */}
            <div className="form-group full-width">
                <label>Base URL</label>
                {isFormMode ? (
                    <input className="form-input" value={editForm.base_url || ''} onChange={e => updateField('base_url', e.target.value)} placeholder="e.g. https://integrate.api.nvidia.com" />
                ) : (
                    <div className="form-value mono">{p?.base_url}</div>
                )}
            </div>

            {/* Endpoint Path */}
            <div className="form-group full-width">
                <label>Endpoint Path</label>
                {isFormMode ? (
                    <input className="form-input" value={editForm.endpoint_path_template || ''} onChange={e => updateField('endpoint_path_template', e.target.value)} placeholder="e.g. /v1/chat/completions" />
                ) : (
                    <div className="form-value mono">{p?.endpoint_path_template}</div>
                )}
            </div>

            {/* Default Model */}
            <div className="form-group">
                <label>Default Model</label>
                {isFormMode ? (
                    models.length > 0 ? (
                        <select className="form-select" value={editForm.default_model || ''} onChange={e => updateField('default_model', e.target.value)}>
                            <option value="">Select model...</option>
                            {models.map((m: string) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    ) : (
                        <input className="form-input" value={editForm.default_model || ''} onChange={e => updateField('default_model', e.target.value)} placeholder="Add models below first" />
                    )
                ) : (
                    <div className="form-value mono">{p?.default_model}</div>
                )}
            </div>

            {/* Auth Scheme */}
            <div className="form-group">
                <label>Auth Scheme</label>
                {isFormMode ? (
                    <select className="form-select" value={editForm.auth_scheme || 'bearer'} onChange={e => updateField('auth_scheme', e.target.value)}>
                        <option value="bearer">Bearer Token</option>
                        <option value="api_key_header">API Key Header</option>
                        <option value="query_param">Query Parameter</option>
                        <option value="none">None</option>
                    </select>
                ) : (
                    <div className="form-value">{p?.auth_scheme || 'bearer'}</div>
                )}
            </div>

            {/* Context Window */}
            <div className="form-group">
                <label>Context Window</label>
                {isFormMode ? (
                    <input className="form-input" type="number" value={editForm.context_window_tokens || ''} onChange={e => updateField('context_window_tokens', parseInt(e.target.value) || null)} placeholder="e.g. 262144" />
                ) : (
                    <div className="form-value">{p?.context_window_tokens?.toLocaleString() || '—'} tokens</div>
                )}
            </div>

            {/* Max Output Tokens */}
            <div className="form-group">
                <label>Max Output Tokens</label>
                {isFormMode ? (
                    <input className="form-input" type="number" value={editForm.max_output_tokens_limit || ''} onChange={e => updateField('max_output_tokens_limit', parseInt(e.target.value) || null)} placeholder="e.g. 16384" />
                ) : (
                    <div className="form-value">{p?.max_output_tokens_limit?.toLocaleString() || '—'}</div>
                )}
            </div>

            {/* Timeout */}
            <div className="form-group">
                <label>Timeout (seconds)</label>
                {isFormMode ? (
                    <input className="form-input" type="number" value={editForm.timeout_seconds || ''} onChange={e => updateField('timeout_seconds', parseInt(e.target.value) || null)} placeholder="e.g. 120" />
                ) : (
                    <div className="form-value">{p?.timeout_seconds || 60}s</div>
                )}
            </div>

            {/* Status (existing only, read-only) */}
            {!isCreating && !isEditing && (
                <div className="form-group">
                    <label>Status</label>
                    <div className="form-value">
                        <span className={`status-dot ${p?.config_status}`}></span>
                        {p?.config_status === 'valid' ? 'Valid' : 'Incomplete'}
                    </div>
                </div>
            )}

            {/* API Key */}
            {isFormMode && (
                <div className="form-group full-width">
                    <label>API Key</label>
                    <input
                        className="form-input"
                        type="password"
                        value={editForm.api_key || ''}
                        onChange={e => updateField('api_key', e.target.value)}
                        placeholder={isCreating ? "Enter API key..." : "Enter new key to update..."}
                        autoComplete="new-password"
                    />
                    {!isCreating && <span className="helper-text">Leave blank to keep current key</span>}
                </div>
            )}

            {/* Description */}
            {isFormMode && (
                <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                        className="form-textarea"
                        value={editForm.description || ''}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Optional description..."
                    />
                </div>
            )}
        </div>
    );

    // Model list management (for create/edit modes)
    const renderModelManagement = () => (
        <section className="config-section">
            <div className="section-header">
                <h3>Models</h3>
                <span className="helper-text">{models.length} model{models.length !== 1 ? 's' : ''}</span>
            </div>

            {isFormMode ? (
                <>
                    <div className="model-tags">
                        {models.map((m: string) => (
                            <span key={m} className="model-tag">
                                {m}
                                <button className="remove-model" onClick={() => removeModel(m)}>x</button>
                            </span>
                        ))}
                        {models.length === 0 && <span className="helper-text">No models added yet</span>}
                    </div>
                    <div className="add-model-row">
                        <input
                            className="form-input"
                            value={newModelInput}
                            onChange={e => setNewModelInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addModel())}
                            placeholder="e.g. moonshotai/kimi-k2.5"
                        />
                        <button className="btn btn-secondary" onClick={addModel}>Add</button>
                    </div>
                </>
            ) : (
                <div className="form-value mono" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                    {models.join(', ') || 'None configured'}
                </div>
            )}
        </section>
    );

    // Capabilities checkboxes (for create/edit)
    const renderCapabilities = () => {
        if (!isFormMode) return null;
        return (
            <section className="config-section">
                <div className="section-header">
                    <h3>Capabilities</h3>
                </div>
                <div className="form-grid three-col">
                    <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editForm.supports_streaming || false} onChange={e => updateField('supports_streaming', e.target.checked)} />
                        <span style={{ fontSize: '0.85rem' }}>Streaming</span>
                    </label>
                    <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editForm.supports_tool_calling || false} onChange={e => updateField('supports_tool_calling', e.target.checked)} />
                        <span style={{ fontSize: '0.85rem' }}>Tool Calling</span>
                    </label>
                    <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editForm.supports_reasoning || false} onChange={e => updateField('supports_reasoning', e.target.checked)} />
                        <span style={{ fontSize: '0.85rem' }}>Reasoning</span>
                    </label>
                </div>
            </section>
        );
    };

    return (
        <div className="provider-management-container">
            <header className="page-header">
                <div>
                    <h1>LLM Providers</h1>
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="content-layout">
                {/* Sidebar */}
                <div className="provider-list">
                    {providers.map(provider => (
                        <div
                            key={provider.id}
                            className={`provider-item ${provider.active ? 'active-provider' : ''} ${selectedProviderId === provider.id && !isCreating ? 'selected' : ''}`}
                            onClick={() => { setIsCreating(false); setSelectedProviderId(provider.id); }}
                        >
                            <div className="provider-header">
                                <span className="provider-name">{provider.display_name}</span>
                                {provider.active && <span className="badge active-badge">Active</span>}
                            </div>
                            <div className="provider-meta">{provider.default_model}</div>
                        </div>
                    ))}
                    <button className="add-provider-btn" onClick={startCreating}>
                        + Add Provider
                    </button>
                </div>

                {/* Detail Panel */}
                <div className="provider-detail">
                    {isCreating ? (
                        /* === CREATE MODE === */
                        <div className="detail-content">
                            <div className="detail-header">
                                <h2>New Provider</h2>
                                <div className="actions">
                                    <button className="btn btn-secondary" onClick={cancelCreating}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Provider'}
                                    </button>
                                </div>
                            </div>

                            <section className="config-section">
                                <div className="section-header">
                                    <h3>Configuration</h3>
                                </div>
                                {renderFormFields()}
                            </section>

                            {renderModelManagement()}
                            {renderCapabilities()}
                        </div>
                    ) : !selectedProviderId ? (
                        <div className="empty-state">Select a provider to view details</div>
                    ) : loading && !p ? (
                        <div className="empty-state">Loading...</div>
                    ) : p ? (
                        /* === VIEW/EDIT MODE === */
                        <div className="detail-content">
                            {/* Header */}
                            <div className="detail-header">
                                <h2>{p.display_name}</h2>
                                <div className="actions">
                                    {isEditing ? (
                                        <>
                                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                            <button className="btn btn-primary" onClick={handleSave}>Save</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn btn-secondary btn-sm" onClick={downloadJSON}>JSON</button>
                                            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
                                            <button
                                                className={`btn ${p.active ? 'btn-secondary' : 'btn-primary'}`}
                                                onClick={() => handleActivate(p.id)}
                                                disabled={p.active}
                                            >
                                                {p.active ? 'Active' : 'Activate'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Configuration Section */}
                            <section className="config-section">
                                <div className="section-header">
                                    <h3>Configuration</h3>
                                    {!isEditing && p.updated_at && (
                                        <span className="helper-text">Last updated: {new Date(p.updated_at).toLocaleDateString()}</span>
                                    )}
                                </div>
                                {renderFormFields()}
                            </section>

                            {/* Models */}
                            {renderModelManagement()}

                            {/* Capabilities */}
                            {renderCapabilities()}

                            {/* Test Connection */}
                            {!isEditing && (
                                <section className="test-section">
                                    <h3>Test Connection</h3>
                                    <div className="test-controls">
                                        <button className="btn btn-secondary" onClick={handleTest} disabled={testLoading}>
                                            {testLoading ? 'Testing...' : 'Run Test'}
                                        </button>
                                        {p.last_tested && (
                                            <span className="helper-text">Last: {new Date(p.last_tested).toLocaleString()}</span>
                                        )}
                                    </div>
                                    {testResult && (
                                        <div className={`test-result ${testResult.status}`}>
                                            {testResult.status === 'success'
                                                ? `Success (${testResult.latency_ms}ms)`
                                                : `Failed: ${testResult.error}`}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
