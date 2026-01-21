# LLM Provider Migration Checklist

**Agent:** Database Architect (Agent 1)  
**Date:** January 17, 2026  
**Status:** ✅ COMPLETE - Ready for execution

---

## 📋 Deliverables Summary

### ✅ Migration Files Created

| File | Purpose | Status |
|------|---------|--------|
| `migrations/001_create_llm_provider_configs.sql` | Schema creation | ✅ Complete |
| `migrations/002_seed_initial_providers.sql` | Initial provider data | ✅ Complete |
| `migrations/999_rollback_llm_provider_configs.sql` | Rollback script | ✅ Complete |
| `scripts/migrate_admin_settings_to_db.py` | API key migration | ✅ Complete |
| `scripts/validate_llm_provider_migration.py` | Validation script | ✅ Complete |
| `migrations/README_MIGRATIONS.md` | Documentation | ✅ Complete |
| `migrations/MIGRATION_CHECKLIST.md` | This checklist | ✅ Complete |

---

## 🎯 Pre-Migration Checklist

### Prerequisites

- [ ] PostgreSQL 16+ running
- [ ] Supabase credentials available
- [ ] `.env` file configured with database credentials
- [ ] Python 3.11+ installed
- [ ] Required Python packages installed:
  ```bash
  pip install psycopg2-binary python-dotenv
  ```
- [ ] Backup of current database created
- [ ] Backup of `config/admin_settings.json` created
- [ ] Read migration documentation: `migrations/README_MIGRATIONS.md`

### Environment Variables Required

```env
# Database connection (choose one method)

# Method 1: Full connection URL
SUPABASE_DB_URL=postgresql://user:pass@host:port/db

# Method 2: Individual components
SUPABASE_DB_HOST=your-host
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password

# Optional: Custom encryption key
DB_ENCRYPTION_KEY=your-secret-encryption-key
```

---

## 📝 Migration Steps

### Step 1: Schema Migration

**File:** `migrations/001_create_llm_provider_configs.sql`

```bash
psql $SUPABASE_DB_URL -f backend/migrations/001_create_llm_provider_configs.sql
```

**Verification:**
- [ ] Table `llm_provider_configs` created
- [ ] Table `llm_provider_config_history` created
- [ ] Functions created (4 total):
  - [ ] `validate_request_builder_config()`
  - [ ] `validate_response_extractor_config()`
  - [ ] `get_active_provider()`
  - [ ] `switch_active_provider()`
- [ ] Triggers created (4 total):
  - [ ] `trg_validate_provider_config`
  - [ ] `trg_log_provider_config_change`
  - [ ] `trg_prevent_active_provider_deletion`
  - [ ] `trg_ensure_single_active_provider`
- [ ] Indexes created (4 total)

**SQL Verification:**
```sql
-- Check tables
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'llm_provider%';

-- Check functions
SELECT proname FROM pg_proc 
WHERE proname LIKE '%provider%';

-- Check triggers
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'llm_provider_configs'::regclass;
```

### Step 2: Seed Initial Providers

**File:** `migrations/002_seed_initial_providers.sql`

```bash
psql $SUPABASE_DB_URL -f backend/migrations/002_seed_initial_providers.sql
```

**Verification:**
- [ ] 4 providers inserted:
  - [ ] Groq (active, enabled, API key empty)
  - [ ] OpenRouter (inactive, disabled, API key empty)
  - [ ] Google AI (inactive, disabled, API key empty)
  - [ ] ChatGPT (inactive, disabled, API key empty)
- [ ] Exactly 1 provider is active
- [ ] All JSONB configs are valid

**SQL Verification:**
```sql
-- Check providers
SELECT provider_name, is_active, is_enabled 
FROM llm_provider_configs 
ORDER BY is_active DESC;

-- Verify unique active constraint
SELECT COUNT(*) as active_count 
FROM llm_provider_configs 
WHERE is_active = TRUE;
-- Should return: 1
```

### Step 3: Migrate Groq API Key

**File:** `scripts/migrate_admin_settings_to_db.py`

```bash
python backend/scripts/migrate_admin_settings_to_db.py
```

