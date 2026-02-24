import { InterventionPlan } from '../utils/planParser';

const MCP_ENDPOINT = '/4/mcp/';

export interface RiskPlanSummary {
  riskId: string;
  riskName: string;
  planId: string;
  planName: string;
  sponsor: string;
  status: string;
  createdAt: string;
  deliverableCount: number;
  taskCount: number;
}

/**
 * Create RiskPlan L1/L2/L3 nodes in Neo4j, attached to the given risk.
 * POST /api/risk-plan
 */
export async function createRiskPlan(riskId: string, plan: InterventionPlan): Promise<{ planId?: string }> {
  const response = await fetch('/api/risk-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ riskId, plan }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to create risk plan: ${response.status} — ${errText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : { planId: 'committed' };
}

/**
 * Fetch an existing RiskPlan for a given risk.
 * GET /api/risk-plan/:riskId
 */
export async function fetchRiskPlan(riskId: string): Promise<InterventionPlan | null> {
  const response = await fetch(`/api/risk-plan/${encodeURIComponent(riskId)}`);

  if (response.status === 404) return null;

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to fetch risk plan: ${response.status} — ${errText}`);
  }

  const text = await response.text();
  if (!text) return null;

  const data = JSON.parse(text);
  return data.plan || null;
}

/**
 * Fetch all saved RiskPlans from Neo4j via MCP Cypher.
 */
export async function fetchAllRiskPlans(): Promise<RiskPlanSummary[]> {
  const query = `
    MATCH (r)-[:HAS_PLAN]->(p:RiskPlan:L1)
    OPTIONAL MATCH (p)-[:HAS_DELIVERABLE]->(d:RiskPlan:L2)
    OPTIONAL MATCH (d)-[:HAS_TASK]->(t:RiskPlan:L3)
    RETURN r.id AS riskId, r.name AS riskName,
           p.id AS planId, p.name AS planName, p.sponsor AS sponsor,
           p.status AS status, toString(p.created_at) AS createdAt,
           count(DISTINCT d) AS deliverableCount,
           count(DISTINCT t) AS taskCount
    ORDER BY p.created_at DESC
  `;

  const requestBody = {
    jsonrpc: '2.0' as const,
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'read_neo4j_cypher',
      arguments: { query }
    }
  };

  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    console.error('[PlanningService] MCP error:', response.status);
    return [];
  }

  const text = await response.text();

  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    // SSE format fallback
    const dataLine = text.split('\n').find(line => line.startsWith('data: '));
    if (!dataLine) return [];
    result = JSON.parse(dataLine.substring(6));
  }

  if (result.error || result.result?.isError) {
    console.error('[PlanningService] Cypher error:', result.error || result.result?.content);
    return [];
  }

  const contentText = result.result?.content?.[0]?.text;
  if (!contentText) return [];

  let rows: any[];
  try {
    rows = JSON.parse(contentText);
  } catch {
    return [];
  }

  if (!Array.isArray(rows)) return [];

  return rows.map(row => ({
    riskId: row.riskId || '',
    riskName: row.riskName || '',
    planId: row.planId || '',
    planName: row.planName || '',
    sponsor: row.sponsor || '',
    status: row.status || 'Draft',
    createdAt: row.createdAt || '',
    deliverableCount: row.deliverableCount || 0,
    taskCount: row.taskCount || 0,
  }));
}
