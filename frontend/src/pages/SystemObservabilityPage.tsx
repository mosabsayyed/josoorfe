import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Layers, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import '../pages/ObservabilityPage.css';
import ObservabilityDashboard from './ObservabilityDashboard';

// ============================================================================
// TYPE DEFINITIONS (Copied from ObservabilityPage)
// ============================================================================
interface Trace {
  conversation_id: string;
  created_at: string;
  query?: string;
  persona?: string;
  provider?: string;
  model_name?: string;
  tool_calls_count?: number;
  has_error?: boolean;
  last_status?: string;
}

interface TraceDetail {
  conversation_id: string;
  created_at: string;
  timeline: any[];
  tool_calls: any[];
  reasoning: any[];
  mcp_operations: any[];
  errors: any[];
  raw: any;
}

// Use same pattern as chatService/ObservabilityPage for API base URL (CRA + Vite)
const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;
const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';

// ============================================================================
// TRACE LIST COMPONENT
// ============================================================================
function TraceList({ traces, selectedId, onSelect, onRefresh, loading }: {
  traces: Trace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="trace-list">
      <div className="trace-list-header">
        <h3>
          <Layers className="icon-sm" />
          Conversation Traces ({traces.length})
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-icon"
          title="Refresh traces"
        >
          <RefreshCw className={`icon-sm ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="trace-list-content">
        {traces.map((trace) => (
          <div
            key={trace.conversation_id}
            className={`trace-item ${selectedId === trace.conversation_id ? 'active' : ''}`}
            onClick={() => onSelect(trace.conversation_id)}
          >
            <div className="trace-id">
              {trace.conversation_id.substring(0, 8)}
            </div>
            <div className="trace-meta">
              <span className="trace-time">
                {trace.created_at ? new Date(trace.created_at).toLocaleString() : ''}
              </span>
              {trace.query && (
                <span className="trace-query">{trace.query.substring(0, 50)}...</span>
              )}
            </div>
            {(trace.has_error || trace.last_status === 'error') && (
              <span className="trace-status-error">!</span>
            )}
          </div>
        ))}
        {traces.length === 0 && !loading && (
          <div className="trace-empty">
            <p>No traces found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TRACE DETAIL VIEW COMPONENT
// ============================================================================
function TraceDetailView({ trace, onBack }: { trace: TraceDetail; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('timeline');

  return (
    <div className="trace-detail">
      <div className="trace-detail-header">
        <div>
          <h3>Trace: {trace.conversation_id.substring(0, 12)}</h3>
          <p className="trace-timestamp">{trace.created_at}</p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          Close
        </button>
      </div>

      <div className="trace-tabs">
        <button
          className={`tab-trigger ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline ({trace.timeline?.length || 0})
        </button>
        <button
          className={`tab-trigger ${activeTab === 'reasoning' ? 'active' : ''}`}
          onClick={() => setActiveTab('reasoning')}
        >
          Reasoning ({trace.reasoning?.length || 0})
        </button>
        <button
          className={`tab-trigger ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          Tool Calls ({trace.tool_calls?.length || 0})
        </button>
        <button
          className={`tab-trigger ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          Errors ({trace.errors?.length || 0})
        </button>
        <button
          className={`tab-trigger ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          Raw Data
        </button>
      </div>

      <div className="trace-content">
        {activeTab === 'timeline' && (
          <div className="timeline-panel">
            {trace.timeline?.map((event: any, idx: number) => (
              <div key={idx} className="timeline-event">
                <div className="timeline-timestamp">{event.timestamp}</div>
                <div className="timeline-type">{event.type}</div>
                <pre>{JSON.stringify(event.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'reasoning' && (
          <div className="reasoning-panel">
            {trace.reasoning?.map((item: any, idx: number) => (
              <div key={idx} className="reasoning-item">
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'tools' && (
          <div className="tools-panel">
            <h4>Tool Calls</h4>
            {trace.tool_calls?.map((call: any, idx: number) => (
              <div key={idx} className="tool-call">
                <pre>{JSON.stringify(call, null, 2)}</pre>
              </div>
            ))}
            <h4>MCP Operations</h4>
            {trace.mcp_operations?.map((op: any, idx: number) => (
              <div key={idx} className="mcp-operation">
                <pre>{JSON.stringify(op, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'errors' && (
          <div className="errors-panel">
            {trace.errors?.map((err: any, idx: number) => (
              <div key={idx} className="error-item">
                <pre>{JSON.stringify(err, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'raw' && (
          <div className="raw-panel">
            <pre>{JSON.stringify(trace.raw, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SYSTEM OBSERVABILITY PAGE
// ============================================================================
export default function SystemObservabilityPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<'traces' | 'analytics'>('traces');

  const fetchTraces = useCallback(async () => {
    if (!isLive) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/debug/traces?limit=25`);
      if (!response.ok) throw new Error('Failed to fetch traces');
      const data = await response.json();
      setTraces(data.traces || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (!isLive) setError(err.message);
    } finally {
      if (!isLive) setLoading(false);
    }
  }, [isLive]);

  const fetchTraceDetail = async (conversationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/debug/traces/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch trace detail');
      const data = await response.json();
      setSelectedTrace(data);
      setSelectedId(conversationId);
    } catch (err: any) {
      console.error('Fetch detail error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-polling effect
  useEffect(() => {
    fetchTraces();

    let intervalId: NodeJS.Timeout;
    if (isLive) {
      intervalId = setInterval(() => {
        fetchTraces();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, fetchTraces]);

  return (
    <div className="observability-page" style={{ padding: '24px' }}>
      <div className="observability-header">
        <div>
          <h1>
            <Eye className="icon-lg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            System Observability
          </h1>
          <p className="subtitle">
            Real-time conversation traces, tool calls, and execution diagnostics
          </p>
        </div>
        <div className="observability-controls">
          {activeTab === 'traces' && (
            <label className="live-toggle">
              <input
                type="checkbox"
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
              />
              <span>{isLive ? 'Live' : 'Paused'}</span>
            </label>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="observability-tabs" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--component-panel-border, #374151)'
      }}>
        <button
          onClick={() => setActiveTab('traces')}
          className={`tab-button ${activeTab === 'traces' ? 'active' : ''}`}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'traces' ? 'var(--component-panel-bg, #1F2937)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'traces' ? '2px solid var(--component-text-accent, var(--component-text-accent))' : '2px solid transparent',
            color: activeTab === 'traces' ? 'var(--component-text-accent, var(--component-text-accent))' : 'var(--component-text-secondary, #D1D5DB)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers className="icon-sm" />
          Conversation Traces
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'analytics' ? 'var(--component-panel-bg, #1F2937)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--component-text-accent, var(--component-text-accent))' : '2px solid transparent',
            color: activeTab === 'analytics' ? 'var(--component-text-accent, var(--component-text-accent))' : 'var(--component-text-secondary, #D1D5DB)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Activity className="icon-sm" />
          Analytics & Costs
        </button>
      </div>

      {error && (
        <div className="observability-error">
          <AlertCircle className="icon-md" />
          <p>{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'traces' ? (
        <div className="observability-main">
          {/* Left Panel - Trace List */}
          <TraceList
            traces={traces}
            selectedId={selectedId}
            onSelect={fetchTraceDetail}
            onRefresh={fetchTraces}
            loading={loading}
          />

          {/* Right Panel - Detail View */}
          <div className="detail-panel">
            {selectedTrace ? (
              <TraceDetailView
                trace={selectedTrace}
                onBack={() => {
                  setSelectedTrace(null);
                  setSelectedId(null);
                }}
              />
            ) : (
              <div className="detail-empty">
                <Eye className="detail-empty-icon" />
                <h3>Select a Trace</h3>
                <p>
                  Click on a conversation trace to view its full execution details,
                  <br />
                  including reasoning steps, tool calls, and errors.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ObservabilityDashboard />
      )}
    </div>
  );
}
