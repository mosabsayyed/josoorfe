-- =====================================================
-- LLM Provider Configuration Schema Migration
-- =====================================================
-- Migration: 001_create_llm_provider_configs
-- Created: January 17, 2026
-- Purpose: Configuration-driven multi-provider LLM support
-- Database: Supabase (PostgreSQL 16)
-- =====================================================

-- =============================================================================
-- Main Provider Configuration Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS llm_provider_configs (
    id SERIAL PRIMARY KEY,
    
    -- Provider Identification
    provider_name VARCHAR(100) NOT NULL UNIQUE,  -- 'groq', 'openrouter', 'google_ai', 'chatgpt'
    display_name VARCHAR(255) NOT NULL,          -- 'Groq', 'OpenRouter', 'Google AI', 'ChatGPT'
    description TEXT,
    
    -- Authentication Configuration
    api_key_encrypted TEXT,                      -- Encrypted API key (use pgcrypto)
    auth_scheme VARCHAR(50) DEFAULT 'bearer',    -- 'bearer', 'api_key_header', 'query_param'
    auth_header_template TEXT,                   -- 'Authorization: Bearer {api_key}' or 'x-goog-api-key: {api_key}'
    
    -- API Endpoint Configuration
    base_url TEXT NOT NULL,                      -- 'https://api.openai.com'
    endpoint_path_template TEXT NOT NULL,        -- '/v1/chat/completions' or '/v1beta/models/{model}:generateContent'
    http_method VARCHAR(10) DEFAULT 'POST',
    additional_headers JSONB,                    -- {"HTTP-Referer": "https://myapp.com"}
    
    -- Request Configuration (HOW TO BUILD THE REQUEST)
    request_builder_config JSONB NOT NULL,       -- JSON schema defining request structure
    
    -- Response Configuration (HOW TO EXTRACT DATA)
    response_extractor_config JSONB NOT NULL,    -- JSON schema defining response extraction
    
    -- Model Settings
    default_model VARCHAR(255) NOT NULL,
    supported_models JSONB,                      -- ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]
    model_capabilities JSONB,                    -- {"tool_calling": true, "caching": true, "streaming": false}
    context_window_tokens INTEGER,
    max_output_tokens_limit INTEGER,
    
    -- Provider Status
    is_active BOOLEAN DEFAULT FALSE,             -- Currently selected provider (only one can be true)
    is_enabled BOOLEAN DEFAULT TRUE,             -- Available for selection
    
    -- Metadata
    config_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT valid_provider_name CHECK (
        provider_name ~ '^[a-z0-9_]+$'
    ),
    CONSTRAINT valid_http_method CHECK (
        http_method IN ('GET', 'POST', 'PUT', 'PATCH')
    ),
    CONSTRAINT valid_auth_scheme CHECK (
        auth_scheme IN ('bearer', 'api_key_header', 'query_param', 'none')
    )
);

-- =============================================================================
-- Unique Constraints
-- =============================================================================

-- Only one active provider at a time (partial unique index)
CREATE UNIQUE INDEX idx_active_provider ON llm_provider_configs (is_active) 
WHERE is_active = TRUE;

-- =============================================================================
-- Performance Indexes
-- =============================================================================

