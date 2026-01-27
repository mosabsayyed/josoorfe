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
    Settings as SettingsIcon,
    Plus,
    Save,
    Layers,
    ArrowLeft,
    Brain,
    Code,
    MessageSquare,
    CheckCircle,
    Server,
    Terminal,
    ArrowRight,
    Play,
    Braces
} from 'lucide-react';
import { chatService } from '../../../../services/chatService';
import { useAuth } from '../../../../contexts/AuthContext';
// Settings service imports removed

import './Observability.css';

// ============================================================================
// TYPE DEFINITIONS (from ObservabilityDashboardPage)
// ============================================================================

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
    mcp_operations?: any[];
    tool_calls_detail?: any[];
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

const TOOL_OPTIONS = ['recall_memory', 'retrieve_instructions', 'read_neo4j_cypher'];

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
interface TimelineEvent {
    timestamp: string;
    type: string;
    layer: string;
    data: any;
}

interface TraceDetail {
    conversation_id: string;
    created_at: string;
    timeline: TimelineEvent[];
    tool_calls: any[];
    reasoning: any[];
    mcp_operations: any[];
    errors: any[];
    raw: any;
}

// ============================================================================
// ADMIN SETTINGS PANEL COMPONENT (from AdminSettingsPage)
// ============================================================================
// AdminSettingsPanel removed


