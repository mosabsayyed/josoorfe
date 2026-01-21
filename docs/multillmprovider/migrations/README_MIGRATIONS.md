# LLM Provider Configuration Migrations

**Created:** January 17, 2026  
**Database:** Supabase (PostgreSQL 16)  
**Purpose:** Configuration-driven multi-provider LLM support

---

## Overview

This migration introduces a database-driven configuration system for LLM providers, eliminating the need for code changes when adding or switching providers.

### Key Features

- ✅ Configuration stored in PostgreSQL JSONB columns
- ✅ Support for 4 providers: Groq, OpenRouter, Google AI, ChatGPT
- ✅ Encrypted API key storage using pgcrypto
- ✅ JSONB validation to prevent invalid configurations
- ✅ Unique constraint ensuring only one active provider
- ✅ Complete audit trail of configuration changes
- ✅ Helper functions for provider management

---

## Files Created

### 1. Migration Files

| File | Purpose |
|------|---------|
| `001_create_llm_provider_configs.sql` | Creates tables, functions, triggers, and constraints |
| `002_seed_initial_providers.sql` | Seeds 4 provider configurations (Groq active by default) |
| `999_rollback_llm_provider_configs.sql` | Complete rollback script |

### 2. Scripts

| File | Purpose |
|------|---------|
| `scripts/migrate_admin_settings_to_db.py` | Migrates Groq API key from admin_settings.json to database |

### 3. Documentation

| File | Purpose |
|------|---------|
| `migrations/README_MIGRATIONS.md` | This file |

---

## Database Schema

### Table: `llm_provider_configs`

Stores provider configurations with JSONB request/response schemas.

```sql
CREATE TABLE llm_provider_configs (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Authentication
    api_key_encrypted TEXT,
    auth_scheme VARCHAR(50) DEFAULT 'bearer',
    auth_header_template TEXT,
    
    -- API Configuration
    base_url TEXT NOT NULL,
    endpoint_path_template TEXT NOT NULL,
    http_method VARCHAR(10) DEFAULT 'POST',
    additional_headers JSONB,
    
    -- Request/Response Configuration (CORE FEATURE)
    request_builder_config JSONB NOT NULL,
    response_extractor_config JSONB NOT NULL,
    
    -- Model Settings
    default_model VARCHAR(255) NOT NULL,
    supported_models JSONB,
    model_capabilities JSONB,
    context_window_tokens INTEGER,
    max_output_tokens_limit INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    config_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(255)
);
```

**Unique Constraints:**
- Only one provider can have `is_active = TRUE` at a time
- `provider_name` must be unique

### Table: `llm_provider_config_history`

Audit trail of all configuration changes.

```sql
CREATE TABLE llm_provider_config_history (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES llm_provider_configs(id),
    action VARCHAR(50),  -- 'created', 'updated', 'activated', etc.
    config_snapshot JSONB NOT NULL,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT NOW()
);
```

---

## Migration Steps

### Prerequisites

1. Ensure PostgreSQL 16+ is running
2. Have Supabase credentials in `.env` file:
   ```env
   SUPABASE_DB_URL=postgresql://user:pass@host:port/db
   # OR individual variables:
   SUPABASE_DB_HOST=your-host
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your-password
   
   # Encryption key (optional, defaults to built-in key)
   DB_ENCRYPTION_KEY=your-secret-key
   ```

3. Install Python dependencies:
   ```bash
   pip install psycopg2-binary python-dotenv
   ```

### Step 1: Run Schema Migration

**File:** `001_create_llm_provider_configs.sql`

```bash
# Using psql
psql $SUPABASE_DB_URL -f backend/migrations/001_create_llm_provider_configs.sql

# OR using Supabase SQL Editor
# Copy and paste the contents into the SQL Editor
```

**Creates:**
- ✓ `llm_provider_configs` table
- ✓ `llm_provider_config_history` table
- ✓ Validation functions for JSONB configs
- ✓ Triggers for validation and audit logging
- ✓ Helper functions: `get_active_provider()`, `switch_active_provider()`

### Step 2: Seed Initial Providers

**File:** `002_seed_initial_providers.sql`

```bash
psql $SUPABASE_DB_URL -f backend/migrations/002_seed_initial_providers.sql
```

**Creates 4 providers:**

| Provider | Active | Enabled | API Key | Notes |
|----------|--------|---------|---------|-------|
| Groq | ✓ | ✓ | Empty (will be migrated) | Current provider |
| OpenRouter | ✗ | ✗ | Empty | Disabled until configured |
| Google AI | ✗ | ✗ | Empty | Disabled until configured |
| ChatGPT | ✗ | ✗ | Empty | Disabled until configured |

### Step 3: Migrate Groq API Key

**File:** `scripts/migrate_admin_settings_to_db.py`

