import { safeJsonParse } from '../utils/streaming';

const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;

const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
const API_PATH_PREFIX = API_BASE_URL ? '' : '/api/v1';

function buildUrl(endpointPath: string) {
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${API_BASE_URL || ''}${API_PATH_PREFIX}${path}`;
}

export interface ChainResponse {
  chain_key: string;
  id: string;
  year: number;
  count: number;
  results: any[];
  clarification_needed: boolean;
  mode?: 'narrative' | 'diagnostic' | string;
  description?: string;
  summary?: string;
  has_more?: boolean;
  page_size?: number;
  skip?: number;
}

export interface ChainSampleResponse {
  chain_key: string;
  has_sample: boolean;
  id?: string;
  year?: number;
  count?: number;
  summary?: string;
}

// ── Raw chain data cache (shared across all consumers) ──
const _chainCache = new Map<string, { nodes: any[]; relationships: any[] }>();
const _chainPromises = new Map<string, Promise<{ nodes: any[]; relationships: any[] }>>();

/**
 * Fetch a chain with caching. First caller fetches, subsequent callers get cached data.
 * Both enterpriseService and ontologyService should use this instead of direct fetch.
 */
export async function fetchChainCached(chainName: string, year: number = 0, quarter?: string | null): Promise<{ nodes: any[]; relationships: any[] }> {
  const key = `${chainName}:${year}:${quarter || 'all'}`;

  // Return cached data if available
  if (_chainCache.has(key)) {
    console.log(`[ChainCache] HIT: ${chainName} (${_chainCache.get(key)!.nodes.length} nodes)`);
    return _chainCache.get(key)!;
  }

  // Deduplicate in-flight requests
  if (_chainPromises.has(key)) {
    console.log(`[ChainCache] DEDUP: ${chainName} (already in flight)`);
    return _chainPromises.get(key)!;
  }

  const promise = (async () => {
    const quarterParam = quarter ? `&quarter=${encodeURIComponent(quarter)}` : '';
    const url = `/api/v1/chains/${chainName}?year=${year}${quarterParam}`;
    console.log(`[ChainCache] FETCH: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!res.ok) throw new Error(`Chain ${chainName}: HTTP ${res.status}`);

    const data = await res.json();
    const envelope = data.results?.[0] || {};
    const result = {
      nodes: envelope.nodes || [],
      relationships: envelope.relationships || envelope.links || [],
    };

    _chainCache.set(key, result);
    _chainPromises.delete(key);
    console.log(`[ChainCache] STORED: ${chainName} (${result.nodes.length} nodes, ${result.relationships.length} rels)`);
    return result;
  })();

  _chainPromises.set(key, promise);
  return promise;
}

export function invalidateChainCache(): void {
  _chainCache.clear();
  _chainPromises.clear();
}

/** Inject external data into the chain cache (e.g. RiskPlan from direct Cypher) */
export function injectChainCache(chainName: string, data: { nodes: any[]; relationships: any[] }): void {
  const key = `${chainName}:0:all`;
  _chainCache.set(key, data);
  console.log(`[ChainCache] INJECTED: ${chainName} (${data.nodes.length} nodes, ${data.relationships.length} rels)`);
}

class ChainsService {
  private async fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<Response> {
    let response: Response;
    const token = (() => {
      try { return localStorage.getItem('josoor_token'); } catch { return null; }
    })();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      response = await fetch(url, { headers, ...options });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      throw new Error(`Network error when fetching ${url}: ${errMsg}`);
    }

    if (!response.ok) {
      let message = `Server error: ${response.status} ${response.statusText}`;
      try {
        const body = await response.text();
        if (body) {
          const parsed = safeJsonParse(body) || body;
          message = typeof parsed === 'string' ? parsed : (parsed?.detail || parsed?.message || message);
        }
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    return response;
  }

  async executeChain(chainKey: string, id: string, year: number, quarter?: number, analyzeGaps = false): Promise<ChainResponse> {
    const url =
      buildUrl(`/chains/${encodeURIComponent(chainKey)}`) +
      `?id=${encodeURIComponent(id)}&year=${year}` +
      (quarter !== undefined ? `&quarter=${quarter}` : '') +
      `&analyzeGaps=${analyzeGaps ? 'true' : 'false'}`;
    const res = await this.fetchWithErrorHandling(url, { method: 'GET' });
    const data = await res.json();
    return data as ChainResponse;
  }

  async getSample(chainKey: string, probeLimit: number = 10): Promise<ChainSampleResponse> {
    const url = buildUrl(`/chains/sample/${encodeURIComponent(chainKey)}`) + `?probe_limit=${probeLimit}`;
    const res = await this.fetchWithErrorHandling(url, { method: 'GET' });
    const data = await res.json();
    return data as ChainSampleResponse;
  }
}

export const chainsService = new ChainsService();
