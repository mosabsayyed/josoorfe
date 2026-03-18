# media-mcp V3 — Frontend Handoff Document

**Author:** Mosab / Claude
**Status:** Handoff-Ready
**Created:** 2026-03-16
**Version:** 3.0
**Source documents:** 01-BRD-media-mcp-v3.md, 02-TDD-media-mcp-v3.md, 03-PLAN-media-mcp-v3.md

---

## 1. Executive Summary

**media-mcp** is a standalone MCP (Model Context Protocol) server that provides media generation capabilities to the Josoor AI assistant (Noor). It replaces the client-side Highcharts chart rendering pipeline with a server-side image generation pipeline, and adds the ability to convert on-screen reports into downloadable PowerPoint (.pptx) and Word (.docx) documents.

**What media-mcp does:**
- Generates chart images server-side (Matplotlib → PNG → Supabase Storage URL) to replace `<ui-chart>` tags
- Generates business visual images (diagrams, infographics, org charts) via Google Gemini Image API
- Assembles PowerPoint presentations from structured JSON specs
- Assembles Word documents from structured content
- Saves PPTX specs to Supabase Storage for multi-turn workflows

**What the frontend needs to support (the short version):**
1. Render CHART artifacts with `content.url` as `<img>` (already done — see Section 5)
2. Render FILE artifacts as a download card (already done — see Section 5)
3. Show "PPT" and "DOCX" convert buttons on REPORT/DOCUMENT/HTML artifacts in the canvas toolbar (already done — see Section 5)
4. Wire the convert buttons to send system messages into the chat (already done — see Section 5)
5. `downloadArtifact()` in canvasActions.ts checks for FILE artifacts and downloads from URL (already done — see Section 5)

**Status:** All 4 frontend file changes have already been applied in the `josoorfe` repo. This document is the authoritative specification and test reference for those changes.

---

## 2. Backend Context (What's Already Live)

### 2.1 media-mcp Server

| Property | Value |
|---|---|
| Service name | `josoor-router-media.service` |
| Port | `8203` |
| Path | `/3/mcp/` |
| Transport | FastMCP stateless HTTP |
| Venv | `backend/mcp-server/servers/media-mcp/.venv-media/` |
| Working dir | `/home/mastersite/development/josoorbe/backend/mcp-server/servers/media-mcp/` |

**5 tools exposed:**
1. `generate_chart_image` — renders a data chart as a PNG image, returns a Supabase Storage URL
2. `generate_image` — generates a business visual via Google Gemini Image API, returns a Supabase Storage URL
3. `generate_pptx` — assembles a PowerPoint file from a structured slide spec, returns a Supabase Storage URL to the .pptx file
4. `generate_docx` — assembles a Word document from structured content sections, returns a Supabase Storage URL to the .docx file
5. `save_spec` — saves a PPTX slide spec as JSON to Supabase Storage, returns the spec URL (used for multi-turn PPTX workflows)

### 2.2 Noor Router (Port 8201) — Tool Forwarding

The Noor Router at port 8201 has been extended to forward all 5 media-mcp tools. The orchestrator still connects to a single MCP endpoint (the Noor Router). The Noor Router proxies media tool calls to media-mcp at port 8203. No changes to the orchestrator were required.

The LLM session now sees 17 tools: 12 knowledge tools + 5 media tools.

**Router config change location:** `backend/mcp-server/servers/mcp-router/router_config.yaml`

### 2.3 Supabase Storage

- **Bucket name:** `"media"` (separate from the existing `"uploads"` bucket)
- **Path pattern:** `media/{user_id}/{date}/{uuid}.{ext}`
- **Example URL:** `https://[project].supabase.co/storage/v1/object/public/media/user_123/2026-03-16/a1b2c3d4.pptx`
- **TTL:** 30 days (daily cleanup cron)
- **Access:** Public URLs (no auth required to download)

### 2.4 LLM Prompts — Already Updated

The following Supabase `instruction_elements` records have been updated with chart-first and content-first rules:

| Element ID | Element Name | Change Applied |
|---|---|---|
| 453 | `shared_output_format` | Chart rendering rule: always use `generate_chart_image`, embed as `<img>`. Never use `<ui-chart>` tags. |
| 460 | `general_analysis` | Content-first rule: never call `generate_pptx`/`generate_docx` as a first response. |
| 461 | `strategy_brief` | Full PPTX design principles embedded. |
| 462 | `risk_advisory` | File generation guard added. |
| 463 | `intervention_planning` | File generation guard added. |

**Effect:** The LLM will now embed chart images as `<img src="url">` instead of `<ui-chart>` tags. It will NOT call file generation tools unprompted — only when user clicks the Convert buttons or explicitly requests conversion.

---

## 3. Frontend Changes Required (from BRD Section 9 and TDD Section 6)

### 3.1 Remove Highcharts / Visualization Pipeline (BRD 9.1)

