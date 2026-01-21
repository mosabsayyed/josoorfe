# MCP Configuration Reference

## Overview

MCP (Model Context Protocol) configuration defines how the backend connects to MCP routers for tool access. Previously stored in file-based `admin_settings.json`, now migrated to database-driven `system_settings` table.

## Architecture

### Four MCP Routers

| Router | Port | Label | Purpose | Persona |
|--------|------|-------|---------|---------|
| Neo4j Cypher | 8080 | neo4j-mcp | Direct database access | Shared |
| Noor Router | 8201 | noor-router | Staff-level queries | Noor |
| Maestro Router | 8202 | maestro-router | Executive queries | Maestro |
| Embeddings Router | 8203 | embeddings-router | Embeddings operations | Shared |

### External URLs

Each router exposed via Caddy:

| Internal | External Path | External URL |
|----------|---------------|------|
| http://localhost:8080/mcp/ | /1/mcp/ | https://betaBE.aitwintech.com/1/mcp/ |
| http://localhost:8201/mcp/ | /2/mcp/ | https://betaBE.aitwintech.com/2/mcp/ |
| http://localhost:8202/mcp/ | /3/mcp/ | https://betaBE.aitwintech.com/3/mcp/ |
| http://localhost:8203/mcp/ | /4/mcp/ | https://betaBE.aitwintech.com/4/mcp/ |

## Configuration Storage

### Database Table: `system_settings`

**Single record** (id=1) contains:

```
id (BIGINT) = 1
date_created (TIMESTAMP)
updated_at (TIMESTAMP)
updated_by (TEXT)
s_enable_graphrag_context (BOOLEAN)
s_mcp_config (JSONB)  ← Full MCP config stored here
```

### JSONB Structure: `s_mcp_config`

```json
{
    "endpoints": [
        {
            "label": "noor-router",
            "url": "https://betaBE.aitwintech.com/2/mcp/",
            "allowed_tools": []
        },
        {
            "label": "maestro-router",
            "url": "https://betaBE.aitwintech.com/3/mcp/",
            "allowed_tools": []
        },
        {
            "label": "embeddings-router",
            "url": "https://betaBE.aitwintech.com/4/mcp/",
            "allowed_tools": []
        },
        {
            "label": "neo4j-mcp",
            "url": "https://betaBE.aitwintech.com/1/mcp/",
            "allowed_tools": []
        }
    ],
    "persona_bindings": {
        "noor": "noor-router",
        "maestro": "maestro-router"
    }
}
```

## Code Integration

### Service: `system_settings_service.py`

Reads/writes system settings:

```python
# Get all settings
settings = system_settings_service.get_settings()
mcp_config = settings['s_mcp_config']

# Update settings
system_settings_service.save_settings({
    's_mcp_config': {...},
    's_enable_graphrag_context': True
}, actor='admin-user')
```

### Orchestrator: `orchestrator_universal.py`

Loads MCP endpoints from database:

```python
def load_mcp_endpoint_map() -> Dict[str, str]:
    """Load endpoints from system_settings, fallback to localhost"""
    settings_record = system_settings_service.get_settings()
    mcp_config = settings_record.get("s_mcp_config", {})
    
    endpoint_map = {}
    for endpoint in mcp_config.get("endpoints", []):
        endpoint_map[endpoint["label"]] = endpoint["url"]
    
    return endpoint_map  # Returns {label: url}
```

Called in `CognitiveOrchestrator.__init__`:

```python
self._mcp_endpoint_map = load_mcp_endpoint_map()
binding_label = f"{self.persona}-router"  # e.g., "noor-router"
self.mcp_router_url = self._mcp_endpoint_map[binding_label]  # Gets URL
```

### API Endpoints

**GET /api/admin/settings**
- Returns current system settings including s_mcp_config
- Response includes all s_* fields + metadata

**PUT /api/admin/settings**
- Updates settings fields
- Validates schema (all s_* fields must be provided)
- Returns 400 if fields missing

