# media-mcp Implementation Plan (V3)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development. Orchestrator dispatches one subagent per task, reviews output against test cases. Test cases are IMMUTABLE.

**Goal:** Build standalone MCP server (media-mcp) for chart images, business visuals, PPTX, DOCX generation.

**Architecture:** FastMCP on port 8203, /3/mcp/, own venv, Supabase Storage "media" bucket. 5 tools.

**References:**
- BRD: docs/specs/media-mcp-v3/01-BRD-media-mcp-v3.md
- TDD: docs/specs/media-mcp-v3/02-TDD-media-mcp-v3.md
- Test Cases: TDD Section 9 (IMMUTABLE)

**Orchestrator rules:** Zero code. Delegate all. Review against test cases. Reject failures. Never modify tests. Escalate to Mosab if stuck.

---

## Orchestrator Management Rules

### Escalation Policy
**Maximum retries per phase gate:** 3 attempts. After 3 failed attempts at the same TC-ID:
1. Orchestrator stops dispatching fix agents
2. Orchestrator reports the failing test case(s) and root cause analysis to Mosab
3. Mosab decides: adjust BRD requirement, change approach, or deprioritize

**Regression handling:** After any fix, re-run ALL test cases from the current phase AND all previous phases. If a fix causes a regression in an earlier phase, the regression takes priority.

**Kill condition:** If total implementation time for any single phase exceeds 2x the estimated time, escalate to Mosab for scope reduction.

### Rollback Strategy
**Router config:** Keep the original router_config.yaml backed up before changes. If media-mcp tools cause issues with existing tools, revert to backup.

**Frontend:** All changes use feature detection (e.g., `if (artifact.content?.url)`) so legacy behavior is preserved. If Convert buttons cause issues, they can be hidden by removing the condition block.

**Systemd:** media-mcp is a new service — if it fails, disable it. No existing service is affected.

**Verification:** After Phase 5, run a manual regression test: send a normal chat query, verify existing chart rendering still works, verify existing reports display, verify canvas share/print/download still work.

### Test Immutability Rule
Test cases defined in the TDD (Section 9) are FROZEN. They must NOT be changed during testing. If a test fails:
1. The implementation must be fixed to pass the test
2. If the test reveals a genuine design flaw, it is escalated to the orchestrator
3. The orchestrator decides whether to update the BRD (which then cascades to TDD)
4. Test cases are never silently modified by implementation agents

### Test Audit Process
After each phase:
1. Orchestrator dispatches a test-runner agent (haiku) with the relevant TC-IDs
2. Test agent runs tests and reports pass/fail for each TC-ID
3. Orchestrator reviews failures against BRD requirements
4. If failures exist: dispatch fix agents with specific TC-IDs to address
5. Re-run failed tests only
6. Phase gate passes when all TC-IDs are green

---

## Phase 1: Foundation (10 tasks)

Phase 1 builds the server skeleton, shared modules, infrastructure, and the first tool (`save_spec`) to validate the full pipeline end-to-end. No chart/image/pptx/docx rendering yet -- that is Phase 2+.

---

### Task 1.1: Venv + deps
**Agent model:** haiku
**Files:** Create: `backend/mcp-server/servers/media-mcp/.venv-media/` (venv directory)
**Description:** Create the Python 3.11 virtual environment for media-mcp and install all pinned dependencies per TDD Section 8.4. The venv lives inside the media-mcp server directory, isolated from the main backend venv and the existing mcp-router venv. Install: matplotlib==3.9.3, python-pptx==1.0.2, python-docx==1.1.2, google-genai==1.5.0, fastmcp==2.3.4, httpx==0.28.1, Pillow==11.1.0, arabic-reshaper==3.0.0, python-bidi==0.6.3, squarify==0.4.4, pyyaml==6.0.2, pydantic==2.10.4.
**Expected output:** `.venv-media/` directory exists at `backend/mcp-server/servers/media-mcp/.venv-media/`. Running `.venv-media/bin/python -c "import matplotlib, pptx, docx, fastmcp, httpx, PIL; print('OK')"` prints OK.
**Acceptance criteria:** All 12 packages importable. No version conflicts. Venv uses Python 3.11.
**Constraints:** Do not touch the existing `.venv/` or `.venv-graphrag/` directories. Do not install globally. Do not use `pip install --upgrade pip` without pinning.
**References:** TDD Section 8.3 (setup commands), TDD Section 8.4 (dependency table)
**Dependencies:** None

---