**What to eventually kill:**
- `buildArtifactsFromTags()` — function that parses `<ui-chart>` tags from LLM HTML
- `extractDatasetBlocks()` — function that extracts chart data blocks from HTML
- `adaptArtifacts()` — adapter layer between tag-parsed data and Highcharts format
- `StrategyReportChartRenderer` — Highcharts renderer component
- Highcharts import and package.json entry

**IMPORTANT — do NOT remove these yet.** Legacy conversations in the database still have `<ui-chart>` tags in their history. The Highcharts fallback path in ArtifactRenderer.tsx must remain. The migration is additive: new charts from the media-mcp path render as `<img>`; old charts continue to render via Highcharts. Removal happens only after a full database migration of old chart artifacts.

**The new path:** LLM calls `generate_chart_image` → gets back `{url, file_id}` → embeds URL as `<img src="url" alt="description">` in HTML → backend packages as CHART artifact with `content.url` → frontend renders via MediaRenderer. No parsing, no Highcharts, no tag extraction.

### 3.2 Add "Convert to PPTX" / "Convert to DOCX" Buttons (BRD 9.2)

Convert buttons appear in the canvas toolbar for report-type artifacts.

**Location:** Canvas toolbar (header button row, same row as Share, Print, Download).

**Visibility rule (exact condition from implementation):**
```
currentArtifact.artifact_type.toUpperCase() in ['REPORT', 'DOCUMENT', 'HTML']
```

**Hidden for:** TABLE, CHART, MEDIA, TWIN_KNOWLEDGE, GRAPHV001, REACT, CODE, MARKDOWN, FILE.

**Why REPORT/DOCUMENT/HTML only?** These artifact types contain flowing content (text, headings, tables, chart images) that can be meaningfully converted to PPTX or DOCX. The others are data visualizations, interactive components, or binary files that don't convert to documents.

### 3.3 Button Trigger Behavior — System Message Format (BRD 9.3)

Clicking a convert button sends a message into the existing chat flow. The LLM receives it as a user turn and initiates the appropriate multi-step workflow.

**PPTX button sends:**
```
[SYSTEM: User requested PPTX conversion of the above report "{artifact.title}". Follow the PPTX workflow: propose slide structure, align with user, then generate.]
```

**DOCX button sends:**
```
[SYSTEM: User requested DOCX conversion of the above report "{artifact.title}". Follow the DOCX workflow: propose TOC structure, align with user, then generate.]
```

`suppress_canvas_auto_open: true` is passed as a message option so the canvas does not auto-open/switch during the multi-turn workflow.

### 3.4 Download Link Rendering — FILE Artifacts (BRD 9.4)

When the LLM returns a Supabase Storage URL for a `.pptx` or `.docx` file, the backend packages it as a FILE artifact with `content.url`, `content.filename`, and `content.type`. The frontend renders a download card.

**Detection:** ArtifactRenderer.tsx checks `artifact.artifact_type === 'FILE'` and routes to FileRenderer.

**FileRenderer receives:**
```typescript
{
  filename: content.filename || artifact.title,
  url: content.url,          // Supabase public URL
  size: content.size,        // optional, may be undefined
  type: content.type,        // "pptx" | "docx" | etc.
  content: content.body,     // optional body text
}
```

### 3.5 canvasActions.ts — URL-Based Download (BRD 9.5)

The canvas "Download" button calls `downloadArtifact(artifact)`. For FILE artifacts, it must download from the Supabase URL instead of building HTML from the DOM.

**New behavior:** If `artifact.content.url` is set AND the artifact type is FILE or the URL ends in `.pptx`/`.docx`, perform a direct browser download from that URL.

---

## 4. Component Specifications (from TDD Section 6)

### 4.1 Files to Modify (TDD 6.1)

| File | Change |
|---|---|
| `frontend/src/components/chat/ArtifactRenderer.tsx` | Add CHART URL branch (MediaRenderer) and FILE case (FileRenderer) |
| `frontend/src/components/chat/CanvasManager.tsx` | Add `onConvertToPPT` / `onConvertToDocx` props + convert button section in toolbar |
| `frontend/src/pages/ChatAppPage.tsx` | Add `handleConvertToPPT` and `handleConvertToDocx` handlers, wire to CanvasManager |
| `frontend/src/utils/canvasActions.ts` | Add URL-download branch at top of `downloadArtifact()` |
| `frontend/src/types/api.ts` or `chat.ts` | (Optional) Add FILE artifact type definition if not already present |

### 4.2 Chart Rendering Replacement (TDD 6.2)

**Before (legacy path):**
1. LLM produces `<ui-chart type="bar" data="...">` tags in HTML response
2. `buildArtifactsFromTags()` parses the tags into artifact objects
3. `extractDatasetBlocks()` extracts the embedded chart data
4. `adaptArtifacts()` converts data format for Highcharts
5. `StrategyReportChartRenderer` renders using Highcharts