Example request:
```bash
curl -X PUT https://betaBE.aitwintech.com/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{
    "s_mcp_config": {
      "endpoints": [...],
      "persona_bindings": {...}
    },
    "s_enable_graphrag_context": true
  }'
```

## Routing Flow

1. **User Request** → Backend (port 8008)
2. **Orchestrator Init** → Calls `load_mcp_endpoint_map()`
3. **Load from DB** → Reads `system_settings.s_mcp_config`
4. **Parse Persona** → Determines binding (noor→noor-router)
5. **Resolve URL** → Looks up endpoint from config
6. **MCP Call** → Sends tool request to resolved URL
7. **Response** → Returns tool result to LLM

### Example: Noor Persona

```
Persona = "noor"
Binding label = "noor-router"
Config lookup = s_mcp_config.endpoints find label="noor-router"
Result = "https://betaBE.aitwintech.com/2/mcp/"
HTTP POST to URL with tool request
```

## Migration Path

### Before (Jan 20, 2026)

- File: `backend/config/admin_settings.json`
- Manually edited JSON
- Restart required to reload

### After (Jan 21, 2026)

- Database: `system_settings` table
- API: `/api/admin/settings` PUT endpoint
- Hot reload: No restart needed
- UI: Admin panel to manage settings

## Adding New MCP Router

1. **Start new router** on available port (e.g., 8204)
2. **Add Caddy route** in `/opt/ibnalarab/Caddyfile`:
   ```
   handle_path /5/mcp/* {
       rewrite * /mcp{path}
       reverse_proxy 127.0.0.1:8204
   }
   ```
3. **Restart Caddy**: `docker restart ibnalarab-caddy`
4. **Update system_settings** via API or SQL:
   ```json
   {
       "label": "new-router",
       "url": "https://betaBE.aitwintech.com/5/mcp/",
       "allowed_tools": []
   }
   ```
5. **Optional**: Update persona bindings if needed

## Troubleshooting

### MCP Endpoints Not Loaded

**Symptom**: Orchestrator fails with "MCP router not configured"

**Check**:
1. system_settings table exists: `SELECT * FROM system_settings;`
2. Record has id=1: `SELECT id FROM system_settings;`
3. s_mcp_config is not empty: `SELECT s_mcp_config FROM system_settings WHERE id=1;`
4. Backend env vars set: `echo $SUPABASE_URL $SUPABASE_SERVICE_ROLE_KEY`

### Endpoints Return 502/503

**Symptom**: MCP requests timeout or fail

**Check**:
1. MCP router running: `ps aux | grep mcp`
2. Port accessible: `curl http://localhost:8201/mcp/`
3. Caddy routing correct: `curl https://betaBE.aitwintech.com/2/mcp/`
4. Firewall rules: `sudo ufw status`

### Schema Mismatch on Settings Update

**Symptom**: PUT `/api/admin/settings` returns 400 "missing settings fields"

**Solution**: 
1. GET `/api/admin/settings` to fetch current fields
2. Update all s_* fields in payload
3. PUT with complete payload (including unmodified fields)

## Related Files

- **SQL Migration**: `docs/SYSTEM_SETTINGS_SQL_MIGRATION.md`
- **API Routes**: `backend/app/api/routes/system_settings.py`
- **Service**: `backend/app/services/system_settings_service.py`
- **Orchestrator**: `backend/app/services/orchestrator_universal.py`
- **Caddy Config**: `/opt/ibnalarab/Caddyfile` (lines 40-69)

## Testing

### Test MCP Router Connection

```bash
# Via localhost (internal)
curl http://localhost:8201/mcp/

# Via external domain (through Caddy)
curl -k https://betaBE.aitwintech.com/2/mcp/

# Via Python in backend
from app.services.system_settings_service import system_settings_service
settings = system_settings_service.get_settings()
print(settings['s_mcp_config'])
```

### Test Orchestrator Loading

```python
from app.services.orchestrator_universal import load_mcp_endpoint_map

endpoints = load_mcp_endpoint_map()
print(f"Noor router: {endpoints.get('noor-router')}")
print(f"Maestro router: {endpoints.get('maestro-router')}")
```