```bash
python backend/scripts/migrate_admin_settings_to_db.py
```

**What it does:**
1. Backs up `config/admin_settings.json` to timestamped file
2. Reads Groq API key from admin_settings.json
3. Encrypts API key using PostgreSQL pgcrypto
4. Updates `llm_provider_configs` table with:
   - Encrypted API key
   - Base URL
   - Endpoint path
   - Default model
5. Validates encryption/decryption works
6. Prints summary of all providers

**Expected output:**
```
================================================================================
LLM Provider Configuration Migration
================================================================================

Loading config/admin_settings.json...
✓ Admin settings loaded
Creating backup...
✓ Backup created
Connecting to database...
✓ Connected successfully

Enabling pgcrypto extension...
✓ pgcrypto enabled

Migrating Groq configuration:
  Base URL: https://api.groq.com
  Endpoint: /openai/v1/responses
  Model: openai/gpt-oss-120b
  API Key: gsk_6xXXCU43xuyPcvz... (truncated)

Encrypting API key...
✓ API key encrypted

Updating database...
✓ Updated provider: Groq (ID: 1)

Validating migration...
✓ API key encryption validated
✓ Provider 'groq' active: True

================================================================================
MIGRATION SUMMARY
================================================================================
Total providers: 4

Provider Status:
--------------------------------------------------------------------------------
Provider             Display Name              Active     Enabled   
--------------------------------------------------------------------------------
groq                 Groq                      ✓ ACTIVE   ✓         
chatgpt              ChatGPT (OpenAI)                     ✗         
google_ai            Google AI (Gemini)                   ✗         
openrouter           OpenRouter                           ✗         
--------------------------------------------------------------------------------

✓ Migration completed successfully!
```

---

## Usage

### Query Active Provider

```sql
-- Using helper function
SELECT * FROM get_active_provider();

-- Direct query
SELECT 
    provider_name,
    display_name,
    base_url,
    default_model,
    model_capabilities
FROM llm_provider_configs
WHERE is_active = TRUE;
```

### Switch Active Provider

```sql
-- Switch to OpenRouter (if enabled)
SELECT switch_active_provider('openrouter', 'admin_user');

-- Switch back to Groq
SELECT switch_active_provider('groq', 'admin_user');
```

### Configure New Provider

```sql
-- 1. Add API key
UPDATE llm_provider_configs
SET 
    api_key_encrypted = pgp_sym_encrypt('your-api-key', 'encryption-passphrase'),
    updated_at = NOW(),
    updated_by = 'admin'
WHERE provider_name = 'openrouter';

-- 2. Enable provider
UPDATE llm_provider_configs
SET 
    is_enabled = TRUE,
    updated_at = NOW(),
    updated_by = 'admin'
WHERE provider_name = 'openrouter';

-- 3. Switch to it
SELECT switch_active_provider('openrouter', 'admin');
```

### View Audit History

```sql
-- All changes
SELECT 
    h.changed_at,
    p.provider_name,
    h.action,
    h.changed_by
FROM llm_provider_config_history h
JOIN llm_provider_configs p ON h.provider_id = p.id
ORDER BY h.changed_at DESC;

-- Changes for specific provider
SELECT * FROM llm_provider_config_history
WHERE provider_id = (SELECT id FROM llm_provider_configs WHERE provider_name = 'groq')
ORDER BY changed_at DESC;
```

### Decrypt API Key (for validation only)

```sql
-- WARNING: Only use for testing/debugging
SELECT 
    provider_name,
    pgp_sym_decrypt(
        decode(api_key_encrypted, 'hex'),
        'encryption-passphrase'
    ) AS decrypted_key
FROM llm_provider_configs
WHERE provider_name = 'groq';
```

---

## Validation Functions

### Request Builder Config Validation

Ensures `request_builder_config` JSONB has required structure:

```sql
-- Valid structure example
{
  "version": "1.0",
  "payload_structure": {
    "model": { "source": "param:model_name", "required": true },
    "messages": { "source": "param:messages", ... }
  }
}
```

**Requirements:**
- Must have `version` field
- Must have `payload_structure` object
- `payload_structure` must contain `model` and `messages`

### Response Extractor Config Validation

Ensures `response_extractor_config` JSONB has required structure:

```sql
-- Valid structure example
{
  "version": "1.0",
  "extraction_rules": {
    "text_content": { "type": "string", "paths": [...] },
    "usage_stats": { "type": "object", "fields": {...} }
  }
}
```

**Requirements:**
- Must have `version` field
- Must have `extraction_rules` object
- `extraction_rules` must contain `text_content` and `usage_stats`

---

## Triggers

### 1. `trg_validate_provider_config`

**When:** BEFORE INSERT OR UPDATE on `llm_provider_configs`  
**What:** Validates JSONB configs and updates `updated_at` timestamp

