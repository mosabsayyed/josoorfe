import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Zap,
  AlertCircle,
  Clock,
  Cpu,
  Filter,
  RefreshCw,
  ChevronDown,
  Wrench,
  Database,
  TrendingUp,
  Sparkles,
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
  // REQUEST extracted columns
  request_model: string | null;
  request_temperature: number | null;
  request_top_p: number | null;
  request_max_tokens: number | null;
  request_messages_count: number;
  request_has_tools: boolean;
  request_tool_choice: string | null;
  // RESPONSE extracted columns
  response_model: string | null;
  response_stop_reason: string | null;
  response_finish_reason: string | null;
  response_reasoning: string | null;
  response_choices_count: number;
  // TOOL CALLS extracted columns
  tool_calls_count: number;
  tool_names_used: string | null;
  tool_calls_list: any | null;
  // TOKENS (including CACHE - MOST IMPORTANT)
  total_tokens: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cached_tokens: number | null;
  ttft_ms: number | null;
  // Additional extracted columns
  request_system_prompt: string | null;
  request_tools_defined: any | null;
  response_content: string | null;
  // STATUS & ERRORS
  has_error: boolean;
  last_status: string;
  last_latency_ms: number | null;
  messages?: Message[];
}

interface Analytics {
  total_requests: number;
  total_tokens: number;
  total_cached: number;
  cache_hit_rate: number;
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
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState('');
  const [filterPersona, setFilterPersona] = useState('');
  const [filterHasTools, setFilterHasTools] = useState<string>('all'); // 'all' | 'yes' | 'no'
  const [filterStatus, setFilterStatus] = useState('');

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

      // Calculate analytics including CACHE stats (MOST IMPORTANT)
      if (data.traces && data.traces.length > 0) {
        const total_requests = data.traces.length;
        const total_tokens = data.traces.reduce(
          (sum: number, t: TraceRecord) => sum + (t.total_tokens || 0),
          0
        );
        const total_cached = data.traces.reduce(
          (sum: number, t: TraceRecord) => sum + (t.cached_tokens || 0),
          0
        );
        const total_input_tokens = data.traces.reduce(
          (sum: number, t: TraceRecord) => sum + (t.input_tokens || 0),
          0
        );
        const cache_hit_rate = total_input_tokens > 0 
          ? Math.round((total_cached / total_input_tokens) * 100)
          : 0;
        const error_count = data.traces.filter(
          (t: TraceRecord) => t.has_error || t.last_status === 'error'
        ).length;
        const latencies = data.traces
          .map((t: TraceRecord) => t.last_latency_ms || 0)
          .filter(l => l > 0)
          .sort((a, b) => a - b);
        const avg_latency_ms = latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0;
        const p95_idx = Math.floor(latencies.length * 0.95);
        const p95_latency_ms = latencies[p95_idx] || 0;
        const tool_usage_count = data.traces.filter(
          (t: TraceRecord) => t.tool_calls_count > 0
        ).length;

        setAnalytics({
          total_requests,
          total_tokens,
          total_cached,
          cache_hit_rate,
          avg_latency_ms,
          error_count,
          error_rate: total_requests > 0 ? Math.round((error_count / total_requests) * 100) : 0,
          models_used: Array.from(new Set(data.traces.map((t: TraceRecord) => t.request_model || t.model_name).filter(Boolean))),
          tool_usage_count,
          avg_tokens_per_request: total_requests > 0 ? Math.round(total_tokens / total_requests) : 0,
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
    const traceModel = trace.request_model || trace.model_name;
    if (filterModel && traceModel !== filterModel) return false;
    if (filterPersona && trace.persona !== filterPersona) return false;
    const hasTools = (trace.tool_calls_count || 0) > 0;
    if (filterHasTools === 'yes' && !hasTools) return false;
    if (filterHasTools === 'no' && hasTools) return false;
    if (filterStatus && trace.last_status !== filterStatus) return false;
    return true;
  });

  // Get unique values for filters
  const uniqueModels = [...new Set(traces.map((t) => t.request_model || t.model_name).filter(Boolean))].sort();
  const uniquePersonas = [...new Set(traces.map((t) => t.persona).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(traces.map((t) => t.last_status).filter(Boolean))].sort();

  // Handle trace expansion with message loading
  const handleTraceClick = async (trace: TraceRecord) => {
    const isExpanding = expandedTrace !== trace.conversation_id;
    
    if (isExpanding && !trace.messages) {
      try {
        const convId = parseInt(trace.conversation_id);
        const result = await chatService.getConversationMessages(convId);
        setTraces(prev => prev.map(t => 
          t.conversation_id === trace.conversation_id 
            ? { ...t, messages: result.messages }
            : t
        ));
        setExpandedTrace(trace.conversation_id);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setExpandedTrace(trace.conversation_id); // Expand anyway
      }
    } else {
      setExpandedTrace(isExpanding ? trace.conversation_id : null);
    }
  };

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

      {/* Analytics Summary with CACHE as PRIMARY METRIC */}
      {analytics && (
        <div className="obs-analytics-grid">
          {/* CACHE HIT RATE - MOST IMPORTANT */}
          <div className="analytics-card highlight cache-highlight">
            <div className="analytics-icon cache">
              <Database />
            </div>
            <div className="analytics-content">
              <div className="analytics-value cache-metric">{analytics.cache_hit_rate}%</div>
              <div className="analytics-label">Cache Hit Rate</div>
              <div className="analytics-subtext cache-metric">
                {analytics.total_cached.toLocaleString()} tokens cached
              </div>
            </div>
          </div>

          {/* TOTAL CACHED TOKENS */}
          <div className="analytics-card cache-highlight">
            <div className="analytics-icon cache-creation">
              <Sparkles />
            </div>
            <div className="analytics-content">
              <div className="analytics-value cache-metric">{analytics.total_cached.toLocaleString()}</div>
              <div className="analytics-label">Total Cached Tokens</div>
              <div className="analytics-subtext">
                {Math.round((analytics.total_cached / analytics.total_tokens) * 100)}% of total
              </div>
            </div>
          </div>

          {/* TOOL USAGE */}
          <div className="analytics-card">
            <div className="analytics-icon tools">
              <Wrench />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.tool_usage_count}</div>
              <div className="analytics-label">Tool Calls</div>
              <div className="analytics-subtext">
                {Math.round((analytics.tool_usage_count / analytics.total_requests) * 100)}% of requests
              </div>
            </div>
          </div>

          {/* TOTAL REQUESTS */}
          <div className="analytics-card">
            <div className="analytics-icon requests">
              <Zap />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.total_requests}</div>
              <div className="analytics-label">Total Requests</div>
            </div>
          </div>

          {/* TOTAL TOKENS */}
          <div className="analytics-card">
            <div className="analytics-icon tokens">
              <Cpu />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.total_tokens.toLocaleString()}</div>
              <div className="analytics-label">Total Tokens</div>
              <div className="analytics-subtext">Avg: {analytics.avg_tokens_per_request}</div>
            </div>
          </div>

          {/* LATENCY */}
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

          {/* ERROR RATE */}
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

          {/* MODELS USED */}
          <div className="analytics-card">
            <div className="analytics-icon models">
              <TrendingUp />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.models_used.length}</div>
              <div className="analytics-label">Models Used</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="obs-filters">
        <div className="filter-group">
          <Filter className="filter-icon" />
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