**After (media-mcp path):**
1. LLM calls `generate_chart_image(chart_type, title, data, options, width, height)`
2. media-mcp renders using Matplotlib, uploads PNG to Supabase Storage
3. LLM embeds result as `<img src="https://...supabase.../media/chart_xxx.png" alt="chart description">` in HTML
4. Backend packages as CHART artifact with `content: { url: "https://...", file_id: "..." }`
5. `ArtifactRenderer` checks `artifact.content?.url` and renders `<MediaRenderer url={...} type="image" />` — a plain `<img>` tag

**Code pattern in ArtifactRenderer.tsx (CHART case):**
```typescript
case 'CHART':
  // Server-rendered chart image — display as <img>
  if ((artifact.content as any)?.url) {
    return <MediaRenderer url={(artifact.content as any).url} type="image" title={artifact.title} />;
  }
  // Legacy fallback: client-side Highcharts rendering
  return <StrategyReportChartRenderer artifact={artifact as ChartArtifact} width="100%" height={fullHeight ? '100%' : '400px'} />;
```

### 4.3 ConvertButtons Component Spec (TDD 6.3)

The convert buttons are inline in the CanvasManager toolbar (not a separate component file, but can be extracted if desired).

**Props (on CanvasManager):**
```typescript
interface CanvasManagerProps {
  // ... existing props ...
  onConvertToPPT?: (artifact: Artifact) => void;
  onConvertToDocx?: (artifact: Artifact) => void;
}
```

**Visibility condition:**
```typescript
currentArtifact && ['REPORT', 'DOCUMENT', 'HTML'].includes(currentArtifact.artifact_type?.toUpperCase())
```

**Rendering:** Two text-label buttons ("PPT" and "DOCX") separated from the icon buttons by a 1px divider. `onClick` calls the respective prop handler with `currentArtifact`.

**Styling (matches existing header buttons):**
```
padding: '6px 12px'
fontSize: '12px'
fontWeight: 600
display: 'flex', alignItems: 'center', justifyContent: 'center'
color: 'var(--component-text-secondary)'
className: 'clickable header-button'
```

**i18n titles:**
```
PPT button:  "Convert to PowerPoint" / "تحويل إلى عرض تقديمي"
DOCX button: "Convert to Word"       / "تحويل إلى مستند"
```

**Click behavior:** Calls `onConvertToPPT?.(currentArtifact)` or `onConvertToDocx?.(currentArtifact)`. The parent (ChatAppPage) handles sending the system message. The canvas is not closed — the multi-turn workflow unfolds in the chat panel.

### 4.4 FileDownloadCard Spec (TDD 6.4)

When the LLM response contains a Supabase Storage URL ending in `.pptx` or `.docx`, the backend packages it as a FILE artifact. The ArtifactRenderer routes FILE artifacts to `FileRenderer`.

**ArtifactRenderer FILE case:**
```typescript
case 'FILE': {
  const content = artifact.content as any;
  return <FileRenderer
    filename={content.filename || artifact.title}
    url={content.url}
    size={content.size}
    type={content.type}
    content={content.body}
  />;
}
```

**FileRenderer component behavior:**
- Displays filename, file type icon, optional size
- "Download" button triggers `window.open(url)` or creates an anchor click for the Supabase URL
- Card layout (not inline — it renders as a block card in the canvas)

**URL pattern to detect (for future reference if building detection logic):**
```
https://{supabase-project}.supabase.co/storage/v1/object/public/media/*.pptx
https://{supabase-project}.supabase.co/storage/v1/object/public/media/*.docx
```

### 4.5 canvasActions.ts Changes (TDD 6.5)

**File:** `frontend/src/utils/canvasActions.ts`

**Function:** `downloadArtifact(artifact: any)`

**Change:** Added a URL-download branch at the top of the function, before the DOM-clone HTML export logic.

**New branch logic:**
```typescript
// Direct URL download for FILE artifacts (PPTX, DOCX from media-mcp)
if (artifact?.content?.url && (artifact.artifact_type === 'FILE' || artifact.content?.url?.match(/\.(pptx|docx)$/i))) {
  const link = document.createElement('a');
  link.href = artifact.content.url;
  link.download = artifact.content?.filename || artifact.title || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return;
}
// ... existing DOM-clone HTML download logic continues below ...
```

**Trigger condition:** `artifact.content.url` is set AND either `artifact.artifact_type === 'FILE'` OR the URL ends in `.pptx` or `.docx` (case-insensitive). The URL check is a belt-and-suspenders safety for cases where artifact_type might not be set correctly.

---

## 5. Exact Code Changes Already Applied

All 4 files have already been modified in the `josoorfe` repository. The `josoorbe` repository (this repo) does not contain a frontend — the frontend lives in `/home/mastersite/development/josoorfe/`.

### 5.1 ArtifactRenderer.tsx

**File:** `/home/mastersite/development/josoorfe/frontend/src/components/chat/ArtifactRenderer.tsx`

