import { ChatRequest, ChatResponse, Conversation, DebugLogs } from '../types/chat';
import { Message } from '../types/api';
import { safeJsonParse } from '../utils/streaming';
import { buildArtifactsFromTags, extractDatasetBlocks } from '../utils/visualizationBuilder';

/**
 * ONE PATH: Process any message payload (new or history) through single extraction pipeline.
 * 
 * CONTRACT:
 * - Backend NEVER extracts datasets (only frontend does)
 * - Datasets arrive escaped in answer text
 * - This function extracts, cleans, and builds artifacts
 * - Returns normalized message ready for display
 */
function processMessagePayload(message: any, existingArtifacts: any[] = []): any {
  // Get raw content (may be JSON string from backend)
  const rawContent = message.content || message.llm_payload?.answer || message.answer || '';

  console.log('[processMessagePayload] Step 1 - rawContent:', rawContent.substring(0, 300));

  // Parse JSON if it's a string
  let parsed: any = {};
  if (typeof rawContent === 'string' && rawContent.trim().startsWith('{')) {
    try {
      parsed = safeJsonParse(rawContent);
      console.log('[processMessagePayload] Step 2 - parsed JSON:', parsed);
    } catch (e) {
      console.warn('[processMessagePayload] Failed to parse JSON, using raw content');
    }
  }

  // Extract answer from parsed payload (or use raw)
  const answer = parsed.answer || rawContent;

  console.log('[processMessagePayload] Step 3 - answer:', answer.substring(0, 300));

  // Extract dataset blocks from answer text
  const { answer: cleanAnswer, datasets } = extractDatasetBlocks(answer);

  console.log('[processMessagePayload] Step 4 - cleanAnswer:', cleanAnswer.substring(0, 300));
  console.log('[processMessagePayload] Step 5 - datasets:', datasets);

  // Build new artifacts from tags
  let newArtifacts: any[] = [];
  if (cleanAnswer && cleanAnswer.includes('<ui-')) {
    newArtifacts = buildArtifactsFromTags(cleanAnswer, datasets);
    console.log('[processMessagePayload] Step 6 - new artifacts:', newArtifacts.map(a => `${a.artifact_type}:${a.title}`));
  } else {
    console.log('[processMessagePayload] Step 6 - NO ui- tags found in cleanAnswer');
    
    // CRITICAL FIX: If datasets exist but no tags, create auto-artifacts
    if (datasets && Object.keys(datasets).length > 0) {
      console.log('[processMessagePayload] Auto-creating artifacts from datasets without tags');
      newArtifacts = Object.entries(datasets).map(([id, dataset]: [string, any]) => ({
        id: dataset.id || id,
        artifact_type: 'chart',
        title: dataset.title || id,
        dataset: dataset,
        metadata: {
          chartType: dataset.type || 'column',
          datasetId: id
        }
      }));
      console.log('[processMessagePayload] Created auto-artifacts:', newArtifacts.map(a => `${a.artifact_type}:${a.title}`));
    }
  }

  // COMPLETE MERGE: Combine embedded artifacts + existing artifacts
  // Avoid duplicates by ID (prefer embedded/new ones)
  const mergedArtifacts = [...newArtifacts];
  const newIds = new Set(newArtifacts.map(a => a.id).filter(Boolean));
  const newTitles = new Set(newArtifacts.map(a => a.title).filter(Boolean));

  if (existingArtifacts && existingArtifacts.length > 0) {
    console.log('[processMessagePayload] Merging with existing artifacts:', existingArtifacts.length);
    for (const existing of existingArtifacts) {
      if (existing.id && newIds.has(existing.id)) continue;
      if (existing.title && newTitles.has(existing.title)) continue;
      mergedArtifacts.push(existing);
    }
  }

  return {
    ...message,
    content: cleanAnswer,
    created_at: message.created_at || message.timestamp || new Date().toISOString(),
    metadata: {
      ...(message.metadata || {}),
      llm_payload: {
        answer: cleanAnswer,
        datasets: datasets,
        artifacts: mergedArtifacts
      }
    }
  };
}