### 2. `trg_log_provider_config_change`

**When:** AFTER INSERT, UPDATE, DELETE on `llm_provider_configs`  
**What:** Logs change to `llm_provider_config_history` with full snapshot

### 3. `trg_prevent_active_provider_deletion`

**When:** BEFORE DELETE on `llm_provider_configs`  
**What:** Prevents deletion of active provider (must switch first)

### 4. `trg_ensure_single_active_provider`

**When:** BEFORE UPDATE on `llm_provider_configs` (when setting `is_active = TRUE`)  
**What:** Automatically deactivates all other providers

---

## Rollback

### Complete Rollback

```bash
# WARNING: This deletes all provider configurations!
psql $SUPABASE_DB_URL -f backend/migrations/999_rollback_llm_provider_configs.sql
```

### Partial Rollback (Delete Seed Data Only)

```sql
-- Remove all seeded providers
DELETE FROM llm_provider_config_history 
WHERE provider_id IN (SELECT id FROM llm_provider_configs);

DELETE FROM llm_provider_configs 
WHERE provider_name IN ('groq', 'openrouter', 'google_ai', 'chatgpt');
```

---

## Testing

### 1. Verify Schema

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('llm_provider_configs', 'llm_provider_config_history');

-- Check functions exist
SELECT proname FROM pg_proc 
WHERE proname LIKE '%provider%';

-- Check triggers exist
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'llm_provider_configs'::regclass;
```

### 2. Test Provider Switch

```sql
-- Should succeed
SELECT switch_active_provider('groq', 'test_user');

-- Verify only one active
SELECT COUNT(*) FROM llm_provider_configs WHERE is_active = TRUE;
-- Should return: 1

-- Should fail (provider disabled)
SELECT switch_active_provider('openrouter', 'test_user');
-- ERROR: Provider openrouter is disabled
```

### 3. Test Validation

```sql
-- Should fail (missing required fields)
INSERT INTO llm_provider_configs (
    provider_name, display_name, base_url, endpoint_path_template, 
    default_model, request_builder_config, response_extractor_config
) VALUES (
    'test_provider', 'Test', 'https://api.test.com', '/v1/test',
    'test-model', '{}'::jsonb, '{}'::jsonb
);
-- ERROR: request_builder_config must contain "version" field
```

### 4. Test Unique Active Constraint

```sql
-- Should succeed (deactivates others)
UPDATE llm_provider_configs SET is_active = TRUE WHERE provider_name = 'groq';

-- Verify
SELECT provider_name, is_active FROM llm_provider_configs;
-- Only 'groq' should be TRUE
```

---

## Troubleshooting

### Issue: "pgcrypto extension not found"

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Issue: "Cannot delete active provider"

```sql
-- Switch to another provider first
SELECT switch_active_provider('another_provider', 'admin');

-- Then delete
DELETE FROM llm_provider_configs WHERE provider_name = 'old_provider';
```

### Issue: Python script can't connect to database

Check your `.env` file has valid credentials:

```bash
# Test connection
psql $SUPABASE_DB_URL -c "SELECT version();"
```

### Issue: Migration script fails with "Groq provider not found"

You need to run migration 002 first:

```bash
psql $SUPABASE_DB_URL -f backend/migrations/002_seed_initial_providers.sql
```

---

## Security Notes

### API Key Encryption

- API keys are encrypted using PostgreSQL `pgcrypto` extension
- Encryption uses symmetric encryption (pgp_sym_encrypt)
- Default passphrase: `josoor-llm-provider-key-2026`
- **PRODUCTION:** Set custom passphrase via `DB_ENCRYPTION_KEY` environment variable

### Best Practices

1. **Never log decrypted API keys**
2. **Rotate encryption passphrase periodically**
3. **Limit database access** to service accounts only
4. **Use SSL** for database connections in production
5. **Backup encrypted keys** separately from database backups

---

## Next Steps

After migration:

1. ✅ **Configure additional providers:**
   - Add API keys for OpenRouter, Google AI, ChatGPT
   - Enable providers as needed

2. ✅ **Update application code:**
   - Load provider config from database instead of admin_settings.json
   - Use generic LLMExecutor with provider config

3. ✅ **Test provider switching:**
   - Switch between providers
   - Verify observability captures correct data

4. ✅ **Monitor audit logs:**
   - Track configuration changes
   - Investigate unauthorized modifications

---

## Support

For issues or questions:

1. Check this README
2. Review migration plan: `LLM_PROVIDER_MIGRATION_PLAN_V2_CONFIG_DRIVEN.md`
3. Inspect database logs: `SELECT * FROM llm_provider_config_history;`
4. Contact: Database Team

---

**Created by:** Agent 1 (Database Architect)  
**Date:** January 17, 2026  
**Version:** 1.0