**What was changed:** Added two new rendering paths in the `renderContent()` switch.

**CHART case — added `content.url` branch (lines 135–141):**
```typescript
case 'CHART':
  // Server-rendered chart image — display as <img>
  if ((artifact.content as any)?.url) {
    return <MediaRenderer url={(artifact.content as any).url} type="image" title={artifact.title} />;
  }
  // Legacy fallback: client-side Highcharts rendering
  return <StrategyReportChartRenderer artifact={artifact as ChartArtifact} width="100%" height={fullHeight ? '100%' : '400px'} />;
```

**FILE case — added entirely (lines 170–179):**
```typescript
case 'FILE': {
  const content = artifact.content as any;
  return <FileRenderer
    filename={content.filename || artifact.title}
    url={content.url}
    size={content.size}
    type={content.type}
    content={content.body}
  />;
}
```

### 5.2 CanvasManager.tsx

**File:** `/home/mastersite/development/josoorfe/frontend/src/components/chat/CanvasManager.tsx`

**What was changed (1): New props added to interface and function signature**

```typescript
// In CanvasManagerProps interface:
onConvertToPPT?: (artifact: Artifact) => void;
onConvertToDocx?: (artifact: Artifact) => void;

// In function signature:
export function CanvasManager({ isOpen = false, conversationId = null, artifacts: propArtifacts, initialArtifact, onClose, onConvertToPPT, onConvertToDocx }: CanvasManagerProps)
```

**What was changed (2): Convert buttons section added to toolbar (after the Download button):**
```typescript
{/* Convert Buttons — only for report-type artifacts */}
{currentArtifact && ['REPORT', 'DOCUMENT', 'HTML'].includes(currentArtifact.artifact_type?.toUpperCase()) && (
  <>
    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--component-panel-border)', margin: '0 4px' }} />
    <button
      className="clickable header-button"
      onClick={() => onConvertToPPT?.(currentArtifact)}
      style={{
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--component-text-secondary)',
      }}
      title={language === 'ar' ? 'تحويل إلى عرض تقديمي' : 'Convert to PowerPoint'}
    >
      PPT
    </button>
    <button
      className="clickable header-button"
      onClick={() => onConvertToDocx?.(currentArtifact)}
      style={{
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--component-text-secondary)',
      }}
      title={language === 'ar' ? 'تحويل إلى مستند' : 'Convert to Word'}
    >
      DOCX
    </button>
  </>
)}
```

### 5.3 ChatAppPage.tsx

**File:** `/home/mastersite/development/josoorfe/frontend/src/pages/ChatAppPage.tsx`

**What was changed (1): Two new handler functions added:**
```typescript
const handleConvertToPPT = useCallback((artifact: any) => {
  handleSendMessage(
    `[SYSTEM: User requested PPTX conversion of the above report "${artifact.title || 'Report'}". Follow the PPTX workflow: propose slide structure, align with user, then generate.]`,
    { suppress_canvas_auto_open: true }
  );
}, [handleSendMessage]);

const handleConvertToDocx = useCallback((artifact: any) => {
  handleSendMessage(
    `[SYSTEM: User requested DOCX conversion of the above report "${artifact.title || 'Report'}". Follow the DOCX workflow: propose TOC structure, align with user, then generate.]`,
    { suppress_canvas_auto_open: true }
  );
}, [handleSendMessage]);
```

**What was changed (2): Props wired to MemoizedCanvasManager:**
```typescript
<MemoizedCanvasManager
  artifacts={canvasArtifacts}
  isOpen={isCanvasOpen}
  onClose={() => setIsCanvasOpen(false)}
  initialArtifact={canvasArtifacts[initialCanvasIndex] || null}
  onConvertToPPT={handleConvertToPPT}
  onConvertToDocx={handleConvertToDocx}
/>
```

### 5.4 canvasActions.ts

**File:** `/home/mastersite/development/josoorfe/frontend/src/utils/canvasActions.ts`

**What was changed:** Added URL-download branch at the top of `downloadArtifact()` (lines 151–160):

**Before:**
```typescript
export const downloadArtifact = async (artifact: any) => {
  const element = document.getElementById('canvas-content-area');
  if (!element) {
    saveArtifact(artifact);
    return;
  }
  // ... DOM-clone HTML export ...
```

**After:**
```typescript
export const downloadArtifact = async (artifact: any) => {
  // Direct URL download for FILE artifacts (PPTX, DOCX from media-mcp)
  if (artifact?.content?.url && (artifact.artifact_type === 'FILE' || artifact.content?.url?.match(/\.(pptx|docx)$/i))) {
    const link = document.createElement('a');
    link.href = artifact.content.url;
    link.download = artifact.content?.filename || artifact.title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const element = document.getElementById('canvas-content-area');
  if (!element) {
    saveArtifact(artifact);
    return;
  }
  // ... DOM-clone HTML export (unchanged) ...
```

---

## 6. Artifact Types and Rendering Rules