// API base discovery
// - CRA exposes env via process.env.REACT_APP_*
// - Vite exposes env via import.meta.env.VITE_*
// We support both without ever referencing the global `process` identifier directly
// (which would throw in Vite/browser when no polyfill exists).
const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;

// If not set, fall back to relative API paths under /api/v1 so dev setups using
// a proxy or same-origin backend continue working.
const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
const API_PATH_PREFIX = (API_BASE_URL && API_BASE_URL.endsWith('/api/v1')) ? '' : '/api/v1';

function buildUrl(endpointPath: string) {
  // endpointPath should start with '/'
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${API_BASE_URL || ''}${API_PATH_PREFIX}${path}`;
}

class ChatService {
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
      response = await fetch(url, {
        headers,
        ...options,
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      // Throw a clearer error for network-level failures (DNS, CORS, server down, etc.)
      throw new Error(`Network error when fetching ${url}: ${errMsg}`);
    }

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      let errorData: any = undefined;
      try {
        errorData = await response.json();
        // Prefer common fields used by our backend and LLM responses
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData.llm_response) {
          errorMessage = typeof errorData.llm_response === 'string' ? errorData.llm_response : JSON.stringify(errorData.llm_response);
        }
      } catch (e) {
        // Keep original message if parsing fails
      }

      const err = new Error(errorMessage);
      (err as any).body = errorData;
      throw err;
    }

    return response;
  }

  // Artifact format adapter for chart compatibility
  public adaptArtifacts(response: any): any {
    if (response.artifacts) {
      response.artifacts = response.artifacts.map((artifact: any) => {
        const type = String(artifact.artifact_type || artifact.type || '').toLowerCase();
        if (type === 'chart' || type === 'table' || type === 'csv') {
          return this.adaptChartArtifact(artifact);
        }
        // Explicitly preserve HTML artifacts
        if (type === 'html') {
          return {
            ...artifact,
            artifact_type: 'HTML',
            // Ensure content is preserved
            content: artifact.content || artifact.html || artifact.body
          };
        }
        return artifact;
      });
    }
    // Removed dual visualizations handling - now unified to artifacts only
    return response;
  }

  // Helper to parse CSV string into columns and rows
  private parseCsv(csv: string): { columns: string[], rows: any[][] } {
    if (!csv) return { columns: [], rows: [] };

    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { columns: [], rows: [] };

    // Simple CSV parser handling quoted strings
    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          result.push(current.replace(/^"|"$/g, '').trim()); // Remove surrounding quotes
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.replace(/^"|"$/g, '').trim());
      return result;
    };

    const columns = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);
    return { columns, rows };
  }

  private adaptChartArtifact(artifact: any): any {

    const content = artifact.content || {};

    // TRUST THE BACKEND: If config exists, use it.
    // Handle case where config is at root (LLM output) or inside content
    const config = content.config || artifact.config;

    if (config) {
      console.log('[adaptChartArtifact] Has config, using config path');
      // CRITICAL: Preserve the type field from the artifact root if it exists
      // Backend sends visualizations with type at root level: {type: "column", title: "...", config: {...}}
      const chartType = artifact.type || content.chart?.type || content.type || 'bar';
      console.log('[adaptChartArtifact] Extracted chartType:', chartType);

      // Map headers to columns if needed (LLM outputs headers, TableRenderer expects columns)
      if (config.headers && !config.columns) {
        config.columns = config.headers;
      }

      // Determine artifact_type based on chartType
      let artifactType = artifact.artifact_type || 'CHART';
      if (String(chartType).toLowerCase() === 'table') {
        artifactType = 'TABLE';
      } else if (String(chartType).toLowerCase() === 'csv') {
        artifactType = 'TABLE'; // Render CSV as table
      }

      return {
        ...artifact,
        artifact_type: artifactType,
        content: {
          ...content,
          chart: { type: chartType },
          // Ensure config is preserved exactly as is
          config: config
        }
      };
    }

    // Check for direct CSV content or type
    if (artifact.type === 'csv' || content.type === 'csv' || content.csv) {
      const csvContent = content.csv || artifact.content; // Assuming content might be the raw CSV string if type is csv
      if (typeof csvContent === 'string') {
        const { columns, rows } = this.parseCsv(csvContent);
        return {
          ...artifact,
          artifact_type: 'TABLE',
          content: {
            chart: { type: 'table' },
            title: { text: artifact.title || 'CSV Data' },
            columns,
            rows
          }
        };
      }
    }

    // Fallback for legacy/other formats
    console.log('[adaptChartArtifact] No config, using fallback path');
    // Check artifact.type first (from backend visualizations), then content.chart.type, then content.type
    const chartType = artifact.type || content.chart?.type || content.type || 'bar';
    console.log('[adaptChartArtifact] Extracted chartType:', chartType);
    const titleText = content.title?.text || content.chart_title || artifact.title || '';
    const xCategories = content.xAxis?.categories || content.categories || [];
    const yAxis = content.yAxis || (content.y_axis_label ? { title: { text: content.y_axis_label } } : undefined);
    const series = content.series || [];

    // Determine artifact_type based on chartType
    let artifactType = artifact.artifact_type || 'CHART';
    if (String(chartType).toLowerCase() === 'table') {
      artifactType = 'TABLE';
    } else if (String(chartType).toLowerCase() === 'csv') {
      artifactType = 'TABLE';
    }

    const result = {
      ...artifact,
      artifact_type: artifactType,
      content: {
        chart: { type: chartType },
        title: { text: titleText },
        xAxis: { categories: xCategories },
        yAxis: yAxis,
        series,
      }
    };
    console.log('[adaptChartArtifact] Returning:', JSON.stringify(result, null, 2));
    return result;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Backend chat endpoints are namespaced under /chat (e.g. /api/v1/chat/message)
    const response = await this.fetchWithErrorHandling(buildUrl('/chat/message'), {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const data = await response.json();

    // Native pass-through mode: the backend now returns a mandated `llm_payload`
    // block (if available) and the full `raw_response`. Do NOT normalize or
    // remap fields—return the payload as-is so the UI can consume the exact
    // block the LLM produced.
    if (data && data.llm_payload) {
      const out: any = {
        conversation_id: data.conversation_id,
        llm_payload: data.llm_payload,
        raw_response: data.raw_response,
      };

      // ONE PATH: Process message through single extraction pipeline
      try {
        // Capture existing artifacts from backend (payload or global)
        const existingArtifacts = data.llm_payload.artifacts || data.visualizations || data.artifacts || [];

        const processed = processMessagePayload({
          content: out.llm_payload?.answer || '',
          llm_payload: out.llm_payload,
          metadata: {}
        }, existingArtifacts); // Pass existing artifacts

        // Update response with processed data
        out.llm_payload.answer = processed.content;
        out.llm_payload.datasets = processed.metadata.llm_payload.datasets;

        // CRITICAL: Ensure we have a merged list of ALL artifacts (embedded + backend)
        // And adapt them to ensure Recharts compatibility
        const mergedArtifacts = processed.metadata.llm_payload.artifacts;
        const adaptedArtifacts = this.adaptArtifacts({ ...out, artifacts: mergedArtifacts }).artifacts;

        out.llm_payload.artifacts = adaptedArtifacts;
        out.artifacts = adaptedArtifacts; // Populate top-level for safety

      } catch (error) {
        console.error('[chatService] CRITICAL: Message processing failed:', error);
        throw new Error(`Failed to process message payload: ${error}`);
      }

      return out;
    }

    // Fallback: return the whole response untouched
    return data;
  }

  async streamMessage(request: ChatRequest, callbacks: { onChunk: (chunk: string) => void, onComplete: (response: ChatResponse) => void, onError: (error: Error) => void }): Promise<void> {
    try {
      const response = await fetch(buildUrl('/chat/stream'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('josoor_token') || ''}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Streaming failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          callbacks.onChunk(chunk); // Raw chunk for now, might need parsing if SSE
          buffer += chunk;
        }
      }

      const finalResponse: ChatResponse = {
        message: buffer,
        conversation_id: request.conversation_id || 0, // Mock ID if missing
        // ... other fields
      };
      callbacks.onComplete(finalResponse);

    } catch (err) {
      callbacks.onError(err as Error);
    }
  }

  // Accept an optional userId for legacy/demo uses, but do NOT default to 1.
  // In normal operation we do NOT pass user_id: the backend resolves the current
  // user using the Authorization token via the get_current_user dependency.
  // Passing user_id as a query param is a legacy pattern in example scripts; it
  // should not be used for production or normal flows. If `userId` is provided,
  // it will be appended to the query string to preserve compatibility.
  async getConversations(userId?: number, limit: number = 50): Promise<{ conversations: Conversation[] }> {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', `${limit}`);
    if (typeof userId === 'number') {
      queryParams.set('user_id', `${userId}`);
    }
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations?${queryParams.toString()}`)
    );
    return response.json();
  }

  async getConversationMessages(conversationId: number): Promise<{ messages: Message[] }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations/${conversationId}/messages`)
    );
    const data = await response.json();

    // ONE PATH: Process all historical messages through same pipeline as new messages
    if (data.messages && Array.isArray(data.messages)) {
      data.messages = data.messages.map((msg: any) => {
        try {
          // Use the SAME processMessagePayload function for history
          const processed = processMessagePayload(msg);
          return processed;
        } catch (e) {
          console.error('[chatService] CRITICAL: History message processing failed:', e);
          // Return original message if processing fails (graceful degradation)
          return msg;
        }
      });
    }

    return data;
  }

  async getDebugLogs(conversationId: number): Promise<DebugLogs> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/debug_logs/${conversationId}`)
    );
    return response.json();
  }

  async deleteConversation(conversationId: number): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations/${conversationId}`),
      {
        method: 'DELETE',
      }
    );
    return response.json();
  }

  async addConversationMessage(conversationId: number, role: 'user' | 'assistant', content: string, metadata: any = {}): Promise<{ ok: boolean }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations/${conversationId}/messages`),
      {
        method: 'POST',
        body: JSON.stringify({ role, content, metadata }),
      }
    );
    return response.json();
  }

  // NEW METHOD: Generate Strategic Report for Sector Desk
  async generateStrategicReport(scope: 'national' | 'region', scopeId: string, assets: any[]): Promise<string> {
    const prompt = `Analyze the strategic alignment for ${scope} ${scopeId}.
    Context: ${assets.length} assets provided.
    Provide a concise strategic summary in HTML format (<h3>, <p>, <ul>).`;

    // Note: In a real app, we might want to create a specific conversation or use a transient one.
    // For now, we simulate a request.
    const response = await this.sendMessage({
      message: prompt,
      conversation_id: 0, // 0 usually implies new or transient
      metadata: {
        scope,
        scopeId,
        assetCount: assets.length
      }
    });

    return response.llm_payload?.answer || response.message || "Analysis not available.";
  }

  // Helper method to format error messages for display
  formatErrorMessage(error: Error): string {
    if (!error) return 'An unknown error occurred';
    let errorMessage = error.message || 'An unknown error occurred';

    const body = (error as any).body;

    // Use shared safeJsonParse that handles Markdown-wrapped JSON and noisy LLM output
    const tryParseJSON = (value: any) => {
      try {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object') return value;
        if (typeof value !== 'string') return null;
        return safeJsonParse(value);
      } catch (e) {
        return null;
      }
    };

    // Recursively search for a key in an object
    const findKeyRecursive = (obj: any, key: string): any => {
      if (!obj || typeof obj !== 'object') return null;
      if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
      for (const k of Object.keys(obj)) {
        try {
          const res = findKeyRecursive(obj[k], key);
          if (res !== null && res !== undefined) return res;
        } catch (_) {
          // ignore
        }
      }
      return null;
    };

    const pieces: string[] = [];

    // Primary message preference order
    const primaryMsg =
      (body && (body.message || (body.error && body.error.message) || body.detail || body.error || body.llm_response)) ||
      errorMessage;

    if (primaryMsg) {
      if (typeof primaryMsg === 'string') pieces.push(primaryMsg);
      else pieces.push(JSON.stringify(primaryMsg, null, 2));
    }

    // Helper to extract failed_generation from various nested shapes and escaped strings
    const extractFailedGeneration = (source: any) => {
      if (!source) return null;
      if (source.failed_generation) return source.failed_generation;
      if (source.error && source.error.failed_generation) return source.error.failed_generation;
      if (typeof source.message === 'string' && /failed_generation/.test(source.message)) {
        const parsed = tryParseJSON(source.message);
        if (parsed && parsed.failed_generation) return parsed.failed_generation;
      }
      if (typeof source.error === 'string' && /failed_generation/.test(source.error)) {
        const parsed = tryParseJSON(source.error);
        if (parsed && parsed.failed_generation) return parsed.failed_generation;
      }
      const foundDeep = findKeyRecursive(source, 'failed_generation');
      if (foundDeep) return foundDeep;
      return null;
    };

    let failedGen: any = null;
    if (body) {
      failedGen = extractFailedGeneration(body) || null;
    } else {
      const m = (errorMessage || '').match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = tryParseJSON(m[0]);
        if (parsed) failedGen = extractFailedGeneration(parsed) || null;
      }
    }

    if (failedGen) {
      const parsedFG = tryParseJSON(failedGen) || failedGen;

      pieces.push('');
      if (parsedFG && typeof parsedFG === 'object') {
        if (parsedFG.name) pieces.push(`Tool attempted: ${parsedFG.name}`);

        const args = parsedFG.arguments || parsedFG.args || parsedFG.parameters || null;
        if (args) {
          if (args.answer) {
            pieces.push('Answer:');
            pieces.push(typeof args.answer === 'string' ? args.answer : JSON.stringify(args.answer, null, 2));
          }

          if (args.clarification_needed) pieces.push(`Clarification needed: ${Boolean(args.clarification_needed)}`);

          if (Array.isArray(args.questions) && args.questions.length > 0) {
            pieces.push('Questions:');
            args.questions.forEach((q: any, i: number) => pieces.push(`${i + 1}. ${q}`));
          }

          const otherArgs = { ...args };
          delete otherArgs.answer;
          delete otherArgs.clarification_needed;
          delete otherArgs.questions;
          if (Object.keys(otherArgs).length > 0) {
            pieces.push('Tool arguments (additional):');
            pieces.push(JSON.stringify(otherArgs, null, 2));
          }
        } else {
          pieces.push('Failed generation details:');
          pieces.push(JSON.stringify(parsedFG, null, 2));
        }
      } else {
        pieces.push('Failed generation (raw):');
        pieces.push(String(parsedFG));
      }

      return pieces.filter(Boolean).join('\n\n');
    }

    if (body) {
      try {
        if (typeof body === 'string') {
          pieces.push(body);
        } else if (body.detail) {
          pieces.push(typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail, null, 2));
        } else if (body.message) {
          pieces.push(typeof body.message === 'string' ? body.message : JSON.stringify(body.message, null, 2));
        } else if (body.error) {
          pieces.push(typeof body.error === 'string' ? body.error : JSON.stringify(body.error, null, 2));
        } else if (body.llm_response) {
          pieces.push(typeof body.llm_response === 'string' ? body.llm_response : JSON.stringify(body.llm_response, null, 2));
        } else {
          pieces.push(JSON.stringify(body, null, 2));
        }
      } catch (e) {
        // fall back
      }

      return pieces.filter(Boolean).join('\n\n');
    }

    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const errorObj = tryParseJSON(jsonMatch[0]);
        if (errorObj) {
          const final = errorObj.detail || errorObj.message || JSON.stringify(errorObj, null, 2) || errorMessage;
          return final;
        }
      }
    } catch (e) {
      // ignore
    }

    return errorMessage;
  }
}

export const chatService = new ChatService();
