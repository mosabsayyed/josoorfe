# Risk Agent Integration Plan

## 1. Required Backend Properties (The "Extra" Properties)

To support the UI *as if* the agent ran, the following properties must exist on `EntityRisk` nodes in Neo4j. We will populate a few examples manually.

| Property | Type | Description |
|----------|------|-------------|
| `build_exposure_pct` | Float (0-100) | Normalized delay exposure for BUILD mode |
| `operate_exposure_pct` | Float (0-100) | Normalized health exposure for OPERATE mode |
| `affecting` | String | 'policy_tools' OR 'performance' (Active Mode) |
| `link_threshold_met` | Boolean | True if exposure >= 50% |
| `agent_last_run` | DateTime | Timestamp of calculation |

## 2. UI Elements needed in RiskDesk

### A. Dynamic KPI Cards
Instead of mock data, these cards aggregate the properties above:

1.  **Build Mode Exposure**: Count of risks where `affecting='policy_tools'` AND `link_threshold_met=true`
2.  **Operate Mode Exposure**: Count of risks where `affecting='performance'` AND `link_threshold_met=true`
3.  **Critical Risks**: Count where `(build_exposure_pct > 65 OR operate_exposure_pct > 65)`
4.  **Emerging Threats**: Count where specific persistence flags are raised (from raw properties)

### B. Topology Map Updates
- **Edges**: The map reads the `affecting` property.
    - If `affecting='policy_tools'`, draw edge to `SectorPolicyTool`.
    - If `affecting='performance'`, draw edge to `SectorPerformance`.
- **Styling**: Edge color based on `*_exposure_pct` (Green/Amber/Red).

### C. Deep Dive Panel (Mode-Aware)

**Context Header**: Shows "BUILD MODE" or "OPERATE MODE" based on `affecting` property.

**Content Block**:
- If **BUILD**: Shows `likelihood_of_delay`, `delay_days`, and component breakdown (IT/Roles/Outputs).
- If **OPERATE**: Shows `operational_health_score` and component breakdown (People/Process/Tools).

**AI Action Block (Chat Integration)**:
- "Explain Calculation": Sends prompt to `/chat` explaining the formula.
- "Suggest Mitigation": Sends prompt to `/chat` using the specific component gap (e.g. "IT Systems delay").

## 3. Chat Integration Flow (Click-to-Chat)

When user clicks an "AI Action" button in the Deep Dive panel:

1.  **Construct Payload**:
    ```json
    {
      "risk_id": "risk-123",
      "mode": "BUILD",
      "exposure": 62.5,
      "components": { "it_systems_delay": 90, "role_gaps": 0 },
      "intent": "EXPLAIN_CALCULATION" 
    }
    ```
2.  **Navigate**: Switch view to Chat interface (or open floating chat).
3.  **Injector**: Send a hidden system message or pre-filled prompt to the Chat Agent.
    - *Prompt*: "The user is asking about Risk [ID]. Context: Mode=BUILD, Exposure=62.5%. Please explain how this score was derived from the IT Systems delay of 90 days."

## 4. Execution Steps

1.  **Seed Data**: Update 3-4 specific `EntityRisk` nodes in Neo4j with the "Extra" properties manually.
2.  **Update RiskDesk**: Modify the component to read these properties.
3.  **Implement Chat Trigger**: Add the "Ask AI" button that packages the context and routes to chat.
