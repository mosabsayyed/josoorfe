-- =====================================================
-- Rollback Script for LLM Provider Configuration
-- =====================================================
-- Purpose: Completely rollback migrations 001 and 002
-- WARNING: This will delete all provider configurations!
-- =====================================================

-- STEP 1: Drop all triggers
DROP TRIGGER IF EXISTS trg_ensure_single_active_provider ON llm_provider_configs;
DROP TRIGGER IF EXISTS trg_prevent_active_provider_deletion ON llm_provider_configs;
DROP TRIGGER IF EXISTS trg_log_provider_config_change ON llm_provider_configs;
DROP TRIGGER IF EXISTS trg_validate_provider_config ON llm_provider_configs;

-- STEP 2: Drop all functions
DROP FUNCTION IF EXISTS ensure_single_active_provider();
DROP FUNCTION IF EXISTS prevent_active_provider_deletion();
DROP FUNCTION IF EXISTS log_provider_config_change();
DROP FUNCTION IF EXISTS validate_provider_config();
DROP FUNCTION IF EXISTS validate_response_extractor_config(JSONB);
DROP FUNCTION IF EXISTS validate_request_builder_config(JSONB);
DROP FUNCTION IF EXISTS switch_active_provider(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS get_active_provider();

-- STEP 3: Drop tables (cascade will handle foreign keys)
DROP TABLE IF EXISTS llm_provider_config_history CASCADE;
DROP TABLE IF EXISTS llm_provider_configs CASCADE;

-- STEP 4: Verification
DO $$
BEGIN
    RAISE NOTICE 'Rollback completed successfully';
    RAISE NOTICE 'All LLM provider configuration tables, functions, and triggers have been removed';
    RAISE NOTICE '';
    RAISE NOTICE 'To restore, run migrations in order:';
    RAISE NOTICE '1. backend/migrations/001_create_llm_provider_configs.sql';
    RAISE NOTICE '2. backend/migrations/002_seed_initial_providers.sql';
    RAISE NOTICE '3. python backend/scripts/migrate_admin_settings_to_db.py';
END $$;
