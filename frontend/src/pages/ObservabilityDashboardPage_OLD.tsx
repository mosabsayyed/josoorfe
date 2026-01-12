import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Zap,
  AlertCircle,
  TrendingUp,
  Filter,
  RefreshCw,
  ChevronDown,
  Clock,
  Cpu,
  Layers,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import './ObservabilityDashboardPage.css';

interface Message {
  id?: number;
  role: string;
  content: string;
  created_at?: string;
}

interface TraceRecord {
  conversation_id: string;
  created_at: string;
  persona: string;
  provider: string;
  model_name: string;
  request_model: string;
  response_model: string;
  request_temperature: number | null;
  request_has_tools: boolean;
  tool_calls_count: number;
  response_stop_reason: string | null;
  last_status: string;
  last_latency_ms: number;
  last_total_tokens: number;
  has_error: boolean;
  messages?: Message[];
}

interface Analytics {
  total_requests: number;
  total_tokens: number;
  avg_latency_ms: number;
  error_count: number;
  error_rate: number;
  models_used: string[];
  tool_usage_count: number;
  avg_tokens_per_request: number;
  p95_latency_ms: number;
}

const API_BASE = window.location.origin;

export default function ObservabilityDashboardPage() {
  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState('');
  const [filterPersona, setFilterPersona] = useState('');
  const [filterHasTools, setFilterHasTools] = useState<boolean | null>(null);

  // Fetch traces
  const fetchTraces = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/api/v1/debug/traces`);
      url.searchParams.set('limit', '50');
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch traces');
      
      const data = await response.json();
      setTraces(data.traces || []);

      // Calculate analytics
      if (data.traces && data.traces.length > 0) {
        const total_requests = data.traces.length;
        const total_tokens = data.traces.reduce(
          (sum: number, t: TraceRecord) => sum + (t.last_total_tokens || 0),
          0
        );
        const error_count = data.traces.filter(
          (t: TraceRecord) => t.has_error || t.last_status === 'error'
        ).length;
        const latencies = data.traces
          .map((t: TraceRecord) => t.last_latency_ms || 0)
          .sort((a, b) => a - b);
        const avg_latency_ms = Math.round(
          latencies.reduce((a, b) => a + b, 0) / latencies.length
        );
        const p95_idx = Math.floor(latencies.length * 0.95);
        const p95_latency_ms = latencies[p95_idx] || 0;
        const tool_usage_count = data.traces.filter(
          (t: TraceRecord) => t.tool_calls_count > 0
        ).length;

        setAnalytics({
          total_requests,
          total_tokens,
          avg_latency_ms,
          error_count,
          error_rate: Math.round((error_count / total_requests) * 100),
          models_used: Array.from(new Set(data.traces.map((t: TraceRecord) => t.request_model || t.model_name).filter(Boolean))),
          tool_usage_count,
          avg_tokens_per_request: Math.round(total_tokens / total_requests),
          p95_latency_ms,
        });
      }
    } catch (error) {
      console.error('Error fetching traces:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTraces();
    const interval = setInterval(fetchTraces, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchTraces]);

  // Filter traces
  const filteredTraces = traces.filter((trace) => {
    // Use model_name for filtering since request_model is NULL for old data
    const traceModel = trace.request_model || trace.model_name;
    if (filterModel && traceModel !== filterModel) return false;
    if (filterPersona && trace.persona !== filterPersona) return false;
    if (filterHasTools !== null && trace.request_has_tools !== filterHasTools)
      return false;
    return true;
  }).filter(t => t.created_at); // Filter out traces with null created_at

  // Get unique models from either request_model or model_name
  const uniqueModels = [...new Set(traces.map((t) => t.request_model || t.model_name).filter(Boolean))].sort();
  const uniquePersonas = [...new Set(traces.map((t) => t.persona).filter(Boolean))].sort();

  return (
    <div className="observability-dashboard-page">
      {/* Header */}
      <div className="obs-header">
        <div className="obs-header-title">
          <Activity className="icon" />
          <h1>LLM Observability Dashboard</h1>
        </div>
        <button
          onClick={fetchTraces}
          disabled={loading}
          className="btn-refresh"
          title="Refresh data"
        >
          <RefreshCw className={loading ? 'spinning' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="obs-analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon requests">
              <Zap />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.total_requests}</div>
              <div className="analytics-label">Total Requests</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon tokens">
              <Cpu />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.total_tokens.toLocaleString()}</div>
              <div className="analytics-label">Total Tokens</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon latency">
              <Clock />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.avg_latency_ms}ms</div>
              <div className="analytics-label">Avg Latency</div>
              <div className="analytics-subtext">P95: {analytics.p95_latency_ms}ms</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon errors">
              <AlertCircle />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.error_count}</div>
              <div className="analytics-label">Errors</div>
              <div className="analytics-subtext">{analytics.error_rate}% error rate</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon tools">
              <Layers />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.tool_usage_count}</div>
              <div className="analytics-label">Tool Calls</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon trend">
              <TrendingUp />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.avg_tokens_per_request}</div>
              <div className="analytics-label">Avg Tokens/Req</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="obs-filters">
        <div className="filter-group">
          <label>
            <Filter className="icon-sm" />
            Model
          </label>
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="filter-select"
          >
            <option value="">All Models</option>
            {uniqueModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Persona</label>
          <select
            value={filterPersona}
            onChange={(e) => setFilterPersona(e.target.value)}
            className="filter-select"
          >
            <option value="">All Personas</option>
            {uniquePersonas.map((persona) => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filterHasTools === true}
              onChange={(e) =>
                setFilterHasTools(e.target.checked ? true : null)
              }
            />
            With Tools
          </label>
        </div>

        {(filterModel || filterPersona || filterHasTools !== null) && (
          <button
            onClick={() => {
              setFilterModel('');
              setFilterPersona('');
              setFilterHasTools(null);
            }}
            className="filter-clear"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Trace List */}
      <div className="obs-trace-list">
        <h2>Conversation Traces ({filteredTraces.length})</h2>
        <div className="trace-items">
          {filteredTraces.length === 0 ? (
            <div className="trace-empty">
              <p>No traces match the selected filters</p>
            </div>
          ) : (
            filteredTraces.map((trace) => (
              <div 
                key={trace.conversation_id} 
                className={`trace-card ${expandedTrace === trace.conversation_id ? 'expanded' : ''}`}
              >
                <div
                  className="trace-card-header"
                  onClick={async () => {
                    const isExpanding = expandedTrace !== trace.conversation_id;
                    
                    // Fetch messages FIRST if needed
                    if (isExpanding && !trace.messages) {
                      try {
                        const convId = parseInt(trace.conversation_id);
                        const result = await chatService.getConversationMessages(convId);
                        // Update trace with messages AND expand in single update
                        setTraces(prev => prev.map(t => 
                          t.conversation_id === trace.conversation_id 
                            ? { ...t, messages: result.messages }
                            : t
                        ));
                        setExpandedTrace(trace.conversation_id);
                      } catch (err) {
                        console.error('Failed to fetch messages:', err);
                      }
                    } else {
                      // Just toggle expansion
                      setExpandedTrace(isExpanding ? trace.conversation_id : null);
                    }
                  }}
                >
                  <div className="trace-card-main">
                    <div className="trace-id-badge">#{trace.conversation_id}</div>
                    <div className="trace-time">
                      {trace.created_at ? new Date(trace.created_at).toLocaleString() : 'N/A'}
                    </div>
                    <div className="trace-badges">
                      <span className="badge persona">{trace.persona || 'unknown'}</span>
                      <span className="badge model">{trace.request_model || trace.model_name || 'unknown'}</span>
                      {trace.request_has_tools && (
                        <span className="badge tools">Tools: {trace.tool_calls_count || 0}</span>
                      )}
                      {(trace.has_error || trace.last_status === 'error') && (
                        <span className="badge error">Error</span>
                      )}
                    </div>
                  </div>
                  <div className="trace-stats">
                    <span className="stat latency">
                      {trace.last_latency_ms ? trace.last_latency_ms + 'ms' : 'N/A'}
                    </span>
                    <span className="stat tokens">
                      {trace.last_total_tokens ? trace.last_total_tokens.toLocaleString() + ' tokens' : 'N/A'}
                    </span>
                    <ChevronDown
                      className={`expand-icon ${
                        expandedTrace === trace.conversation_id ? 'expanded' : ''
                      }`}
                    />
                  </div>
                </div>

                {expandedTrace === trace.conversation_id && (
                  <div style={{
                    background: '#ff0000',
                    color: '#ffffff',
                    padding: '20px',
                    border: '3px solid yellow',
                    marginTop: '10px',
                    boxSizing: 'border-box'
                  }}>
                    <h1 style={{color: 'white', fontSize: '24px'}}>EXPANDED: {trace.conversation_id}</h1>
                    {/* Metadata Section */}
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--component-panel-border)'}}>
                      <div className="detail-row">
                        <span className="label">Model:</span>
                        <span className="value">{trace.request_model || trace.model_name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Status:</span>
                        <span className={`value status-${trace.last_status}`}>{trace.last_status}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Provider:</span>
                        <span className="value">{trace.provider}</span>
                      </div>
                    </div>

                    {/* Messages Section */}
                    <div>
                      <h3 style={{fontSize: '0.875rem', fontWeight: 600, color: 'var(--component-text-primary)', marginBottom: '0.75rem'}}>Conversation Messages</h3>
                      {!trace.messages ? (
                        <div style={{padding: '1rem', textAlign: 'center', color: 'var(--component-text-secondary)'}}>Loading messages...</div>
                      ) : trace.messages.length === 0 ? (
                        <div style={{padding: '1rem', textAlign: 'center', color: 'var(--component-text-secondary)'}}>No messages found</div>
                      ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                          {trace.messages.map((msg, idx) => (
                            <div key={idx} style={{
                              padding: '0.75rem',
                              background: msg.role === 'user' ? 'var(--component-bg-secondary)' : 'var(--component-panel-bg)',
                              border: '1px solid var(--component-panel-border)',
                              borderRadius: '6px'
                            }}>
                              <div style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--component-text-accent)', marginBottom: '0.5rem'}}>
                                {msg.role.toUpperCase()}
                              </div>
                              <div style={{fontSize: '0.875rem', color: 'var(--component-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
