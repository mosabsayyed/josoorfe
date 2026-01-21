-- =====================================================
-- LLM Provider Initial Seed Data
-- =====================================================
-- Migration: 002_seed_initial_providers
-- Created: January 17, 2026
-- Purpose: Insert initial provider configurations (Groq, OpenRouter, Google AI, ChatGPT)
-- Database: Supabase (PostgreSQL 16)
-- =====================================================

-- NOTE: This seed data migrates the existing configuration from admin_settings.json
-- and adds placeholder configurations for other providers

-- =============================================================================
-- 1. GROQ PROVIDER (Current Active Provider)
-- =============================================================================

INSERT INTO llm_provider_configs (
    provider_name,
    display_name,
    description,
    api_key_encrypted,
    auth_scheme,
    auth_header_template,
    base_url,
    endpoint_path_template,
    http_method,
    additional_headers,
    request_builder_config,
    response_extractor_config,
    default_model,
    supported_models,
    model_capabilities,
    context_window_tokens,
    max_output_tokens_limit,
    is_active,
    is_enabled,
    updated_by
) VALUES (
    'groq',
    'Groq',
    'Groq LLM API with ultra-fast inference and MCP tool support',
    NULL,  -- Will be set by migration script from admin_settings.json
    'bearer',
    'Authorization: Bearer {api_key}',
    'https://api.groq.com',
    '/openai/v1/responses',
    'POST',
    '{"Content-Type": "application/json"}'::jsonb,
    -- Request Builder Config (Groq format with MCP tools)
    '{
      "version": "1.0",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "payload_structure": {
        "model": {
          "source": "param:model_name",
          "required": true
        },
        "messages": {
          "source": "param:messages",
          "transform": "messages_transformer",
          "transformer_config": {
            "format": "openai",
            "role_mapping": {
              "user": "user",
              "assistant": "assistant",
              "system": "system"
            },
            "combine_system": false
          }
        },
        "temperature": {
          "source": "param:temperature",
          "path": "temperature",
          "required": false,
          "default": null
        },
        "max_tokens": {
          "source": "param:max_output_tokens",
          "path": "max_output_tokens",
          "required": false
        },
        "tools": {
          "source": "param:tools",
          "path": "tools",
          "transform": "tools_transformer",
          "transformer_config": {
            "format": "groq_mcp",
            "enabled_if": "model_capabilities.tool_calling == true"
          },
          "required": false
        }
      },
      "conditional_fields": {
        "tool_choice": {
          "include_if": "tools != null",
          "value": "auto"
        }
      }
    }'::jsonb,
    -- Response Extractor Config (Groq format)
    '{
      "version": "1.0",
      "extraction_rules": {
        "text_content": {
          "type": "string",
          "paths": [
            "$.output[?(@.type==''message'')].content[?(@.type==''output_text'')].text",
            "$.choices[0].message.content"
          ],
          "join_strategy": "first_non_null",
          "required": true
        },
        "usage_stats": {
          "type": "object",
          "fields": {
            "input_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.input_tokens",
                "$.usage.prompt_tokens"
              ],
              "required": true
            },
            "output_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.output_tokens",
                "$.usage.completion_tokens"
              ],
              "required": true
            },
            "total_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.total_tokens"
              ],
              "fallback_calculation": "input_tokens + output_tokens",
              "required": true
            },
            "cached_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.input_tokens_details.cached_tokens"
              ],
              "default": 0,
              "required": false
            }
          }
        },
        "tool_calls": {
          "type": "array",
          "detect_format": true,
          "formats": {
            "groq_mcp": {
              "count_path": "$.output[?(@.type==''tool_use'')] | length(@)",
              "extract_calls": {
                "path": "$.output[?(@.type==''tool_use'')]",
                "item_schema": {
                  "name": "name",
                  "arguments": "arguments",
                  "status": "status",
                  "output": "output"
                }
              }
            },
            "openai": {
              "count_path": "$.choices[0].message.tool_calls | length(@)",
              "extract_calls": {
                "path": "$.choices[0].message.tool_calls",
                "item_schema": {
                  "name": "function.name",
                  "arguments": "function.arguments",
                  "id": "id"
                }
              }
            }
          }
        },
        "reasoning": {
          "type": "string",
          "paths": [
            "$.output[?(@.type==''message'')].content[?(@.type==''reasoning'')].text"
          ],
          "required": false,
          "default": null
        },
        "finish_reason": {
          "type": "string",
          "paths": [
            "$.choices[0].finish_reason"
          ],
          "value_mapping": {
            "STOP": "stop",
            "MAX_TOKENS": "length"
          }
        },
        "error_info": {
          "type": "object",
          "detect_path": "$.error",
          "fields": {
            "error_type": {
              "paths": ["$.error.type", "$.error.code"]
            },
            "error_message": {
              "paths": ["$.error.message"]
            }
          }
        }
      }
    }'::jsonb,
    'openai/gpt-oss-120b',
    '["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"]'::jsonb,
    '{"tool_calling": true, "caching": true, "streaming": false}'::jsonb,
    128000,
    8192,
    true,  -- Active by default
    true,
    'migration_seed'
);

