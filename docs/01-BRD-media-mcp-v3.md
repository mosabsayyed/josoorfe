# Business Requirements Document: media-mcp

**Author:** Mosab / Claude
**Status:** Draft
**Created:** 2026-03-16
**Version:** 3.0

---

## 1. Executive Summary

media-mcp is a standalone MCP (Model Context Protocol) server that provides media generation capabilities to the Josoor platform's AI assistant (Noor). It enables any LLM provider (Groq, Gemini, OpenAI, OpenRouter, etc.) connected through the orchestrator to produce chart images, business visuals, PowerPoint presentations, and Word documents — without any provider-specific integration.

The server operates as an **execution layer only** — it generates files from structured specifications. All content decisions, story structuring, and user alignment happen in the LLM conversation layer before any file is produced.

---

## 2. Problem Statement

**Current State:**
- Charts are rendered client-side using Highcharts via `<ui-chart>` tags. The frontend has a complex pipeline: `extractDatasetBlocks()` → `buildArtifactsFromTags()` → `adaptArtifacts()` → Highcharts renderer. Different LLMs produce inconsistent chart data formats, leading to rendering failures.
- The platform cannot produce downloadable deliverables (PowerPoint, Word) from reports.
- Business visuals (diagrams, infographics, org charts) cannot be generated.
- The "Download" button in the canvas only exports raw HTML (DOM clone → .html file) — not professional documents.

**Impact:**
- Users (senior government leaders) expect presentation-ready deliverables, not HTML pages.
- Chart rendering inconsistencies waste LLM tokens on data format corrections.
- No visual generation capability limits the richness of AI-produced content.

**Goal:**
- Enable consistent, server-rendered chart images that work with any LLM.
- Enable AI-generated business visuals for professional contexts.
- Enable conversion of on-screen reports to PowerPoint and Word documents.
- All capabilities accessible via MCP tools — provider-independent.

---

## 3. Core Principles

### 3.1 Content-First, File-Second (MANDATORY)

Content creation and file creation are two completely separate phases.

- The LLM must NEVER produce a file (PPT/DOCX) as the first step.
- The LLM must first understand what the user is trying to communicate, build the content as an on-screen HTML report, let the user review and iterate, and only after explicit user confirmation proceed to file creation.
- If a user requests "make me a PPT about X", the LLM must redirect: build the content as a report first, show it on screen, get confirmation, then convert.
- The file is just packaging. The content is the work.

### 3.2 Provider Independence

- All media generation capabilities are exposed as MCP tools.
- Any LLM routed through the orchestrator automatically gets these tools.
- No LLM-specific code or integration required.

### 3.3 Accuracy Over Imagery

- Text blocks and data tables must NEVER be rendered as images. They must always be structured data (native PPTX/DOCX elements).
- Charts are rendered as images because they are visual representations of data — but the underlying data must remain in the structured spec.
- Business visuals are for concepts that cannot be expressed as data.

### 3.4 Business Context Only

- Image generation is restricted to business-relevant categories.
- The system must prevent recreational or off-topic image generation.
- Every generated visual must serve a business communication purpose.

---

## 4. Architecture

### 4.1 Deployment

- **Server name:** media-mcp
- **Port:** 8203
- **Caddy route:** `/3/mcp/` → `127.0.0.1:8203` (slot already reserved in Caddy)
- **Framework:** FastMCP (Python), stateless HTTP transport
- **Systemd service:** `josoor-router-media.service`
- **Own venv:** `.venv-media/` with: `python-pptx`, `python-docx`, `matplotlib`, image API client, `fastmcp`
- **Own config YAML:** `media_router_config.yaml`
- **Supabase Storage bucket:** `"media"` (separate from `"uploads"`)

### 4.2 System Diagram

```
┌─────────────────────────────────────────────────┐
│  Orchestrator (orchestrator_universal.py)        │
│  connects to TWO MCP servers per request:        │
│                                                  │
│  ┌──────────────┐     ┌───────────────┐          │
│  │ Noor Router  │     │  media-mcp    │          │
│  │ /1/mcp/      │     │  /3/mcp/      │          │
│  │ port 8201    │     │  port 8203    │          │
│  │ 12 tools     │     │  4 tools      │          │
│  │ (knowledge)  │     │ (file gen)    │          │
│  └──────────────┘     └──────┬────────┘          │
│                              │                   │
│                     ┌────────▼────────┐          │
│                     │ Supabase Storage│          │
│                     │ bucket: "media" │          │
│                     └─────────────────┘          │
└─────────────────────────────────────────────────┘
```

### 4.3 Orchestrator Change

The orchestrator must connect to both Noor Router + media-mcp. The LLM sees all 16 tools (12 knowledge + 4 media) in one session. The MCPConfig in admin settings gets a new endpoint entry for media-mcp.

---

## 5. Features — The 4 Tools

### 5.1 Tool: `generate_chart_image`