**Interactive prompts:**
- [ ] Confirm migration when prompted
- [ ] Verify backup file created
- [ ] Review migration summary output

**Verification:**
- [ ] Backup created: `config/admin_settings.backup.YYYYMMDD_HHMMSS.json`
- [ ] Groq provider updated with:
  - [ ] Encrypted API key
  - [ ] Base URL from admin_settings.json
  - [ ] Endpoint path from admin_settings.json
  - [ ] Model name from admin_settings.json
- [ ] pgcrypto extension enabled
- [ ] API key encryption/decryption validated

**SQL Verification:**
```sql
-- Check Groq provider
SELECT 
    provider_name,
    base_url,
    endpoint_path_template,
    default_model,
    CASE 
        WHEN api_key_encrypted IS NOT NULL THEN 'Encrypted'
        ELSE 'Empty'
    END as api_key_status
FROM llm_provider_configs
WHERE provider_name = 'groq';
```

### Step 4: Validate Migration

**File:** `scripts/validate_llm_provider_migration.py`

```bash
python backend/scripts/validate_llm_provider_migration.py
```

**Checks performed:**
- [ ] Tables exist
- [ ] Columns exist
- [ ] Indexes exist
- [ ] Functions exist
- [ ] Triggers exist
- [ ] Providers seeded
- [ ] Exactly one active provider
- [ ] JSONB validation works
- [ ] pgcrypto extension enabled

**Expected output:**
```
✓ All checks passed! Migration is valid.
```

---

## ✅ Post-Migration Checklist

### Database Verification

- [ ] Run validation script (see Step 4)
- [ ] Check audit history:
  ```sql
  SELECT * FROM llm_provider_config_history ORDER BY changed_at DESC;
  ```
- [ ] Verify active provider:
  ```sql
  SELECT * FROM get_active_provider();
  ```
- [ ] Test provider switching:
  ```sql
  -- This should fail (provider disabled)
  SELECT switch_active_provider('openrouter', 'test_user');
  
  -- This should succeed
  SELECT switch_active_provider('groq', 'test_user');
  ```

### Configuration Verification

- [ ] Backup files created:
  - [ ] `config/admin_settings.backup.YYYYMMDD_HHMMSS.json`
- [ ] Original `config/admin_settings.json` unchanged
- [ ] All provider configs visible in database
- [ ] JSONB structures valid

### Security Verification

- [ ] API keys encrypted in database
- [ ] Encryption passphrase secure
- [ ] Database SSL enabled (production)
- [ ] Access controls configured

---

## 🧪 Testing Checklist

### Functional Tests

- [ ] **Active Provider Query:**
  ```sql
  SELECT * FROM get_active_provider();
  ```
  Should return Groq configuration

- [ ] **Provider Switch:**
  ```sql
  -- Enable OpenRouter first (if testing)
  UPDATE llm_provider_configs 
  SET is_enabled = TRUE 
  WHERE provider_name = 'openrouter';
  
  -- Switch to it
  SELECT switch_active_provider('openrouter', 'admin');
  
  -- Verify
  SELECT provider_name, is_active FROM llm_provider_configs;
  ```

- [ ] **Audit History:**
  ```sql
  SELECT 
      changed_at,
      p.provider_name,
      action,
      changed_by
  FROM llm_provider_config_history h
  JOIN llm_provider_configs p ON h.provider_id = p.id
  ORDER BY changed_at DESC
  LIMIT 10;
  ```

- [ ] **Validation Enforcement:**
  ```sql
  -- This should FAIL
  INSERT INTO llm_provider_configs (
      provider_name, display_name, base_url, 
      endpoint_path_template, default_model,
      request_builder_config, response_extractor_config
  ) VALUES (
      'invalid', 'Invalid', 'https://test.com', '/test', 'test-model',
      '{}'::jsonb, '{}'::jsonb
  );
  -- ERROR: request_builder_config must contain "version" field
  ```

- [ ] **Active Provider Protection:**
  ```sql
  -- This should FAIL
  DELETE FROM llm_provider_configs WHERE is_active = TRUE;
  -- ERROR: Cannot delete active provider
  ```

### Integration Tests

