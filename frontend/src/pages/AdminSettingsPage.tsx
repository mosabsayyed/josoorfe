import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSettings, saveSettings, AdminSettings } from '../services/adminSettingsService';
import '../pages/ObservabilityPage.css';

// ============================================================================
// ADMIN SETTINGS PANEL (Extracted from ObservabilityPage)
// ============================================================================
function AdminSettingsPanel({
  userRole,
  token,
  settings,
  draft,
  setDraft,
  onReload,
  onSave,
  loading,
  error
}: {
  userRole?: string;
  token: string | null;
  settings: AdminSettings | null;
  draft: AdminSettings | null;
  setDraft: (s: AdminSettings | null) => void;
  onReload: () => void;
  onSave: () => void;
  loading: boolean;
  error: string | null;
}) {
  if (loading && !settings) {
    return (
      <div className="admin-settings-loading">
        <RefreshCw className="icon-md animate-spin" />
        <p>Loading admin settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-settings-error">
        <AlertCircle className="icon-md" />
        <p>{error}</p>
        <button onClick={onReload} className="btn-primary">Retry</button>
      </div>
    );
  }

  if (!settings || !draft) {
    return (
      <div className="admin-settings-empty">
        <SettingsIcon className="icon-md" />
        <p>No settings available</p>
      </div>
    );
  }

  const handleProviderChange = (key: string, value: any) => {
    setDraft({
      ...draft,
      provider: {
        ...draft.provider,
        [key]: value
      }
    });
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(draft);

  return (
    <div className="admin-settings-panel">
      <div className="admin-settings-header">
        <div>
          <h2>
            <SettingsIcon className="icon-md" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
            Admin Settings
          </h2>
          <p className="subtitle">
            Configure LLM provider, MCP tools, and system behavior
          </p>
        </div>
        <div className="admin-settings-actions">
          <button
            onClick={onReload}
            disabled={loading}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw className={`icon-sm ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            onClick={onSave}
            disabled={!isDirty || loading}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save className="icon-sm" />
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-settings-error-banner">
          <AlertCircle className="icon-sm" />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-settings-content">
        <div className="settings-section">
          <h3>LLM Provider Configuration</h3>
          
          <div className="form-group">
            <label>Base URL</label>
            <input
              type="text"
              value={draft.provider.base_url || ''}
              onChange={(e) => handleProviderChange('base_url', e.target.value)}
              placeholder="http://127.0.0.1:9090"
            />
            <small>HTTP endpoint for LLM API (LocalAI, LM Studio, OpenRouter, etc.)</small>
          </div>

          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={draft.provider.api_key || ''}
              onChange={(e) => handleProviderChange('api_key', e.target.value)}
              placeholder="Leave empty for local LLM, required for Groq/OpenRouter"
            />
            <small>
              {draft.provider.base_url && (
                (draft.provider.base_url.includes('localhost') || draft.provider.base_url.includes('127.0.0.1'))
                  ? '✓ Local LLM detected - API key is optional'
                  : (draft.provider.api_key ? '✓ API key configured' : '⚠️ Cloud provider detected - API key is required')
              )}
            </small>
          </div>

          <div className="form-group">
            <label>Model Name</label>
            <input
              type="text"
              value={draft.provider.model || ''}
              onChange={(e) => handleProviderChange('model', e.target.value)}
              placeholder="meta-llama-3.1-8b-instruct"
            />
            <small>Model identifier for the LLM</small>
          </div>

          <div className="form-group">
            <label>Endpoint Path</label>
            <input
              type="text"
              value={draft.provider.endpoint_path}
              onChange={(e) => handleProviderChange('endpoint_path', e.target.value)}
              placeholder="/v1/chat/completions"
            />
            <small>API endpoint path (e.g., /v1/chat/completions, /v1/responses)</small>
          </div>

          <div className="form-group">
            <label>Temperature</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={draft.provider.temperature}
              onChange={(e) => handleProviderChange('temperature', parseFloat(e.target.value))}
            />
            <small>Sampling temperature (0.0 = deterministic, 2.0 = creative)</small>
          </div>

          <div className="form-group">
            <label>Max Tokens</label>
            <input
              type="number"
              step="100"
              min="100"
              max="32000"
              value={draft.provider.max_output_tokens || 4096}
              onChange={(e) => handleProviderChange('max_output_tokens', parseInt(e.target.value))}
            />
            <small>Maximum completion length</small>
          </div>

          <div className="form-group">
            <label>Timeout (seconds)</label>
            <input
              type="number"
              step="5"
              min="10"
              max="300"
              value={draft.provider.timeout || 120}
              onChange={(e) => handleProviderChange('timeout', parseInt(e.target.value))}
            />
            <small>Request timeout in seconds</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>MCP & Response Configuration</h3>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={draft.provider.enable_mcp_tools}
                onChange={(e) => handleProviderChange('enable_mcp_tools', e.target.checked)}
              />
              <span>Enable MCP Tools</span>
            </label>
            <small>Allow LLM to call recall_memory, retrieve_instructions, read_neo4j_cypher</small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={draft.provider.enable_response_schema}
                onChange={(e) => handleProviderChange('enable_response_schema', e.target.checked)}
              />
              <span>Enable Response Schema</span>
            </label>
            <small>Enforce structured JSON output format (requires provider support)</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>MCP Router Configuration</h3>
          
          <div className="form-group">
            <label>Noor MCP Router URL</label>
            <input
              type="text"
              value={draft.mcp.endpoints.find(e => e.label === 'noor-router')?.url || ''}
              onChange={(e) => {
                const newEndpoints = draft.mcp.endpoints.map(ep => 
                  ep.label === 'noor-router' ? { ...ep, url: e.target.value } : ep
                );
                if (!newEndpoints.some(ep => ep.label === 'noor-router')) {
                  newEndpoints.push({ label: 'noor-router', url: e.target.value, allowed_tools: [] });
                }
                setDraft({ ...draft, mcp: { ...draft.mcp, endpoints: newEndpoints } });
              }}
              placeholder="http://127.0.0.1:8201/mcp"
            />
            <small>Staff-facing MCP router (port 8201)</small>
          </div>

          <div className="form-group">
            <label>Maestro MCP Router URL</label>
            <input
              type="text"
              value={draft.mcp.endpoints.find(e => e.label === 'maestro-router')?.url || ''}
              onChange={(e) => {
                const newEndpoints = draft.mcp.endpoints.map(ep => 
                  ep.label === 'maestro-router' ? { ...ep, url: e.target.value } : ep
                );
                if (!newEndpoints.some(ep => ep.label === 'maestro-router')) {
                  newEndpoints.push({ label: 'maestro-router', url: e.target.value, allowed_tools: [] });
                }
                setDraft({ ...draft, mcp: { ...draft.mcp, endpoints: newEndpoints } });
              }}
              placeholder="http://127.0.0.1:8202/mcp"
            />
            <small>Executive-facing MCP router (port 8202)</small>
          </div>
        </div>

        {isDirty && (
          <div className="settings-dirty-indicator">
            <AlertCircle className="icon-sm" />
            <span>You have unsaved changes</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ADMIN SETTINGS PAGE
// ============================================================================
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [draftSettings, setDraftSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  const loadSettings = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!draftSettings) return;
    setError(null);
    setLoading(true);
    try {
      const saved = await saveSettings(draftSettings, token);
      setSettings(saved);
      setDraftSettings(saved);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="observability-page" style={{ padding: '24px' }}>
      <AdminSettingsPanel
        userRole={(user as any)?.role}
        token={token}
        settings={settings}
        draft={draftSettings}
        setDraft={setDraftSettings}
        onReload={loadSettings}
        onSave={handleSave}
        loading={loading}
        error={error}
      />
    </div>
  );
}