**Replaces** the current `<ui-chart>` tag system entirely. This is the ONLY chart rendering path — there is NO fallback to client-side `<ui-chart>` tags or Highcharts. The LLM calls this tool, gets back a URL, and embeds it as `<img src="url">` in its HTML answer. Frontend renders a plain image — no Highcharts, no tag parsing, no `buildArtifactsFromTags()`.

**Parameters:**
```
chart_type: "bar" | "column" | "line" | "area" | "pie" | "donut" | "radar" | "scatter" | "combo" | "waterfall" | "treemap"
title: string
data: { categories: [...], series: [{ name, data, color? }] }
options: { subtitle?, legend?, axis_labels?, stacked?, locale: "en"|"ar" }
width: int (px, default 800)
height: int (px, default 500)
```

**Returns:**
```
{ url: "https://...supabase.../media/chart_xxx.png", file_id: "..." }
```

**Rendering engine:** Matplotlib (or Plotly with Kaleido for fast PNG export).

**Constraints:**
- Must support Arabic text in axis labels and legends (RTL)
- Must match Josoor theme colors
- Maximum render time: 3 seconds per chart

---

### 5.2 Tool: `generate_image`

**Business visual generation** via image service (NanoBanana or similar).

**Parameters:**
```
category: "icon" | "conceptual_diagram" | "infographic" | "org_structure" | "process_flow" | "comparison" | "timeline" | "matrix" | "framework" | "architecture" | "roadmap" | "value_chain" | "cover" | "icon_set"
description: string (what the image should depict)
style: "corporate" | "flat" | "isometric" (default: "corporate")
locale: "en" | "ar"
width: int (default 1024)
height: int (default 768)
```

**Returns:**
```
{ url: "https://...supabase.../media/img_xxx.png", file_id: "..." }
```

**Category is enforced** — the tool rejects requests not matching a business category. No "draw me a cat."

#### Allowed Categories

| Category | Use for | Examples |
|----------|---------|----------|
| `icon` | Department/capability icons for slides | Pillar icons, domain icons |
| `icon_set` | Sets of thematic icons for slides | Strategy pillars icons, capability domain icons |
| `conceptual_diagram` | Frameworks, maturity models, transformation roadmaps | Digital transformation journey |
| `infographic` | Visual summaries of strategies/initiatives (non-tabular) | KPI dashboard visual |
| `org_structure` | Hierarchies, reporting lines | Division structure, governance model |
| `process_flow` | Workflows, decision trees, RACI-style visuals | Approval workflow, service delivery |
| `comparison` | Before/after, current vs target state, option comparison | Scenario comparison |
| `timeline` | Project milestones, roadmap visuals | 3-year transformation roadmap |
| `matrix` | Priority matrices, risk heat maps, quadrant diagrams | BCG matrix, SWOT |
| `framework` | Named frameworks, models | Balanced scorecard, Porter's 5 forces |
| `architecture` | System/technical/enterprise architecture | Solution architecture diagram |
| `roadmap` | Phased plans, milestones | Implementation phases |
| `value_chain` | Value flows, supply chains, impact paths | Stakeholder ecosystem |
| `cover` | Title slides, report covers, section dividers | Presentation cover image |

#### Guardrails (Server-Enforced)

1. **Category is required** — requests without a valid category are rejected with an error.
2. **Business context prefix** — every prompt sent to the image API is prefixed with: "Professional business diagram for a government strategy platform. Clean, minimal corporate style. No people, no photographs, no text overlays."
3. **Blocklist** — the server checks the description against blocked terms (entertainment, personal, memes, jokes, social media, selfie, fun, game, cartoon, anime, celebrity, etc.) and returns an error explaining the restriction. Blocklist matching uses whole-word matching (not substring). Words are tokenized by splitting on whitespace and punctuation. 'function' does NOT match 'fun'. 'game-changer' DOES match 'game'. This prevents false positives on legitimate business terms while catching blocked words used as standalone terms or hyphenated compounds.
4. **Audit log** — every generation request is logged with: user_id, category, description, result URL, timestamp. Audit logging applies to ALL tools (generate_chart_image, generate_image, generate_pptx, generate_docx, save_spec), not just generate_image. Every tool call is logged with: user_id, tool_name, key parameters, result URL (or null on failure), status (success/blocked/error), timestamp.

#### What is Explicitly Excluded

- Photographs or realistic images of people
- Decorative art or creative illustrations unrelated to business
- Memes, jokes, entertainment content
- Marketing materials with baked-in text overlays
- Data tables as images (always use structured TABLE elements)
- Charts as images (always use `generate_chart_image`)

---

### 5.3 Tool: `generate_pptx`

**Creates a PowerPoint file** from a structured spec.

**Critical: This is an assembly tool, not a content creation tool.** Content must already exist and be confirmed on-screen before this tool is called.