The complete rendering decision table. This governs what renders in ArtifactRenderer.tsx and what buttons appear in the canvas toolbar.

### 6.1 Rendering Path by Artifact Type

| Artifact Type | Condition | Renderer | Notes |
|---|---|---|---|
| `CHART` | `content.url` is set | `MediaRenderer` (plain `<img>`) | New media-mcp path |
| `CHART` | `content.url` is NOT set | `StrategyReportChartRenderer` | Legacy Highcharts fallback |
| `FILE` | any | `FileRenderer` | PPTX/DOCX download card |
| `REPORT` | any | `ReportRenderer` | Flowing HTML report |
| `DOCUMENT` | any | `DocumentRenderer` | Structured document |
| `HTML` | any | `HtmlRenderer` | Raw HTML rendering |
| `TABLE` | any | `TableRenderer` | Tabular data |
| `MEDIA` | any | `MediaRenderer` | Images/video |
| `TWIN_KNOWLEDGE` | any | `TwinKnowledgeRenderer` | KSA knowledge display |
| `MARKDOWN` | any | `MarkdownRenderer` | Markdown text |
| `CODE` | any | `CodeRenderer` | Syntax-highlighted code |
| `GRAPHV001` | any | (graph renderer) | Knowledge graph |
| `REACT` | any | (React renderer) | Interactive React component |

### 6.2 Convert Button Visibility

| Artifact Type | "PPT" Button | "DOCX" Button |
|---|---|---|
| `REPORT` | Visible | Visible |
| `DOCUMENT` | Visible | Visible |
| `HTML` | Visible | Visible |
| `TABLE` | Hidden | Hidden |
| `CHART` | Hidden | Hidden |
| `MEDIA` | Hidden | Hidden |
| `FILE` | Hidden | Hidden |
| `TWIN_KNOWLEDGE` | Hidden | Hidden |
| `GRAPHV001` | Hidden | Hidden |
| `REACT` | Hidden | Hidden |
| `MARKDOWN` | Hidden | Hidden |
| `CODE` | Hidden | Hidden |

**Rule:** `['REPORT', 'DOCUMENT', 'HTML'].includes(currentArtifact.artifact_type?.toUpperCase())`

---

## 7. Workflow: How PPT/DOCX Conversion Works End-to-End

### 7.1 The Content-First Principle (BRD 3.1 and 8.1)

Content creation and file creation are two completely separate phases. The LLM will NEVER produce a PPTX or DOCX file as its first response to any request. The workflow is always:

1. Content is created and visible on screen as a REPORT or HTML artifact
2. User reviews and iterates (multiple chat turns)
3. User clicks "PPT" or "DOCX" button when satisfied
4. LLM proposes structure and aligns with user (one or more chat turns)
5. LLM generates the file
6. File artifact returned → download card displayed

If a user sends "make me a PowerPoint about X" without existing on-screen content, the LLM will redirect: build the content as a report first, show it on screen, then await conversion instruction.

### 7.2 PPTX Conversion Workflow (BRD 8.3)

This is a multi-step workflow. The convert button triggers Step 0; the LLM drives the rest.

```
Step 0: User clicks "PPT" in canvas toolbar
        └─ ChatAppPage sends:
           "[SYSTEM: User requested PPTX conversion of the above report "Title".
            Follow the PPTX workflow: propose slide structure, align with user, then generate.]"

Step 1: LLM analyzes the on-screen content
        ├─ Identifies key messages per slide
        ├─ Identifies data points (charts already rendered as Supabase URLs)
        └─ Identifies where new images would strengthen the message

Step 2: LLM proposes SLIDE STRUCTURE in chat
        ├─ Story arc (which template: strategy, assessment, risk...)
        ├─ Slide-by-slide outline (layout type, title, planned elements)
        └─ Asks user: "Does this structure work? Any changes?"

Step 3: User reviews and responds
        ├─ Can reorder, add, remove slides in the reply
        ├─ Can change content assignments
        └─ Says "looks good" or gives feedback

Step 4: LLM calls save_spec()
        ├─ Serializes the approved slide structure as JSON
        └─ Returns spec_url (Supabase URL to the spec JSON)

Step 5: LLM calls generate_image() for each needed visual
        ├─ Multiple sequential tool calls within the tool loop
        └─ Collects returned image URLs

Step 6: LLM calls generate_pptx()
        ├─ Passes spec_url + slides array with all image URLs filled in
        ├─ Tool downloads all images, embeds as binary, applies Josoor theme
        ├─ Runs 13-point QA validation checklist
        └─ Returns { url: "https://...supabase.../media/pptx_xxx.pptx", file_id: "..." }

Step 7: LLM presents download link
        └─ Backend packages as FILE artifact
           Frontend renders FileRenderer download card
           User clicks Download → browser fetches from Supabase URL
```

### 7.3 DOCX Conversion Workflow (BRD 8.4)

