/**
 * Graph Server API Client
 * Consolidated from graphv001/api/
 * Calls backend graph-server on port 3001
 */

const GRAPH_SERVER_URL = process.env.REACT_APP_GRAPH_SERVER_URL || '';

export interface GraphData {
  nodes: any[];
  links: any[];
}

export interface DashboardData {
  dimensions: any[];
  quarters: string[];
}

export interface OutcomesData {
  outcomes: any[];
  quarter: string;
}

/**
 * Fetch graph data for visualization
 */
export async function fetchGraphData(params?: Record<string, string>): Promise<GraphData> {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const response = await fetch(`/api/graph${queryString}`);
  if (!response.ok) throw new Error(`Graph API error: ${response.statusText}`);
  return response.json();
}

/**
 * Fetch Neo4j health status
 */
export async function fetchNeo4jHealth() {
  const response = await fetch('/api/neo4j/health');
  if (!response.ok) throw new Error(`Neo4j health check failed: ${response.statusText}`);
  return response.json();
}

/**
 * Fetch dashboard metrics
 */
export async function fetchDashboardMetrics(quarter?: string): Promise<DashboardData> {
  const params = quarter ? `?quarter=${encodeURIComponent(quarter)}` : '';
  const response = await fetch(`/api/neo4j/dashboard/metrics${params}`);
  if (!response.ok) throw new Error(`Dashboard metrics error: ${response.statusText}`);
  return response.json();
}

/**
 * Fetch outcomes data
 */
export async function fetchOutcomesData(quarter?: string): Promise<OutcomesData> {
  const params = quarter ? `?quarter=${encodeURIComponent(quarter)}` : '';
  const response = await fetch(`/api/dashboard/outcomes${params}`);
  if (!response.ok) throw new Error(`Outcomes data error: ${response.statusText}`);
  return response.json();
}

/**
 * Fetch business chain data
 */
export async function fetchBusinessChain(chainKey: string, params?: Record<string, any>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const response = await fetch(`/api/business-chain/${chainKey}${queryString}`);
  if (!response.ok) throw new Error(`Business chain error: ${response.statusText}`);
  return response.json();
}

/**
 * Fetch available years from Neo4j
 */
export async function fetchAvailableYears(): Promise<number[]> {
  const response = await fetch('/api/neo4j/years');
  if (!response.ok) throw new Error(`Years fetch error: ${response.statusText}`);
  const data = await response.json();
  return data.years || [];
}
