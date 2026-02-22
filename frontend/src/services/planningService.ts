import { InterventionPlan } from '../utils/planParser';

export async function createRiskPlan(riskId: string, plan: InterventionPlan): Promise<void> {
  console.log('[planningService] createRiskPlan — stubbed', { riskId, plan });
  // TODO: Neo4j MCP or backend API to create RiskPlan L1/L2/L3 nodes
}

export async function fetchRiskPlan(riskId: string): Promise<InterventionPlan | null> {
  console.log('[planningService] fetchRiskPlan — stubbed', { riskId });
  return null;
  // TODO: Fetch existing plan from Neo4j
}
