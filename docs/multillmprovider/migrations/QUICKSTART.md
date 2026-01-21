# Quick Start: LLM Provider Migration

**5-minute setup guide for the impatient developer** 🚀

---

## Prerequisites

```bash
# 1. Install dependencies
pip install psycopg2-binary python-dotenv

# 2. Set environment variables
export SUPABASE_DB_URL="postgresql://user:pass@host:port/db"
# OR set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD individually
```

---

## Execute Migration (3 Commands)

```bash
# Step 1: Create schema (30 seconds)
psql $SUPABASE_DB_URL -f backend/migrations/001_create_llm_provider_configs.sql

# Step 2: Seed providers (10 seconds)
psql $SUPABASE_DB_URL -f backend/migrations/002_seed_initial_providers.sql

# Step 3: Migrate Groq API key (30 seconds)
python backend/scripts/migrate_admin_settings_to_db.py
# Type "yes" when prompted
```

---

## Verify (1 Command)

```bash
python backend/scripts/validate_llm_provider_migration.py
```

**Expected output:**
```
✓ All checks passed! Migration is valid.
```

---

## Use It

### Python

```python
import psycopg2
import os

# Connect
conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
cursor = conn.cursor()

# Get active provider
cursor.execute("SELECT * FROM get_active_provider()")
provider = cursor.fetchone()

print(f"Active provider: {provider['provider_name']}")
print(f"Model: {provider['default_model']}")
print(f"Base URL: {provider['base_url']}")
```

### SQL

```sql
-- Get active provider
SELECT * FROM get_active_provider();

-- Switch provider
SELECT switch_active_provider('openrouter', 'admin');

-- View all providers
SELECT provider_name, is_active, is_enabled FROM llm_provider_configs;

-- Check audit log
SELECT * FROM llm_provider_config_history ORDER BY changed_at DESC LIMIT 10;
```

---

## What Was Created?

| What | Where | Purpose |
|------|-------|---------|
| **Tables** | `llm_provider_configs`<br>`llm_provider_config_history` | Store configs & audit trail |
| **Functions** | `get_active_provider()`<br>`switch_active_provider()` | Helper functions |
| **Triggers** | Auto-validation<br>Auto-logging | Enforce rules |
| **Providers** | Groq (active)<br>OpenRouter<br>Google AI<br>ChatGPT | 4 providers ready |

---

## Common Tasks

### Add API Key to Provider

```sql
UPDATE llm_provider_configs
SET 
    api_key_encrypted = pgp_sym_encrypt('your-api-key', 'encryption-passphrase'),
    is_enabled = TRUE,
    updated_by = 'admin'
WHERE provider_name = 'openrouter';
```

### Switch Active Provider

```sql
SELECT switch_active_provider('openrouter', 'admin');
```

### View Configuration

```sql
SELECT 
    provider_name,
    display_name,
    base_url,
    default_model,
    is_active,
    is_enabled
FROM llm_provider_configs;
```

---

## Troubleshooting

### "pgcrypto not found"

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### "Cannot connect to database"

```bash
# Test connection
psql $SUPABASE_DB_URL -c "SELECT version();"
```

### "Migration script fails"

```bash
# Check .env file
cat .env | grep DB

# Run with debug
python -u backend/scripts/migrate_admin_settings_to_db.py
```

---

## Rollback

```bash
psql $SUPABASE_DB_URL -f backend/migrations/999_rollback_llm_provider_configs.sql
```

---

## Full Documentation

📚 **Complete guide:** [migrations/README_MIGRATIONS.md](README_MIGRATIONS.md)  
✅ **Checklist:** [migrations/MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)  
📋 **Plan:** [LLM_PROVIDER_MIGRATION_PLAN_V2_CONFIG_DRIVEN.md](../LLM_PROVIDER_MIGRATION_PLAN_V2_CONFIG_DRIVEN.md)

---

**Done!** 🎉 Your LLM provider configuration is now database-driven.

Next: Update application code to use `get_active_provider()` instead of `admin_settings.json`
