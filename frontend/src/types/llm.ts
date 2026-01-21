export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMRequest {
    messages: LLMMessage[];
    model: string;
    provider?: string;
    temperature?: number;
    max_output_tokens?: number;
    tools?: any[]; // json schema for tools
}

export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cached_tokens?: number;
}

export interface LLMResponseData {
    text: string;
    usage: TokenUsage;
    provider: string;
    model: string;
    latency_ms: number;
    request_id: string;
    tool_calls?: any[];
}

export interface APIResponse<T> {
    status: 'success' | 'error';
    data?: T;
    error?: {
        type: string;
        message: string;
        details?: any;
    };
}

// Admin Types

// Generic provider types - ALL fields from backend API
export type ProviderConfig = Record<string, any>;
export type ProviderDetail = Record<string, any>;

export interface MetricsSummary {
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cached_tokens: number;
    total_cost: number;
    avg_latency_ms: number;
    error_rate: number;
    p50_latency_ms: number;
    p75_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
}

export interface ABTestConfig {
    enabled: boolean;
    test_name: string;
    primary_provider: string;
    secondary_provider: string;
    traffic_split: Record<string, number>;
    metrics_tracked: string[];
    test_duration: {
        start: string;
        end: string;
    };
}