Simpler than PPTX — no image generation step, no spec persistence needed.

```
Step 0: User clicks "DOCX" in canvas toolbar
        └─ ChatAppPage sends:
           "[SYSTEM: User requested DOCX conversion of the above report "Title".
            Follow the DOCX workflow: propose TOC structure, align with user, then generate.]"

Step 1: LLM maps HTML structure to document sections
        ├─ Extracts heading hierarchy (H1 → H2 → H3)
        └─ Identifies chart images already embedded (Supabase URLs)

Step 2: LLM proposes DOCUMENT STRUCTURE in chat
        ├─ Table of Contents outline
        ├─ Section breakdown (which content maps to which section)
        └─ Cover page details (title, subtitle, classification)

Step 3: User quick alignment
        └─ Confirms or adjusts TOC / structure

Step 4: LLM calls generate_docx()
        ├─ Passes sections array with all content
        ├─ Tool downloads chart images, embeds as binary
        ├─ Applies Josoor theme (fonts, colors, heading styles)
        ├─ Runs 8-point QA validation checklist
        └─ Returns { url: "https://...supabase.../media/docx_xxx.docx", file_id: "..." }

Step 5: LLM presents download link
        └─ Backend packages as FILE artifact → FileRenderer download card
```

---

## 8. Test Cases — Frontend-Specific

These test cases validate the 4 frontend changes. Run these manually or in automation after any modification to the affected files.

### TC-INT-007: Frontend Convert Button Triggers PPTX Workflow

**Source:** TDD Section 9.6

**Technique:** Integration (frontend trigger)

**Setup:**
1. Open the chat with an existing REPORT or HTML artifact in the canvas
2. Artifact type must be one of: REPORT, DOCUMENT, HTML

**Steps:**
1. Verify the "PPT" button is visible in the canvas toolbar
2. Click "PPT"
3. Observe the chat input area

**Expected behavior:**
- A system message is sent to the chat: `[SYSTEM: User requested PPTX conversion of the above report "Title". Follow the PPTX workflow: propose slide structure, align with user, then generate.]`
- The LLM receives this message and responds with a proposed slide structure (NOT an immediate PPTX file)
- The canvas does not auto-switch to a new artifact (suppress_canvas_auto_open)

**Pass criteria:**
- Chat message is sent via the API
- LLM response proposes slide structure (multi-turn workflow begins)
- No immediate FILE artifact is returned from the first LLM response

---

### TC-FE-001: PPT Button Visible for REPORT Artifact

**Technique:** Equivalence Partitioning (convert button visibility)

**Setup:** Canvas open, current artifact is type REPORT

**Expected:** "PPT" button visible in canvas toolbar

**Pass criteria:** Button renders, has correct title attribute "Convert to PowerPoint" (English) or "تحويل إلى عرض تقديمي" (Arabic)

---

### TC-FE-002: DOCX Button Visible for REPORT Artifact

**Technique:** Equivalence Partitioning

**Setup:** Canvas open, current artifact is type REPORT

**Expected:** "DOCX" button visible in canvas toolbar

**Pass criteria:** Button renders, has title "Convert to Word" / "تحويل إلى مستند"

---

### TC-FE-003: Convert Buttons Visible for DOCUMENT Artifact

**Technique:** Equivalence Partitioning

**Setup:** Canvas open, current artifact is type DOCUMENT

**Expected:** Both "PPT" and "DOCX" buttons visible

**Pass criteria:** Both buttons render

---

### TC-FE-004: Convert Buttons Visible for HTML Artifact

**Technique:** Equivalence Partitioning

**Setup:** Canvas open, current artifact is type HTML

**Expected:** Both "PPT" and "DOCX" buttons visible

**Pass criteria:** Both buttons render

---

### TC-FE-005: Convert Buttons Hidden for TABLE Artifact

**Technique:** Equivalence Partitioning (convert button hidden)

**Setup:** Canvas open, current artifact is type TABLE

**Expected:** Neither "PPT" nor "DOCX" button visible

**Pass criteria:** Neither button renders in the toolbar

---

### TC-FE-006: Convert Buttons Hidden for CHART Artifact

**Technique:** Equivalence Partitioning

**Setup:** Canvas open, current artifact is type CHART

**Expected:** Neither convert button visible

**Pass criteria:** No PPT/DOCX buttons in toolbar

---

### TC-FE-007: Convert Buttons Hidden for FILE Artifact

**Technique:** Equivalence Partitioning

**Setup:** Canvas open, current artifact is type FILE

**Expected:** Neither convert button visible

**Pass criteria:** No PPT/DOCX buttons in toolbar

---

### TC-FE-008: CHART with content.url Renders as Img (Media-MCP Path)

**Technique:** Equivalence Partitioning (new chart rendering path)

**Setup:** CHART artifact with `content.url` set to a Supabase image URL

**Expected:** Artifact renders as `<img src="url">` via MediaRenderer