**Parameters:**
```
title: string
locale: "en" | "ar"
spec_url: string (optional — Supabase URL to a previously saved spec; if omitted, slides array is used directly)
slides: [
  {
    layout: "title" | "section_divider" | "content_visual" | "content_text" | "comparison" | "data_highlight" | "closing" | "chart_left" | "chart_full" | "chart_text" | "table_full" | "visual_text" | "visual_full" | "two_column" | "bullets_icon" | "process_flow" | "timeline" | "matrix" | "key_message",
    title: string,
    elements: [
      { type: "heading", text: "...", position: "top_left" },
      { type: "bullets", items: ["..."], position: "left_half" },
      { type: "image", url: "https://...", position: "right_half", caption: "..." },
      { type: "table", headers: [...], rows: [...], position: "center" },
      { type: "chart_image", url: "https://...", position: "full_width" },
      { type: "callout", text: "key number", highlight: "42%", position: "top_right" },
      { type: "arrow_flow", steps: ["A", "B", "C"], position: "bottom" },
      { type: "separator", position: "mid_horizontal" },
      { type: "footnote", text: "Source: ...", position: "bottom_right" }
    ],
    speaker_notes: "..."
  }
]
```

**Returns:**
```
{ url: "https://...supabase.../media/pptx_xxx.pptx", file_id: "..." }
```

**Key rules:**
- Images downloaded from URLs and **embedded as binary** in the .pptx (works offline)
- Josoor theme applied: colors, fonts, logo placement
- RTL support for Arabic locale (text direction, alignment flipped)
- Position system uses a grid (left_half, right_half, full_width, top_left, etc.)
- The tool validates the spec: rejects slides with no visual elements (all-text-only slides get flagged)
- Maximum assembly time: 60 seconds per presentation

---

### 5.4 Tool: `generate_docx`

**Creates a Word document** from structured content.

**Parameters:**
```
title: string
locale: "en" | "ar"
toc: boolean (default true)
sections: [
  {
    heading: string,
    level: 1 | 2 | 3,
    content: [
      { type: "paragraph", text: "..." },
      { type: "bullets", items: ["..."] },
      { type: "table", headers: [...], rows: [...] },
      { type: "image", url: "https://...", caption: "..." },
      { type: "chart_image", url: "https://...", caption: "..." },
      { type: "callout", text: "..." },
      { type: "page_break" }
    ]
  }
]
```

**Returns:**
```
{ url: "https://...supabase.../media/docx_xxx.docx", file_id: "..." }
```

**Key rules:**
- Auto-generates table of contents from headings
- Images embedded as binary
- Josoor theme: heading styles, colors, fonts
- RTL support for Arabic
- Maximum assembly time: 30 seconds per document

---

## 6. PPTX Slide Design Best Practices (Comprehensive)

This section defines the presentation design philosophy that must be embedded in the LLM's system prompt and enforced by the `generate_pptx` tool's QA validation.

### 6.1 Brand Style: Josoor Platform (Government Strategy)

```
Colors:
  primary:    oklch values from theme.css (mapped to hex for PPTX)
  accent:     platform accent color (gold #d4a017)
  background: #FFFFFF (light), #1A1A2E (dark section dividers)
  text:       #2C3E50 (headings), #4A5568 (body)
  data:       Consistent chart palette (6 colors, distinguishable)

Typography:
  Arabic: Noto Sans Arabic (or Cairo) — web-safe, clean, professional
  English: Inter or Segoe UI — modern sans-serif
  Hierarchy: See Section 6.9 for the definitive typography hierarchy (6 levels)

Spacing:
  Margins:       100px from edges (all sides)
  Title gap:     60px below title
  Element gap:   40px between elements
  Bullet indent: 40px
```

### 6.2 Slide Layout System (Position Grid)

```
┌─────────────────────────────────────────┐
│  top_left      │  top_center   │ top_right    │
│                │               │              │
├────────────────┼───────────────┼──────────────┤
│  left_half     │    center     │ right_half   │
│                │               │              │
├────────────────┼───────────────┼──────────────┤
│  bottom_left   │ bottom_center │ bottom_right │
│                │               │              │
└─────────────────────────────────────────┘

Special positions:
  full_width    — spans entire slide width
  full_slide    — full bleed (no margins)
  left_third    — 33% left
  center_third  — 33% center
  right_third   — 33% right
```

**Approximate coordinate mapping (percentage of slide area):**

| Position | X Start | Y Start | Width | Height |
|----------|---------|---------|-------|--------|
| `top_left` | 0% | 0% | 50% | 40% |
| `top_center` | 25% | 0% | 50% | 40% |
| `top_right` | 50% | 0% | 50% | 40% |
| `left_half` | 0% | 10% | 50% | 80% |
| `center` | 15% | 15% | 70% | 70% |
| `right_half` | 50% | 10% | 50% | 80% |
| `bottom_left` | 0% | 60% | 50% | 40% |
| `bottom_center` | 25% | 60% | 50% | 40% |
| `bottom_right` | 50% | 60% | 50% | 40% |
| `full_width` | 0% | 10% | 100% | 80% |
| `full_slide` | 0% | 0% | 100% | 100% |
| `left_third` | 0% | 10% | 33% | 80% |
| `center_third` | 33% | 10% | 34% | 80% |
| `right_third` | 66% | 10% | 34% | 80% |

All positions respect the 100px margin gutter except `full_slide`. Y percentages account for the title bar (top ~10%) and takeaway bar (bottom ~10%).

