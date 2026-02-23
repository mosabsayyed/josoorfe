import { InterventionPlan } from '../utils/planParser';

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