// ============================================================================
// MAIN COMPONENT: AdminObservability (Combines Dashboard & Settings)
// ============================================================================
// ============================================================================
// MAIN COMPONENT: AdminObservability (Combines Dashboard & Settings)
// ============================================================================
export default function AdminObservability() {
    const { token, user } = useAuth();

    // COMPACT STYLES & JSON FORMATTING
    const styles = `
    .obs-analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.5rem !important;
        margin-bottom: 0.5rem !important;
    }
    .analytics-card {
        padding: 0.5rem 0.75rem !important;
        min-height: auto !important;
    }
    .analytics-label {
        font-size: 0.65rem !important;
        margin-bottom: 0.1rem !important;
    }
    .analytics-value {
        font-size: 1rem !important;
    }
    .analytics-subtext {
        font-size: 0.6rem !important;
    }
    .obs-filters {
        padding: 0.25rem 0.5rem !important;
        background: rgba(255,255,255,0.03);
        border-radius: 6px;
        margin-bottom: 0.5rem !important;
    }
    .filter-group {
        gap: 0.5rem !important;
    }
    .filter-select {
        height: 28px !important;
        font-size: 0.8rem !important;
        padding: 0 0.5rem !important;
    }
    .btn-clear-filters, .btn-refresh {
        height: 28px !important;
        font-size: 0.8rem !important;
        padding: 0 0.75rem !important;
    }
    
    /* MCP CARD STYLES */
    .mcp-card {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1rem;
        transition: border-color 0.2s;
    }
    .mcp-card:hover {
        border-color: #374151;
    }
    .mcp-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: #1f2937;
        border-bottom: 1px solid #374151;
    }
    .mcp-card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: #e5e7eb;
    }
    .mcp-card-content {
        padding: 1rem;
    }
    .mcp-payload-block {
        margin-bottom: 1rem;
    }
    .mcp-payload-block:last-child {
        margin-bottom: 0;
    }
    .mcp-payload-label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    .mcp-payload-pre {
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        font-size: 0.8rem;
        line-height: 1.5;
        padding: 0.75rem;
        border-radius: 6px;
        overflow-x: auto;
        margin: 0;
        white-space: pre-wrap;
    }
    `;

    // Settings state removed


    // OBSERVABILITY STATE
    const [traces, setTraces] = useState<TraceRecord[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [obsLoading, setObsLoading] = useState(false);
    const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
    const [filterModel, setFilterModel] = useState('');
    const [filterPersona, setFilterPersona] = useState('');
    const [filterHasTools, setFilterHasTools] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState('');

    // SETTINGS STATE
    // Settings state removed



    // ------------------------------------------------------------------------
    // OBSERVABILITY LOGIC
    // ------------------------------------------------------------------------
    const fetchTraces = useCallback(async () => {
        setObsLoading(true);
        try {
            const endpoint = `${API_BASE}/api/v1/debug/traces`;
            const url = new URL(endpoint, window.location.origin);
            url.searchParams.set('limit', '50');

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error('Failed to fetch traces');

            const data = await response.json();
            const newTraces = data.traces || [];

            // MERGE: Preserve extracted details (messages, mcp_operations) to avoid wiping expanded trace data
            setTraces(prev => {
                const prevMap = new Map(prev.map(t => [String(t.conversation_id), t]));

                return newTraces.map((t: TraceRecord) => {
                    const prevTrace = prevMap.get(String(t.conversation_id));
                    return {
                        ...t,
                        // Preserve client-side extracted fields if they exist
                        messages: prevTrace?.messages || t.messages,
                        mcp_operations: prevTrace?.mcp_operations || t.mcp_operations,
                        tool_calls_detail: prevTrace?.tool_calls_detail || t.tool_calls_detail
                    };
                });
            });

            // Calculate analytics including CACHE stats (MOST IMPORTANT)
            if (newTraces.length > 0) {
                const total_requests = newTraces.length;
                const total_tokens = newTraces.reduce(
                    (sum: number, t: TraceRecord) => sum + (t.total_tokens || 0),
                    0
                );
                const total_cached = newTraces.reduce(
                    (sum: number, t: TraceRecord) => sum + (t.cached_tokens || 0),
                    0
                );
                const total_input_tokens = newTraces.reduce(
                    (sum: number, t: TraceRecord) => sum + (t.input_tokens || 0),
                    0
                );
                const cache_hit_rate = total_input_tokens > 0
                    ? Math.round((total_cached / total_input_tokens) * 100)
                    : 0;
                const error_count = newTraces.filter(
                    (t: TraceRecord) => t.has_error || t.last_status === 'error'
                ).length;
                const latencies = newTraces
                    .map((t: TraceRecord) => t.last_latency_ms || 0)
                    .filter((l: number) => l > 0)
                    .sort((a: number, b: number) => a - b);
                const avg_latency_ms = latencies.length > 0
                    ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length)
                    : 0;
                const p95_idx = Math.floor(latencies.length * 0.95);
                const p95_latency_ms = latencies[p95_idx] || 0;
                const tool_usage_count = newTraces.filter(
                    (t: TraceRecord) => t.tool_calls_count > 0 || t.request_has_tools
                ).length;

                setAnalytics({
                    total_requests,
                    total_tokens,
                    total_cached,
                    cache_hit_rate,
                    avg_latency_ms,
                    error_count,
                    error_rate: total_requests > 0 ? Math.round((error_count / total_requests) * 100) : 0,
                    models_used: Array.from(new Set(newTraces.map((t: TraceRecord) => t.request_model || t.model_name).filter(Boolean))) as string[],
                    tool_usage_count,
                    avg_tokens_per_request: total_requests > 0 ? Math.round(total_tokens / total_requests) : 0,
                    p95_latency_ms,
                });
            }
        } catch (error) {
            console.error('Error fetching traces:', error);
        } finally {
            setObsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTraces();
        const interval = setInterval(fetchTraces, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchTraces]);

    // Handle trace expansion with message loading
    const handleTraceClick = async (trace: TraceRecord) => {
        const isExpanding = expandedTrace !== trace.conversation_id;

        if (isExpanding && !trace.messages) {
            try {
                // Fetch full trace detail from DEBUG endpoint (contains timeline/events)
                console.log('[Obs] Fetching detail for trace:', trace.conversation_id);
                const endpoint = `${API_BASE}/api/v1/debug/traces/${trace.conversation_id}`;
                const response = await fetch(endpoint);

                if (!response.ok) {
                    throw new Error('Failed to fetch trace detail');
                }

                const detail: TraceDetail = await response.json();
                console.log('[Obs] Detail fetched:', detail);

                // Map timeline events to chat messages
                const messages = mapTraceDetailToMessages(detail);
                console.log('[Obs] Mapped messages:', messages.length, messages);

                // Extract MCP calls directly from timeline (since root fields are empty)
                console.log('[Obs] Raw Timeline Types:', (detail.timeline || []).map((e: any) => e.type));

                let extractedCalls: any[] = [];

                // 1. Check Nested inside 'llm_call_received' / 'llm_response' (Primary Source)

                // 2. Check Nested inside 'llm_call_received' / 'llm_response'
                const responseEvents = (detail.timeline || [])
                    .filter((e: any) =>
                        e.type === 'llm_call_received' ||
                        e.type === 'llm_response' ||
                        e.type.includes('response') ||
                        e.type === 'agent_state_update' // Sometimes hidden here
                    );

                responseEvents.forEach((evt: any) => {
                    // Try different paths where the output might hide
                    const data = evt.data?.response || evt.data;
                    const output = data?.output || data?.content;

                    if (Array.isArray(output)) {
                        const nestedCalls = output.filter((item: any) =>
                            item.type === 'mcp_call' ||
                            item.type === 'tool_call' ||
                            item.type === 'mcp_list_tools' // Also capture list tools if present
                        );
                        if (nestedCalls.length > 0) {
                            console.log(`[Obs] Found ${nestedCalls.length} nested calls in event ${evt.type}`);
                            extractedCalls = [...extractedCalls, ...nestedCalls];
                        }
                    }
                });

                // DEDUPLICATE: Filter out identical calls (by ID or full content) because timeline may contain redundant events
                const uniqueCalls = Array.from(new Map(extractedCalls.map(item => [item.id || JSON.stringify(item), item])).values());
                console.log(`[Obs] Deduplicated calls: ${extractedCalls.length} -> ${uniqueCalls.length}`);

                const mcpCalls = uniqueCalls.map((e: any) => {
                    // Normalize arguments (handle stringified JSON)
                    let args = e.arguments || e.args || e.input || e.parameters || {};
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch (err) { /* keep as string */ }
                    }

                    // Normalize output/result
                    let result = e.output || e.result || e.content;

                    // Special handling for tool lists
                    if (!result && e.tools) {
                        try {
                            const toolNames = e.tools.map((t: any) => t.name).join(', ');
                            result = `Tools List (${e.tools.length}): ${toolNames}`;
                        } catch (err) { /**/ }
                    }

                    if (typeof result === 'string') {
                        try {
                            // Try parsing once to see if it's a JSON string
                            const parsed = JSON.parse(result);
                            // If it's an array of text objects (standard MCP output), simplify it
                            if (Array.isArray(parsed) && parsed[0]?.text) {
                                result = parsed.map((p: any) => p.text).join('\n');
                            } else {
                                result = parsed;
                            }
                        } catch (err) { /* keep as string */ }
                    }

                    return {
                        server_name: e.server_label || 'unknown',
                        tool_name: e.name || e.tool_name || 'unknown',
                        arguments: args,
                        result: result,
                        is_error: !!e.error || e.status === 'error'
                    };
                });

                console.log('[Obs] Extracted MCP Calls:', mcpCalls);

                setTraces(prev => prev.map(t =>
                    String(t.conversation_id) === String(trace.conversation_id)
                        ? {
                            ...t,
                            messages: messages,
                            // Use our manually extracted list
                            mcp_operations: mcpCalls
                        }
                        : t
                ));
                setExpandedTrace(trace.conversation_id);
            } catch (err) {
                console.error('Failed to fetch messages:', err);
                setExpandedTrace(trace.conversation_id); // Expand anyway to show snapshot
            }
        } else {
            setExpandedTrace(isExpanding ? trace.conversation_id : null);
        }
    };

    // Helper to map debug trace timeline to chat messages
    const mapTraceDetailToMessages = (detail: TraceDetail): Message[] => {
        let messages: Message[] = [];
        console.log('[Obs] Timeline length:', detail.timeline ? detail.timeline.length : 0);

        if (!detail.timeline) {
            console.log('[Obs] No timeline found');
            return messages;
        }

        // Base time for synthetic timestamps (if needed)
        const baseTime = new Date(detail.created_at || new Date().toISOString()).getTime();

        // 1. Get Context from Request (History + Current Prompt)
        let inputMessages: any[] = [];

        // Priority 1: Detailed Request Input (Sent to LLM)
        const sentEvent = detail.timeline.find(e =>
            e.type === 'llm_call_sent' || e.type === 'llm_request' || e.type.includes('request')
        );
        console.log('[Obs] sentEvent found:', !!sentEvent);

        if (sentEvent && sentEvent.data) {
            const req = sentEvent.data.request || sentEvent.data;
            if (req.input && Array.isArray(req.input)) {
                inputMessages = req.input;
            } else if (req.messages && Array.isArray(req.messages)) {
                inputMessages = req.messages;
            }
        }

        // Priority 2: Raw Messages (Fallback if specific event data is missing, e.g. Trace 645)
        if (inputMessages.length === 0 && detail.raw && Array.isArray(detail.raw.messages)) {
            console.log('[Obs] Using raw.messages fallback');
            inputMessages = detail.raw.messages;
        }

        if (inputMessages.length > 0) {
            // Map context, filtering out system Prompt (too large)
            inputMessages.forEach((m: any, idx: number) => {
                if (m.role === 'system') return; // Skip system prompt

                messages.push({
                    id: idx,
                    role: m.role,
                    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                    // Synthetic timestamp: history items appear before the final response
                    created_at: new Date(baseTime - ((inputMessages.length - idx) * 1000)).toISOString()
                });
            });
        } else if (sentEvent && sentEvent.data) {
            // Priority 3: Legacy Prompt field
            const req = sentEvent.data.request || sentEvent.data;
            if (req.prompt) {
                messages.push({
                    id: 0,
                    role: 'user',
                    content: req.prompt,
                    created_at: sentEvent ? sentEvent.timestamp : baseTime.toString()
                });
            }
        }

        // 2. Append Final Response (from this trace)
        const recvEvent = detail.timeline.find(e =>
            e.type === 'llm_call_received' || e.type === 'llm_response' || e.type.includes('response')
        );
        console.log('[Obs] recvEvent found:', !!recvEvent);

        if (recvEvent && recvEvent.data) {
            let content = '';
            let reasoning = '';

            const resData = recvEvent.data.response || recvEvent.data;
            const output = resData.output;
            console.log('[Obs] output array:', output);

            // Structure Verification: output is Array [{type:'reasoning', ...}, {type:'message', ...}]
            if (Array.isArray(output)) {
                const msgItem = output.find((o: any) => o.type === 'message');
                const reasonItem = output.find((o: any) => o.type === 'reasoning');

                if (msgItem && Array.isArray(msgItem.content) && msgItem.content[0]) {
                    content = msgItem.content[0].text || JSON.stringify(msgItem.content[0]);
                }
                if (reasonItem && Array.isArray(reasonItem.content) && reasonItem.content[0]) {
                    reasoning = reasonItem.content[0].text || JSON.stringify(reasonItem.content[0]);
                }
            } else {
                // Fallback for flat structure
                content = resData.content || resData.answer || resData.text || '';
                reasoning = resData.reasoning || '';
            }

            if (content || reasoning) {
                // Check if this response is already in the history (unlikely for new traces)
                // But if it is, we might duplicate. The trace usually contains the *new* response.
                messages.push({
                    id: messages.length + 1,
                    conversation_id: parseInt(detail.conversation_id),
                    role: 'assistant',
                    content: content || '(No content generated)',
                    created_at: recvEvent.timestamp, // Real timestamp of response
                    metadata: {
                        top_reasoning: reasoning
                    }
                } as any);
            }
        }

        return messages;
    };

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

    const uniqueModels = [...new Set(traces.map((t) => t.request_model || t.model_name).filter(Boolean))].sort();
    const uniquePersonas = [...new Set(traces.map((t) => t.persona).filter(Boolean))].sort();
    const uniqueStatuses = [...new Set(traces.map((t) => t.last_status).filter(Boolean))].sort();


    // ------------------------------------------------------------------------
    // SETTINGS LOGIC
    // ------------------------------------------------------------------------
    // Settings logic removed


    // ------------------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------------------
    return (
        <div className="observability-dashboard-page">
            <style>{styles}</style>

            {/* Top Navigation Removed - Title is in Global Header */}

            {/* ================================================================================= */}
            {/* VIEW: SETTINGS */}
            {/* ================================================================================= */}


            {/* ================================================================================= */}
            {/* VIEW: OBSERVABILITY DASHBOARD (Fire Icons & Dropdowns) */}
            {/* ================================================================================= */}

            <>
                {/* Analytics Summary with CACHE as PRIMARY METRIC */}
                {analytics && (
                    <div className="obs-analytics-grid">
                        {/* CACHE HIT RATE - MOST IMPORTANT */}
                        <div className="analytics-card highlight cache-highlight">
                            <div className="analytics-content">
                                <div className="analytics-label cache-metric">Cache Hit Rate</div>
                                <div className="analytics-value cache-metric">
                                    {analytics.cache_hit_rate}% <span className="analytics-subtext">({analytics.total_cached.toLocaleString()} tokens cached)</span>
                                </div>
                            </div>
                        </div>

                        {/* TOTAL CACHED TOKENS */}
                        <div className="analytics-card cache-highlight">
                            <div className="analytics-content">
                                <div className="analytics-label cache-metric">Total Cached Tokens</div>
                                <div className="analytics-value cache-metric">
                                    {analytics.total_cached.toLocaleString()} <span className="analytics-subtext">({Math.round((analytics.total_cached / analytics.total_tokens) * 100)}% of total)</span>
                                </div>
                            </div>
                        </div>

                        {/* TOOL USAGE */}
                        <div className="analytics-card">
                            <div className="analytics-content">
                                <div className="analytics-label">Tool Calls</div>
                                <div className="analytics-value">
                                    {analytics.tool_usage_count} <span className="analytics-subtext">({Math.round((analytics.tool_usage_count / analytics.total_requests) * 100)}% of reqs)</span>
                                </div>
                            </div>
                        </div>

                        {/* TOTAL REQUESTS */}
                        <div className="analytics-card">
                            <div className="analytics-content">
                                <div className="analytics-label">Total Requests</div>
                                <div className="analytics-value">{analytics.total_requests}</div>
                            </div>
                        </div>

                        {/* TOTAL TOKENS */}
                        <div className="analytics-card">
                            <div className="analytics-content">
                                <div className="analytics-label">Total Tokens</div>
                                <div className="analytics-value">
                                    {analytics.total_tokens.toLocaleString()} <span className="analytics-subtext">(Avg: {analytics.avg_tokens_per_request})</span>
                                </div>
                            </div>
                        </div>

                        {/* LATENCY */}
                        <div className="analytics-card">
                            <div className="analytics-content">
                                <div className="analytics-label">Avg Latency</div>
                                <div className="analytics-value">
                                    {analytics.avg_latency_ms}ms <span className="analytics-subtext">(P95: {analytics.p95_latency_ms}ms)</span>
                                </div>
                            </div>
                        </div>

                        {/* ERROR RATE */}
                        <div className="analytics-card">
                            <div className="analytics-content">
                                <div className="analytics-label">Errors</div>
                                <div className="analytics-value">
                                    {analytics.error_count} <span className="analytics-subtext">({analytics.error_rate}%)</span>
                                </div>
                            </div>
                        </div>

                        {/* MODELS USED */}
                        <div className="analytics-card">
                            <div className="analytics-content">
                                <div className="analytics-label">Models Used</div>
                                <div className="analytics-value">{analytics.models_used.length}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Controls */}
                <div className="obs-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="filter-group">
                        <Filter className="filter-icon" />
                        <select
                            value={filterModel}
                            onChange={(e) => setFilterModel(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Models</option>
                            {uniqueModels.map((model) => (
                                <option key={model as string} value={model as string}>
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
                                <option key={status as string} value={status as string}>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--component-text-secondary)' }}>
                            Viewing <strong>{traces.length}</strong> recent traces
                        </div>
                        <button
                            onClick={fetchTraces}
                            disabled={obsLoading}
                            className="btn-refresh"
                            title="Refresh data"
                        >
                            <RefreshCw className={obsLoading ? 'spinning' : ''} />
                            {obsLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
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
                                    className={`trace-card ${expandedTrace === trace.conversation_id ? 'selected' : ''}`}
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

                                                {/* FORCE SHOW CACHE/TOOLS DEBUGGING IF 0 */}
                                                {(trace.tool_calls_count > 0 || trace.request_has_tools) ? (
                                                    <span className="badge tools" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#d8b4fe', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                                        <Terminal size={12} style={{ marginRight: 4 }} />
                                                        Tools: {trace.tool_calls_count}
                                                    </span>
                                                ) : (
                                                    // Debug: Show 0 count just to prove we checked
                                                    <span className="badge tools faded" style={{ opacity: 0.4, fontSize: '0.6rem' }}>
                                                        Target: 0
                                                    </span>
                                                )}

                                                {(trace.cached_tokens && trace.cached_tokens > 0) ? (
                                                    <span className="badge cache-hit" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                                        <Zap size={12} style={{ marginRight: 4 }} />
                                                        Cache: {trace.cached_tokens}
                                                    </span>
                                                ) : (
                                                    // Debug: Show 0 cache just to prove we checked
                                                    <span className="badge cache-hit faded" style={{ opacity: 0.4, fontSize: '0.6rem' }}>
                                                        Cache: {trace.cached_tokens || 0}
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
                                                className={`expand-icon ${expandedTrace === trace.conversation_id ? 'expanded' : ''
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* EXPANDED CONTENT */}
                                    {expandedTrace === trace.conversation_id && (
                                        <div className="trace-card-details">
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

                                            {/* MCP OPERATIONS / TOOL CALLS (Extracted from Timeline) - ALWAYS RENDER */}
                                            {trace.mcp_operations && trace.mcp_operations.length > 0 && (
                                                <div className="detail-section" style={{ marginTop: '2rem' }}>
                                                    <h4 style={{
                                                        color: '#e2e8f0',
                                                        fontWeight: 600,
                                                        marginBottom: '1rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <Terminal size={16} color="#8b5cf6" />
                                                        MCP Tool Operations
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                                                            ({trace.mcp_operations.length})
                                                        </span>
                                                    </h4>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        {trace.mcp_operations.map((op: any, idx: number) => (
                                                            <div key={idx} className="mcp-card">
                                                                {/* Header */}
                                                                <div className="mcp-card-header">
                                                                    <div className="mcp-card-title">
                                                                        <Server size={14} color="#64748b" />
                                                                        <span style={{ color: '#94a3b8' }}>{op.server_name}</span>
                                                                        <ArrowRight size={12} color="#475569" />
                                                                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{op.tool_name}</span>
                                                                    </div>
                                                                    <span className={`badge ${op.is_error ? 'error' : 'success'}`}
                                                                        style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px' }}>
                                                                        {op.is_error ? 'Failed' : 'Success'}
                                                                    </span>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="mcp-card-content">
                                                                    {/* INPUT */}
                                                                    <div className="mcp-payload-block">
                                                                        <div className="mcp-payload-label" style={{ color: '#93c5fd' }}>
                                                                            <Braces size={12} />
                                                                            INPUT PAYLOAD
                                                                        </div>
                                                                        <pre className="mcp-payload-pre" style={{
                                                                            color: '#bfdbfe',
                                                                            background: 'rgba(15, 23, 42, 0.5)',
                                                                            border: '1px solid rgba(147, 197, 253, 0.1)'
                                                                        }}>
                                                                            {typeof op.arguments === 'string' ? op.arguments : JSON.stringify(op.arguments, null, 2)}
                                                                        </pre>
                                                                    </div>

                                                                    {/* OUTPUT */}
                                                                    <div className="mcp-payload-block">
                                                                        <div className="mcp-payload-label" style={{ color: '#86efac' }}>
                                                                            <Terminal size={12} />
                                                                            OUTPUT RESULT
                                                                        </div>
                                                                        <pre className="mcp-payload-pre" style={{
                                                                            color: '#bbf7d0',
                                                                            background: 'rgba(20, 83, 45, 0.1)',
                                                                            border: '1px solid rgba(134, 239, 172, 0.1)'
                                                                        }}>
                                                                            {(() => {
                                                                                if (op.result === undefined || op.result === null) return <span style={{ color: '#64748b' }}>(no output)</span>;
                                                                                const str = typeof op.result === 'string' ? op.result : JSON.stringify(op.result, null, 2);
                                                                                return str.length > 5000 ? str.substring(0, 5000) + '... (truncated)' : str;
                                                                            })()}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}


                                            {/* CONVERSATION MESSAGES / SNAPSHOT */}
                                            {(!trace.messages || trace.messages.length === 0) ? (
                                                /* FALLBACK: NO MESSAGES LOADED, SHOW SNAPSHOT */
                                                (trace.response_content || trace.response_reasoning) && (
                                                    <div className="detail-section">
                                                        <h4>Last Response Snapshot</h4>
                                                        <div className="messages-list">
                                                            {/* Reasoning (if any) */}
                                                            {trace.response_reasoning && (
                                                                <div className="message-item assistant">
                                                                    <div className="message-header">
                                                                        <span className="message-role">assistant (reasoning)</span>
                                                                    </div>
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
                                                            {/* Content (if any) */}
                                                            {trace.response_content && (
                                                                <div className="message-item assistant">
                                                                    <div className="message-header">
                                                                        <span className="message-role">assistant</span>
                                                                    </div>
                                                                    <div className="message-content">
                                                                        {trace.response_content}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                /* FULL CONVERSATION HISTORY */
                                                <div className="detail-section">
                                                    <h4>Conversation History</h4>
                                                    <div className="messages-list">
                                                        {trace.messages.map((msg, idx) => {
                                                            const isLastAssistantMessage = msg.role === 'assistant' && idx === trace.messages!.length - 1;
                                                            return (
                                                                <div key={msg.id || idx} className={`message-item ${msg.role}`}>
                                                                    <div className="message-header">
                                                                        <span className="message-role">{msg.role}</span>
                                                                        <span className="message-time">
                                                                            {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                                                                        </span>
                                                                    </div>

                                                                    {/* INJECT REASONING INTO LAST ASSISTANT MESSAGE */}
                                                                    {isLastAssistantMessage && trace.response_reasoning && (
                                                                        <div className="reasoning-content" style={{ marginBottom: '1rem', borderLeft: '3px solid #8b5cf6' }}>
                                                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Reasoning Process</div>
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
                                                                    )}

                                                                    <div className="message-content">
                                                                        {msg.content}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
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
            </>
        </div>
    );
}