CREATE INDEX idx_provider_name ON llm_provider_configs(provider_name);
CREATE INDEX idx_is_active ON llm_provider_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_is_enabled ON llm_provider_configs(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX idx_created_at ON llm_provider_configs(created_at DESC);

-- =============================================================================
-- Audit History Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS llm_provider_config_history (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES llm_provider_configs(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,                 -- 'created', 'updated', 'activated', 'deactivated', 'deleted'
    config_snapshot JSONB NOT NULL,              -- Full config at time of change
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_action CHECK (
        action IN ('created', 'updated', 'activated', 'deactivated', 'deleted', 'enabled', 'disabled')
    )
);

-- Index for audit queries
CREATE INDEX idx_provider_history_provider ON llm_provider_config_history(provider_id, changed_at DESC);
CREATE INDEX idx_provider_history_action ON llm_provider_config_history(action, changed_at DESC);

-- =============================================================================
-- Validation Functions
-- =============================================================================

-- Function to validate request_builder_config JSONB structure
CREATE OR REPLACE FUNCTION validate_request_builder_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required top-level fields
    IF NOT (config ? 'version') THEN
        RAISE EXCEPTION 'request_builder_config must contain "version" field';
    END IF;
    
    IF NOT (config ? 'payload_structure') THEN
        RAISE EXCEPTION 'request_builder_config must contain "payload_structure" field';
    END IF;
    
    -- Validate payload_structure contains required fields
    IF NOT (config->'payload_structure' ? 'model') THEN
        RAISE EXCEPTION 'payload_structure must contain "model" field';
    END IF;
    
    IF NOT (config->'payload_structure' ? 'messages') THEN
        RAISE EXCEPTION 'payload_structure must contain "messages" field';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate response_extractor_config JSONB structure
CREATE OR REPLACE FUNCTION validate_response_extractor_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required top-level fields
    IF NOT (config ? 'version') THEN
        RAISE EXCEPTION 'response_extractor_config must contain "version" field';
    END IF;
    
    IF NOT (config ? 'extraction_rules') THEN
        RAISE EXCEPTION 'response_extractor_config must contain "extraction_rules" field';
    END IF;
    
    -- Validate extraction_rules contains required fields
    IF NOT (config->'extraction_rules' ? 'text_content') THEN
        RAISE EXCEPTION 'extraction_rules must contain "text_content" field';
    END IF;
    
    IF NOT (config->'extraction_rules' ? 'usage_stats') THEN
        RAISE EXCEPTION 'extraction_rules must contain "usage_stats" field';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Triggers
-- =============================================================================

-- Trigger to validate JSONB configs before insert/update
CREATE OR REPLACE FUNCTION validate_provider_config()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate request builder config
    PERFORM validate_request_builder_config(NEW.request_builder_config);
    
    -- Validate response extractor config
    PERFORM validate_response_extractor_config(NEW.response_extractor_config);
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_provider_config
    BEFORE INSERT OR UPDATE ON llm_provider_configs
    FOR EACH ROW
    EXECUTE FUNCTION validate_provider_config();

-- Trigger to log configuration changes to audit table
CREATE OR REPLACE FUNCTION log_provider_config_change()
RETURNS TRIGGER AS $$
DECLARE
    action_type VARCHAR(50);
    snapshot JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'created';
        snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
            action_type := 'activated';
        ELSIF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            action_type := 'deactivated';
        ELSIF OLD.is_enabled = TRUE AND NEW.is_enabled = FALSE THEN
            action_type := 'disabled';
        ELSIF OLD.is_enabled = FALSE AND NEW.is_enabled = TRUE THEN
            action_type := 'enabled';
        ELSE
            action_type := 'updated';
        END IF;
        snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'deleted';
        snapshot := to_jsonb(OLD);
    END IF;
    
    -- Insert audit record
    INSERT INTO llm_provider_config_history (
        provider_id,
        action,
        config_snapshot,
        changed_by,
        changed_at
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        action_type,
        snapshot,
        COALESCE(NEW.updated_by, OLD.updated_by, 'system'),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_provider_config_change
    AFTER INSERT OR UPDATE OR DELETE ON llm_provider_configs
    FOR EACH ROW
    EXECUTE FUNCTION log_provider_config_change();

-- Trigger to prevent deletion of active provider
CREATE OR REPLACE FUNCTION prevent_active_provider_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_active = TRUE THEN
        RAISE EXCEPTION 'Cannot delete active provider. Switch to another provider first.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_active_provider_deletion
    BEFORE DELETE ON llm_provider_configs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_active_provider_deletion();

-- Trigger to ensure only one active provider
CREATE OR REPLACE FUNCTION ensure_single_active_provider()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a provider to active, deactivate all others
    IF NEW.is_active = TRUE THEN
        UPDATE llm_provider_configs
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = NEW.updated_by
        WHERE is_active = TRUE
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_active_provider
    BEFORE UPDATE ON llm_provider_configs
    FOR EACH ROW
    WHEN (NEW.is_active = TRUE)
    EXECUTE FUNCTION ensure_single_active_provider();

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to get active provider configuration
CREATE OR REPLACE FUNCTION get_active_provider()
RETURNS TABLE (
    id INTEGER,
    provider_name VARCHAR(100),
    display_name VARCHAR(255),
    base_url TEXT,
    endpoint_path_template TEXT,
    default_model VARCHAR(255),
    request_builder_config JSONB,
    response_extractor_config JSONB,
    model_capabilities JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.provider_name,
        p.display_name,
        p.base_url,
        p.endpoint_path_template,
        p.default_model,
        p.request_builder_config,
        p.response_extractor_config,
        p.model_capabilities
    FROM llm_provider_configs p
    WHERE p.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to switch active provider
CREATE OR REPLACE FUNCTION switch_active_provider(new_provider_name VARCHAR(100), switched_by VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    provider_exists BOOLEAN;
    provider_enabled BOOLEAN;
BEGIN
    -- Check if provider exists and is enabled
    SELECT EXISTS(SELECT 1 FROM llm_provider_configs WHERE provider_name = new_provider_name),
           EXISTS(SELECT 1 FROM llm_provider_configs WHERE provider_name = new_provider_name AND is_enabled = TRUE)
    INTO provider_exists, provider_enabled;
    
    IF NOT provider_exists THEN
        RAISE EXCEPTION 'Provider % does not exist', new_provider_name;
    END IF;
    
    IF NOT provider_enabled THEN
        RAISE EXCEPTION 'Provider % is disabled', new_provider_name;
    END IF;
    
    -- Deactivate all providers
    UPDATE llm_provider_configs
    SET is_active = FALSE,
        updated_at = NOW(),
        updated_by = switched_by;
    
    -- Activate the new provider
    UPDATE llm_provider_configs
    SET is_active = TRUE,
        updated_at = NOW(),
        updated_by = switched_by
    WHERE provider_name = new_provider_name;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Comments for Documentation
-- =============================================================================

COMMENT ON TABLE llm_provider_configs IS 'Configuration-driven LLM provider settings - supports multiple providers without code changes';
COMMENT ON COLUMN llm_provider_configs.request_builder_config IS 'JSONB schema defining how to construct API requests from standard inputs';
COMMENT ON COLUMN llm_provider_configs.response_extractor_config IS 'JSONB schema defining how to extract data from API responses using JSONPath';
COMMENT ON TABLE llm_provider_config_history IS 'Audit trail of all configuration changes';

-- =============================================================================
-- Grant Permissions (adjust based on your setup)
-- =============================================================================

-- Note: Adjust role names based on your Supabase setup
-- GRANT SELECT, INSERT, UPDATE ON llm_provider_configs TO authenticated;
-- GRANT SELECT ON llm_provider_config_history TO authenticated;

-- =============================================================================
-- Migration Complete
-- =============================================================================

-- Verification query
DO $$
BEGIN
    RAISE NOTICE 'Migration 001 completed successfully';
    RAISE NOTICE 'Created tables: llm_provider_configs, llm_provider_config_history';
    RAISE NOTICE 'Created functions: validate_request_builder_config, validate_response_extractor_config';
    RAISE NOTICE 'Created helper functions: get_active_provider, switch_active_provider';
END $$;
