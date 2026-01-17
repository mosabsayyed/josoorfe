# 🧠 JOSOOR Cypher Query Specification (v1.4)

## **1. Global Requirements (Apply to ALL Queries)**

### **A. Input Parameters**
*   `$id`: (String or Null) The specific starting node ID. If null, return all valid root nodes for that chain.
*   `$year`: (Integer) The fiscal year. If `0`, do not filter by year.
*   `$quarter`: (Integer or Null) The quarter (1-4). If null, do not filter by quarter.

### **B. Data Robustness (Critical)**
*   **Property Keys**: The database uses inconsistent casing. Always check for both lowercase and uppercase variants:
    *   Year: `coalesce(n.year, n.Year)`
    *   Quarter: `coalesce(n.quarter, n.Quarter)`
*   **Type Safety**: Always cast to `toInteger()` or `toString()` before comparison to handle mixed data types in the graph.
*   **Root Fallback**: If a chain is broken (no relationships found), the query **must still return the root node(s)**. Use `OPTIONAL MATCH` and robust `UNWIND` logic.

### **C. Standard Output Format**
Every query must return exactly these columns for frontend compatibility:
1.  `nId`: Unique ID of the node.
2.  `nLabels`: List of labels.
3.  `nProps`: Map of properties (exclude `embedding` and `embedding_generated_at`).
4.  `rType`: Type of the relationship.
5.  `rProps`: Properties of the relationship.
6.  `sourceId`: ID of the start node of the relationship.
7.  `targetId`: ID of the end node of the relationship.

---

## **2. The Chain Logic Definitions**

### **Chain 1: Sector Value Chain (`sector_value_chain`)**
*   **Root**: `SectorObjective`
*   **Path**: `SectorObjective -> SectorPolicyTool -> SectorAdminRecord -> SectorStakeholder -> SectorDataTransaction -> SectorPerformance`
*   **Narrative Mode**: Return the full linear paths.
*   **Diagnostic Mode**: Segmented visibility. Ensure SPOF (Single Point of Failure) detection on Admin Records.

### **Chain 2: Strategic Initiatives (`setting_strategic_initiatives`)**
*   **Root**: `SectorObjective`
*   **Path**: `SectorObjective -> SectorPolicyTool -> EntityCapability -> Resource Gaps -> EntityProject -> EntityChangeAdoption`
*   **Logic**: Connects objectives to execution. Gaps are nodes with labels `EntityOrgUnit`, `EntityProcess`, or `EntityITSystem`.

### **Chain 3: Strategic Priorities (`setting_strategic_priorities`)**
*   **Root**: `SectorObjective`
*   **Path**: `SectorObjective -> SectorPerformance -> EntityCapability -> Resource Gaps`
*   **Logic**: Performance-driven priorities. Identifies which capability gaps block specific targets.

### **Chain 4: Build Oversight (`build_oversight`)**
*   **Root**: `EntityRisk`
*   **Path**: `SectorPolicyTool -> EntityCapability -> EntityRisk -> SectorPolicyTool`
*   **Logic**: Compliance loop. Ensure risks in building capabilities are informing policy tools.

### **Chain 5: Operate Oversight (`operate_oversight`)**
*   **Root**: `EntityRisk`
*   **Path**: `SectorPerformance -> EntityCapability -> EntityRisk -> SectorPerformance`
*   **Logic**: Performance loop. Monitor how operational risks impact live KPIs.

### **Chain 6: Sustainable Operations (`sustainable_operations`)**
*   **Root**: `EntityProcess`
*   **Path**: `EntityProcess -> EntityITSystem -> EntityVendor`
*   **Logic**: Supply chain visibility. Traces process dependency on technology and external vendors.

### **Chain 7: Integrated Oversight (`integrated_oversight`)**
*   **Root**: `EntityProject`
*   **Path**: `EntityProject -> Gaps -> EntityCapability -> (SectorPolicyTool OR SectorPerformance)`
*   **Logic**: Bottom-up impact. Show how project delays ripple up to strategic objectives.

### **Chain 8: Aggregate View (`aggregate`)**
*   **Logic**: The "Capabilities Bridge". Connect all `SectorObjective` and `SectorPerformance` nodes to `EntityProject` and `EntityRisk` nodes using `EntityCapability` as the central connector (1-2 hops).

---

## **3. Reference Cypher Pattern (For AI Template)**

```cypher
// Use this pattern to ensure root nodes are never lost
MATCH (root:ROOT_LABEL)
WHERE ($year = 0 OR toInteger(coalesce(root.year, root.Year)) = toInteger($year))
  AND ($quarter IS NULL OR toString(coalesce(root.quarter, root.Quarter)) = toString($quarter))
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH path = (root)-[:REL_TYPES*1..5]-(target)
WITH root, path
UNWIND (CASE WHEN path IS NULL THEN [root] ELSE nodes(path) END) AS n
UNWIND (CASE WHEN path IS NULL THEN [null] ELSE relationships(path) END) AS r
WITH DISTINCT n, r
WHERE n IS NOT NULL
RETURN n.id as nId, labels(n) as nLabels,
       apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) as nProps,
       type(r) as rType, apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) as rProps,
       CASE WHEN r IS NOT NULL THEN startNode(r).id ELSE null END as sourceId, 
       CASE WHEN r IS NOT NULL THEN endNode(r).id ELSE null END as targetId
```