-- =============================================================================
-- 2. OPENROUTER PROVIDER (Fallback option)
-- =============================================================================

INSERT INTO llm_provider_configs (
    provider_name,
    display_name,
    description,
    api_key_encrypted,
    auth_scheme,
    auth_header_template,
    base_url,
    endpoint_path_template,
    http_method,
    additional_headers,
    request_builder_config,
    response_extractor_config,
    default_model,
    supported_models,
    model_capabilities,
    context_window_tokens,
    max_output_tokens_limit,
    is_active,
    is_enabled,
    updated_by
) VALUES (
    'openrouter',
    'OpenRouter',
    'OpenRouter API - Access to multiple LLM providers through a unified interface',
    NULL,  -- API key to be configured
    'bearer',
    'Authorization: Bearer {api_key}',
    'https://openrouter.ai',
    '/api/v1/chat/completions',
    'POST',
    '{
      "Content-Type": "application/json",
      "HTTP-Referer": "https://josoor.aitwintech.com",
      "X-Title": "Josoor Enterprise Architecture Platform"
    }'::jsonb,
    -- Request Builder Config (OpenAI-compatible)
    '{
      "version": "1.0",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "payload_structure": {
        "model": {
          "source": "param:model_name",
          "required": true
        },
        "messages": {
          "source": "param:messages",
          "transform": "messages_transformer",
          "transformer_config": {
            "format": "openai",
            "role_mapping": {
              "user": "user",
              "assistant": "assistant",
              "system": "system"
            },
            "combine_system": false
          }
        },
        "temperature": {
          "source": "param:temperature",
          "path": "temperature",
          "required": false,
          "default": 0.7
        },
        "max_tokens": {
          "source": "param:max_output_tokens",
          "path": "max_tokens",
          "required": false
        },
        "tools": {
          "source": "param:tools",
          "path": "tools",
          "transform": "tools_transformer",
          "transformer_config": {
            "format": "openai_functions",
            "enabled_if": "model_capabilities.tool_calling == true"
          },
          "required": false
        }
      },
      "conditional_fields": {
        "tool_choice": {
          "include_if": "tools != null",
          "value": "auto"
        }
      }
    }'::jsonb,
    -- Response Extractor Config (OpenAI format)
    '{
      "version": "1.0",
      "extraction_rules": {
        "text_content": {
          "type": "string",
          "paths": [
            "$.choices[0].message.content"
          ],
          "join_strategy": "first_non_null",
          "required": true
        },
        "usage_stats": {
          "type": "object",
          "fields": {
            "input_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.prompt_tokens"
              ],
              "required": true
            },
            "output_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.completion_tokens"
              ],
              "required": true
            },
            "total_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.total_tokens"
              ],
              "fallback_calculation": "input_tokens + output_tokens",
              "required": true
            },
            "cached_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.prompt_tokens_details.cached_tokens"
              ],
              "default": 0,
              "required": false
            }
          }
        },
        "tool_calls": {
          "type": "array",
          "detect_format": true,
          "formats": {
            "openai": {
              "count_path": "$.choices[0].message.tool_calls | length(@)",
              "extract_calls": {
                "path": "$.choices[0].message.tool_calls",
                "item_schema": {
                  "name": "function.name",
                  "arguments": "function.arguments",
                  "id": "id"
                }
              }
            }
          }
        },
        "finish_reason": {
          "type": "string",
          "paths": [
            "$.choices[0].finish_reason"
          ],
          "value_mapping": {
            "stop": "stop",
            "length": "length",
            "tool_calls": "tool_calls"
          }
        },
        "error_info": {
          "type": "object",
          "detect_path": "$.error",
          "fields": {
            "error_type": {
              "paths": ["$.error.type", "$.error.code"]
            },
            "error_message": {
              "paths": ["$.error.message"]
            }
          }
        }
      }
    }'::jsonb,
    'anthropic/claude-3.5-sonnet',
    '["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "google/gemini-pro-1.5"]'::jsonb,
    '{"tool_calling": true, "caching": false, "streaming": true}'::jsonb,
    200000,
    8192,
    false,  -- Not active
    false,  -- Disabled until API key is configured
    'migration_seed'
);

