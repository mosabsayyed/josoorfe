import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { ProviderConfig, ProviderDetail } from '../../types/llm';
import '../../styles/ProviderManagement.css';

export const ProviderManagement: React.FC = () => {
    const [providers, setProviders] = useState<ProviderConfig[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [selectedProviderDetail, setSelectedProviderDetail] = useState<ProviderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<ProviderDetail> & { api_key?: string }>({});
    const [testResult, setTestResult] = useState<any | null>(null);
    const [testLoading, setTestLoading] = useState(false);

    useEffect(() => {
        loadProviders();
    }, []);

    useEffect(() => {
        if (selectedProviderId) {
            loadProviderDetail(selectedProviderId);
        } else {
            setSelectedProviderDetail(null);
            setTestResult(null);
        }
    }, [selectedProviderId]);

    useEffect(() => {
        if (selectedProviderDetail) {
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
                api_key: ''
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

    const p = selectedProviderDetail;
    const models = p?.supported_models || [];

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
                            className={`provider-item ${provider.active ? 'active-provider' : ''} ${selectedProviderId === provider.id ? 'selected' : ''}`}
                            onClick={() => setSelectedProviderId(provider.id)}
                        >
                            <div className="provider-header">
                                <span className="provider-name">{provider.display_name}</span>
                                {provider.active && <span className="badge active-badge">Active</span>}
                            </div>
                            <div className="provider-meta">{provider.default_model}</div>
                        </div>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="provider-detail">
                    {!selectedProviderId ? (
                        <div className="empty-state">Select a provider to view details</div>
                    ) : loading && !p ? (
                        <div className="empty-state">Loading...</div>
                    ) : p ? (
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
                                            <button className="btn btn-secondary btn-sm" onClick={downloadJSON}>↓ JSON</button>
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

                                <div className="form-grid">
                                    {/* Display Name */}
                                    <div className="form-group">
                                        <label>Display Name</label>
                                        {isEditing ? (
                                            <input className="form-input" value={editForm.display_name || ''} onChange={e => updateField('display_name', e.target.value)} />
                                        ) : (
                                            <div className="form-value">{p.display_name}</div>
                                        )}
                                    </div>

                                    {/* Provider ID (Read-only) */}
                                    <div className="form-group">
                                        <label>Provider ID</label>
                                        <div className="form-value mono">{p.id}</div>
                                    </div>

                                    {/* Base URL */}
                                    <div className="form-group full-width">
                                        <label>Base URL</label>
                                        {isEditing ? (
                                            <input className="form-input" value={editForm.base_url || ''} onChange={e => updateField('base_url', e.target.value)} />
                                        ) : (
                                            <div className="form-value mono">{p.base_url}</div>
                                        )}
                                    </div>

                                    {/* Endpoint Path */}
                                    <div className="form-group full-width">
                                        <label>Endpoint Path</label>
                                        {isEditing ? (
                                            <input className="form-input" value={editForm.endpoint_path_template || ''} onChange={e => updateField('endpoint_path_template', e.target.value)} />
                                        ) : (
                                            <div className="form-value mono">{p.endpoint_path_template}</div>
                                        )}
                                    </div>

                                    {/* Default Model */}
                                    <div className="form-group">
                                        <label>Default Model</label>
                                        {isEditing ? (
                                            <select className="form-select" value={editForm.default_model || ''} onChange={e => updateField('default_model', e.target.value)}>
                                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        ) : (
                                            <div className="form-value mono">{p.default_model}</div>
                                        )}
                                    </div>

                                    {/* Auth Scheme */}
                                    <div className="form-group">
                                        <label>Auth Scheme</label>
                                        {isEditing ? (
                                            <select className="form-select" value={editForm.auth_scheme || 'bearer'} onChange={e => updateField('auth_scheme', e.target.value)}>
                                                <option value="bearer">Bearer Token</option>
                                                <option value="api_key_header">API Key Header</option>
                                                <option value="query_param">Query Parameter</option>
                                                <option value="none">None</option>
                                            </select>
                                        ) : (
                                            <div className="form-value">{p.auth_scheme || 'bearer'}</div>
                                        )}
                                    </div>

                                    {/* Context Window */}
                                    <div className="form-group">
                                        <label>Context Window</label>
                                        {isEditing ? (
                                            <input className="form-input" type="number" value={editForm.context_window_tokens || ''} onChange={e => updateField('context_window_tokens', parseInt(e.target.value) || null)} placeholder="e.g. 128000" />
                                        ) : (
                                            <div className="form-value">{p.context_window_tokens?.toLocaleString() || '—'} tokens</div>
                                        )}
                                    </div>

                                    {/* Max Output Tokens */}
                                    <div className="form-group">
                                        <label>Max Output Tokens</label>
                                        {isEditing ? (
                                            <input className="form-input" type="number" value={editForm.max_output_tokens_limit || ''} onChange={e => updateField('max_output_tokens_limit', parseInt(e.target.value) || null)} placeholder="e.g. 8192" />
                                        ) : (
                                            <div className="form-value">{p.max_output_tokens_limit?.toLocaleString() || '—'}</div>
                                        )}
                                    </div>

                                    {/* Timeout */}
                                    <div className="form-group">
                                        <label>Timeout (seconds)</label>
                                        {isEditing ? (
                                            <input className="form-input" type="number" value={editForm.timeout_seconds || ''} onChange={e => updateField('timeout_seconds', parseInt(e.target.value) || null)} placeholder="e.g. 60" />
                                        ) : (
                                            <div className="form-value">{p.timeout_seconds || 60}s</div>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="form-group">
                                        <label>Status</label>
                                        <div className="form-value">
                                            <span className={`status-dot ${p.config_status}`}></span>
                                            {p.config_status === 'valid' ? 'Valid' : 'Incomplete'}
                                        </div>
                                    </div>

                                    {/* API Key (Edit only) */}
                                    {isEditing && (
                                        <div className="form-group full-width">
                                            <label>API Key</label>
                                            <input
                                                className="form-input"
                                                type="password"
                                                value={editForm.api_key || ''}
                                                onChange={e => updateField('api_key', e.target.value)}
                                                placeholder="Enter new key to update..."
                                                autoComplete="new-password"
                                            />
                                            <span className="helper-text">Leave blank to keep current key</span>
                                        </div>
                                    )}

                                    {/* Description (Edit only) */}
                                    {isEditing && (
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
                            </section>

                            {/* Model Info (Read-only) */}
                            {!isEditing && (
                                <section className="config-section">
                                    <div className="section-header">
                                        <h3>Available Models</h3>
                                        <span className="helper-text">{models.length} models</span>
                                    </div>
                                    <div className="form-value mono" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                                        {models.join(', ') || 'None configured'}
                                    </div>
                                </section>
                            )}

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
                                                ? `✓ Success (${testResult.latency_ms}ms)`
                                                : `✗ Failed: ${testResult.error}`}
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
