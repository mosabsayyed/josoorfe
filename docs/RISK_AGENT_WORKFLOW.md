# Risk Agent "Left-Right Brain" Workflow

## 1. System Philosophy
To ensure trust in automated risk assessments, the system separates **execution** (math) from **audit** (reasoning).
- **Left Brain (The Engine)**: A deterministic Python script. High speed, strict adherence to formulas, 100% coverage.
- **Right Brain (The Auditor)**: An LLM-based agent. High reasoning, sample-based verification, anomaly detection.

---

## 2. Left Brain: The Risk Engine
**Component**: `RiskAgentService` (Python)
**Source of Truth**: `docs/RISK_LOGIC_SPEC.md`

### Workflow
1.  **Trigger**: Scheduled (nightly) or Event-Driven (data change).
2.  **Fetch**: Pulls all `EntityRisk` nodes and their structural inputs (delays, persistence signals, survey scores).
3.  **Compute**: Applies fixed formulas (section 1.A - 1.D of Spec).
    *   *Example*: `risk_score = max(delay) * max(persistence_factor)`
4.  **Execute**:
    *   SET properties: `build_exposure_pct`, `risk_score`.
    *   MERGE/DELETE relationships: `AFFECTS_POLICY_TOOL`.
5.  **Ledger Generation**:
    *   Saves a **Run Manifest** to the database (JSON blob or specialized table).
    *   *Manifest Schema*:
        ```json
        {
          "run_id": "run-20250109-001",
          "timestamp": "2025-01-09T08:00:00Z",
          "total_processed": 450,
          "summary": { "high": 45, "med": 120, "low": 285 },
          "changes": [
            { "risk_id": "risk-001", "pre_score": 45, "post_score": 82, "status": "ESCALATED" },
            // ... list of all changes
          ]
        }
        ```

---

## 3. Right Brain: The Risk Auditor
**Component**: `RiskAuditorAgent` (LLM/MCP)
**Context**: "You are a Senior Risk Officer auditing an automated system."

### Audit Protocol Overview
The Auditor is triggered immediately after the Engine completes. It performs three mandatory tests.

#### Test A: The "Spot Check" (Integrity)
1.  **Sampling**: Randomly select **10 Risk IDs** from the Ledger's `changes` list.
2.  **Simulation**:
    *   Fetch the *exact same* raw evidence the script used for these 10 items.
    *   Inject the **Logic Spec** (formulas) into the LLM context.
    *   Prompt: *"Given these raw inputs and these formulas, calculate the score step-by-step."*
3.  **Verification**:
    *   Compare LLM result vs. Ledger Script Result.
    *   **Pass**: All 10 match exactly (within rounding tolerance).
    *   **Fail**: Any mismatch triggers a "Logic Divergence Alert."

#### Test B: The "Aggregate Sanity" (Macro Check)
1.  **Query**: Run independent Cypher queries to count High/Med/Low nodes in the DB.
2.  **Compare**: Match DB counts vs. Ledger Summary counts.
    *   *Why?* Ensures the script didn't "hallucinate" updates that failed to commit, or report changes it didn't make.

#### Test C: The "impact Analysis" (Trend)
1.  **Compare**: Top 10 Risks (by score) *Pre-Run* vs. *Post-Run*.
2.  **Reasoning**:
    *   Are new entrants to the Top 10 Explainable?
    *   *Example*: "Risk X jumped to #3. Why? Ah, delay increased by 40 days. Valid."
    *   *Example*: "Risk Y jumped to #1. Why? No data changed. **SUSPICIOUS**."

### Output: The Audit Report
The Analyst generates a final report stored in `RiskAuditLog`.

```markdown
# Audit Report: run-20250109-001
**Status**: ✅ PASSED (or ❌ FAILED)

## 1. Spot Check
- Sampled Risks: [risk-022, risk-104, ...]
- Verification: 10/10 scores match.

## 2. Global State
- Total Risks: 450
- Shifts: 12 risks moved from Amber to Red.
- Consistency: DB counts match Ledger.

## 3. Top Risk Analysis
- New entry in Top 10: `risk-099` (Cybersecurity Gaps).
- Reason: Audit findings uploaded yesterday increased 'Persistence' to 3. VALID.
```

---

## 4. Interaction Workflow (The "Ask")
When a user asks: *"Why is the Compliance Risk red?"*

1.  **User Inquiry**: "Why is...?"
2.  **LLM Retrieval**:
    *   Fetches the **latest Audit Report** (for trust).
    *   Fetches the **Engine Calculation Tree** (for facts).
3.  **Synthesis**:
    *   "The automated system flagged this as Red because the 'Persistence' signal reached level 3 (Recurring Issue). The Auditor validated this calculation on [Date]."

---

## 5. Artifacts to Build
1.  `RiskAgentService.py` (The Engine + Ledger Writer)
2.  `RiskAuditor.py` (The Runner for the 3 Tests)
3.  `prompts/risk_auditor_system.md` (The "Senior Risk Officer" persona & instructions)
