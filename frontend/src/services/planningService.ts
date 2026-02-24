import { InterventionPlan } from '../utils/planParser';

export interface RiskPlanSummary {
  id: string;
  name: string;
  sponsor?: string;
  narrative?: string;
  status?: string;
  riskId?: string;
  createdAt?: string;
  deliverableCount: number;
  taskCount: number;
}

/**
 * Create RiskPlan L1/L2/L3 nodes in Neo4j, attached to the given risk.
 * POST /api/risk-plan
 */
export async function createRiskPlan(riskId: string, plan: InterventionPlan, narrative?: string): Promise<{ planId?: string }> {
  const payload = narrative ? { riskId, plan: { ...plan, narrative } } : { riskId, plan };
  const response = await fetch('/api/neo4j/risk-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
 * Fetch all RiskPlans (summary list).
 * GET /api/neo4j/risk-plans
 */
export async function fetchAllRiskPlans(): Promise<RiskPlanSummary[]> {
  const response = await fetch('/api/neo4j/risk-plans');

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    console.error('[PlanningService] fetchAllRiskPlans failed:', response.status, errText);
    return [];
  }

  const text = await response.text();
  if (!text) return [];

  const data = JSON.parse(text);
  return data.plans || [];
}
