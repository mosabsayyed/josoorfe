# JOSOOR Frontend Re-Wiring - Corrected User Requirements

**Version:** 2.0 (Corrected)
**Date:** January 13, 2026
**Source:** User Raw Requirements + SST v1.1 + Screen Mapping

> **CRITICAL OVERRIDE:** Any conflict between this document and previous versions is resolved in favor of this document. The `/chat` application structure and CSS are the **immutable foundation**.

---

## 1. Core Architecture Strategy

### 1.1 The "Stitching" Mandate
- **Host Application:** The existing `/chat` route is the **Container**.
- **Styling Authority:** `theme.css` and `sidebar.css` from `/chat` must be applied globally. All imported components must be stripped of conflicting styles and adopt these variables.
- **Integration Direction:** Components from `/sandbox` and the "New Design" are imported **INTO** the Chat architecture, not the other way around.

### 1.2 Backend & Language
- **Backend URL:** `https://betaBE.aitwintech.com`
- **Status:** Online fully running
- **Languages:** English & Arabic (RTL support required).
- **Themes:** Light & Dark mode (Must enforce compliance on "New Design" components which are currently non-compliant).

---

## 2. Navigation & Layout Structure

### 2.1 Unified Main Page
- **Concept:** A single shell entered after login.
- **Header:**
    - Source: `/sandbox` header (must include Year/Quarter filters).
    - Modification: Add **Profile** (moved from sidebar).
    - Add: **Onboarding (?)** icon.
- **Sidebar:**
    - **Foundation:** Retain `/chat` behavior (Collapse, New Chat, History).
    - **Structure:** Refactor menu items to match "New Design" 5 Desks + Sections.

---

## 3. The 5 Desks (New Design Integration)

### 3.1 Sector Desk
- **Map Component:**
    - Source: "Keep as is" from the new Design. The map will later include real data points (hundreds so its a project on its own) 
    - Note: Major rehaul deferred.
- **Strategic Impact Lenses:**
    - Source: `/josoor-sandbox/executive`
    - **Change:** Use **KPI Gauges** (visual) instead of Cards. Data points remain same
    - **Detailed** graph queries and behaviour in screen mapping
.

### 3.2 Controls Desk
- **Structure:** 4 Signal Ribbons.
- **Data Source:** `screen_mapping.md` -> Graph Queries.
    1. **Steering:** (`setting_strategic_initiatives`)
    2. **Risk BUILD:** (`build_oversight`)
    3. **Risk OPERATE:** (`operate_oversight`)
    4. **Delivery:** (`sustainable_operations`) Note: Refined via screen mapping logic.
    - **Detailed** graph queries and behaviour in screen mapping


### 3.3 Planning Desk (Implied in docs, explicit in screen_mapping)
- **Features:** Intervention Planning, Strategic Reset, Scenario Simulation.
- **Detailed** graph queries and behaviour in screen mapping

### 3.4 Enterprise Desk
- **Features:** Capability Matrix, Gap Analysis, Sector Value Chain visualization.
- **Detailed** graph queries and behaviour in screen mapping


### 3.5 Reporting Desk
- **Features:** AI Insights, PDF Export.
- **Detailed** graph queries and behaviour in screen mapping


---

## 4. Content Sections (Main Area)

> **Constraint:** These must open in the **Main Content Area**, NOT the Side Canvas.

### 4.1 Knowledge Series
- **Source:** "Twin Knowledge" from `/chat`.
- **Content:** Embed YouTube videos (replace missing media files).

### 4.2 Roadmap
- **Source:** Combined "Product Roadmap" + "Plan Your Journey" from `/chat`.
- **Action:** Revamp content.

### 4.3 Graph Explorer
- **Source:** Extract "3D Graph" component from `/chat` (Intelligent Dashboards).
- **Action:** Make independent full-screen section.

### 4.4 Graph Chat
- **Source:** Existing `/chat` functionality.
- **Context:** This is the default "Home" or "Graph Chat" view.

---

## 5. New Functional Modules

### 5.1 Onboarding Tour
- **Trigger:** One-time per user (locked as "seen").
- **Replay:** `?` Icon in header.
- **UX Requirements (To Design):**
    - Usage of fade-out/focus effects.
    - Step-by-step sidebar explanation.
    - **Design QA:** Precise popup location (avoid covering UI), specific text per step.
    - **Text Narrative**: I provided this somewhere so important to use. 

### 5.2 Governance Log System
- **UI:** I prefer it is NOT a section on its own but rather embedded in the narratives of other sections so that it feeds into the context. Specifically,  in Enterprise desk when a capability requires escalation to appear as a popup by clicking on it. And in Controls desk similarly  on a node that has escalation by click and popup.  
- **Panels:** Decisions | State | Escalations.
- **Backend:** New API endpoints + Neo4j `governance_log` schema (ref: `GOVERNANCE_LOG_DESIGN`).

### 5.3 Risk Engine Analysis
- **Modes:** BUILD (Delay Scoring) vs OPERATE (Health/Exposure).
- **Visualization:** Color Bands (Green <35%, Amber 35-65%, Red >65%).
- **Integration:** Feeds the "Controls Desk" ribbons and the Enterprise Desk Risk Exposure.

### 5.4 Trace (Refactor "Explain to Me")
- **Origin:** `/josoor-sandbox/executive` "Explain to me" button.
- **Refactor:** Instead of a popup answer, it triggers a **Chat Thread** with the query (Traceability to Backend Chat API).
- **Where to appear** Sector on Radars. Enterprise Desk per Overlay. In Controls Desk per Signal

### 5.5 Invite System
- **Requirement:** Verify "Request Invite" on Landing Page.
    - If functional -> Test.
    - If placeholder -> Implement code.

---

## 6. Infrastructure & Data

### 6.1 Settings Migration
- **Current:** File-based (`admin_settings.json`).
- **Target:** **Database-based** (Supabase `admin_settings` table).
- **Criticality:** System non-functional without this.

### 6.2 Icons & Assets
- **Icons:** Use provided `zip` folder assets (fix broken `/chat` icons).
- **Animation:** Merge "Cube Animation" with Founders Letter? (User mentioned "merged with the founders letter").

---

## 7. Traceability Matrix (Sample)

| User Req | Feature | Source Component | Action |
| :--- | :--- | :--- | :--- |
| Use /chat CSS | Global Styling | `/chat` | Enforce `theme.css` globally. |
| Sector Desk Lenses | Executive Views | `/sandbox/exec` | Convert Cards -> Gauges. |
| Trace Feature | Explain Button | `/sandbox/exec` | Convert Popup -> Chat Query. |
| Graph Explorer | 3D Graph | `/chat/dashboard` | Extract to standalone. |