-- =============================================================================
-- 3. GOOGLE AI PROVIDER (Gemini)
-- =============================================================================

INSERT INTO llm_provider_configs (
    provider_name,
    display_name,
    description,
    api_key_encrypted,
    auth_scheme,
    auth_header_template,
    base_url,
    endpoint_path_template,
    http_method,
    additional_headers,
    request_builder_config,
    response_extractor_config,
    default_model,
    supported_models,
    model_capabilities,
    context_window_tokens,
    max_output_tokens_limit,
    is_active,
    is_enabled,
    updated_by
) VALUES (
    'google_ai',
    'Google AI (Gemini)',
    'Google Gemini API - Advanced multimodal AI capabilities',
    NULL,  -- API key to be configured
    'api_key_header',
    'x-goog-api-key: {api_key}',
    'https://generativelanguage.googleapis.com',
    '/v1beta/models/{model}:generateContent',
    'POST',
    '{"Content-Type": "application/json"}'::jsonb,
    -- Request Builder Config (Google AI format)
    '{
      "version": "1.0",
      "headers": {
        "Content-Type": "application/json"
      },
      "payload_structure": {
        "model": {
          "source": "param:model_name",
          "path": "url_path",
          "required": true
        },
        "contents": {
          "source": "param:messages",
          "transform": "messages_transformer",
          "transformer_config": {
            "format": "google_ai",
            "role_mapping": {
              "user": "user",
              "assistant": "model",
              "system": "user"
            },
            "combine_system": true,
            "structure": "parts_array"
          }
        },
        "generationConfig": {
          "type": "object",
          "fields": {
            "temperature": {
              "source": "param:temperature",
              "required": false
            },
            "maxOutputTokens": {
              "source": "param:max_output_tokens",
              "required": false
            }
          }
        },
        "tools": {
          "source": "param:tools",
          "path": "tools",
          "transform": "tools_transformer",
          "transformer_config": {
            "format": "google_function_declarations",
            "enabled_if": "model_capabilities.tool_calling == true"
          },
          "required": false
        }
      }
    }'::jsonb,
    -- Response Extractor Config (Google AI format)
    '{
      "version": "1.0",
      "extraction_rules": {
        "text_content": {
          "type": "string",
          "paths": [
            "$.candidates[0].content.parts[0].text"
          ],
          "join_strategy": "first_non_null",
          "required": true
        },
        "usage_stats": {
          "type": "object",
          "fields": {
            "input_tokens": {
              "type": "integer",
              "paths": [
                "$.usageMetadata.promptTokenCount"
              ],
              "required": true
            },
            "output_tokens": {
              "type": "integer",
              "paths": [
                "$.usageMetadata.candidatesTokenCount"
              ],
              "required": true
            },
            "total_tokens": {
              "type": "integer",
              "paths": [
                "$.usageMetadata.totalTokenCount"
              ],
              "fallback_calculation": "input_tokens + output_tokens",
              "required": true
            },
            "cached_tokens": {
              "type": "integer",
              "paths": [
                "$.usageMetadata.cachedContentTokenCount"
              ],
              "default": 0,
              "required": false
            }
          }
        },
        "tool_calls": {
          "type": "array",
          "detect_format": true,
          "formats": {
            "google_function_calling": {
              "count_path": "$.candidates[0].content.parts[?(@.functionCall)] | length(@)",
              "extract_calls": {
                "path": "$.candidates[0].content.parts[?(@.functionCall)]",
                "item_schema": {
                  "name": "functionCall.name",
                  "arguments": "functionCall.args"
                }
              }
            }
          }
        },
        "finish_reason": {
          "type": "string",
          "paths": [
            "$.candidates[0].finishReason"
          ],
          "value_mapping": {
            "STOP": "stop",
            "1": "stop",
            "MAX_TOKENS": "length",
            "2": "length"
          }
        },
        "error_info": {
          "type": "object",
          "detect_path": "$.error",
          "fields": {
            "error_type": {
              "paths": ["$.error.code", "$.error.status"]
            },
            "error_message": {
              "paths": ["$.error.message"]
            }
          }
        }
      }
    }'::jsonb,
    'gemini-1.5-pro',
    '["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"]'::jsonb,
    '{"tool_calling": true, "caching": true, "streaming": true}'::jsonb,
    1048576,
    8192,
    false,  -- Not active
    false,  -- Disabled until API key is configured
    'migration_seed'
);