          <select
            value={filterHasTools}
            onChange={(e) => setFilterHasTools(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Requests</option>
            <option value="yes">With Tools</option>
            <option value="no">Without Tools</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {(filterModel || filterPersona || filterHasTools !== 'all' || filterStatus) && (
            <button
              onClick={() => {
                setFilterModel('');
                setFilterPersona('');
                setFilterHasTools('all');
                setFilterStatus('');
              }}
              className="btn-clear-filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Trace List */}
      <div className="obs-trace-list">
        <h2>Conversation Traces ({filteredTraces.length})</h2>
        <div className="trace-items" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {filteredTraces.length === 0 ? (
            <div className="trace-empty">
              <p>No traces match the selected filters</p>
            </div>
          ) : (
            filteredTraces.map((trace) => (
              <div 
                key={trace.conversation_id} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--component-panel-bg)',
                  border: '1px solid var(--component-panel-border)',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}
              >
                <div
                  className="trace-card-header"
                  onClick={() => handleTraceClick(trace)}
                >
                  <div className="trace-card-main">
                    <div className="trace-id-badge">#{trace.conversation_id}</div>
                    <div className="trace-time">
                      {trace.created_at ? new Date(trace.created_at).toLocaleString() : 'N/A'}
                    </div>
                    <div className="trace-badges">
                      <span className="badge persona">{trace.persona || 'unknown'}</span>
                      <span className="badge model">{trace.request_model || trace.model_name || 'unknown'}</span>
                      {trace.tool_calls_count > 0 && (
                        <span className="badge tools">
                          <Wrench size={12} /> Tools: {trace.tool_calls_count}
                        </span>
                      )}
                      {trace.cached_tokens && trace.cached_tokens > 0 && (
                        <span className="badge cache-hit">
                          <Database size={12} /> Cache: {trace.cached_tokens.toLocaleString()}
                        </span>
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
                      {trace.total_tokens ? trace.total_tokens.toLocaleString() + ' tokens' : 'N/A'}
                    </span>
                    <ChevronDown
                      className={`expand-icon ${
                        expandedTrace === trace.conversation_id ? 'expanded' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* EXPANDED CONTENT */}
                {expandedTrace === trace.conversation_id && (
                  <div style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--component-bg-secondary)',
                    borderTop: '1px solid var(--component-panel-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {/* REQUEST PARAMS */}
                    <div className="detail-section">
                      <h4>Request Parameters</h4>
                      <div className="detail-grid">
                        <div className="detail-row">
                          <span className="label">Model:</span>
                          <span className="value">{trace.request_model || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Temperature:</span>
                          <span className="value">{trace.request_temperature ?? 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Top P:</span>
                          <span className="value">{trace.request_top_p ?? 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Max Tokens:</span>
                          <span className="value">{trace.request_max_tokens || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Messages Count:</span>
                          <span className="value">{trace.request_messages_count}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Tool Choice:</span>
                          <span className="value">{trace.request_tool_choice || 'auto'}</span>
                        </div>
                      </div>
                    </div>

                    {/* TOKEN USAGE (INCLUDING CACHE) */}
                    <div className="detail-section highlight-section">
                      <h4>Token Usage & Performance (🔥 CACHE METRICS)</h4>
                      <div className="detail-grid">
                        <div className="detail-row">
                          <span className="label">Total Tokens:</span>
                          <span className="value">{trace.total_tokens?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Input Tokens:</span>
                          <span className="value">{trace.input_tokens?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Output Tokens:</span>
                          <span className="value">{trace.output_tokens?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="detail-row highlight cache-row">
                          <span className="label">🔥 Cached Tokens:</span>
                          <span className="value cache-metric">{trace.cached_tokens?.toLocaleString() || '0'}</span>
                        </div>
                        {trace.cached_tokens && trace.cached_tokens > 0 && (
                          <div className="detail-row highlight cache-row">
                            <span className="label">Cache Hit Rate:</span>
                            <span className="value cache-metric">
                              {Math.round((trace.cached_tokens / (trace.input_tokens || 1)) * 100)}%
                            </span>
                          </div>
                        )}
                        {trace.ttft_ms && (
                          <div className="detail-row">
                            <span className="label">Time to First Token (TTFT):</span>
                            <span className="value">{trace.ttft_ms}ms</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="label">Total Latency:</span>
                          <span className="value">{trace.last_latency_ms}ms</span>
                        </div>
                      </div>
                    </div>

                    {/* RESPONSE DETAILS */}
                    <div className="detail-section">
                      <h4>Response Details</h4>
                      <div className="detail-grid">
                        <div className="detail-row">
                          <span className="label">Response Model:</span>
                          <span className="value">{trace.response_model || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Status:</span>
                          <span className={`value status-${trace.last_status}`}>{trace.last_status}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Stop Reason:</span>
                          <span className="value">{trace.response_stop_reason || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Finish Reason:</span>
                          <span className="value">{trace.response_finish_reason || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Choices Count:</span>
                          <span className="value">{trace.response_choices_count}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Latency:</span>
                          <span className="value">{trace.last_latency_ms}ms</span>
                        </div>
                      </div>
                    </div>

                    {/* TOOL CALLS */}
                    {trace.tool_calls_count > 0 && (
                      <div className="detail-section">
                        <h4>Tool Calls</h4>
                        <div className="detail-grid">
                          <div className="detail-row">
                            <span className="label">Tools Count:</span>
                            <span className="value">{trace.tool_calls_count}</span>
                          </div>
                          <div className="detail-row full-width">
                            <span className="label">Tools Used:</span>
                            <span className="value">{trace.tool_names_used || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REASONING (if available) */}
                    {trace.response_reasoning && (
                      <div className="detail-section">
                        <h4>LLM Reasoning</h4>
                        <div className="reasoning-content">
                          {(() => {
                            try {
                              const reasoning = typeof trace.response_reasoning === 'string' 
                                ? JSON.parse(trace.response_reasoning) 
                                : trace.response_reasoning;
                              
                              if (reasoning?.content?.[0]?.text) {
                                return reasoning.content[0].text;
                              }
                              return JSON.stringify(reasoning, null, 2);
                            } catch (e) {
                              return trace.response_reasoning;
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {/* SYSTEM PROMPT (if available) */}
                    {trace.request_system_prompt && (
                      <div className="detail-section">
                        <h4>System Prompt</h4>
                        <div className="code-content">
                          <pre>{trace.request_system_prompt}</pre>
                        </div>
                      </div>
                    )}

                    {/* FULL RESPONSE CONTENT (if available) */}
                    {trace.response_content && (
                      <div className="detail-section">
                        <h4>Full Response Content</h4>
                        <div className="code-content">
                          <pre>{trace.response_content}</pre>
                        </div>
                      </div>
                    )}

                    {/* TOOL DEFINITIONS (if available) */}
                    {trace.request_tools_defined && (
                      <div className="detail-section">
                        <h4>Tool Definitions</h4>
                        <div className="code-content">
                          <pre>{JSON.stringify(trace.request_tools_defined, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {/* TOOL CALLS LIST (if available) */}
                    {trace.tool_calls_list && (
                      <div className="detail-section">
                        <h4>Tool Calls Details</h4>
                        <div className="code-content">
                          <pre>{JSON.stringify(trace.tool_calls_list, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {/* CONVERSATION MESSAGES */}
                    {trace.messages && trace.messages.length > 0 && (
                      <div className="detail-section">
                        <h4>Conversation Messages</h4>
                        <div className="messages-list">
                          {trace.messages.map((msg, idx) => (
                            <div key={msg.id || idx} className={`message-item ${msg.role}`}>
                              <div className="message-header">
                                <span className="message-role">{msg.role}</span>
                                <span className="message-time">
                                  {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                                </span>
                              </div>
                              <div className="message-content">
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
