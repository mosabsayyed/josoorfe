# Phase 2 Frontend Integration Instructions

## Overview
Phase 2 backend is complete. Frontend needs to add a single checkbox in Admin Settings to control GraphRAG context injection.

---

## Task: Add GraphRAG Toggle to Admin Settings UI

### File to Modify
`frontend/src/components/AdminSettings.tsx`

---

### What to Add

**1. Add field to settings state/type:**
```typescript
interface AdminSettingsType {
  provider: {
    // ... existing provider fields
  };
  mcp: {
    // ... existing MCP fields
  };
  enable_graphrag_context: boolean;  // NEW FIELD
  updated_at?: string;
  updated_by?: string;
  // ... other existing fields
}
```

**2. Add checkbox UI element:**
Add this section in the Advanced Settings area (or new "Context Enhancement" section):

```tsx
<div className="settings-section">
  <h3>GraphRAG Context Enhancement</h3>
  <div className="setting-item">
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={settings.enable_graphrag_context || false}
        onChange={(e) => 
          setSettings({
            ...settings,
            enable_graphrag_context: e.target.checked
          })
        }
      />
      <span>Enable GraphRAG Semantic Context</span>
    </label>
    <p className="setting-description">
      Inject relevant graph communities into LLM queries for enhanced context-awareness.
      Adds ~300ms latency but improves response quality for complex queries.
    </p>
  </div>
</div>
```

**3. Ensure save/load includes the field:**
The existing save/load logic should automatically handle the new field since it's part of the `AdminSettings` model. Verify:

```typescript
// When loading settings
const loadSettings = async () => {
  const response = await fetch('/api/admin/settings');
  const data = await response.json();
  setSettings(data);  // Should include enable_graphrag_context
};

// When saving settings
const saveSettings = async () => {
  await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)  // Should include enable_graphrag_context
  });
};
```

---

### Styling Recommendations

**Option 1: Add to existing Advanced Settings**
- Place after MCP configuration section
- Use same card/panel styling as other settings

**Option 2: Create new "Performance & Context" section**
```tsx
<div className="settings-card">
  <h2>Performance & Context</h2>
  <div className="setting-item">
    {/* GraphRAG checkbox here */}
  </div>
</div>
```

---

### Testing Checklist

After implementing:

1. **Load Settings:**
   - Open Admin Settings page
   - Verify checkbox loads with current value (default: unchecked)

2. **Toggle & Save:**
   - Check the box
   - Click Save
   - Refresh page
   - Verify checkbox remains checked

3. **Backend Verification:**
   - Check backend logs when you send a chat query
   - Should see: `[GraphRAG] Injected context (XXX chars)` when enabled
   - No GraphRAG logs when disabled

4. **Functional Test:**
   - Enable GraphRAG
   - Send query: "What are the risks in ongoing projects?"
   - Response should include graph context entities
   - Disable GraphRAG
   - Same query should work but without graph context

---

### API Contract (Already Implemented)

**Endpoint:** `GET /api/admin/settings`
**Response:**
```json
{
  "provider": { ... },
  "mcp": { ... },
  "enable_graphrag_context": false,
  "updated_at": "2026-01-20T12:00:00Z"
}
```

**Endpoint:** `POST /api/admin/settings`
**Request Body:**
```json
{
  "provider": { ... },
  "mcp": { ... },
  "enable_graphrag_context": true
}
```

---

### Expected Behavior

**When Enabled (`enable_graphrag_context: true`):**
- Orchestrator calls GraphRAG service before LLM query
- Adds ~300ms latency (embedding + similarity ranking)
- Injects relevant graph communities into prompt
- LLM receives targeted context (max 1500 tokens)

**When Disabled (`enable_graphrag_context: false`):**
- GraphRAG service not called
- No additional latency
- LLM operates with base cognitive prompt only

---

### Troubleshooting

**Checkbox doesn't save:**
- Check browser console for API errors
- Verify `/api/admin/settings` POST returns 200
- Check backend logs for validation errors

**Toggle has no effect on queries:**
- Verify backend setting matches UI (check `backend/data/admin_settings.json`)
- Restart backend if config caching is enabled
- Check backend logs for `[GraphRAG]` messages when enabled

**GraphRAG errors in logs:**
- Ensure Neo4j is running and GraphRAG index built
- Check `ENABLE_GRAPHRAG_CONTEXT` env var if using env override
- Verify embedding service (OpenAI API key) is configured

---

## Summary for Frontend Developer

**What:** Add single checkbox to Admin Settings for GraphRAG toggle  
**Where:** `frontend/src/components/AdminSettings.tsx`  
**Field Name:** `enable_graphrag_context` (boolean)  
**Default:** `false`  
**Backend:** Already implemented, just needs UI  
**Testing:** Enable → send query → check for graph context in response

**Estimated Effort:** 15-30 minutes  
**Dependencies:** None (backend complete)
