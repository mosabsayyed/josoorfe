# JOSOOR Frontend Re-Wiring - User Requirements

**Version:** 1.0  
**Date:** January 12, 2026  
**Status:** APPROVED

---

## 1. PROJECT OVERVIEW

Re-wire the JOSOOR Frontend by integrating `/chat`, `/josoor-sandbox`, and new design components from a zip file into a unified coherent system.

**Key Principles:**
- `/chat` CSS is the master authority - all incoming code adopts `/chat` theme.css and sidebar.css
- Backend at `https://betaBE.aitwintech.com`
- Multi-language support (EN/AR with RTL)
- Light/dark theme support

---

## 2. MAIN PAGE REQUIREMENTS

### 2.1 Structure
- Unified main page accessed after login
- Invite-only access from landing page
- Global header with year/quarter filters (from sandbox)
- New design menu sidebar
- Main content area for all sections

### 2.2 Chat Elements (MUST REMAIN)
- New Chat button
- Sidebar collapsing functionality
- Conversation history

### 2.3 Profile Relocation
- Profile moves from bottom-left sidebar to header

---

## 3. DESK REQUIREMENTS

### 3.1 Sector Desk
- Map component (SaudiMap)
- KPI Gauges from new design (copy/paste blocks, change values only)

### 3.2 Controls Desk (4 Signal Ribbons)
| Ribbon | API Chain |
|--------|-----------|
| Steering | `setting_strategic_initiatives` |
| Risk BUILD | `build_oversight` |
| Risk OPERATE | `operate_oversight` |
| Delivery | `sustainable_operations` |

### 3.3 Planning Desk
- Capability matrix
- Gap analysis

### 3.4 Reporting Desk
- AI-generated insights
- PDF export

### 3.5 Enterprise Desk
- Sector value chain visualization

---

## 4. SECTIONS (OPEN IN MAIN AREA)

### 4.1 Knowledge Series
- Opens in main content area (NOT canvas)
- Existing Twin Knowledge content

### 4.2 Roadmap
- Opens in main content area (NOT canvas)
- Combined: Product Roadmap + Plan Your Journey

### 4.3 Graph Explorer
- Opens in main content area (NOT canvas)
- 3D graph visualization

### 4.4 Graph Chat
- Chat interface in main area
- Preserves existing chat functionality

---

## 5. ONBOARDING REQUIREMENTS

### 5.1 Trigger
- One-time activity for new users
- Locked as "seen" after completion
- `?` icon in header for replay

### 5.2 Design Requirements
- Show exactly what fades out
- Show where message box appears
- Define how many steps
- Specify if pages change during tour
- Define text content for each popup
- Popup location must not cover elements being explained

---

## 6. GOVERNANCE LOG SYSTEM

### 6.1 Purpose
- True institutional memory through decision tracking
- State feedback and escalation management
- Automated governance agent (daily run)

### 6.2 Components
- Decision entries (what, why, owner, cascade)
- State entries (execution reports)
- Escalation entries (issues, resolution)

### 6.3 UI
- Governance menu item with badge (open escalation count)
- Panel with tabs: Decisions | State | Escalations

---

## 7. RISK ENGINE INTEGRATION

### 7.1 Modes
- BUILD mode: Expected delay scoring
- OPERATE mode: Health-based exposure

### 7.2 Visualization
- Color-coded bands (Green < 35%, Amber 35-65%, Red > 65%)
- Trend flags for OPERATE mode
- Integration into Controls Desk ribbons

---

## 8. INVITE SYSTEM

### 8.1 Requirements
- Verify if "Request Invite" on landing page is functional or placeholder
- If functional: test it
- If placeholder: code it

---

## 9. BACKEND REQUIREMENTS

### 9.1 Settings Migration
- Migrate from file-based (`admin_settings.json`) to Supabase `admin_settings` table
- System not working without settings

### 9.2 Governance API
- CRUD endpoints for decisions, state, escalations
- Agent run endpoint

### 9.3 Risk Engine API
- Execution trigger endpoint
- Config management endpoint

---

## 10. ICONS

### 10.1 Available Icons (14 total)
- josoor.png
- menu.png
- new.png
- profile.png
- twin.png
- approach.png
- arabic.png
- chat.png
- demo.png
- architecture.png
- icon-article.png
- icon-audio.png
- icon-guide.png
- icon-video.png

---

## 11. REFERENCED DOCUMENTS

- `GOVERNANCE_LOG_DESIGN_1768206485031.md`
- `Enterprise_Ontology_SST_v1_1_1768206798485.md`
- `screen_mapping.md` (from zip)
- `SYSTEM_API_CATALOG.md` (from zip)
