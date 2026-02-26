import { InterventionPlan } from '../utils/planParser';

const MCP_ENDPOINT = '/1/mcp/'; // Noor MCP router (port 8201)

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
  const response = await fetch('/api/neo4j/risk-plan', {
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
  const response = await fetch(`/api/neo4j/risk-plan/${encodeURIComponent(riskId)}`);

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
 * Fetch all saved RiskPlans via REST API.
 * GET /api/neo4j/risk-plans
 */
export async function fetchAllRiskPlans(): Promise<RiskPlanSummary[]> {
  const response = await fetch('/api/neo4j/risk-plans');

  if (!response.ok) {
    console.error('[PlanningService] Failed to fetch risk plans:', response.status);
    return [];
  }

  const text = await response.text();
  if (!text) return [];

  let rows: any[];
  try {
    rows = JSON.parse(text);
  } catch (e) {
    console.error('[PlanningService] JSON parse error:', e);
    return [];
  }

  if (!Array.isArray(rows)) {
    // Handle { plans: [...] } or { data: [...] } wrapper
    rows = (rows as any).plans || (rows as any).data || [];
  }

  return rows.map((row: any) => ({
    riskId: row.riskId || row.risk_id || '',
    riskName: row.riskName || row.risk_name || '',
    planId: row.planId || row.plan_id || row.id || '',
    planName: row.planName || row.plan_name || row.name || '',
    sponsor: row.sponsor || '',
    status: row.status || 'Draft',
    createdAt: row.createdAt || row.created_at || '',
    deliverableCount: row.deliverableCount || row.deliverable_count || 0,
    taskCount: row.taskCount || row.task_count || 0,
  }));
}