### Task 1.2: theme.json + theme.py
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/theme.json`, Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/theme.py`
**Description:** Create the theme configuration file and its Python loader module per TDD Section 4.8 and TDD Section 8.6. The `theme.json` file defines all brand values (colors, fonts, spacing, logo path, typography hierarchy). The `theme.py` module provides dataclasses (`ThemeColors`, `ThemeFonts`, `ThemeSpacing`, `ThemeConfig`) and a `load_theme()` function that reads `theme.json`, caches the result, and returns a `ThemeConfig` instance. Include the full `typography_hierarchy` block with the 6 levels from BRD Section 6.9 (hero_title, section_title, slide_title, body_large, body, caption) with min_pt, max_pt, weight, and line_height values.
**Expected output:** `theme.json` contains valid JSON matching the schema in TDD 8.6 including colors (primary=#2C3E50, accent=#d4a017, background=#FFFFFF, background_dark=#1A1A2E, text_heading=#2C3E50, text_body=#4A5568, chart_palette with 6 colors), fonts (Inter + Noto Sans Arabic), spacing (margin=100, title_gap=60, element_gap=40, bullet_indent=40), logo_path, and typography_hierarchy. `theme.py` exports `load_theme()` returning a `ThemeConfig` dataclass. Calling `load_theme()` twice returns the same cached instance.
**Acceptance criteria:** `theme.json` validates against the JSON Schema in TDD 8.6. `load_theme()` returns a ThemeConfig with all fields populated. Caching works (second call returns same object). All 6 chart_palette colors are valid hex. All typography_hierarchy levels have min_pt < max_pt.
**Constraints:** Do not add extra fields beyond what TDD specifies. Do not hardcode the path -- accept `config_path` parameter with default "theme.json". Do not use environment variables for theme values.
**References:** TDD Section 4.8 (theme.py code), TDD Section 8.6 (theme.json schema + defaults), BRD Section 6.9 (typography hierarchy), BRD Section 6.1 (brand style)
**Dependencies:** None

---

### Task 1.3: storage.py
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/storage.py`
**Description:** Create the shared Supabase Storage upload module per TDD Section 4.5. This module is used by ALL tools (chart, image, pptx, docx, save_spec) to upload generated files to the "media" bucket. It reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment variables. The `upload_file()` async function takes `file_bytes`, `extension`, optional `user_id` (default "system"), and optional `content_type`. It generates a UUID file_id, builds the path as `{user_id}/{date}/{file_id}.{extension}`, POSTs to the Supabase Storage REST API, and returns `{"url": public_url, "file_id": str(file_id)}`. Include the content-type mapping table: .png -> image/png, .pptx -> application/vnd.openxmlformats-officedocument.presentationml.presentation, .docx -> application/vnd.openxmlformats-officedocument.wordprocessingml.document, .json -> application/json.
**Expected output:** `storage.py` exists with an `upload_file()` async function. Function signature matches TDD 4.5. Uses httpx async client. Raises a clear error on upload failure with the Supabase error message.
**Acceptance criteria:** TC-SPEC-001 (valid spec save uses this module for upload). Function generates unique UUIDs per call. Path pattern matches `{user_id}/{date}/{uuid}.{ext}`. Content-type defaults to octet-stream if extension not in mapping. Environment variables are read at module level (not hardcoded).
**Constraints:** Do not import supabase_client from the main backend. This is a standalone module using httpx directly against the Supabase REST API. Do not create the bucket -- that is Task 1.5. Do not add retry logic in this phase.
**References:** TDD Section 4.5 (storage.py design), BRD Section 11.3 (storage path pattern)
**Dependencies:** Task 1.1 (httpx must be installed)

---

### Task 1.4: guardrails.py
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/guardrails.py`
**Description:** Create the image generation guardrails module per TDD Section 4.6. This module enforces business-only image generation. It contains: (1) `ImageCategory` enum with all 14 categories (icon, icon_set, conceptual_diagram, infographic, org_structure, process_flow, comparison, timeline, matrix, framework, architecture, roadmap, value_chain, cover), (2) `BLOCKED_TERMS` list with all blocked terms from the TDD, (3) `validate_category(category: str)` function that raises ValueError with code INVALID_CATEGORY if the category string is not in the enum, (4) `check_blocklist(description: str)` function that raises ValueError with code BLOCKED_CONTENT if the description contains any blocked term using case-insensitive whole-word regex matching.
**Expected output:** `guardrails.py` exports `ImageCategory`, `BLOCKED_TERMS`, `validate_category()`, and `check_blocklist()`. The enum has exactly 14 members. The blocklist has all terms from TDD 4.6.
**Acceptance criteria:** TC-GUARD-001 through TC-GUARD-010 (guardrail decision table, TDD 9.7). `validate_category("icon")` passes. `validate_category("photograph")` raises ValueError. `check_blocklist("corporate strategy diagram")` passes. `check_blocklist("draw me a cartoon cat")` raises ValueError. Whole-word matching works: "game" blocks but "gamechanger" does not.
**Constraints:** Do not add terms beyond what TDD specifies. Do not add fuzzy matching or AI-based content filtering. Keep it simple: enum + list + two functions.
**References:** TDD Section 4.6 (guardrails.py code), TDD Section 9.7 (guardrail decision table), BRD Section 5.2 (allowed categories and guardrails)
**Dependencies:** None

---

### Task 1.5: Supabase setup
**Agent model:** haiku
**Files:** No files created in repo. Supabase resources created via API/dashboard.
**Description:** Create the Supabase Storage bucket "media" and the `media_audit_log` table. Bucket: name="media", public=true, file_size_limit=50MB, allowed_mime_types=["image/png", "application/json", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]. Table: `media_audit_log` with columns: id (uuid, PK, default gen_random_uuid()), user_id (text, not null), tool_name (text, not null), category (text, nullable -- for generate_image only), description (text, nullable), result_url (text), file_id (text), created_at (timestamptz, default now()), status (text, default 'success'). Create an index on created_at for TTL cleanup queries.
**Expected output:** Bucket "media" exists in Supabase Storage, configured as public. Table `media_audit_log` exists with all columns. Index on `created_at` exists.
**Acceptance criteria:** Uploading a test file to the "media" bucket returns a public URL. The public URL is accessible without authentication. The `media_audit_log` table accepts INSERT statements. Index is visible in Supabase dashboard.
**Constraints:** Do not modify existing buckets (e.g., "uploads"). Do not add RLS policies beyond public read. Use the Supabase MCP tool or Python client -- do not use raw SQL if MCP works.
**References:** BRD Section 11.3 (storage config), TDD Section 8.5 (TTL enforcement references this table), BRD Section 5.2 (audit log requirement)
**Dependencies:** None

---

### Task 1.6: media_router_config.yaml
**Agent model:** haiku
**Files:** Create: `backend/mcp-server/servers/media-mcp/media_router_config.yaml`
**Description:** Create the YAML configuration file for the media-mcp server per TDD Section 2.2. This follows the exact same structure as the existing Noor Router config at `backend/mcp-server/servers/mcp-router/router_config.yaml`. Define all 5 tools with their names, descriptions, and parameter definitions: generate_chart_image, generate_image, generate_pptx, generate_docx, save_spec. Include server block with host=127.0.0.1, port=8203, transport=http. Do NOT include a backends section -- media-mcp tools are implemented directly in server.py (not via wrapper scripts like the Noor Router).
**Expected output:** `media_router_config.yaml` exists with 5 tool definitions and server config. YAML parses without errors. Tool names, descriptions, and parameter names match TDD Section 2.2 exactly.
**Acceptance criteria:** YAML is valid (parseable by pyyaml). All 5 tools present. Parameter names match TDD 2.2. Server port is 8203. No backends section (differs from Noor Router pattern). Tool descriptions are verbatim from TDD 2.2.
**Constraints:** Copy tool descriptions verbatim from TDD Section 2.2 -- do not rephrase. Do not add governance or rate_limit sections (not needed for media-mcp). Do not add parameters not listed in TDD 2.2.
**References:** TDD Section 2.2 (media_router_config.yaml full content), `backend/mcp-server/servers/mcp-router/router_config.yaml` (existing pattern to follow for structure)
**Dependencies:** None

---

### Task 1.7: Server skeleton
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/__init__.py`, Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/server.py`, Create: `backend/mcp-server/servers/media-mcp/__main__.py`
**Description:** Create the FastMCP server entry point per TDD Section 2.3 and 2.4. The `server.py` file creates a FastMCP instance named 'media-mcp' with `stateless_http=True`, and registers all 5 tools as async functions via `@mcp.tool()` decorators. For Phase 1, the 4 generation tools (generate_chart_image, generate_image, generate_pptx, generate_docx) are **stubs** that return `{"error": true, "code": "NOT_IMPLEMENTED", "message": "Tool not yet implemented"}`. The `save_spec` tool is fully implemented (it is the Phase 1 validation tool). The `__main__.py` provides the `run_http()` entry point matching TDD 2.4 pattern. The `__init__.py` is empty. Each stub tool has the correct typed signature matching TDD Section 3 (all parameters with types and defaults).
**Expected output:** Server starts on port 8203 with `python -m media_mcp`. MCP handshake works. `tools/list` returns 5 tools with correct names and parameter schemas. Calling `save_spec` with valid input uploads JSON to Supabase and returns a URL. Calling any other tool returns NOT_IMPLEMENTED error.
**Acceptance criteria:** TC-SPEC-001 (valid spec saved successfully), TC-SPEC-003 (empty spec rejected). Server responds to MCP `tools/list` with all 5 tools. Server responds to MCP `tools/call` for save_spec. Stub tools return structured error (not crash).
**Constraints:** Do not implement chart_renderer, image_generator, pptx_builder, or docx_builder. Stubs only. Do not add middleware, authentication, or logging beyond basic print statements. Follow the existing server.py pattern from Noor Router for startup code.
**References:** TDD Section 2.3 (tool registration pattern), TDD Section 2.4 (server startup), TDD Section 3.5 (save_spec spec), `backend/mcp-server/servers/mcp-router/src/mcp_router/server.py` (existing server pattern)
**Dependencies:** Task 1.1 (venv), Task 1.2 (theme.py), Task 1.3 (storage.py), Task 1.4 (guardrails.py), Task 1.5 (Supabase bucket), Task 1.6 (config YAML)

---

### Task 1.8: Systemd + Caddy
**Agent model:** haiku
**Files:** Create: `/etc/systemd/system/josoor-router-media.service`; Modify: `/home/mastersite/development/josoorbe/Caddyfile` (if route missing)
**Description:** Create the systemd service unit file per TDD Section 8.1 and verify/add the Caddy reverse proxy route per TDD Section 8.2. The systemd unit runs as user=mastersite, group=mastersite, WorkingDirectory is the media-mcp server directory, ExecStart uses the .venv-media python to run `python -m media_mcp`. EnvironmentFile loads both root `.env` and `backend/.env`. Caddy route: `handle /3/mcp/* { reverse_proxy 127.0.0.1:8203 }`. After creating the service file, enable and start it. After verifying Caddy, reload Caddy if modified.
**Expected output:** `josoor-router-media.service` is active and running. `curl http://127.0.0.1:8203/mcp/` returns an MCP response (or connection accepted). Caddy route `/3/mcp/` proxies to port 8203.
**Acceptance criteria:** `systemctl status josoor-router-media` shows active (running). `journalctl -u josoor-router-media --no-pager -n 20` shows no errors. Port 8203 is listening (`ss -tlnp | grep 8203`). Caddy config includes the /3/mcp/ route.
**Constraints:** Do not modify existing systemd services (josoor-router.service, josoor-backend.service). Do not restart Caddy unless the route was actually missing. Do not change the Caddy port or domain.
**References:** TDD Section 8.1 (systemd service file), TDD Section 8.2 (Caddy verification)
**Dependencies:** Task 1.7 (server must exist to start)

---

### Task 1.9: save_spec tool
**Agent model:** sonnet
**Files:** Modify: `backend/mcp-server/servers/media-mcp/src/media_mcp/server.py` (the save_spec implementation within the server skeleton)
**Description:** Fully implement the `save_spec` tool per TDD Section 3.5. This tool validates the full upload pipeline: receives a title and spec JSON object, validates that spec is not empty, serializes spec to JSON bytes, calls `storage.upload_file()` with extension="json" and content_type="application/json", and returns `{"spec_url": url}`. If spec is empty (empty dict or no "slides" key), return error with code INVALID_SPEC. The path in Supabase follows the pattern `{user_id}/{date}/spec_{uuid}.json`. This is the critical Phase 1 validation tool -- if save_spec works end-to-end, it proves the server skeleton, storage module, and Supabase bucket are all working.
**Expected output:** Calling save_spec via MCP with valid input returns a `spec_url` pointing to Supabase Storage. Downloading that URL returns the exact JSON submitted. Calling with empty spec returns INVALID_SPEC error.
**Acceptance criteria:** TC-SPEC-001 (valid spec saved, URL returns exact JSON, content-type is application/json). TC-SPEC-002 (large 20-slide spec saved without truncation, full round-trip). TC-SPEC-003 (empty spec rejected with INVALID_SPEC code, no file uploaded).
**Constraints:** Do not validate the internal structure of the spec (e.g., slide layouts) -- that validation happens in `generate_pptx` when the spec is consumed. Only check for empty. Do not add user_id resolution -- use "system" as default for now.
**References:** TDD Section 3.5 (save_spec input/output schemas and implementation notes), TDD Section 9.5 (TC-SPEC-001 through TC-SPEC-003)
**Dependencies:** Task 1.3 (storage.py), Task 1.5 (Supabase bucket), Task 1.7 (server skeleton with stub)

---

### Task 1.10: TTL cron
**Agent model:** haiku
**Files:** Create: `/etc/systemd/system/josoor-media-cleanup.timer`, Create: `/etc/systemd/system/josoor-media-cleanup.service`, Create: `backend/mcp-server/servers/media-mcp/scripts/cleanup_expired_media.py`
**Description:** Create a systemd timer that runs daily at 03:00 UTC to delete media files older than 30 days per TDD Section 8.5. The cleanup script queries `media_audit_log` for entries where `created_at < now() - interval '30 days'`, extracts the `result_url` path from each, deletes the corresponding file from Supabase Storage "media" bucket, then deletes the audit log entry. The systemd timer triggers the service unit which runs the cleanup script using the .venv-media Python. The script reads Supabase credentials from the same environment files as the main service.
**Expected output:** Timer is enabled and loaded (`systemctl list-timers` shows josoor-media-cleanup.timer). Script runs without error when invoked manually (even if no old entries exist). Script logs how many files were processed.
**Acceptance criteria:** Timer is scheduled for 03:00 UTC daily. Script connects to Supabase successfully. Script handles empty result set gracefully (0 files to delete). Script deletes both the Storage file and the audit log row for each expired entry.
**Constraints:** Do not delete files that are not in the "media" bucket. Do not delete audit log entries without first deleting the Storage file. If Storage deletion fails, log the error but continue to next entry (do not abort). Do not use crontab -- use systemd timer as specified.
**References:** TDD Section 8.5 (TTL enforcement), BRD Section 11.3 (30-day TTL)
**Dependencies:** Task 1.1 (venv), Task 1.5 (Supabase bucket + audit log table)

---

## Phase 1 Gate

Phase 1 is complete when ALL of the following pass:

**Test cases (from TDD Section 9.5):**
- [ ] **TC-SPEC-001:** Valid spec saved successfully -- URL returns exact JSON, content-type is application/json
- [ ] **TC-SPEC-002:** Large spec (20 slides) saved without truncation -- full JSON round-trips correctly
- [ ] **TC-SPEC-003:** Empty spec rejected -- INVALID_SPEC error returned, no file uploaded

**Infrastructure checks:**
- [ ] `.venv-media/` exists and all 12 packages are importable
- [ ] `theme.json` validates against TDD 8.6 JSON Schema
- [ ] `load_theme()` returns ThemeConfig with all fields populated
- [ ] `storage.upload_file()` successfully uploads to Supabase "media" bucket
- [ ] `guardrails.validate_category()` and `check_blocklist()` work per TDD 9.7 decision table
- [ ] Supabase "media" bucket exists and is public
- [ ] `media_audit_log` table exists and accepts inserts
- [ ] `media_router_config.yaml` parses and contains 5 tool definitions
- [ ] Server starts on port 8203 and responds to MCP `tools/list` with 5 tools
- [ ] `josoor-router-media.service` is active and running
- [ ] Caddy `/3/mcp/` route proxies to port 8203
- [ ] 4 stub tools return NOT_IMPLEMENTED error (do not crash)
- [ ] `josoor-media-cleanup.timer` is enabled and scheduled for 03:00 UTC

---

## Phase 2: Chart Rendering (3 tasks)

Phase 2 implements the full chart rendering pipeline, replacing the `generate_chart_image` stub with a working Matplotlib-based renderer that supports all 11 chart types, Josoor brand theming, and Arabic RTL text.

---

### Task 2.1: chart_renderer.py
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/chart_renderer.py`
**Description:** Create the Matplotlib rendering pipeline per TDD Section 4.1. Implement the `render_chart()` async function that takes chart_type, title, data, options, width, height, and a ThemeConfig, and returns PNG bytes. Use the Matplotlib Agg backend (headless server-safe). Create the chart type dispatch map for all 11 types: bar (ax.barh() horizontal bars), column (ax.bar() vertical bars), line (ax.plot() with markers), area (ax.fill_between() with semi-transparent fill), pie (ax.pie() standard), donut (ax.pie() with white circle center at inner radius 0.5), radar (PolarAxes spider chart), scatter (ax.scatter() dot plot), combo (ax.bar() + ax.plot() on twinx -- first series bar, rest line), waterfall (custom stacked bar with positive green, negative red, connector lines), treemap (squarify.plot() proportional rectangles). Apply Josoor theme colors from theme.py: background color from theme.colors.background, title font from theme.fonts.heading with size from typography hierarchy, data colors from theme.colors.chart_palette (6 colors, cycled if more series), grid as light gray dashed at 0.3 alpha, spines removed except bottom and left. Support custom series colors (when series includes a "color" field, use that hex color instead of theme palette). Support stacked mode (when options.stacked is true, stack bars/columns). Create figure with figsize=(width/100, height/100) at dpi=150. Add legend if options.legend is not false and series count > 1. Set axis labels from options.axis_labels (x and y). Render to BytesIO as PNG and return bytes.
**Expected output:** `chart_renderer.py` exists with an async `render_chart()` function. Calling it with any of the 11 chart types produces valid PNG bytes. Theme colors are applied. Custom series colors override theme palette. Stacked mode stacks bars vertically.
**Acceptance criteria:** TC-CHART-007 (custom colors in series applied -- bar chart with color "#FF0000" renders red bars). TC-CHART-008 (stacked bar chart -- columns are stacked not side-by-side, total heights are visually proportional).
**Constraints:** Do not add chart types beyond the 11 specified. Do not add animation or interactivity. Use Agg backend only (no GUI backends). Do not import from the main backend codebase. Keep all rendering synchronous within the async wrapper (Matplotlib is not async-native).
**References:** TDD Section 4.1 (chart_renderer.py design, dispatch map, theme application, RTL handling), TDD Section 3.1 (generate_chart_image input/output schemas)
**Dependencies:** Task 1.1 (venv with matplotlib, squarify), Task 1.2 (theme.py for ThemeConfig)

---

### Task 2.2: generate_chart_image tool
**Agent model:** sonnet
**Files:** Modify: `backend/mcp-server/servers/media-mcp/src/media_mcp/server.py`
**Description:** Wire chart_renderer.py into server.py by replacing the generate_chart_image stub with the full implementation per TDD Section 3.1. The tool function receives chart_type (str), title (str), data (dict with categories and series), options (dict, optional), width (int, default 800), and height (int, default 500). Implementation pipeline: (1) Validate chart_type is one of the 11 allowed types -- if not, return error with code INVALID_CHART_TYPE. (2) Validate data has non-empty categories and non-empty series -- if not, return error with code INVALID_DATA. (3) Validate width is between 200 and 2000, height is between 150 and 1500 -- if not, return error with code INVALID_DATA with message specifying the valid range. (4) Load theme via theme.load_theme(). (5) Call chart_renderer.render_chart() with all parameters and theme. (6) Call storage.upload_file() with the PNG bytes, extension="png", content_type="image/png". (7) Return {"url": url, "file_id": file_id}. If chart_renderer raises an exception, return error with code CHART_RENDER_FAILED. If storage upload fails, return error with code UPLOAD_FAILED.
**Expected output:** Calling generate_chart_image via MCP with valid input returns a URL to a PNG image in Supabase Storage. Calling with invalid chart_type returns INVALID_CHART_TYPE. Calling with empty data returns INVALID_DATA. Calling with out-of-range dimensions returns INVALID_DATA.
**Acceptance criteria:** TC-CHART-001 (valid bar chart renders -- response contains url and file_id, URL returns HTTP 200 with content-type image/png, PNG opens without corruption, dimensions approximately 800x500px). TC-CHART-003 (invalid chart type "histogram" rejected with INVALID_CHART_TYPE code). TC-CHART-004 (empty data rejected with INVALID_DATA code). TC-CHART-005 (Arabic locale with RTL text -- chart renders with Arabic title and labels, text properly shaped, categories right-to-left). TC-CHART-006 (all 11 chart types render -- each returns url and file_id with valid PNG, no errors). TC-CHART-009 (minimum dimensions 200x150 accepted -- PNG renders at approximately 200x150px). TC-CHART-010 (maximum dimensions 2000x1500 accepted -- PNG renders within 3 seconds). TC-BND-001 (chart width at minimum 200px -- renders without error). TC-BND-002 (chart width at maximum 2000px -- renders within 3 seconds). TC-BND-003 (chart width 199px below minimum -- INVALID_DATA error returned). TC-BND-004 (chart width 2001px above maximum -- INVALID_DATA error returned). TC-BND-005 (chart width zero -- INVALID_DATA error returned). TC-BND-006 (chart height at minimum 150px -- renders successfully).
**Constraints:** Do not modify other tool implementations. Do not add parameters beyond what TDD Section 3.1 specifies. Do not add audit logging for charts (audit log is only for image generation). Error responses must follow the consistent error format: {"error": true, "code": "...", "message": "..."}.
**References:** TDD Section 3.1 (generate_chart_image input/output schemas, error codes), TDD Section 9.1 (TC-CHART-001 through TC-CHART-010), TDD Section 9.8 (TC-BND-001 through TC-BND-006)
**Dependencies:** Task 2.1 (chart_renderer.py), Task 1.3 (storage.py), Task 1.2 (theme.py), Task 1.7 (server skeleton)

---

### Task 2.3: RTL chart support
**Agent model:** sonnet
**Files:** Modify: `backend/mcp-server/servers/media-mcp/src/media_mcp/chart_renderer.py`
**Description:** Add full Arabic RTL text support to chart_renderer.py per TDD Section 4.1 RTL handling. Import arabic_reshaper and bidi.algorithm for proper Arabic glyph shaping. When locale is "ar" in options: (1) Apply Arabic font family via matplotlib.rcParams (use Noto Sans Arabic from theme.fonts). (2) Reshape all text strings (title, subtitle, axis labels, category labels, series names, legend entries) using arabic_reshaper.reshape() followed by bidi.algorithm.get_display() before passing to Matplotlib. (3) Reverse the category axis order for right-to-left reading direction. (4) Set title and label text direction to right-to-left. Ensure that non-Arabic text mixed with Arabic renders correctly. Ensure that the reshaping handles edge cases like empty strings and strings with only numbers.
**Expected output:** Charts with locale "ar" render with properly shaped Arabic glyphs (not broken/disconnected letters). Category axis reads right-to-left. Arabic font (Noto Sans Arabic) is used for all text elements. Mixed Arabic/English text renders correctly.
**Acceptance criteria:** TC-CHART-002 (valid pie chart with multiple series -- pie chart renders 4 segments matching data proportions, legend visible, theme colors applied). TC-CHART-005 (Arabic locale with RTL text -- chart renders with Arabic title and labels, text properly shaped not broken glyphs, categories appear right-to-left).
**Constraints:** Do not modify the chart type dispatch logic. Only add RTL-specific code paths. Do not add font files -- rely on system-installed Noto Sans Arabic or the font path from theme.json. Do not use plt.rcParams globally -- set per-figure to avoid affecting concurrent renders.
**References:** TDD Section 4.1 (RTL text handling section), TDD Section 9.1 (TC-CHART-002, TC-CHART-005)
**Dependencies:** Task 2.1 (chart_renderer.py must exist), Task 1.1 (venv with arabic-reshaper and python-bidi), Task 1.2 (theme.py for Arabic font config)

---

## Phase 2 Gate

Phase 2 is complete when ALL of the following pass:

**Test cases (from TDD Section 9.1 and 9.8):**
- [ ] **TC-CHART-001:** Valid bar chart renders successfully -- response contains url and file_id, URL returns HTTP 200 with content-type image/png, PNG opens without corruption, dimensions approximately 800x500px
- [ ] **TC-CHART-002:** Valid pie chart with multiple series -- PNG renders 4 segments matching data proportions, legend visible, theme colors applied
- [ ] **TC-CHART-003:** Invalid chart type "histogram" rejected with INVALID_CHART_TYPE code, no file generated, no Supabase upload
- [ ] **TC-CHART-004:** Empty data rejected with INVALID_DATA code, no file generated
- [ ] **TC-CHART-005:** Arabic locale with RTL text -- chart renders with Arabic title and labels, text properly shaped, categories right-to-left
- [ ] **TC-CHART-006:** All 11 chart types render -- each returns url and file_id with valid PNG, no errors
- [ ] **TC-CHART-007:** Custom colors in series applied -- bar chart with color "#FF0000" renders red bars
- [ ] **TC-CHART-008:** Stacked bar chart -- columns stacked not side-by-side, total heights visually proportional
- [ ] **TC-CHART-009:** Minimum dimensions 200x150 accepted, PNG renders without error
- [ ] **TC-CHART-010:** Maximum dimensions 2000x1500 accepted, render completes within 3 seconds
- [ ] **TC-BND-001:** Chart width at minimum 200px renders without error, image width approximately 200px
- [ ] **TC-BND-002:** Chart width at maximum 2000px renders within 3 seconds, image width approximately 2000px
- [ ] **TC-BND-003:** Chart width 199px below minimum returns INVALID_DATA error, no chart rendered
- [ ] **TC-BND-004:** Chart width 2001px above maximum returns INVALID_DATA error
- [ ] **TC-BND-005:** Chart width zero returns INVALID_DATA error
- [ ] **TC-BND-006:** Chart height at minimum 150px renders successfully

---

## Phase 3: Image Generation (2 tasks)

Phase 3 implements the AI-powered business image generation pipeline, replacing the `generate_image` stub with a working Google Gemini Image API integration that enforces business-only guardrails and maintains an audit trail.

---

### Task 3.1: image_generator.py
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/image_generator.py`
**Description:** Create the Google Gemini Image API client module per TDD Section 4.2. Define the BUSINESS_PREFIX constant: "Professional business diagram for a government strategy platform. Clean, minimal corporate style. No people, no photographs, no text overlays." Implement the async `generate_image()` function that takes category (str), description (str), style (str), locale (str), width (int), and height (int), and returns image bytes. Pipeline: (1) Call guardrails.validate_category(category) -- raises ValueError if invalid. (2) Call guardrails.check_blocklist(description) -- raises ValueError if blocked terms found. (3) Build the full prompt as f"{BUSINESS_PREFIX} Category: {category}. Style: {style}. {description}". (4) If locale is "ar", append " Include Arabic text where appropriate." to the prompt. (5) Create a google.genai Client using api_key from os.environ['GEMINI_IMAGE_API_KEY']. (6) Call client.models.generate_images() with model='imagen-3.0-generate-002', the full prompt, and config with number_of_images=1 and aspect_ratio calculated from width/height using a helper function _calc_aspect_ratio(). (7) Extract image bytes from the response. (8) Resize if needed using Pillow to match requested width/height. (9) Return bytes. Also implement the async `log_audit()` function that takes user_id (str), category (str), description (str), and result_url (str), and writes an entry to the media_audit_log Supabase table via httpx POST to the Supabase REST API. The audit log entry includes: user_id, tool_name ("generate_image"), category, description, result_url, and status ("success"). Read SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment variables for the audit log write.
**Expected output:** `image_generator.py` exists with the BUSINESS_PREFIX constant, the async `generate_image()` function, and the async `log_audit()` function. The BUSINESS_PREFIX starts with "Professional business diagram for a government strategy platform." The generate_image function calls guardrails before making the API call. The log_audit function writes to the media_audit_log table.
**Acceptance criteria:** TC-IMG-007 (business prefix prepended to API prompt -- the actual prompt sent to the image API starts with the BUSINESS_PREFIX, verified via audit log or request interceptor). TC-IMG-009 (Arabic locale image -- image generated with Arabic text prompt augmentation, locale "ar" appends Arabic instruction to prompt).
**Constraints:** Do not hardcode the API key -- read from environment variable GEMINI_IMAGE_API_KEY. Do not import from the main backend codebase (use httpx directly for Supabase audit log writes, not supabase_client). Do not add retry logic in this phase. Do not cache API responses. Do not add rate limiting (that is infrastructure-level concern).
**References:** TDD Section 4.2 (image_generator.py design, BUSINESS_PREFIX, generate_image pipeline, log_audit function, audit log format), TDD Section 3.2 (generate_image input/output schemas, error codes)
**Dependencies:** Task 1.1 (venv with google-genai, Pillow, httpx), Task 1.4 (guardrails.py for validate_category and check_blocklist), Task 1.5 (Supabase media_audit_log table)

---

### Task 3.2: generate_image tool
**Agent model:** sonnet
**Files:** Modify: `backend/mcp-server/servers/media-mcp/src/media_mcp/server.py`
**Description:** Wire image_generator.py into server.py by replacing the generate_image stub with the full implementation per TDD Section 3.2. The tool function receives category (str), description (str), style (str, default "corporate"), locale (str, default "en"), width (int, default 1024), and height (int, default 768). Implementation pipeline: (1) Validate description length is at least 10 characters -- if not, return error with code INVALID_DATA and message "Description must be at least 10 characters". (2) Call guardrails.validate_category(category) -- if ValueError raised, return error with code INVALID_CATEGORY and the exception message. (3) Call guardrails.check_blocklist(description) -- if ValueError raised, return error with code BLOCKED_CONTENT and the exception message. (4) Call image_generator.generate_image() with all parameters -- if exception raised, return error with code IMAGE_API_ERROR and the exception message. (5) Call storage.upload_file() with the image bytes, extension="png", content_type="image/png" -- if exception raised, return error with code UPLOAD_FAILED. (6) Call image_generator.log_audit() with user_id="system", category, description, and the result URL. (7) Return {"url": url, "file_id": file_id}. The order of validation is critical: description length first, then category validation, then blocklist check -- this ensures INVALID_CATEGORY is returned before BLOCKED_CONTENT when the category itself is invalid.
**Expected output:** Calling generate_image via MCP with a valid category and clean description returns a URL to a PNG image in Supabase Storage and creates an audit log entry. Calling with an invalid category returns INVALID_CATEGORY. Calling with blocked terms returns BLOCKED_CONTENT. Calling with an empty description returns INVALID_DATA.
**Acceptance criteria:** TC-IMG-001 (valid business category "icon" accepted -- image generated, URL returns valid PNG/JPEG, audit log entry created). TC-IMG-002 (valid business category "process_flow" accepted -- image generated, audit log contains category and description). TC-IMG-003 (all 14 valid categories accepted -- each returns url and file_id with valid image URLs). TC-IMG-004 (invalid category "landscape_painting" rejected with INVALID_CATEGORY code, no image generated, no API call made). TC-IMG-005 (blocked term "cartoon" in description rejected with BLOCKED_CONTENT code, blocked term identified in message, no API call made). TC-IMG-006 (blocked term "weapon" in description rejected with BLOCKED_CONTENT code). TC-IMG-007 (business prefix prepended to API prompt -- prompt starts with BUSINESS_PREFIX). TC-IMG-008 (audit log entry created on success -- entry contains timestamp, category, description, result URL, user_id). TC-IMG-009 (Arabic locale image -- image generated with Arabic text prompt augmentation). TC-IMG-010 (empty description rejected with INVALID_DATA code and message "Description must be at least 10 characters", no API call). TC-GUARD-001 (valid category "icon", clean description, no blocked terms -- image generated successfully). TC-GUARD-002 (valid category "matrix", blocked term "game" present -- BLOCKED_CONTENT error, term "game" identified). TC-GUARD-003 (invalid category "landscape", clean description -- INVALID_CATEGORY error returned before blocklist check). TC-GUARD-004 (invalid category "selfie" -- INVALID_CATEGORY error, category validation fails first before blocklist check on description). TC-GUARD-005 (valid category "cover", empty description -- INVALID_DATA error, description length validation fails at minimum 10 characters). TC-GUARD-006 (valid category "timeline", blocked term "anime" present -- BLOCKED_CONTENT error, term "anime" identified).
**Constraints:** Do not modify other tool implementations. Do not add parameters beyond what TDD Section 3.2 specifies. Error responses must follow the consistent error format: {"error": true, "code": "...", "message": "..."}. The validation order must be: description length, then category, then blocklist -- this matches the guardrail decision table expectations where INVALID_CATEGORY is returned before BLOCKED_CONTENT.
**References:** TDD Section 3.2 (generate_image input/output schemas, error codes), TDD Section 4.2 (image_generator.py design), TDD Section 4.6 (guardrails.py), TDD Section 9.2 (TC-IMG-001 through TC-IMG-010), TDD Section 9.7 (TC-GUARD-001 through TC-GUARD-006)
**Dependencies:** Task 3.1 (image_generator.py), Task 1.3 (storage.py), Task 1.4 (guardrails.py), Task 1.7 (server skeleton)

---

## Phase 3 Gate

Phase 3 is complete when ALL of the following pass:

**Test cases (from TDD Section 9.2 and 9.7):**
- [ ] **TC-IMG-001:** Valid business category "icon" accepted -- image generated, URL returns valid PNG/JPEG, audit log entry created
- [ ] **TC-IMG-002:** Valid business category "process_flow" accepted -- image generated, audit log contains category and description
- [ ] **TC-IMG-003:** All 14 valid categories accepted -- each returns url and file_id with valid image URLs
- [ ] **TC-IMG-004:** Invalid category "landscape_painting" rejected with INVALID_CATEGORY code, no image generated, no API call made
- [ ] **TC-IMG-005:** Blocked term "cartoon" in description rejected with BLOCKED_CONTENT code, blocked term identified in message, no API call made
- [ ] **TC-IMG-006:** Blocked term "weapon" in description rejected with BLOCKED_CONTENT code
- [ ] **TC-IMG-007:** Business prefix prepended to API prompt -- prompt starts with BUSINESS_PREFIX, verified via audit log or request interceptor
- [ ] **TC-IMG-008:** Audit log entry created on success -- entry contains timestamp, category, description, result URL, user_id
- [ ] **TC-IMG-009:** Arabic locale image -- image generated with Arabic text prompt augmentation
- [ ] **TC-IMG-010:** Empty description rejected with INVALID_DATA code and message "Description must be at least 10 characters", no API call
- [ ] **TC-GUARD-001:** Valid category "icon", clean description, no blocked terms -- image generated successfully
- [ ] **TC-GUARD-002:** Valid category "matrix", blocked term "game" present -- BLOCKED_CONTENT error, term "game" identified
- [ ] **TC-GUARD-003:** Invalid category "landscape", clean description -- INVALID_CATEGORY error returned before blocklist check
- [ ] **TC-GUARD-004:** Invalid category "selfie" -- INVALID_CATEGORY error, category validation fails first
- [ ] **TC-GUARD-005:** Valid category "cover", empty description -- INVALID_DATA error, description length validation fails
- [ ] **TC-GUARD-006:** Valid category "timeline", blocked term "anime" present -- BLOCKED_CONTENT error, term "anime" identified

---

## Phase 4: PPTX + DOCX Assembly

The most complex phase. PPTX tasks (4.1-4.4) come first, then DOCX tasks (4.5-4.7).

---

### Task 4.1: Josoor PPTX template
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/templates/josoor.pptx`
**Description:** Create a python-pptx template with master slides. Brand colors (gold #d4a017, dark #1A1A2E, text #2C3E50/#4A5568). Fonts (Noto Sans Arabic, Inter). Logo placeholder on title slide. Slide layouts for the 19 layout types from BRD Section 6.3: title, section_divider, content_visual, content_text, comparison, data_highlight, closing, chart_left, chart_full, chart_text, table_full, visual_text, visual_full, two_column, bullets_icon, process_flow, timeline, matrix, key_message. Slide dimensions: 13,716,000 x 9,144,000 EMU (10" x 7.5" standard 16:9). Template must contain a blank layout that the zone engine can use for programmatic element placement.
**Expected output:** A `.pptx` template file that python-pptx can load via `Presentation("templates/josoor.pptx")`. Template contains master slide with brand colors and a blank layout for programmatic zone placement.
**Acceptance criteria:** Visual verification -- template opens in python-pptx without error. Has correct slide dimensions (16:9). Brand colors are set in the slide master. Fonts are referenced. Logo placeholder exists on the title layout.
**Constraints:** Web-safe fonts only. No # prefix in hex codes when setting python-pptx RgbColor values (causes corruption per powerpoint skill). Use `RGBColor(0xd4, 0xa0, 0x17)` not string hex with #.
**References:** BRD Section 6.1 (brand style), BRD Section 6.3 (19 layout types), TDD Section 4.3 (template loading), TDD Section 8 (infrastructure)
**Dependencies:** None

---

### Task 4.2: pptx_builder.py
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/pptx_builder.py`
**Description:** TDD Section 4.3. Implement the full PPTX assembly module with four key components. (1) Zone engine: POSITION_GRID mapping 14 position names (top_left, top_center, top_right, left_half, center, right_half, bottom_left, bottom_center, bottom_right, full_width, full_slide, left_third, center_third, right_third) to EMU coordinate tuples (left, top, width, height). Slide dimensions: SLIDE_W=13,716,000, SLIDE_H=9,144,000, MARGIN=914,400. (2) Layout router: LAYOUT_DEFAULTS dict mapping each of the 19 layout types to expected zones and visual_weight. (3) Image download: async function using httpx to download images from URLs with timeout=10, validate content-type is image/*, and embed as binary bytes via slide.shapes.add_picture(BytesIO(bytes), left, top, width, height). (4) RTL support: apply_rtl() function setting paragraph.alignment=PP_ALIGN.RIGHT, bidi attribute via XML pPr.set(qn('a:rtl'), '1'), and Arabic font family for locale "ar". Main entry point: async `build_presentation(spec, theme, locale) -> bytes` that loads the template, iterates slides, places elements using the zone engine, downloads and embeds images, applies RTL if needed, injects speaker notes, and returns PPTX bytes via BytesIO.
**Expected output:** Module with async `build_presentation(spec, theme, locale) -> bytes` function. The POSITION_GRID dict has all 14 entries with correct EMU values from TDD 4.3. LAYOUT_DEFAULTS has all 19 entries. Image download embeds binary bytes, not URL references.
**Acceptance criteria:** TC-PPTX-001 (basic presentation builds with 3 slides, opens without corruption, all images embedded as binary). TC-PPTX-003 (image embedding verification -- PPTX shows images offline). TC-PPTX-004 (Arabic RTL -- text alignment RIGHT, Arabic font applied, bidi flag set). TC-PPTX-009 (all 19 layout types render without error). TC-PPTX-011 (21 slides rejected with SLIDE_LIMIT_EXCEEDED before assembly). TC-PPTX-012 (speaker notes present on content slides). TC-PPTX-013 (spec_url parameter loads remote spec JSON via httpx).
**Constraints:** Must use POSITION_GRID coordinates exactly as defined in TDD 4.3. Must embed images as binary bytes, not URL references. Must support all 19 layout types. Must enforce 20-slide cap before starting assembly.
**References:** TDD Section 4.3 (full module design with POSITION_GRID, LAYOUT_DEFAULTS, image embedding, RTL support), TDD Section 3.3 (generate_pptx input/output schemas), BRD Section 6.2 (position grid coordinates), BRD Section 6.3 (layout types)
**Dependencies:** Task 4.1 (josoor.pptx template), Task 1.2 (theme.py for ThemeConfig), Task 1.3 (storage.py)

---

### Task 4.3: qa_validator.py (PPTX checks)
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/qa_validator.py`
**Description:** TDD Section 4.7. Implement the QA validation module with QAResult dataclass (passed: bool, check_id: str, message: str) and `validate_pptx(slides, locale, theme) -> List[QAResult]` function running all 13 PPTX QA checks. The 13 checks: (1) PPTX-QA-01: No all-text slides -- at least one of [image, chart_image, callout, arrow_flow, table] must be present, EXCEPT slides whose title contains "Executive Summary" or "Next Steps". (2) PPTX-QA-02: No slide has >5 bullet points -- len(items) <= 5. (3) PPTX-QA-03: No bullet has >10 words -- len(item.split()) <= 10. (4) PPTX-QA-04: Every chart/image has caption -- elements with type "image" or "chart_image" must have non-empty "caption". (5) PPTX-QA-05: Title slide and closing slide exist -- first slide layout == "title", last slide layout == "closing". (6) PPTX-QA-06: Font sizes follow hierarchy -- validated using theme.json typography_hierarchy (slide_title 28-36pt > body 18-22pt > caption 14-16pt). (7) PPTX-QA-07: Color palette matches theme -- any color in series data must be in theme.colors.chart_palette or theme.colors.*. (8) PPTX-QA-08: All images embedded -- validated during build, flagged here if any URL failed. (9) PPTX-QA-09: RTL text direction correct for Arabic -- if locale == "ar", verify RTL attributes set. (10) PPTX-QA-10: File opens without corruption -- python-pptx can re-read saved bytes. (11) PPTX-QA-11: Speaker notes present for all content slides -- slides with layout not in ["title", "section_divider", "closing"] must have non-empty speaker_notes. (12) PPTX-QA-12: Maximum 2 font families used. (13) PPTX-QA-13: Slide count matches spec. Also define `validate_docx()` as a stub returning empty list (DOCX checks added in Task 4.6).
**Expected output:** Module with QAResult dataclass, `validate_pptx()` returning list of QAResult objects, and `validate_docx()` stub. Each QAResult has passed=True/False, the specific check_id (e.g. "PPTX-QA-01"), and a descriptive message identifying which slide failed.
**Acceptance criteria:** TC-PPTX-005 (all-text slide rejected by PPTX-QA-01, error identifies specific slide number). TC-PPTX-006 (Executive Summary all-text slide passes PPTX-QA-01 exception). TC-PPTX-007 (>5 bullets rejected by PPTX-QA-02). TC-PPTX-014 (table element renders -- QA checks pass for well-formed table). TC-BND-011 (exactly 5 bullets passes PPTX-QA-02). TC-BND-012 (6 bullets fails PPTX-QA-02).
**Constraints:** Return structured QAResult objects, not just pass/fail. Each failed check must identify the offending slide index. Warnings vs errors distinction: failed checks are errors (passed=False), informational notes can use passed=True with a message.
**References:** TDD Section 4.7 (all 13 PPTX checks and 8 DOCX checks listed), BRD Section 6.10 (QA checklist)
**Dependencies:** Task 1.2 (theme.py for typography_hierarchy validation in PPTX-QA-06)

---

### Task 4.4: generate_pptx tool
**Agent model:** sonnet
**Files:** Modify: `backend/mcp-server/servers/media-mcp/src/media_mcp/server.py` (replace generate_pptx stub)
**Description:** Wire pptx_builder + qa_validator into the server by replacing the generate_pptx stub with the full implementation per TDD Section 3.3. The tool receives title (str), locale (str, enum "en"/"ar"), optional spec_url (str), and optional slides (list). Implementation pipeline: (1) Enforce oneOf constraint -- if neither spec_url nor slides provided, return error with code INVALID_LAYOUT. If both provided, slides takes precedence and spec_url is ignored. (2) If spec_url provided and no slides, download spec JSON from the URL via httpx -- if fetch fails, return error SPEC_FETCH_FAILED. (3) Validate slide count <= 20 -- if exceeded, return error SLIDE_LIMIT_EXCEEDED with message "Maximum 20 slides per presentation". (4) Load theme via theme.load_theme(). (5) Call pptx_builder.build_presentation(spec, theme, locale) -- if build fails, return error PPTX_BUILD_FAILED. If image download fails during build, return error IMAGE_DOWNLOAD_FAILED. If assembly exceeds 60 seconds, return error TIMEOUT. (6) Run qa_validator.validate_pptx(slides, locale, theme) -- if any check has passed=False, return error QA_VALIDATION_FAILED with details listing each failed check. (7) Call storage.upload_file() with PPTX bytes, extension="pptx" -- if upload fails, return error UPLOAD_FAILED. (8) Return {url, file_id}.
**Expected output:** generate_pptx tool fully functional in the MCP server. Calling via MCP with valid slides returns a URL to a .pptx file in Supabase Storage. QA validation runs before returning.
**Acceptance criteria:** TC-PPTX-001 (basic 3-slide presentation builds successfully). TC-PPTX-002 (file integrity -- python-pptx re-reads without exception, file size > 10KB). TC-PPTX-003 (images embedded as binary). TC-PPTX-004 (Arabic RTL support). TC-PPTX-005 (QA rejects all-text slide). TC-PPTX-006 (QA allows Executive Summary all-text). TC-PPTX-007 (QA rejects >5 bullets). TC-PPTX-008 (QA accepts exactly 5 bullets). TC-PPTX-009 (all 19 layouts render). TC-PPTX-010 (20 slides accepted within 60 seconds). TC-PPTX-011 (21 slides rejected with SLIDE_LIMIT_EXCEEDED). TC-PPTX-012 (speaker notes required for content slides). TC-PPTX-013 (spec_url loads remote spec). TC-PPTX-014 (table renders with header row accent background). TC-PPTX-015 (theme colors applied -- primary for titles, accent for highlights, max 2 fonts). TC-BND-007 (height 1501px -- not applicable to PPTX, chart-only). TC-BND-008 (1-slide PPTX generates). TC-BND-009 (20-slide PPTX generates within 60 seconds).
**Constraints:** Must enforce 20-slide cap before assembly starts. Must embed images as binary. Must run QA validation before returning. Error responses follow consistent format: {"error": true, "code": "...", "message": "...", "details": [...]}. The details field is only present for QA_VALIDATION_FAILED errors.
**References:** TDD Section 3.3 (JSON schema, error codes, implementation notes, oneOf constraint), TDD Section 4.3 (pptx_builder pipeline), TDD Section 4.7 (QA validator), TDD Section 9.3 (TC-PPTX-001 through TC-PPTX-015), TDD Section 9.8 (TC-BND-008 through TC-BND-012)
**Dependencies:** Task 4.2 (pptx_builder.py), Task 4.3 (qa_validator.py), Task 1.3 (storage.py), Task 1.7 (server skeleton)

---

### Task 4.5: Josoor DOCX templates
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/templates/josoor_report.docx`, `backend/mcp-server/servers/media-mcp/templates/josoor_memo.docx`, `backend/mcp-server/servers/media-mcp/templates/josoor_brief.docx`, `backend/mcp-server/servers/media-mcp/templates/josoor_policy.docx`
**Description:** Create four python-docx branded document templates per TDD Section 4.4 style system and BRD Section 7.2. Each template defines heading styles: Heading 1 (22pt Bold, primary color #2C3E50, 24pt space before, page break before), Heading 2 (16pt SemiBold, primary color #2C3E50, 18pt space before), Heading 3 (13pt SemiBold, gray #4A5568, 12pt space before). Body style: 11pt for English / 12pt for Arabic, 1.15 line spacing, 6pt space after, justify alignment for English / right alignment for Arabic. Font family: Inter for English, Noto Sans Arabic for Arabic. Page layout: standard A4 with 1-inch margins. Headers with logo placeholder. Footers with page number field code (auto-incrementing). Cover page layout section with vertical spacing for: centered logo, title (22pt Bold primary centered), subtitle (14pt Regular gray centered), metadata block (date, classification, prepared by, version). Each template type has the same base styles but varies in cover page structure (report has full cover; memo/brief/policy have lighter header-only covers). RTL-ready: section properties include bidi flag support, paragraph direction attributes, right-aligned text defaults for Arabic locale.
**Expected output:** 4 `.docx` template files in the templates directory. Each opens without corruption in python-docx via `Document("templates/josoor_report.docx")`. Heading styles (Heading 1, Heading 2, Heading 3) are defined with correct font sizes, weights, and colors. Body style has correct spacing. Footer contains page number field. Cover page section is present.
**Acceptance criteria:** Visual verification -- each template opens in python-docx without error. Heading 1 is 22pt Bold #2C3E50. Heading 2 is 16pt SemiBold #2C3E50. Heading 3 is 13pt SemiBold #4A5568. Body is 11pt with 1.15 line spacing. Footer has page number field code. Cover page title placeholder is centered.
**Constraints:** Web-safe fonts only (Inter, Noto Sans Arabic). RTL-ready for Arabic -- include bidi-capable section properties. Do not embed actual logo image (use placeholder path from theme.json logo_path). Use `RGBColor(0x2C, 0x3E, 0x50)` not string hex with # (same pattern as PPTX template constraint).
**References:** BRD Section 7.2 (style system), TDD Section 4.4 (docx_builder.py style system, template loading), TDD Section 8 (infrastructure)
**Dependencies:** None

---

### Task 4.6: docx_builder.py
**Agent model:** sonnet
**Files:** Create: `backend/mcp-server/servers/media-mcp/src/media_mcp/docx_builder.py`
**Description:** TDD Section 4.4. Implement the full DOCX assembly module with six key components. (1) Style system: STYLE_MAP dict mapping locale ("en"/"ar") to heading and body style configs per TDD 4.4 -- heading_1 (Inter/Noto Sans Arabic, 22pt, Bold, #2C3E50, 24pt space before, page break before), heading_2 (16pt, Bold, #2C3E50, 18pt space before), heading_3 (13pt, Bold, #4A5568, 12pt space before), body (11pt/12pt, 1.15 line spacing, 6pt space after, JUSTIFY/RIGHT alignment). Theme.json overrides applied via theme.py. (2) TOC generation: add_toc() function using python-docx OxmlElement manipulation to insert Word field codes -- add "Table of Contents" heading, then insert field code begin + instrText `TOC \o "1-3" \h \z \u` + separate + end. TOC auto-updates when opened in Word. Must use field codes, not manual text entries. (3) Cover page builder: build_cover_page() function per TDD 4.4 -- centered logo image (from theme.logo_path), vertical spacing, title (22pt Bold primary centered), subtitle (14pt Regular gray centered), metadata block (date, classification "Internal", prepared by "Noor AI", version "1.0"), page break after cover. (4) Element rendering for all 7 element types from the generate_docx JSON schema (TDD Section 3.4): paragraph (styled body text), bullets (bulleted list items), table (header row with accent background #d4a017 white text, alternating row shading light gray, thin gray borders), image (download via httpx, embed as binary bytes via document.add_picture with max width Inches(6), centered, italic 10pt caption below), chart_image (same as image with source attribution in caption), callout (light accent background, bold text, left border in accent color), page_break (document.add_page_break()). (5) Image download: async function using httpx with timeout=10 to download images from URLs, validate content-type is image/*, embed as binary bytes. Same pattern as PPTX builder. (6) RTL support: apply_rtl_to_document() function per TDD 4.4 -- set bidi flag on section properties, all paragraphs alignment RIGHT, all runs font.name = Noto Sans Arabic, header/footer RTL direction. Main entry point: async `build_document(spec, theme, locale) -> bytes` that loads the report template (v1 uses "report" template only per TDD Fix 7), builds cover page, adds TOC if toc=True, iterates sections adding headings with correct level styles, renders each content element, applies RTL if locale is "ar", and returns DOCX bytes via BytesIO. Mode B only -- accepts structured sections JSON. The LLM handles HTML-to-sections conversion (Mode A per TDD Section 4.4 note on HTML-to-DOCX conversion).
**Expected output:** Module with async `build_document(spec, theme, locale) -> bytes` function. STYLE_MAP dict has "en" and "ar" entries with all heading and body styles. add_toc() inserts Word field codes. build_cover_page() creates cover with logo, title, subtitle, metadata. All 7 element types render correctly. Images embedded as binary bytes. RTL support for Arabic locale.
**Acceptance criteria:** TC-DOCX-001 (basic document with 3 sections builds, opens without corruption, cover page present, TOC present, heading hierarchy correct H1/H1/H2). TC-DOCX-003 (TOC field code present in document XML, heading count matches section count). TC-DOCX-004 (cover page has title, date, classification "Internal", prepared by "Noor AI", version "1.0", logo image). TC-DOCX-005 (Arabic RTL -- text alignment RIGHT, Noto Sans Arabic font, bidi flag set on section properties). TC-DOCX-006 (image embedded as binary, caption italic 10pt below, width <= 6 inches, visible offline). TC-DOCX-007 (chart image embedded with source attribution caption). TC-DOCX-008 (callout has light accent background, bold text, left border accent color). TC-DOCX-009 (table header row accent background #d4a017 white text, alternating row shading, thin borders).
**Constraints:** v1 uses "report" template only (per TDD Fix 7) -- do not implement template type selection logic. TOC must use Word field codes via OxmlElement, not manual text entries. Must embed images as binary bytes, not URL references. Heading levels restricted to 1-3 only. Do not accept raw HTML input -- Mode B structured sections only.
**References:** TDD Section 4.4 (full module design -- style system, TOC generation, cover page, image embedding, RTL support, HTML-to-DOCX note), TDD Section 3.4 (generate_docx JSON schema with 7 element types), BRD Sections 7.1-7.5 (document requirements)
**Dependencies:** Task 4.5 (josoor_report.docx template), Task 1.2 (theme.py for ThemeConfig), Task 1.3 (storage.py)

---

### Task 4.7: generate_docx tool
**Agent model:** sonnet
**Files:** Modify: `backend/mcp-server/servers/media-mcp/src/media_mcp/server.py` (replace generate_docx stub). Modify: `backend/mcp-server/servers/media-mcp/src/media_mcp/qa_validator.py` (replace validate_docx stub with full 8-check implementation from Task 4.3 stub).
**Description:** Wire docx_builder + qa_validator (DOCX checks) into the server by replacing the generate_docx stub with the full implementation per TDD Section 3.4. Also implement the full validate_docx() function in qa_validator.py per TDD Section 4.7. The tool receives title (str), locale (str, enum "en"/"ar"), toc (bool, default true), and sections (list, required). Implementation pipeline: (1) Validate sections is non-empty -- if empty array, return error INVALID_DATA. (2) Validate all heading levels are 1-3 -- if any section has level outside [1, 2, 3], return error INVALID_HEADING_LEVEL with message "Heading level must be 1, 2, or 3". (3) Load theme via theme.load_theme(). (4) Call docx_builder.build_document(spec, theme, locale) -- spec is the dict with title, locale, toc, sections. If build fails, return error DOCX_BUILD_FAILED. If image download fails during build, return error IMAGE_DOWNLOAD_FAILED. If assembly exceeds 30 seconds, return error TIMEOUT. (5) Run qa_validator.validate_docx(sections, locale, document_bytes) with all 8 DOCX QA checks: DOCX-QA-01 (TOC matches actual headings), DOCX-QA-02 (all images embedded), DOCX-QA-03 (page numbers present in footer), DOCX-QA-04 (cover page has title/date/classification/prepared_by), DOCX-QA-05 (no heading without content below it -- every section must have at least one content element), DOCX-QA-06 (tables have header rows -- every table element has non-empty headers array), DOCX-QA-07 (RTL direction correct for Arabic -- bidi attribute on section properties if locale "ar"), DOCX-QA-08 (file opens without corruption -- python-docx re-reads saved bytes). If any check has passed=False, return error QA_VALIDATION_FAILED with details listing each failed check. (6) Call storage.upload_file() with DOCX bytes, extension="docx", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document" -- if upload fails, return error UPLOAD_FAILED. (7) Return {url, file_id, qa_result} where qa_result summarizes all 8 checks.
**Expected output:** generate_docx tool fully functional in the MCP server. qa_validator.py now has both validate_pptx() (from Task 4.3) and validate_docx() (8 checks). Calling generate_docx via MCP with valid sections returns a URL to a .docx file in Supabase Storage plus qa_result. QA validation runs before returning.
**Acceptance criteria:** TC-DOCX-001 (basic document with sections builds successfully, URL returns valid DOCX). TC-DOCX-002 (file integrity -- python-docx re-reads without exception, file size > 5KB). TC-DOCX-003 (TOC field code present, heading count matches). TC-DOCX-004 (cover page has all required fields). TC-DOCX-005 (Arabic RTL support correct). TC-DOCX-006 (image embedded as binary, caption below, max 6 inches). TC-DOCX-007 (chart image with source attribution). TC-DOCX-008 (callout styled correctly). TC-DOCX-009 (table header row formatted). TC-DOCX-010 (QA rejects heading with empty content array via DOCX-QA-05). TC-BND-010 (21 slides -- not applicable to DOCX, PPTX-only). TC-BND-011 (5 bullets passes -- not applicable to DOCX, PPTX-only). TC-BND-012 (6 bullets fails -- not applicable to PPTX-only). TC-BND-013 (heading level 3 valid -- DOCX renders H3 at 13pt SemiBold dark gray). TC-BND-014 (heading level 4 invalid -- returns INVALID_HEADING_LEVEL error, no DOCX generated).
**Constraints:** Must embed images as binary bytes. Must run all 8 QA checks before returning. Heading levels 1-3 only -- level 4+ rejected with INVALID_HEADING_LEVEL before assembly starts. Error responses follow consistent format: {"error": true, "code": "...", "message": "...", "details": [...]}. The details field is only present for QA_VALIDATION_FAILED errors.
**References:** TDD Section 3.4 (generate_docx JSON schema, error codes, implementation notes), TDD Section 4.4 (docx_builder pipeline), TDD Section 4.7 (QA validator -- 8 DOCX checks DOCX-QA-01 through DOCX-QA-08), TDD Section 9.4 (TC-DOCX-001 through TC-DOCX-010), TDD Section 9.8 (TC-BND-013 through TC-BND-014)
**Dependencies:** Task 4.6 (docx_builder.py), Task 4.3 (qa_validator.py base with validate_docx stub), Task 1.3 (storage.py), Task 1.7 (server skeleton)

---

## Phase 4 Gate

Phase 4 is complete when ALL of the following pass:

**PPTX tests (from TDD Section 9.3 and 9.8):**
- [ ] **TC-PPTX-001:** Basic 3-slide presentation builds successfully, opens without corruption, all images embedded as binary
- [ ] **TC-PPTX-002:** File integrity -- python-pptx re-reads without exception, file size > 10KB
- [ ] **TC-PPTX-003:** Images embedded as binary, visible offline
- [ ] **TC-PPTX-004:** Arabic RTL -- text alignment RIGHT, Arabic font applied, bidi flag set
- [ ] **TC-PPTX-005:** QA rejects all-text slide via PPTX-QA-01, error identifies specific slide number
- [ ] **TC-PPTX-006:** QA allows Executive Summary all-text slide (PPTX-QA-01 exception)
- [ ] **TC-PPTX-007:** QA rejects >5 bullets via PPTX-QA-02
- [ ] **TC-PPTX-008:** QA accepts exactly 5 bullets
- [ ] **TC-PPTX-009:** All 19 layout types render without error
- [ ] **TC-PPTX-010:** 20 slides accepted within 60 seconds
- [ ] **TC-PPTX-011:** 21 slides rejected with SLIDE_LIMIT_EXCEEDED
- [ ] **TC-PPTX-012:** Speaker notes present for content slides
- [ ] **TC-PPTX-013:** spec_url loads remote spec JSON via httpx
- [ ] **TC-PPTX-014:** Table renders with header row accent background
- [ ] **TC-PPTX-015:** Theme colors applied -- primary for titles, accent for highlights, max 2 fonts

**DOCX tests (from TDD Section 9.4):**
- [ ] **TC-DOCX-001:** Basic document with sections builds, cover page present, TOC present, heading hierarchy correct
- [ ] **TC-DOCX-002:** File integrity -- python-docx re-reads without exception, file size > 5KB
- [ ] **TC-DOCX-003:** TOC field code present in document XML, heading count matches section count
- [ ] **TC-DOCX-004:** Cover page has title, date, classification, prepared by, version, logo
- [ ] **TC-DOCX-005:** Arabic RTL -- text alignment RIGHT, Noto Sans Arabic font, bidi flag set
- [ ] **TC-DOCX-006:** Image embedded as binary, caption italic 10pt below, width <= 6 inches, visible offline
- [ ] **TC-DOCX-007:** Chart image embedded with source attribution caption
- [ ] **TC-DOCX-008:** Callout has light accent background, bold text, left border accent color
- [ ] **TC-DOCX-009:** Table header row accent background, alternating row shading, thin borders
- [ ] **TC-DOCX-010:** QA rejects heading with empty content array via DOCX-QA-05

**Boundary tests (from TDD Section 9.8):**
- [ ] **TC-BND-007:** Chart height above maximum 1501px returns INVALID_DATA error
- [ ] **TC-BND-008:** 1-slide PPTX generates successfully
- [ ] **TC-BND-009:** 20-slide PPTX generates within 60 seconds
- [ ] **TC-BND-010:** 21 slides rejected with SLIDE_LIMIT_EXCEEDED
- [ ] **TC-BND-011:** Exactly 5 bullets passes PPTX-QA-02
- [ ] **TC-BND-012:** 6 bullets fails PPTX-QA-02
- [ ] **TC-BND-013:** Heading level 3 valid -- DOCX renders H3 at 13pt SemiBold dark gray
- [ ] **TC-BND-014:** Heading level 4 invalid -- returns INVALID_HEADING_LEVEL error, no DOCX generated

**Total: 39 test cases**

---

## Phase 5: Integration (6 tasks)

Phase 5 connects media-mcp to the existing platform: Noor Router forwarding, frontend chart/file rendering, prompt updates, and end-to-end validation across all provider paths.

---

### Task 5.1: Noor Router config update
**Agent model:** haiku
**Files:** Modify: `backend/mcp-server/servers/mcp-router/router_config.yaml`
**Description:** TDD Section 5. Add media-mcp as an HTTP backend to the Noor Router config: `{name: media-mcp, type: http, url: http://127.0.0.1:8203/mcp/}`. Add 5 new tool entries forwarding to this backend with their full parameter descriptions: generate_chart_image (render a data chart as a PNG image -- parameters: chart_type, title, data, options, width, height), generate_image (generate a business visual -- parameters: category, description, style_hint, width, height), generate_pptx (assemble a PowerPoint presentation -- parameters: spec_url, title, user_id), generate_docx (assemble a Word document -- parameters: title, sections, user_id, classification, language), save_spec (save a PPTX slide spec as JSON -- parameters: title, spec). Each tool entry uses `backend: media-mcp` and `type: http`.
**Expected output:** Updated router_config.yaml with a new `media-mcp` backend entry and 5 new forwarded tool entries. Noor Router serves 17 tools total (12 existing + 5 new) when restarted.
**Acceptance criteria:** TC-INT-003 (orchestrator sees all tools including media-mcp tools via Noor Router MCP session)
**Constraints:** Do NOT modify existing tool entries or the existing `local-backend-wrapper` backend. Only ADD the new backend and 5 new tools. Tool descriptions must match TDD Section 5.2 verbatim.
**References:** Existing `backend/mcp-server/servers/mcp-router/router_config.yaml` pattern, TDD Section 5.2 (Option A -- Single Gateway)
**Dependencies:** Phase 4 complete (media-mcp server running with all 5 tools implemented)

---

### Task 5.2: Admin settings verification
**Agent model:** haiku
**Files:** No file changes expected. Supabase admin_settings verification only.
**Description:** TDD Section 5. The TDD recommends Option A (gateway through Noor Router), meaning the orchestrator does NOT need a new MCPConfig endpoint. Verify that the existing Noor Router endpoint in MCPConfig already covers media-mcp tools (since they are forwarded via HTTP backend in Task 5.1). Connect to the Noor Router MCP endpoint and confirm that `tools/list` returns all 17 tools (12 existing + 5 media-mcp). If direct connection is needed instead (Option B), add a new MCPConfig endpoint for media-mcp in Supabase admin_settings with label="media-mcp", url="http://127.0.0.1:8203/mcp/", allowed_tools=["generate_chart_image","generate_image","generate_pptx","generate_docx","save_spec"].
**Expected output:** Verified that media-mcp tools are accessible through the existing Noor Router MCP connection. No admin_settings changes needed if Option A works correctly.
**Acceptance criteria:** TC-INT-003 (orchestrator MCP session includes media tools -- visible in tool list, tool call routed through Noor Router to media-mcp at :8203, response contains valid chart URL)
**Constraints:** Do not modify orchestrator_universal.py. Do not change existing MCPConfig endpoints. Only add a new endpoint if Option A verification fails.
**References:** TDD Section 5.2 (Option A vs Option B), TDD Section 5.3 (changes summary)
**Dependencies:** Task 5.1 (Noor Router config updated with media-mcp backend)

---

### Task 5.3: Frontend -- chart rendering replacement
**Agent model:** sonnet
**Files:** Modify files in `/home/mastersite/development/josoorfe/frontend/src/`:
  - `components/chat/ArtifactRenderer.tsx` -- add URL-based chart rendering via `<img src={url}>`
  - `services/chatService.ts` -- remove/bypass buildArtifactsFromTags, extractDatasetBlocks, adaptArtifacts
  - `utils/visualizationBuilder.ts` -- deprecate (remove imports/references)
  - `utils/visualizationParser.ts` -- deprecate (remove imports/references)
**Description:** TDD Section 6. Replace the client-side chart rendering pipeline with server-rendered image display. Before: LLM produces `<ui-chart>` tags, frontend parses with `buildArtifactsFromTags()` -> `extractDatasetBlocks()` -> `adaptArtifacts()` -> Highcharts/StrategyReportChartRenderer. After: LLM calls `generate_chart_image` tool, gets a URL back, embeds `<img src="url" alt="description">` in HTML response, frontend renders standard `<img>` tag. Remove the tag parsing pipeline functions (buildArtifactsFromTags, extractDatasetBlocks, adaptArtifacts) and their references. Remove StrategyReportChartRenderer component if it exists. Remove Highcharts imports and configuration. When a CHART artifact has `content.url`, render `<img src={url}>` instead of the old chart renderer. Delete `ChartRenderer.tsx` (legacy component).
**Expected output:** Charts display as images from Supabase URLs. No Highcharts rendering. No `<ui-chart>` tag parsing. Standard `<img>` tags render charts in message bubbles.
**Acceptance criteria:** Charts from generate_chart_image render correctly in the frontend as `<img>` elements. No JavaScript console errors from removed chart parsing code. Existing non-chart artifacts (tables, HTML content) continue to render normally.
**Constraints:** Keep existing renderers for non-chart artifacts (tables, code blocks, etc.). Only replace CHART handling. Do not remove Highcharts from package.json in this task (separate cleanup). Use CSS variables from theme.css, no Tailwind.
**References:** TDD Section 6.2 (chart rendering replacement), TDD Section 6.1 (files to modify), existing ArtifactRenderer.tsx
**Dependencies:** Phase 2 complete (charts generate correctly via generate_chart_image)

---

### Task 5.4: Frontend -- convert buttons + FILE download
**Agent model:** sonnet
**Files:** Modify/create in `/home/mastersite/development/josoorfe/frontend/src/`:
  - Create: `components/chat/ConvertButtons.tsx` -- PPTX/DOCX conversion buttons
  - Create: `components/chat/FileDownloadCard.tsx` -- download card for FILE artifacts
  - Modify: `components/chat/CanvasManager.tsx` or `CanvasHeader.tsx` -- add ConvertButtons to message action bar
  - Modify: `components/chat/MessageBubble.tsx` -- render FileDownloadCard for FILE artifacts
  - Modify: `utils/canvasActions.ts` -- URL-based download for FILE artifacts
**Description:** TDD Section 6. Two new components: (1) ConvertButtons: "Convert to PPTX" and "Convert to DOCX" buttons visible only on REPORT/DOCUMENT/HTML artifacts. Visibility rules: `hasReportContent = true` if the message HTML contains `<h1>/<h2>/<h3>` headings, `<table>` elements, `<img>` tags, and content length > 500 characters. Hidden for greetings, short answers, error messages. On click, sends system-injected message: "[SYSTEM: User requested PPTX conversion of the above report. Follow the PPTX workflow.]" or "[SYSTEM: User requested DOCX conversion of the above report. Follow the DOCX workflow.]" via the existing chatService.sendMessage() flow. (2) FileDownloadCard: renders a download card (file icon, filename, "Generated presentation/document" subtitle, Download button) when artifact type is FILE with `content.url`. Detects URLs matching `https://{supabase-domain}/storage/v1/object/public/media/*.pptx` or `*.docx`. Download button triggers `window.open(url)` or anchor tag click. (3) canvasActions.ts: when a FILE artifact has a `content.url`, download directly from that URL instead of building HTML from DOM.
**Expected output:** Convert buttons appear on report/document messages in the action bar. FILE artifacts show styled download cards with icon, filename, and download button. Clicking "Convert to PPTX" sends the correct system message via chat.
**Acceptance criteria:** TC-INT-007 (button triggers correct chat message -- "Convert to PPTX" click sends system message via API, LLM response proposes slide structure not immediate PPTX generation)
**Constraints:** Buttons only on report/document content, not charts/tables/short messages. Use CSS variables from theme.css, no Tailwind. ConvertButtons in same row as existing copy/like actions. FileDownloadCard styled consistently with existing message bubble design.
**References:** TDD Section 6.3 (ConvertButtons component spec), TDD Section 6.4 (FileDownloadCard component spec), TDD Section 6.5 (canvasActions.ts changes), existing CanvasManager.tsx, canvasActions.ts
**Dependencies:** None (can run parallel with Task 5.3)

---

### Task 5.5: Prompt updates
**Agent model:** sonnet
**Files:** No file changes. Supabase `instruction_elements` table updates via Python client or MCP.
**Description:** TDD Section 7. Update 5 rows in the Supabase `instruction_elements` table. APPEND to existing prompt content (do NOT replace). Updates: (1) ID 453 (shared_output_format): Add "## Chart Rendering" section -- "When producing data visualizations, ALWAYS call `generate_chart_image` first. Embed the returned URL as `<img src=\"url\" alt=\"description\">` in your HTML response. NEVER use `<ui-chart>` tags -- they are deprecated and will not render." Add "## File Artifacts" section -- file download link format with `<a href=\"{url}\" download class=\"file-download\">`. (2) ID 460 (general_analysis): Add "## Media Generation Rules" section -- content-first rule ("NEVER call generate_pptx or generate_docx as a first response"), chart images rule, business visuals category reference, redirect rule for "make me a PPT" requests. (3) ID 461 (strategy_brief): Add "## Presentation Design Rules" section -- one message per slide, visual first principle, insight-based titles, max 5 bullets/10 words per bullet, speaker notes requirement, story structure (Executive Summary -> Situation -> Complication -> Findings -> Recommendation -> Roadmap -> Next Steps), "IMPACTFUL, NOT MINIMAL" design principle, use generate_image for context-specific visuals. (4) ID 462 (risk_advisory): Add "## File Generation Guard" section -- content-first rule, only generate files when user explicitly requests or clicks convert button. (5) ID 463 (intervention_planning): Add "## File Generation Guard" section -- same content as risk_advisory addition.
**Expected output:** 5 instruction_elements rows updated with media-mcp guidance appended to existing content. Prompts load correctly via `_build_cognitive_prompt()`.
**Acceptance criteria:** Manual verification -- prompts load correctly, LLM receives the new instructions in its system prompt. `shared_output_format` contains chart rendering rule. All 4 desk prompts contain content-first or file generation guard rules. `strategy_brief` contains presentation design methodology.
**Constraints:** APPEND to existing prompt content. Do NOT replace existing instructions. Do NOT modify instruction element metadata (title, type, is_active). Use the Supabase Python client (not raw SQL) per project access pattern.
**References:** TDD Section 7.1 (elements to update), TDD Section 7.2 (draft content blocks), BRD Section 10 (prompt integration requirements)
**Dependencies:** None

---

### Task 5.6: End-to-end integration testing
**Agent model:** sonnet
**Files:** No files created. Test execution and verification only.
**Description:** Run complete integration tests across all workflows per TDD Section 9.6. Test scenarios: (1) Full PPTX workflow: call generate_chart_image to render 2 charts, call generate_image for 1 business visual, call save_spec with slide structure referencing all URLs, call generate_pptx with spec_url, verify final PPTX contains embedded charts and image, opens without corruption. (2) Full DOCX workflow: call generate_chart_image for 1 chart, call generate_docx with sections referencing chart URL, verify DOCX contains embedded chart image, opens without corruption. (3) Orchestrator multi-server: send a chat message through the API, verify LLM sees all 17 tools (12 knowledge + 5 media), verify tool call routes through Noor Router to media-mcp at :8203. (4) Provider paths: verify tools callable via Groq (native MCP integration), Gemini (MCP session as tool), and OpenAI-compatible (client-side tool loop). (5) Frontend button: verify "Convert to PPTX" button triggers correct chat message via API, verify LLM response proposes slide structure (not immediate PPTX generation).
**Expected output:** All 7 integration tests pass. Full end-to-end workflows verified across all provider paths and frontend interactions.
**Acceptance criteria:** TC-INT-001 (full PPTX workflow -- all 4 calls succeed, PPTX opens without corruption, chart and image embedded and visible offline, slide structure matches spec). TC-INT-002 (full DOCX workflow -- both calls succeed, DOCX opens without corruption, chart embedded and visible offline). TC-INT-003 (orchestrator connects -- MCP session includes media tools, tool call routed through Noor Router, response contains valid chart URL). TC-INT-004 (Groq provider -- Groq receives media tools in MCP server configuration, tool call succeeds, chart URL returned). TC-INT-005 (Gemini provider -- Gemini SDK receives media tools from MCP session, tool call succeeds). TC-INT-006 (OpenAI-compatible provider -- tool list includes media tools, tool call handled via mcp_session.call_tool(), result appended to messages, final response contains chart URL). TC-INT-007 (frontend convert button -- chat message sent via API, LLM response proposes slide structure).
**Constraints:** Do not modify any code to make tests pass. If a test fails, report the failure with details and root cause. Tests validate existing implementation, not create new implementation.
**References:** TDD Section 9.6 (TC-INT-001 through TC-INT-007 full specifications)
**Dependencies:** Tasks 5.1 through 5.5 all complete

---

## Phase 5 Gate

Phase 5 is complete when ALL of the following pass:

**Integration tests (from TDD Section 9.6):**
- [ ] **TC-INT-001:** Full PPTX workflow end-to-end -- all 4 tool calls succeed, PPTX opens without corruption, chart and image embedded and visible offline, slide structure matches saved spec
- [ ] **TC-INT-002:** Full DOCX workflow end-to-end -- both tool calls succeed, DOCX opens without corruption, chart image embedded and visible offline
- [ ] **TC-INT-003:** Orchestrator connects to media-mcp via Noor Router -- MCP session includes media tools, tool call routed through Noor Router to media-mcp at :8203, response contains valid chart URL
- [ ] **TC-INT-004:** Groq provider path with media tools -- Groq receives media tools in MCP server configuration, tool call succeeds, chart URL returned in LLM response
- [ ] **TC-INT-005:** Gemini provider path with media tools -- Gemini SDK receives media tools from MCP session, tool call succeeds
- [ ] **TC-INT-006:** OpenAI-compatible provider path with media tools -- tool list includes media tools, tool call handled via mcp_session.call_tool(), result appended to messages, final response contains chart URL
- [ ] **TC-INT-007:** Frontend convert button triggers PPTX workflow -- chat message sent via API, LLM response proposes slide structure (not immediate PPTX generation)

**Total: 7 test cases**

---

## Risk Mitigations During Implementation

| Risk | Mitigation |
|------|-----------|
| Content-first enforcement | For v1, enforcement is via Tier-1 prompt + frontend button triggers only (no server-side conversation state check). The 100% compliance metric is aspirational -- measured via manual conversation audits. Server-side enforcement deferred to v2. |
| Async generation not implemented | The BRD mentions "async generation option" as a mitigation for large presentations. For v1, presentations are synchronous with a 60s timeout and 20-slide cap. Async generation (background job + notification) deferred to v2. |
| Kaleido risk eliminated | V2 uses Matplotlib instead of Plotly/Kaleido for chart rendering, so the Kaleido v0.2.1 installation risk from V1 is eliminated. Matplotlib's Agg backend requires no external binary dependencies. |
| Cairo/Tajawal fonts not on VPS | Install via `apt-get install fonts-noto-arabic` or bundle font files in the media-mcp package. V3 uses Noto Sans Arabic (system font) referenced via theme.json. |
| Nano Banana API key limits | Check rate limits via Gemini dashboard before Phase 3. Add request throttling if needed. |
| python-pptx template complexity | Start with 3 simple layouts (cover, chart_full, bullets_icon), expand to all 19 incrementally. |
| Supabase Storage bucket permissions | Create bucket and test upload BEFORE Phase 1 tasks start. |

---

## Final Summary

| Phase | Tasks | Gate Tests | Status |
|-------|-------|------------|--------|
| 1. Foundation | 10 | TC-SPEC (3) + infra (13) | Pending |
| 2. Chart Rendering | 3 | TC-CHART (10) + TC-BND (6) | Pending |
| 3. Image Generation | 2 | TC-IMG (10) + TC-GUARD (6) | Pending |
| 4. PPTX + DOCX Assembly | 7 | TC-PPTX (15) + TC-DOCX (10) + TC-BND (8) | Pending |
| 5. Integration | 6 | TC-INT (7) | Pending |
| **Total** | **28 tasks** | **75 test cases** | |

**Execution method:** superpowers:subagent-driven-development
**Orchestrator:** Claude Opus -- zero code, delegate all, review against test cases
**Test case policy:** IMMUTABLE -- never modify during implementation
**Escalation:** To Mosab if agent stuck or test case change needed
