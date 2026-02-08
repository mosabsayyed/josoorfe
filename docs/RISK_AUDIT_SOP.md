# Risk Audit Standard Operating Procedure (SOP)

**Document ID**: SOP-RISK-AUDIT-001
**Purpose**: Defines the manual verification and analysis protocols for validating automated risk assessments.
**Auditor**: Risk Analyst AI (Right Brain)

---

## Part 1: Logic & Reference Tables

### 1.1 Mode Determination
- **BUILD Mode**: If underlying Capability is `Planned` or `In Progress`.
- **OPERATE Mode**: If underlying Capability is `Active`.

### 1.2 BUILD Mode Formulas
**Goal**: Calculate `Risk Score` (Days) and `Exposure %`.

| Metric | Formula |
|:---|:---|
| **Component Risk (c)** | `max(persistence_factor, delay_days / red_tolerance_days)` |
| **Likelihood** | `Average(Outputs_Risk, Roles_Risk, IT_Risk)` |
| **Expected Delay** | `Likelihood × Max(Component_Delays)` |
| **Exposure %** | `(Expected Delay / Red Tolerance) × 100` |

**Reference Table A: Persistence Factors**
- Level 0: 0.00
- Level 1: 0.50
- Level 2: 0.75
- Level 3: 1.00 (Critical/Issue)

### 1.3 OPERATE Mode Formulas
**Goal**: Calculate `Exposure %` (Inverse of Health).

| Metric | Formula |
|:---|:---|
| **Operational Health** | `Average(People_Score, Process_Score, Tools_Score)` normalized to 0-100 |
| **Exposure %** | `100 - Operational_Health - (Trend_Penalty if applicable)` |

---

## Part 2: The Three Audit Tests

### Test 1: The Integrity Spot Check
**Requirement**: Verify calculation accuracy on a random sample output by the automation script.
**Sample Size**: 10 Risks.

**Procedure**:
1.  Read the **Raw Evidence** provided for the risk (delays, survey scores).
2.  Identify the **Mode** (Build vs. Operate) using Section 1.1.
3.  Manually calculate the score using the formulas in Section 1.2 or 1.3.
4.  Compare your manual result with the script's `Risk Score`.
5.  **Pass Criteria**: Deviation is < 0.1%.

### Test 2: The Aggregate Sanity Check
**Requirement**: Validate the macro-level statistics of the run output against the live database state.

**Procedure**:
1.  Read the **Script Summary** (e.g., "Total processed: 450, High: 45").
2.  Compare with **Database Actuals** (Output of `MATCH (n:EntityRisk) RETURN count(n)`).
3.  **Pass Criteria**: Exact match on Total, High, Medium, Low counts.

### Test 3: The Trend & Impact Analysis
**Requirement**: Analyze the volatility of the highest-risk items and justify changes.
**Scope**: Top 10 Risks by Score (Pre-Run vs. Post-Run).

**Procedure**:
1.  Identify any **New Entrants** to the Top 10 list.
2.  For each new entrant, identify the **Driver** of the change (e.g., "Delay increased from 10 to 45 days").
3.  **Verdict**:
    - **Justified**: Data change dictates the score increase.
    - **Suspicious**: Score increased but data remained static (potential script error).

---

## Part 3: Reporting
The Auditor must produce a structured finding for every run:

```markdown
**Audit Finding**
- **Run ID**: [ID]
- **Test 1 (Integrity)**: [PASS/FAIL] - (Match rate on 10 samples)
- **Test 2 (Aggregates)**: [PASS/FAIL] - (Discrepancy count)
- **Test 3 (Trends)**: [VALID/INVALID] - (Analysis of new Top 10 entrants)
```