**Pass criteria:**
- No Highcharts component rendered
- An `<img>` tag is present with `src` matching the Supabase URL
- Image loads and displays

---

### TC-FE-009: CHART without content.url Falls Back to Highcharts

**Technique:** Equivalence Partitioning (legacy chart rendering fallback)

**Setup:** CHART artifact with `content.url` undefined or null (legacy format)

**Expected:** Artifact renders via StrategyReportChartRenderer (Highcharts)

**Pass criteria:**
- Highcharts component renders
- No broken image tag

---

### TC-FE-010: FILE Artifact Renders as Download Card

**Technique:** Equivalence Partitioning (FILE artifact rendering)

**Setup:** FILE artifact with `content.url` pointing to a `.pptx` Supabase URL, `content.filename` set

**Expected:** FileRenderer renders a download card showing the filename and a Download button

**Pass criteria:**
- FileRenderer component renders
- Filename is displayed
- Download button is present

---

### TC-FE-011: Download Button Triggers URL Download for FILE Artifact

**Technique:** Equivalence Partitioning (URL-based download)

**Setup:** Canvas has a FILE artifact with a `.pptx` content.url

**Steps:**
1. Click the canvas "Download" button (ArrowDownTrayIcon in the toolbar)

**Expected:** Browser triggers a file download from the Supabase URL

**Pass criteria:**
- `downloadArtifact()` creates an `<a>` element with `href = artifact.content.url`
- `.click()` is called
- Browser download dialog appears (or file saves directly)
- The HTML export path (DOM clone) is NOT executed

---

### TC-FE-012: Download Button Uses HTML Export for Non-FILE Artifacts

**Technique:** Equivalence Partitioning (HTML export fallback preserved)

**Setup:** Canvas has a REPORT artifact (no content.url)

**Steps:**
1. Click the canvas "Download" button

**Expected:** Browser downloads an `.html` file built from the DOM clone

**Pass criteria:**
- `downloadArtifact()` proceeds to the DOM-clone branch (not the URL branch)
- A `.html` file is downloaded
- File contains the rendered artifact content

---

### TC-FE-013: PPT Button Click Sends Correct System Message

**Technique:** Unit/Integration (message content verification)

**Setup:** Canvas has REPORT artifact with title "Q3 Water Sector Assessment"

**Steps:**
1. Click "PPT" button

**Expected:** The message sent to the API is exactly:
```
[SYSTEM: User requested PPTX conversion of the above report "Q3 Water Sector Assessment". Follow the PPTX workflow: propose slide structure, align with user, then generate.]
```

**Pass criteria:**
- Message content matches the template exactly (title interpolated correctly)
- Message option `suppress_canvas_auto_open: true` is included

---

### TC-FE-014: DOCX Button Click Sends Correct System Message

**Technique:** Unit/Integration

**Setup:** Canvas has REPORT artifact with title "Intervention Plan"

**Steps:**
1. Click "DOCX" button

**Expected:** Message sent is:
```
[SYSTEM: User requested DOCX conversion of the above report "Intervention Plan". Follow the DOCX workflow: propose TOC structure, align with user, then generate.]
```

**Pass criteria:**
- Message content matches template with correct title
- `suppress_canvas_auto_open: true` included

---

### TC-FE-015: Convert Buttons Hidden When No Artifact Active

**Technique:** Equivalence Partitioning (edge case)

**Setup:** Canvas is open but `currentArtifact` is null

**Expected:** Neither convert button renders

**Pass criteria:** The condition `currentArtifact && ['REPORT', ...]` evaluates to falsy when `currentArtifact` is null. No buttons rendered. No errors thrown.

---

## 9. Dependencies

### 9.1 Backend Services

| Service | Port | Status | Dependency |
|---|---|---|---|
| media-mcp | 8203 | Must be running | File generation will fail without it |
| Noor Router | 8201 | Must be running | LLM will not see media tools |
| Backend API | 8008 | Must be running | All chat functionality |

**Check:** `systemctl status josoor-router-media.service`

### 9.2 Supabase Storage

- Bucket `"media"` must exist in the Supabase project
- Bucket must be configured as public (public URL access required for download cards)
- Environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set in the media-mcp service environment

### 9.3 LLM Prompt Configuration

The prompt updates (Section 2.4) must already be in the `instruction_elements` table. Without them:
- The LLM may still use `<ui-chart>` tags instead of calling `generate_chart_image`
- The LLM may call file generation tools immediately instead of following the content-first workflow

**Verify:** Check Supabase `instruction_elements` table for IDs 453, 460, 461, 462, 463 and confirm the media generation rules are present.

### 9.4 Frontend Dependencies