-- =============================================================================
-- 4. CHATGPT PROVIDER (OpenAI)
-- =============================================================================

INSERT INTO llm_provider_configs (
    provider_name,
    display_name,
    description,
    api_key_encrypted,
    auth_scheme,
    auth_header_template,
    base_url,
    endpoint_path_template,
    http_method,
    additional_headers,
    request_builder_config,
    response_extractor_config,
    default_model,
    supported_models,
    model_capabilities,
    context_window_tokens,
    max_output_tokens_limit,
    is_active,
    is_enabled,
    updated_by
) VALUES (
    'chatgpt',
    'ChatGPT (OpenAI)',
    'OpenAI ChatGPT API - GPT-4 and GPT-3.5 models',
    NULL,  -- API key to be configured
    'bearer',
    'Authorization: Bearer {api_key}',
    'https://api.openai.com',
    '/v1/chat/completions',
    'POST',
    '{"Content-Type": "application/json"}'::jsonb,
    -- Request Builder Config (OpenAI format)
    '{
      "version": "1.0",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "payload_structure": {
        "model": {
          "source": "param:model_name",
          "required": true
        },
        "messages": {
          "source": "param:messages",
          "transform": "messages_transformer",
          "transformer_config": {
            "format": "openai",
            "role_mapping": {
              "user": "user",
              "assistant": "assistant",
              "system": "system"
            },
            "combine_system": false
          }
        },
        "temperature": {
          "source": "param:temperature",
          "path": "temperature",
          "required": false,
          "default": 0.7
        },
        "max_tokens": {
          "source": "param:max_output_tokens",
          "path": "max_tokens",
          "required": false
        },
        "tools": {
          "source": "param:tools",
          "path": "tools",
          "transform": "tools_transformer",
          "transformer_config": {
            "format": "openai_functions",
            "enabled_if": "model_capabilities.tool_calling == true"
          },
          "required": false
        }
      },
      "conditional_fields": {
        "tool_choice": {
          "include_if": "tools != null",
          "value": "auto"
        }
      }
    }'::jsonb,
    -- Response Extractor Config (OpenAI format)
    '{
      "version": "1.0",
      "extraction_rules": {
        "text_content": {
          "type": "string",
          "paths": [
            "$.choices[0].message.content"
          ],
          "join_strategy": "first_non_null",
          "required": true
        },
        "usage_stats": {
          "type": "object",
          "fields": {
            "input_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.prompt_tokens"
              ],
              "required": true
            },
            "output_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.completion_tokens"
              ],
              "required": true
            },
            "total_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.total_tokens"
              ],
              "fallback_calculation": "input_tokens + output_tokens",
              "required": true
            },
            "cached_tokens": {
              "type": "integer",
              "paths": [
                "$.usage.prompt_tokens_details.cached_tokens"
              ],
              "default": 0,
              "required": false
            }
          }
        },
        "tool_calls": {
          "type": "array",
          "detect_format": true,
          "formats": {
            "openai": {
              "count_path": "$.choices[0].message.tool_calls | length(@)",
              "extract_calls": {
                "path": "$.choices[0].message.tool_calls",
                "item_schema": {
                  "name": "function.name",
                  "arguments": "function.arguments",
                  "id": "id"
                }
              }
            }
          }
        },
        "reasoning": {
          "type": "string",
          "paths": [
            "$.choices[0].message.reasoning"
          ],
          "required": false,
          "default": null
        },
        "finish_reason": {
          "type": "string",
          "paths": [
            "$.choices[0].finish_reason"
          ],
          "value_mapping": {
            "stop": "stop",
            "length": "length",
            "tool_calls": "tool_calls"
          }
        },
        "error_info": {
          "type": "object",
          "detect_path": "$.error",
          "fields": {
            "error_type": {
              "paths": ["$.error.type", "$.error.code"]
            },
            "error_message": {
              "paths": ["$.error.message"]
            }
          }
        }
      }
    }'::jsonb,
    'gpt-4o',
    '["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo", "o1-preview", "o1-mini"]'::jsonb,
    '{"tool_calling": true, "caching": true, "streaming": true}'::jsonb,
    128000,
    16384,
    false,  -- Not active
    false,  -- Disabled until API key is configured
    'migration_seed'
);

