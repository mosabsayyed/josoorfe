/**
 * Utility to extract intervention plan JSON from LLM response text.
 * Looks for [PLAN_JSON_START]...[PLAN_JSON_END] blocks.
 */

export interface PlanTask {
  id: string;
  name: string;
  owner: string;
  start_date: string;
  end_date: string;
  depends_on: string[];
}

export interface PlanDeliverable {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  tasks: PlanTask[];
}

export interface RiskAnalysisSnapshot {
  risk_id: string;
  risk_name: string;
  risk_category?: string;
  capability_id: string;
  capability_name: string;
  band: string;
  mode: string;
  selected_strategy: string;
  strategy_description?: string;
  narrative_html?: string;
  people_score?: number;
  process_score?: number;
  tools_score?: number;
  maturity_level?: number;
  target_maturity_level?: number;
  kpi_achievement_pct?: number;
  build_exposure_pct?: number;
  dependency_count?: number;
  build_status?: string;
  execute_status?: string;
  snapshot_date: string;
}

export interface InterventionPlan {
  name: string;
  sponsor: string;
  narrative?: string;
  risk_id?: string;
  capability_id?: string;
  risk_analysis: RiskAnalysisSnapshot;
  deliverables: PlanDeliverable[];
}

export interface ParsedPlanResponse {
  narrative: string;  // HTML narrative (markers stripped)
  plan: InterventionPlan | null;  // Parsed plan or null if extraction failed
}

/**
 * Extract plan JSON block from answer text.
 * Returns the narrative without the plan block and the parsed plan object.
 */
export function parsePlanResponse(answer: string): ParsedPlanResponse {
  if (!answer || typeof answer !== 'string') {
    return { narrative: answer, plan: null };
  }

  const planRegex = /\[PLAN_JSON_START\]\s*(.*?)\s*\[PLAN_JSON_END\]/s;
  const match = answer.match(planRegex);

  if (!match) {
    // No plan block found
    return { narrative: answer, plan: null };
  }

  try {
    // Parse the JSON block
    const planJson = JSON.parse(match[1]);

    // Remove the plan block from the answer
    const cleanNarrative = answer.slice(0, match.index) + answer.slice(match.index! + match[0].length);

    return {
      narrative: cleanNarrative.trim(),
      plan: planJson as InterventionPlan
    };
  } catch (e) {
    // Failed to parse JSON, return original answer as narrative
    console.warn('[parsePlanResponse] Failed to parse plan JSON:', e);

    // Still strip the markers even if JSON is malformed
    const cleanNarrative = answer
      .replace(/\[PLAN_JSON_START\].*?\[PLAN_JSON_END\]/s, '')
      .trim();

    return { narrative: cleanNarrative, plan: null };
  }
}
