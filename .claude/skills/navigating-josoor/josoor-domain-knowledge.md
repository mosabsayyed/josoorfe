# Josoor Domain Knowledge

## What Is Josoor?

**Josoor** (جسور = "bridges" in Arabic) is a **Transformation Intelligence** platform — an operating system for KSA public sector governance. It bridges the gap between strategy and execution for Saudi Vision 2030 implementation.

**Built by:** AI Twin Tech (aitwintech.com)
**Founder:** Mosab Sayyed
**Target users:** Saudi government decision-makers — vice ministers, strategy directors, PMO managers, sector regulators

**Core value proposition:** Government entities have complex data spread across siloed systems. Josoor creates a "cognitive digital twin" of the governance structure, making relationships between policies, capabilities, risks, and performance visible and actionable.

## Vision 2030 Context

Saudi Vision 2030 is the kingdom's strategic framework for economic diversification and social transformation. It involves dozens of government entities (ministries, authorities, commissions) each implementing programs across sectors like housing, tourism, energy, transport, etc.

**Key challenge Josoor solves:** These entities struggle to:
- Track whether strategic objectives are actually being executed
- See how policy decisions ripple across capabilities, risks, and performance
- Detect gaps before they become crises
- Make data-driven decisions instead of relying on quarterly reports

## The SST Ontology

SST stands for **Strategy-Structure-Technology** — the three pillars of organizational transformation. The ontology is the knowledge graph that models how these three dimensions interconnect.

### Node Types (Neo4j Labels)

| Label | What It Represents | Level |
|---|---|---|
| `SectorPolicyTool` | Policy instruments (IDs 1.0-15.x) and physical assets (IDs ≥16.0) | L1-L2 |
| `SectorObjective` | Strategic objectives | L1 |
| `EntityCapability` | Organizational capabilities (what the entity can do) | L1-L3 |
| `EntityRisk` | Risks that threaten capabilities or performance | L1-L3 |
| `SectorPerformance` | KPIs, metrics, performance targets | L2-L3 |
| `EntityStakeholder` | People/orgs affected by or involved in governance | L2 |
| `EntityTransaction` | Services, interactions with stakeholders | L2-L3 |
| `EntityOrgUnit` | Organizational units (departments, divisions) | L3 |
| `EntityItSystem` | Information systems supporting operations | L3 |
| `EntityProcess` | Business processes | L3 |
| `EntityVendor` | External suppliers/contractors | L3 |
| `EntityProject` | Implementation projects (build mode) | L3 |

### Level Hierarchy (L1 → L2 → L3)

- **L1 (Strategic/Portfolio):** No parent. ID pattern: `X.0` (e.g., "1.0", "6.0")
- **L2 (Tactical/Programmatic):** Has L1 parent. ID pattern: `X.Y` (e.g., "1.1", "6.2")
- **L3 (Operational/Delivery):** Has L2 parent. ID pattern: `X.Y.Z` (e.g., "1.1.1", "6.2.5")

**Hierarchy is encoded via:**
- `parent_id` + `parent_year` fields on child nodes (L2 and L3)
- `level` field: `"L1"` | `"L2"` | `"L3"` (string)

This hierarchy drives the drill-down experience in the UI. Users start at L1 (strategy) and drill into L2 (capabilities) and L3 (operations).

### Key Relationships

| Relationship | Meaning |
|---|---|
| `MONITORED_BY` | A capability is monitored by a risk |
| `CLOSE_GAPS` | A project closes gaps in a capability |
| `DELIVERS` | An org unit delivers a capability |
| `SUPPORTS` | An IT system supports a process |
| `MANAGES` | A stakeholder manages a policy tool |

## What Are "Desks"?

Desks are specialized workspaces within the Josoor shell. Each desk provides a different lens on the same underlying ontology data:

### Sector Desk
**Purpose:** Sector-level oversight. View policy tools, value chains, and strategic health of a sector (e.g., Housing, Tourism, Energy).

**What it shows:**
- Policy tool cards (laws, regulations, programs)
- Sector value chain: Policy → Stakeholders → Transactions → KPIs
- RAG status (Red/Amber/Green) for each chain line
- Gantt chart for implementation timelines
- Geographic map of sector assets

### Enterprise Desk
**Purpose:** Organization-level view. Capability matrix showing what an entity can and can't do.

**What it shows:**
- Capability matrix: L1 → L2 → L3 drill-down
- Maturity assessment per capability
- Gap analysis between current and target state
- Risk overlay on capabilities

### Planning Desk
**Purpose:** Intervention planning. When a gap is identified, plan how to close it.

**What it shows:**
- Scenario modeling
- Resource allocation
- Project portfolio management
- Impact simulation

### Controls Desk
**Purpose:** Risk and compliance oversight.

**What it shows:**
- Build oversight: Are capabilities being built according to policy?
- Operate oversight: Are risks being managed during operations?
- Integrated oversight: Cross-cutting view of all oversight chains

### Reporting Desk
**Purpose:** Executive dashboards and KPI reporting.

## What Are "Business Chains"?

Business chains are pre-defined traversal paths through the knowledge graph. Each chain answers a specific governance question:

| Chain | Question It Answers |
|---|---|
| `sector_value_chain` | "How does policy flow to stakeholder outcomes?" |
| `setting_strategic_initiatives` | "Are strategic objectives being translated into action?" |
| `setting_strategic_priorities` | "Are performance targets driving capability building?" |
| `build_oversight` | "Are capabilities being built in compliance with policy?" |
| `operate_oversight` | "Are operational risks being managed against performance?" |
| `integrated_oversight` | "How do strategic gaps feed back into strategy?" |
| `sustainable_operations` | "Are operations sustainable (process → IT → vendor)?" |

## RAG Status (Red/Amber/Green)

The RAG system provides traffic-light health indicators:

- **Green:** All connections in the chain are intact. No broken links.
- **Amber:** ≤25% of connections are broken. Attention needed.
- **Red:** >25% of connections are broken. Intervention required.
- **Default/Gray:** No data or not applicable.

RAG is computed per "line" in a chain. A line is a path from one layer to the next (e.g., Capability → Risk). If a node exists but has no outgoing relationship to the next layer, that line is "broken."

## What Is Noor?

Noor (نور = "light" in Arabic) is the AI assistant embedded in the platform. It:
- Uses LLM (Groq-hosted models) for natural language interaction
- Accesses the knowledge graph via MCP tools
- Generates artifacts (charts, tables, analysis) rendered in the canvas panel
- Has specialized prompts per desk context (general analysis, risk advisory, strategy brief, intervention planning)

## The Founder Letter

A Rubik's cube 3D experience (`founder.html` / `founder-ar.html`) that tells the Josoor origin story. It's embedded in the landing page via iframe. Available in English and Arabic. The Arabic version should read as if originally written in Arabic (use `arabic-perfection` skill).

## Landing Page Structure

The public landing page (`/landing`) has these sections in order:
1. **Hero** — main tagline and beta signup CTA
2. **AI to IA challenge** — why 50%+ of AI adoptions fail
3. **Innovation approach** — Josoor's methodology
4. **Strategy House** — visual framework (pediment, columns, foundation)
5. **Platform showcase** — screenshots carousel
6. **Mockups** — watch/decide/deliver cycle
7. **Differentiators** — built differently, built here
8. **Beta form** — signup form (writes to Supabase `users_pending`)
9. **Footer** — links, contact