-- =============================================================================
-- Verification Queries
-- =============================================================================

DO $$
DECLARE
    provider_count INTEGER;
    active_count INTEGER;
    active_provider VARCHAR(100);
BEGIN
    SELECT COUNT(*) INTO provider_count FROM llm_provider_configs;
    SELECT COUNT(*) INTO active_count FROM llm_provider_configs WHERE is_active = TRUE;
    SELECT provider_name INTO active_provider FROM llm_provider_configs WHERE is_active = TRUE LIMIT 1;
    
    RAISE NOTICE 'Migration 002 completed successfully';
    RAISE NOTICE 'Total providers seeded: %', provider_count;
    RAISE NOTICE 'Active providers: %', active_count;
    RAISE NOTICE 'Current active provider: %', COALESCE(active_provider, 'NONE');
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run migration script: python backend/scripts/migrate_admin_settings_to_db.py';
    RAISE NOTICE '2. Configure API keys for other providers in the database';
    RAISE NOTICE '3. Enable providers as needed';
END $$;

-- =============================================================================
-- Rollback Script (for testing)
-- =============================================================================

-- To rollback this migration:
-- DELETE FROM llm_provider_config_history WHERE provider_id IN (SELECT id FROM llm_provider_configs);
-- DELETE FROM llm_provider_configs WHERE provider_name IN ('groq', 'openrouter', 'google_ai', 'chatgpt');