- `FileRenderer` component must exist (it's referenced in ArtifactRenderer.tsx FILE case)
- `MediaRenderer` component must exist (used for CHART with URL)
- `chatService.sendMessage()` must support a second options argument with `suppress_canvas_auto_open`

---

## 10. What NOT To Do

These actions would break existing functionality. Do not do them until explicitly authorized.

### 10.1 Do NOT Remove Highcharts from package.json

Legacy conversations in the database have `<ui-chart>` tags embedded in historical messages. The Highcharts renderer path in ArtifactRenderer.tsx must remain as a fallback. The condition is `if ((artifact.content as any)?.url)` — if the url is missing, it falls through to Highcharts. Removing Highcharts from package.json would break rendering of all historical chart artifacts.

**When it CAN be removed:** After a database migration that converts all existing `<ui-chart>` CHART artifacts to the URL-based format. This has not happened yet.

### 10.2 Do NOT Remove buildArtifactsFromTags / extractDatasetBlocks

These functions may still be called by the message rendering pipeline for legacy messages. Removing them before confirming no remaining callers will cause runtime errors.

**When they CAN be removed:** After confirming zero callers remain and all historical artifacts have been migrated.

### 10.3 Do NOT Change the Chat API Contract

The backend returns the same `ChatResponse` shape it always has. The media-mcp changes are transparent to the API contract:
- CHART artifacts now have `content.url` set (new field, additive)
- FILE artifact type is new (additive)
- All existing artifact types and response fields are unchanged

No API version bump is required.

### 10.4 Do NOT Call generate_pptx / generate_docx Directly from the Frontend

These tools are LLM-only. The frontend triggers the workflow via a chat system message. The LLM orchestrates the multi-step tool calls (save_spec → generate_image → generate_pptx). The frontend never calls MCP tools directly.

### 10.5 Do NOT Close the Canvas During Conversion

The convert button passes `suppress_canvas_auto_open: true` to prevent the canvas from switching artifacts during the multi-turn workflow. Do not remove this option — the user needs to keep seeing the original report while the LLM proposes structure in the chat panel.

---

## Appendix A: Complete Artifact Type Reference

From the codebase. All artifact types the frontend may encounter:

| Type | Description | Renderer | Convert Buttons |
|---|---|---|---|
| `CHART` | Data visualization (chart image or Highcharts) | MediaRenderer (with URL) or StrategyReportChartRenderer | No |
| `TABLE` | Tabular data | TableRenderer | No |
| `REPORT` | Flowing HTML report with sections | ReportRenderer | Yes (PPT + DOCX) |
| `DOCUMENT` | Structured document | DocumentRenderer | Yes (PPT + DOCX) |
| `HTML` | Raw HTML content | HtmlRenderer | Yes (PPT + DOCX) |
| `MARKDOWN` | Markdown text | MarkdownRenderer | No |
| `CODE` | Code snippet | CodeRenderer | No |
| `MEDIA` | Image or video by URL | MediaRenderer | No |
| `FILE` | Downloadable file (PPTX, DOCX, etc.) | FileRenderer | No |
| `TWIN_KNOWLEDGE` | KSA knowledge display | TwinKnowledgeRenderer | No |
| `GRAPHV001` | Knowledge graph | Graph renderer | No |
| `REACT` | Interactive React component | React renderer | No |

---

## Appendix B: System Message Templates (Exact Strings)

These strings are sent verbatim by the convert button handlers. Copy exactly if re-implementing.

**PPTX conversion:**
```
[SYSTEM: User requested PPTX conversion of the above report "${artifact.title || 'Report'}". Follow the PPTX workflow: propose slide structure, align with user, then generate.]
```

**DOCX conversion:**
```
[SYSTEM: User requested DOCX conversion of the above report "${artifact.title || 'Report'}". Follow the DOCX workflow: propose TOC structure, align with user, then generate.]
```

`${artifact.title || 'Report'}` is a JavaScript template literal — the artifact title is interpolated at click time. If the artifact has no title, the fallback string `'Report'` is used.

---

## Appendix C: File Paths Quick Reference

| Component | Path |
|---|---|
| ArtifactRenderer | `/home/mastersite/development/josoorfe/frontend/src/components/chat/ArtifactRenderer.tsx` |
| CanvasManager | `/home/mastersite/development/josoorfe/frontend/src/components/chat/CanvasManager.tsx` |
| ChatAppPage | `/home/mastersite/development/josoorfe/frontend/src/pages/ChatAppPage.tsx` |
| canvasActions.ts | `/home/mastersite/development/josoorfe/frontend/src/utils/canvasActions.ts` |
| BRD | `/home/mastersite/development/josoorbe/docs/specs/media-mcp-v3/01-BRD-media-mcp-v3.md` |
| TDD | `/home/mastersite/development/josoorbe/docs/specs/media-mcp-v3/02-TDD-media-mcp-v3.md` |
| Implementation Plan | `/home/mastersite/development/josoorbe/docs/specs/media-mcp-v3/03-PLAN-media-mcp-v3.md` |
| media-mcp server dir | `/home/mastersite/development/josoorbe/backend/mcp-server/servers/media-mcp/` |
| Systemd service | `/etc/systemd/system/josoor-router-media.service` |