- [ ] Application can load active provider config
- [ ] API key decryption works in application
- [ ] Request builder uses provider config
- [ ] Response extractor uses provider config
- [ ] Observability logs provider name correctly

---

## 📊 Success Criteria

### Database Schema

- ✅ All tables created
- ✅ All columns present
- ✅ All indexes created
- ✅ All functions operational
- ✅ All triggers active
- ✅ Unique constraints enforced

### Data Integrity

- ✅ 4 providers seeded
- ✅ Exactly 1 active provider
- ✅ All JSONB configs valid
- ✅ API key encrypted securely
- ✅ Audit trail initialized

### Functionality

- ✅ Active provider retrieval works
- ✅ Provider switching works
- ✅ JSONB validation enforced
- ✅ Audit logging works
- ✅ Active provider protection works

### Documentation

- ✅ README created
- ✅ Migration steps documented
- ✅ Usage examples provided
- ✅ Troubleshooting guide included
- ✅ Security notes documented

---

## 🔄 Rollback Plan

### If Migration Fails

1. **Stop application** (if running)

2. **Rollback database:**
   ```bash
   psql $SUPABASE_DB_URL -f backend/migrations/999_rollback_llm_provider_configs.sql
   ```

3. **Restore backup:**
   ```bash
   # Restore database from backup
   pg_restore -d $SUPABASE_DB_URL /path/to/backup.dump
   ```

4. **Restore admin_settings.json:**
   ```bash
   cp config/admin_settings.backup.YYYYMMDD_HHMMSS.json config/admin_settings.json
   ```

5. **Verify application works** with original configuration

### Partial Rollback (Data Only)

If schema is fine but data is wrong:

```sql
-- Delete all providers
DELETE FROM llm_provider_config_history;
DELETE FROM llm_provider_configs;

-- Re-run seed
\i backend/migrations/002_seed_initial_providers.sql

-- Re-run migration script
python backend/scripts/migrate_admin_settings_to_db.py
```

---

## 🚀 Next Steps

After successful migration:

1. **Update Application Code:**
   - [ ] Load provider config from database
   - [ ] Use generic LLMExecutor
   - [ ] Update observability service

2. **Configure Additional Providers:**
   - [ ] Add OpenRouter API key
   - [ ] Add Google AI API key
   - [ ] Add ChatGPT API key
   - [ ] Enable desired providers

3. **Test Provider Switching:**
   - [ ] Switch to each provider
   - [ ] Verify functionality
   - [ ] Check observability data

4. **Monitor:**
   - [ ] Watch audit logs
   - [ ] Monitor application logs
   - [ ] Track performance metrics

5. **Documentation:**
   - [ ] Update API documentation
   - [ ] Update deployment guide
   - [ ] Update troubleshooting guide

---

## 📞 Support & Escalation

### Issue Resolution

| Issue Type | Action | Contact |
|------------|--------|---------|
| Migration script fails | Check logs, verify .env | Database Team |
| JSONB validation fails | Review config structure | Database Team |
| API key encryption fails | Check pgcrypto extension | Security Team |
| Application integration | Check code changes | Backend Team |
| Performance issues | Review indexes | Database Team |

### Useful Queries

```sql
-- View all providers
SELECT * FROM llm_provider_configs;

-- View audit history
SELECT * FROM llm_provider_config_history ORDER BY changed_at DESC;

-- Get active provider
SELECT * FROM get_active_provider();

-- Check encryption
SELECT EXISTS (SELECT FROM pg_extension WHERE extname = 'pgcrypto');

-- View all functions
SELECT proname FROM pg_proc WHERE proname LIKE '%provider%';

-- View all triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'llm_provider_configs'::regclass;
```

---

## ✅ Final Checklist

Before marking migration as complete:

- [ ] All migration files executed successfully
- [ ] Validation script passes (0 errors)
- [ ] Application can load provider config
- [ ] API key encryption/decryption works
- [ ] Provider switching works
- [ ] Audit logging works
- [ ] Documentation reviewed
- [ ] Team notified of changes
- [ ] Backup procedures updated
- [ ] Monitoring configured

---

**Prepared by:** Agent 1 (Database Architect)  
**Date:** January 17, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Execution