### 6.3 Slide Layout Types

| Layout | Purpose | Required Elements | Visual Weight |
|---|---|---|---|
| `title` | Opening slide | title, subtitle, optional logo | 90% visual |
| `section_divider` | Breathing room between topics | section title, optional number | 95% visual |
| `content_visual` | **Default for most slides** | title + one visual + supporting text | 60% visual, 40% text |
| `content_text` | When text is unavoidable | title + structured bullets | Max 5 bullets |
| `data_highlight` | Key metric/number | large callout number + context | 80% number, 20% context |
| `comparison` | Before/after, A vs B | split layout, visual contrast | 50/50 split |
| `process_flow` | Steps, workflow, timeline | arrow_flow or timeline element | Horizontal flow |
| `matrix` | 2x2 quadrant, risk map | four quadrants with labels | Balanced grid |
| `closing` | Final slide | key takeaway + CTA + contact | Clean, confident |
| `chart_left` | Chart left + supporting text right | chart in left zone + bullets/text in right zone | 60% chart |
| `chart_full` | Full-width chart focus | full-width chart + takeaway bar | 80% chart |
| `chart_text` | Chart + narrative | chart left + narrative right | 50/50 |
| `table_full` | Data table focus | full-width table + takeaway bar | 80% table |
| `visual_text` | Image + text | generated image left + text right | 60% image |
| `visual_full` | Full-width image | full-width visual + takeaway bar | 90% visual |
| `two_column` | Balanced text | text/bullets left + text/bullets right | 50/50 |
| `bullets_icon` | Recommendations | icon-annotated bullets | Even spread |
| `key_message` | Single insight | large text center + optional supporting metric | 90% text |
| `timeline` | Chronological roadmap | horizontal timeline with milestones | Horizontal flow |

### 6.4 The 7 Commandments of Enterprise Slides

1. **One message per slide.** If you can't state the slide's purpose in one sentence, split it.

2. **5-second scan rule.** A senior leader should grasp the point in 5 seconds. If it takes longer, redesign.

3. **Visual first, text supports.** The visual IS the message. Text adds nuance, not substance. For data — show the chart. For process — show the flow. For comparison — show side-by-side.

4. **No orphan slides.** Every slide connects to the one before and after. Story arc must be visible.

5. **Callout the "so what."** Every data slide needs a headline that states the insight, not a description. Not "Q3 Revenue by Department" — instead "Water Sector grew 23% while Regulation declined."

6. **Images earn their place.** Every image must reinforce the specific message of that slide. Generic visuals (handshake clipart, lightbulb icons) waste credibility. Use `generate_image` to create context-specific visuals: an org structure for THIS ministry, a process flow for THIS initiative.

7. **Speaker notes carry the narrative.** The slide is a visual anchor. The full argument lives in speaker notes. Notes should be 3-5 sentences per slide — the actual words the presenter would say.

### 6.5 The Anti-Pattern: All-Text Slides

**Guiding principle: IMPACTFUL, NOT MINIMAL.** Every slide must drive its key message home as fast and forcefully as possible. Use the least amount of elements that still delivers the key message most impactfully in the shortest time to a diverse audience of senior leaders with "slide fatigue" and little time to read text.

**This does NOT mean "use fewer elements."** It means every element must earn its place — and visuals almost always earn their place faster than text. A slide with a chart, 3 bullets, and an arrow showing causality is better than a slide with just a title and a paragraph — if the chart and arrow make the message land faster.

**A slide that is only title + bullets is LAZY, not minimal.** Senior leaders skim — text-only slides get skipped. If a slide has no visual element, the LLM must ask: "Would a visual make this land faster?" If yes, add one.

**Exception:** Executive Summary and Next Steps slides may be text-focused.

### 6.6 Visual Selection Decision Tree

When the LLM is deciding what visual to use for a slide, follow this tree:

```
Is the content DATA (numbers, metrics, comparisons)?
├── YES: Is it a trend over time?
│   ├── YES → Line chart
│   └── NO: Is it a comparison across categories?
│       ├── YES → Column/bar chart
│       └── NO: Is it composition of a whole?
│           ├── YES → Pie chart (max 6 slices)
│           └── NO: Is it intensity across 2 dimensions?
│               ├── YES → Heatmap
│               └── NO → Table (last resort for data)
│
└── NO: Is the content a CONCEPT (framework, approach, model)?
    ├── YES → generate_image (conceptual_diagram, framework, architecture)
    └── NO: Is it a PROCESS (steps, workflow, phases)?
        ├── YES: Is it chronological?
        │   ├── YES → generate_image (roadmap, timeline)
        │   └── NO → generate_image (process_flow)
        └── NO: Is it a STRUCTURE (org chart, hierarchy)?
            ├── YES → generate_image (org_structure)
            └── NO: Is it a COMPARISON (before/after, options)?
                ├── YES → generate_image (comparison) OR two_column layout
                └── NO → Bullets with icons (text-based, last resort)
```

### 6.7 Slide-by-Slide Design Process

For each slide, the LLM must specify:

