# Frontend Canonical Rendering Requirements (SST 6A)

**Source of Truth:** `docs/Enterprise_Ontology_SST_v1.2.md` → **Section 6A only**  
**Scope:** Frontend Sankey rendering and canonical flow text  
**No assumptions / no fallbacks / no mock paths**

## 1) Non‑Negotiables

- **Use Section 6A only** for chain definitions. Ignore 6.B2 or any other docs.
- **Frontend must render exactly the 6A canonical path** (node order + relationship types).
- **Levels are handled by frontend**, not specified in 6A:
  - When the same label appears at multiple levels, the renderer must use `nProps.level` to place nodes in separate columns.
  - Do not invent L1/L2/L3 bridge steps unless they are explicitly in 6A.
- **No inferred links** and **no synthetic paths**. If 6A does not specify a relation, do not render it.
- **If a 6A definition is updated, update canonical rendering to match it**. Do not override 6A with older notes.

## 2) Canonical Chains (Section 6A)

### Chain 1 — Sector Value Chain (`sector_value_chain`)
SectorObjective  
→ REALIZED_VIA → SectorPolicyTool  
→ REFERS_TO → SectorAdminRecord  
→ APPLIED_ON → (SectorCitizen | SectorGovEntity | SectorBusiness)  
→ TRIGGERS_EVENT → SectorDataTransaction  
→ MEASURED_BY → SectorPerformance  
→ AGGREGATES_TO → SectorObjective

### Chain 2 — Setting Strategic Initiatives (`setting_strategic_initiatives`)
SectorObjective  
→ REALIZED_VIA → SectorPolicyTool  
→ SETS_PRIORITIES → EntityCapability  
→ ROLE_GAPS | KNOWLEDGE_GAPS | AUTOMATION_GAPS → (EntityOrgUnit | EntityProcess | EntityITSystem)  
→ GAPS_SCOPE → EntityProject  
→ ADOPTION_RISKS → EntityChangeAdoption

### Chain 3 — Setting Strategic Priorities (`setting_strategic_priorities`)
SectorObjective  
→ CASCADED_VIA → SectorPerformance  
→ SETS_TARGETS → EntityCapability  
→ ROLE_GAPS | KNOWLEDGE_GAPS | AUTOMATION_GAPS → (EntityOrgUnit | EntityProcess | EntityITSystem)

### Chain 4 — Build Oversight (`build_oversight`)
EntityChangeAdoption  
→ INCREASE_ADOPTION → EntityProject  
→ CLOSE_GAPS → (EntityOrgUnit | EntityProcess | EntityITSystem)  
→ ROLE_GAPS → EntityCapability  
→ MONITORED_BY → EntityRisk  
→ INFORMS → SectorPolicyTool  
→ GOVERNED_BY → SectorObjective

### Chain 5 — Operate Oversight (`operate_oversight`)
EntityCapability  
→ MONITORED_BY → EntityRisk  
→ INFORMS → SectorPerformance  
→ AGGREGATES_TO → SectorObjective

### Chain 6 — Sustainable Operations (`sustainable_operations`)
EntityCultureHealth  
→ MONITORS_FOR → EntityOrgUnit  
→ APPLY → EntityProcess  
→ AUTOMATION → EntityITSystem  
→ DEPENDS_ON → EntityVendor

### Chain 7 — Integrated Oversight (`integrated_oversight`)
**TBD** in 6A (do not infer). Only implement when 6A provides explicit labels + relationships.

## 3) Rendering Rules

- **Column order** = 6A path order.
- **Edge filtering** = only edges matching the 6A relationship between adjacent columns.
- **Direction** = always draw left → right to match the 6A sequence (even if raw edge direction is reversed).
- **Grouping**:
  - Operations column groups EntityOrgUnit / EntityProcess / EntityITSystem
  - Stakeholders column groups SectorCitizen / SectorGovEntity / SectorBusiness

## 4) Change Control

- If any chain deviates from 6A in the UI, **fix the mapping first** (no new logic).
- If 6A is changed, **update canonicalPaths and rendering immediately**.
- Any exception must be written into 6A before it is implemented.