1. **Layout type** — which layout from the layout types table (Section 6.3)
2. **Title** — the insight (not the topic)
3. **Position assignments** — what goes in each position slot (using the position grid from Section 6.2)
4. **For each element:**
   - Type (chart_image, image, bullets, table, callout, arrow_flow, heading, separator, footnote)
   - If chart_image: which chart type, what data (pre-rendered via `generate_chart_image`)
   - If image: which category, description for generation (pre-rendered via `generate_image`)
   - If bullets: exact text, max 5 items
   - If table: columns and rows (max 5x6)
   - If callout: text with highlight number/action
5. **Speaker notes** — what the presenter says (not what's on the slide)
6. **Transition logic** — how this slide connects to the next

### 6.8 Deck-Level Quality Checks (Story Quality)

Before finalizing the slide structure, the LLM must verify the following story-level quality checks. These ensure the deck works as a coherent narrative before it is sent to the `generate_pptx` tool for file assembly.

- [ ] Executive summary slide exists and can stand alone
- [ ] Every slide has a clear insight title (not a topic label)
- [ ] No slide has more than 1 key message
- [ ] No more than 2 consecutive text-only slides
- [ ] At least 50% of body slides have a visual element (chart, image, or diagram)
- [ ] All data charts have a takeaway or annotation
- [ ] Recommendations are specific (who, what, when), not generic
- [ ] Total slide count is within the target range for the format
- [ ] The deck tells a coherent story when reading only the titles in sequence

### 6.9 Story Structure Templates

**Strategy Presentation (McKinsey pyramid):**
```
1. Executive Summary      — 1 slide (answer first)
2. Situation              — 1-2 slides (where we are)
3. Complication           — 1-2 slides (what's at stake)
4. Key Findings           — 2-4 slides (data_highlight + content_visual)
5. Recommendation         — 2-3 slides (content_visual, heavy on visuals)
6. Implementation Roadmap — 1-2 slides (process_flow / timeline)
7. Next Steps             — 1 slide (closing)
```

**Assessment/Maturity Review:**
```
1. Title + Scope          — 1 slide
2. Methodology            — 1 slide (process_flow)
3. Overall Score          — 1 slide (data_highlight)
4. By Dimension           — 3-5 slides (comparison or matrix)
5. Key Gaps               — 1-2 slides (content_visual with gap chart)
6. Recommendations        — 2-3 slides (prioritized)
7. Roadmap                — 1 slide (timeline)
```

**Risk / Controls Report:**
```
1. Risk Landscape         — 1 slide (matrix / heatmap)
2. Top Risks              — 2-3 slides (one per risk, data_highlight)
3. Mitigation Status      — 1-2 slides (comparison: planned vs actual)
4. Escalations            — 1 slide (content_visual)
5. Next Review Cycle      — 1 slide (closing)
```

### 6.10 Element Design Rules

| Element | Rules |
|---|---|
| **bullets** | Max 5 items. Max 8 words per bullet. Use sentence fragments, not full sentences. Start each with an action verb or key noun. |
| **callout** | One per slide max. Font size 2-3x body text. Always has a context line below ("vs 18% last quarter"). |
| **table** | Max 5 columns, 6 rows visible. Highlight the key row/column with accent color. Header row always distinct. |
| **arrow_flow** | 3-5 steps max. Horizontal preferred. Color progression from light to bold. Each step: icon + short label. |
| **image** | Must fill at least 40% of slide area. Never stretched/distorted. If text overlays image, use gradient overlay (20% opacity). |
| **chart_image** | Title above chart states the insight (not the metric name). Legend only if >2 series. No 3D effects. |
| **separator** | Thin line (1px), 60% slide width, centered. Use to divide related but distinct content on same slide. |
| **footnote** | Source attribution only. Bottom-right. 12pt. Light gray. |

### 6.11 Slide Title Rule

Title = the insight, NOT the topic.
- GOOD: "Revenue grew 12% YoY"
- BAD: "Revenue Overview"
- GOOD: "IT capabilities stalled at Level 2"
- BAD: "Capability Assessment Results"

### 6.12 Typography and Design Quality Rules

From elite-powerpoint-designer best practices:

**Typography Hierarchy:**
```
Hero Title: 48-64pt, Bold, 1.1x line height
Section Title: 36-44pt, Semibold, 1.2x line height
Slide Title: 28-36pt, Semibold, 1.3x line height
Body Large: 24-28pt, Regular, 1.4x line height
Body: 18-22pt, Regular, 1.5x line height
Caption: 14-16pt, Light, 1.6x line height
```

**Font rules:**
- Maximum 2 font families per deck (one serif optional for emphasis)
- Use web-safe fonts ONLY (Arial, Noto Sans Arabic, Inter, Segoe UI, Cairo)
- Do NOT use the `#` prefix in PptxGenJS hex codes (causes corruption)
- 4.5:1 contrast ratio minimum for text readability (accessibility)

**Color Application:**
```
Background: Brand background (usually white, dark for section dividers)
Primary: Titles, key elements
Secondary: Subtitles, secondary text
Accent: Highlights, data points, emphasis (gold #d4a017)
Text: 95% opacity for readability
```

**Visual Consistency Checklist (built into QA):**
- All slides use design system colors (no random colors)
- Typography follows hierarchy (no more than 4 font sizes)
- Spacing is consistent (same margins, padding throughout)
- Alignment is precise (everything lines up to grid)

### 6.13 QA Validation Checklist (Built into `generate_pptx`)

The tool must validate before saving:
- [ ] No slide has only text elements (must have at least one visual) — except Executive Summary and Next Steps
- [ ] No slide has >5 bullet points
- [ ] No bullet has >10 words
- [ ] Every chart/image has a caption or context
- [ ] Title slide and closing slide exist
- [ ] Font sizes follow hierarchy (no body text larger than title)
- [ ] Color palette matches theme (no random hex values)
- [ ] All images are embedded (no broken URLs)
- [ ] RTL text direction correct for Arabic locale
- [ ] File opens without corruption (python-pptx validation)
- [ ] Speaker notes present for all content slides
- [ ] Maximum 2 font families used
- [ ] Slide count matches spec

---

## 7. DOCX Document Design

### 7.1 Document Structure

```
┌─────────────────────────────────────────┐
│  Cover Page                              │
│  - Title, subtitle, date, logo           │
│  - Classification (if applicable)        │
├─────────────────────────────────────────┤
│  Table of Contents (auto-generated)      │
│  - Up to 3 heading levels               │
├─────────────────────────────────────────┤
│  Executive Summary                       │
│  - 1 page max, key findings + recs       │
├─────────────────────────────────────────┤
│  Body Sections (H1 → H2 → H3)           │
│  - Paragraphs, tables, charts, callouts  │
├─────────────────────────────────────────┤
│  Appendices                              │
│  - Supporting data, methodology          │
├─────────────────────────────────────────┤
│  Footer: page numbers, date, doc title   │
└─────────────────────────────────────────┘
```

### 7.2 Style System (Josoor Theme)

```
Fonts:
  Arabic: Noto Sans Arabic (body 12pt, headings 14-22pt)
  English: Inter or Calibri (body 11pt, headings 13-20pt)

Heading Hierarchy:
  H1: 22pt, Bold, primary color, 24pt space above, page break before
  H2: 16pt, SemiBold, primary color, 18pt space above
  H3: 13pt, SemiBold, dark gray, 12pt space above

Body:
  Size: 11-12pt, Regular
  Line spacing: 1.15
  Paragraph spacing: 6pt after
  Justified alignment (LTR), right-aligned (RTL)

Colors:
  Same palette as PPTX theme (consistency across deliverables)
```

### 7.3 Element Types

| Element | Design Rules |
|---|---|
| **paragraph** | Justified text. No single-sentence paragraphs (combine or use bullets). Max 150 words per paragraph. |
| **bullets** | Indented 0.5in. Round bullet style. Max 2 nesting levels. |
| **table** | Header row with accent background + white text. Alternating row shading (light gray). Borders: thin, gray. |
| **image** | Centered. Max width 6in. Caption below in italic 10pt. |
| **chart_image** | Same as image, with source attribution below caption. |
| **callout** | Light accent background box. Bold text. Used for key findings or warnings. 1px accent-color left border. |
| **page_break** | Before each H1 section (automatic). Manual where needed. |

### 7.4 Cover Page Template

```
┌─────────────────────────────┐
│         [Logo]              │
│                             │
│                             │
│    Document Title           │
│    (22pt, Bold, Primary)    │
│                             │
│    Subtitle / Description   │
│    (14pt, Regular, Gray)    │
│                             │
│                             │
│    Date: March 2026         │
│    Classification: Internal │
│    Prepared by: [Noor AI]   │
│    Version: 1.0             │
└─────────────────────────────┘
```

### 7.5 Two Conversion Modes

**Mode A: Report → DOCX (direct conversion)**
- HTML content is already "word ready" (flowing text)
- Map HTML headings → DOCX heading styles
- Map HTML tables → DOCX formatted tables
- Embed chart images already generated
- Auto-generate TOC from heading structure
- Quick user alignment: show proposed TOC, user confirms

**Mode B: Chat content → DOCX (structured conversion)**
- LLM proposes document structure (TOC outline)
- User aligns on structure
- LLM maps chat content into sections
- Same embedding and formatting rules apply

### 7.6 QA Validation Checklist (Built into `generate_docx`)

- [ ] TOC matches actual headings (no orphan entries)
- [ ] All images embedded (no broken URLs)
- [ ] Page numbers present in footer
- [ ] Cover page has all required fields
- [ ] No heading without content below it
- [ ] Tables have header rows
- [ ] RTL direction correct for Arabic locale
- [ ] File opens without corruption

---

## 8. Complete Workflow

### 8.1 The Universal Principle

**Content first, file second.** The LLM never jumps to file creation. It always builds and validates content on screen first. File generation is packaging.

### 8.2 Flow Diagram

```
User interacts with Noor
         │
         ▼
┌─────────────────────────┐
│  Content Creation Phase  │
│  (chat / report buttons) │
│                          │
│  LLM produces HTML with  │
│  chart images (<img>)    │
│  and analysis on screen  │
└────────────┬────────────┘
             │
    User reviews content
    on screen, iterates
             │
             ▼
    Content approved ✓
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
"Convert to      "Convert to
 PPTX"  btn       DOCX"  btn
    │                 │
    ▼                 ▼
┌──────────┐   ┌──────────┐
│ PPTX     │   │ DOCX     │
│ Workflow │   │ Workflow │
└──────────┘   └──────────┘
```

### 8.3 PPTX Workflow (Multi-Step)

```
Step 1: LLM analyzes approved content
        ├─ Identifies key messages
        ├─ Identifies data points (charts already rendered)
        └─ Identifies where images would strengthen the message

Step 2: LLM proposes SLIDE STRUCTURE
        ├─ Story arc (which template: strategy, assessment, risk...)
        ├─ Slide-by-slide outline:
        │   Slide 1: title — "Q3 Water Sector Maturity Assessment"
        │   Slide 2: section_divider — "Methodology"
        │   Slide 3: content_visual — "Assessment Framework" + [generate_image: process_flow]
        │   Slide 4: data_highlight — "Overall Score: 3.2/5" + [existing chart_image]
        │   ...
        └─ Shows which slides need new images generated

Step 3: User reviews and aligns on structure
        ├─ Can reorder, add, remove slides
        ├─ Can change which content goes where
        └─ Approves the spec

Step 4: LLM SAVES SPEC to Supabase Storage
        ├─ JSON structure with all slide definitions
        ├─ References to existing chart image URLs
        ├─ Descriptions for images to be generated
        └─ Returns spec_url

Step 5: LLM ORCHESTRATES GENERATION
        ├─ Calls generate_image() for each needed image
        │   (multiple sequential tool calls in the tool loop)
        ├─ Collects returned URLs
        └─ All images now have Supabase URLs

Step 6: LLM calls generate_pptx()
        ├─ Passes spec_url + slides array with all URLs
        ├─ Tool downloads all images, embeds as binary
        ├─ Applies Josoor theme
        ├─ Runs QA validation checklist
        └─ Returns { url, file_id }

Step 7: LLM presents download link to user
        └─ "Your presentation is ready: [Download PPTX]"
```

### 8.4 DOCX Workflow (Simpler)

```
Step 1: LLM analyzes approved content
        ├─ Maps HTML structure to document sections
        └─ Identifies heading hierarchy

Step 2: LLM proposes DOCUMENT STRUCTURE
        ├─ Table of Contents outline
        ├─ Section breakdown (which content goes where)
        └─ Cover page details

Step 3: User quick alignment
        └─ Confirms or adjusts TOC / structure

Step 4: LLM calls generate_docx()
        ├─ Passes sections with all content
        ├─ Chart images embedded from existing URLs
        ├─ Applies Josoor theme
        ├─ Runs QA validation checklist
        └─ Returns { url, file_id }

Step 5: LLM presents download link to user
```

---

## 9. Frontend Changes Required

### 9.1 Remove Highcharts/Visualization Pipeline

`<ui-chart>` tags replaced by `<img src="chart_url">`. Kill:
- `buildArtifactsFromTags()`
- `extractDatasetBlocks()`
- `adaptArtifacts()`
- Highcharts renderers (`StrategyReportChartRenderer`)

### 9.2 Add "Convert to PPTX" / "Convert to DOCX" Buttons

Appear on any assistant message containing a report/analysis. Located in the message action bar or canvas toolbar.

**Visibility rules:**
- Only visible when the current artifact/message contains report/analysis content.
- Hidden for simple responses, greetings, etc.

### 9.3 Buttons Trigger a New Chat Message

Clicking "Convert to PPTX" sends a system-injected message like: `[SYSTEM: User requested PPTX conversion of the above report. Follow the PPTX workflow.]` This keeps it within the chat flow so the LLM can propose structure and align.

### 9.4 Download Link Rendering

When LLM response contains a Supabase Storage URL for `.pptx` or `.docx`, render as a download card with file icon, name, size, and download button.

### 9.5 canvasActions.ts — URL-Based Download

The current `downloadArtifact()` builds HTML from the DOM. For FILE artifacts with a `content.url`, download from that URL directly instead of building HTML.

---

## 10. Prompt Instruction Additions

The LLM system prompt must be updated with:

1. **Chart generation rule**: "When producing data visualizations, ALWAYS call `generate_chart_image` first. Embed the returned URL as `<img src="url" alt="description">` in your HTML. Never use `<ui-chart>` tags."

2. **File generation guard**: "NEVER call `generate_pptx` or `generate_docx` as a first response. Content must be validated on screen first. Only generate files when explicitly requested by the user or triggered by the Convert button."

3. **PPTX design principles**: The full Section 6 rules, condensed into the prompt.

4. **Image generation guard**: "Only use `generate_image` for business visuals needed in presentations or documents. Categories listed in Section 5.2. Reject non-business requests."

5. **Content-first rule**: "If a user asks to create a presentation or document, first build the content as an on-screen report. Show it to the user. Get confirmation. Only then proceed to file creation."

---

## 11. Infrastructure Details

### 11.1 Dependencies (Python packages for .venv-media)

- `matplotlib` — chart rendering
- `python-pptx` — PowerPoint generation
- `python-docx` — Word document generation
- `google-genai` — Image generation API
- `fastmcp` — MCP server framework
- `httpx` — HTTP client for Supabase Storage uploads
- `Pillow` — Image processing

### 11.2 Templates

Branded PPTX and DOCX templates stored in the media-mcp server:
- `templates/josoor.pptx` — Josoor-branded PowerPoint template
- `templates/josoor_report.docx` — Report template
- `templates/josoor_memo.docx` — Memo template
- `templates/josoor_brief.docx` — Brief template
- `templates/josoor_policy.docx` — Policy document template

Templates must match the site theme: gold accent (#d4a017), dark background option, Noto Sans Arabic / Inter fonts.

### 11.3 Storage

- **Bucket:** Supabase Storage, bucket name "media"
- **Path pattern:** `media/{user_id}/{date}/{uuid}.{ext}`
- **TTL:** 30 days
- **Access:** Public URLs

### 11.4 Spec Persistence

PPTX specs (slide structure approved by user) are saved as JSON to Supabase Storage.

**Save mechanism:** The media-mcp server exposes a 5th utility tool `save_spec` for this purpose:
- **Input:** `{ title: string, spec: object }` — the full slide structure as JSON
- **Output:** `{ spec_url: "https://...supabase.../media/.../spec_xxx.json" }`
- **Path pattern:** `media/{user_id}/{date}/spec_{uuid}.json`
- **Purpose:** Persist the approved slide structure between conversation turns (survives context condensation)
- **The `generate_pptx` tool can read this spec via its optional `spec_url` parameter, or accept slides inline**

Note: `save_spec` is a lightweight utility (not counted among the 4 primary generation tools). It only writes JSON to Supabase Storage and returns a URL.

---

## 12. Theming

### 12.1 Single Reference Theme

The Josoor platform theme is the single reference. Colors, fonts, and styling are drawn from `frontend/src/styles/theme.css` and mapped to PPTX/DOCX equivalents.

### 12.2 Client Swappability

When a client deploys the solution, the theme is changed to match theirs. This means:
- Templates are parameterized (colors, fonts, logo as variables)
- A theme config file (`theme.json`) on the server defines all brand values
- Changing the theme changes all output formats (PPTX, DOCX, charts)

**Theming is a server-level configuration, NOT a per-tool-call parameter.** The `generate_pptx` and `generate_docx` tools always use the currently deployed theme. There is no `theme` parameter on the tools — the server reads `theme.json` at startup. To change the theme, update the config and restart the service.

---

## 13. Out of Scope

- **Code file generation** — excluded
- **Video generation** — not included
- **PDF generation** — not included (users can print to PDF from the browser)
- **Real-time collaboration on files** — single-user generation only
- **File editing** — files are generated once; re-generation required for changes
- **Image generation for non-business purposes** — explicitly blocked

---

## 14. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chart render time | < 3s per chart | Server-side timing |
| Visual generation time | < 30s per image | API response time |
| PPT assembly time | < 60s per presentation | End-to-end tool call |
| DOCX assembly time | < 30s per document | End-to-end tool call |
| File corruption rate | 0% | QA validation pass rate |
| Chart visual consistency across LLM providers | 100% | Manual audit |
| Category enforcement accuracy | 100% rejection of invalid categories | Guardrail hit rate |
| Content-first compliance | 100% (file generation only after on-screen content) | Programmatic: assemble_* tool calls only succeed when conversation contains at least one prior REPORT/HTML artifact |

---

## 15. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Image API unavailable | High | Graceful error message, no fallback |
| Chart rendering failure | High | Error boundary returns raw data |
| Corrupted PPTX/DOCX files | High | QA validation step before returning file |
| LLM skips content-first rule | Medium | Prompt enforcement + frontend button-only trigger |
| Supabase Storage quota exceeded | Medium | 30-day TTL auto-cleanup |
| Arabic RTL rendering issues | Medium | Explicit RTL testing for all types |
| Users abuse image generation | Low | Category enforcement + blocklist + audit log |
| Large presentations timeout | Medium | Cap at 20 slides per request |

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **media-mcp** | The MCP server providing media generation capabilities |
| **NanoBanana** | Image generation API (Google Gemini Image or similar) |
| **MCP** | Model Context Protocol — standard for LLM tool integration |
| **FastMCP** | Python framework for building MCP servers |
| **Supabase Storage** | Object storage service used for generated files |
| **Canvas** | The right-side panel in the chat UI that displays artifacts |
| **Artifact** | A structured content unit (chart, table, report, file, etc.) |
| **Noor** | The AI assistant persona for staff users |
| **Spec** | The JSON structure defining a presentation's slide layout, saved to Supabase Storage |
