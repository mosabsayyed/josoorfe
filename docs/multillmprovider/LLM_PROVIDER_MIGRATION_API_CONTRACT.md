# LLM Provider Migration - Frontend API Contract

**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** January 17, 2026  
**Backend Base URL:** `/api` (all paths relative to this)

---

## Executive Summary

This document defines the complete API contract for the LLM Provider Migration system. Frontend teams must implement these exact endpoints, request/response formats, and error handling patterns.

**Key Principles:**
- All responses follow standard JSON format (status + data/error)
- All timestamps in ISO 8601 format (UTC)
- All numeric IDs are integers or UUIDs
- Rate limiting: 1000 req/min per IP
- Authentication: Bearer token in Authorization header

---

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [LLM Execution API](#llm-execution-api)
4. [Admin Provider Management](#admin-provider-management)
5. [A/B Testing](#ab-testing)
6. [Metrics & Observability](#metrics--observability)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

All admin endpoints require Bearer token authentication.

### Header Format
```
Authorization: Bearer <jwt_token>
```

### Token Claims
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin",
  "exp": 1705420800
}
```

### Error: Unauthorized
```
Status: 401
Response: {
  "status": "error",
  "error": {
    "type": "unauthorized",
    "message": "Invalid or expired token"
  }
}
```

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    /* Endpoint-specific data */
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "type": "error_type",
    "message": "Human-readable error message",
    "details": {
      /* Optional additional context */
    }
  }
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": [
    /* Items */
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## LLM Execution API

### POST /llm/execute

Execute a query against the active LLM provider.

#### Request

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant"
    },
    {
      "role": "user",
      "content": "What are the active projects?"
    }
  ],
  "model": "mixtral-8x7b",
  "provider": "groq",
  "temperature": 0.7,
  "max_output_tokens": 1000,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_projects",
        "description": "Get list of projects",
        "parameters": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": ["active", "completed", "paused"]
            }
          }
        }
      }
    }
  ]
}
```

#### Request Schema

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| messages | Array | Yes | - | Array of message objects with role and content |
| model | String | Yes | - | Provider-specific model name |
| provider | String | No | active | Provider ID: groq, google_ai, chatgpt, openrouter |
| temperature | Float | No | 0.7 | Range: 0.0 - 2.0 |
| max_output_tokens | Integer | No | - | Must be positive |
| tools | Array | No | - | Optional function definitions |

#### Message Schema

```json
{
  "role": "system|user|assistant",
  "content": "string"
}
```

#### Response (Success)

```json
{
  "status": "success",
  "data": {
    "text": "The active projects are...",
    "usage": {
      "input_tokens": 150,
      "output_tokens": 85,
      "total_tokens": 235,
      "cached_tokens": 50
    },
    "provider": "groq",
    "model": "mixtral-8x7b",
    "latency_ms": 234,
    "request_id": "req_a1b2c3d4e5f6",
    "tool_calls": [
      {
        "id": "call_1",
        "type": "function",
        "function": {
          "name": "get_projects",
          "arguments": "{\"status\": \"active\"}"
        }
      }
    ]
  }
}
```

#### Response Schema

| Field | Type | Notes |
|-------|------|-------|
| text | String | The LLM's text response |
| usage | Object | Token usage breakdown |
| usage.input_tokens | Integer | Number of input tokens |
| usage.output_tokens | Integer | Number of output tokens |
| usage.total_tokens | Integer | Sum of input + output |
| usage.cached_tokens | Integer | Number of cached tokens (if applicable) |
| provider | String | Which provider executed the request |
| model | String | Which model was used |
| latency_ms | Integer | Round-trip latency in milliseconds |
| request_id | String | Unique request identifier for logging |
| tool_calls | Array | List of function calls (if any) |

#### Response (Error - Invalid Input)

```json
{
  "status": "error",
  "error": {
    "type": "invalid_request",
    "message": "Invalid request format",
    "details": {
      "field": "temperature",
      "issue": "Must be between 0.0 and 2.0"
    }
  }
}
```

#### Response (Error - Provider Not Found)

```json
{
  "status": "error",
  "error": {
    "type": "provider_not_found",
    "message": "Provider 'unknown_provider' is not configured",
    "details": {
      "available_providers": ["groq", "google_ai", "chatgpt", "openrouter"]
    }
  }
}
```

#### Response (Error - Network Error)

```json
{
  "status": "error",
  "error": {
    "type": "network_error",
    "message": "Failed to connect to LLM provider",
    "details": {
      "provider": "groq",
      "error": "Connection timeout after 30s"
    }
  }
}
```

Status Code: 502

#### Response (Error - Timeout)

```json
{
  "status": "error",
  "error": {
    "type": "timeout",
    "message": "LLM request exceeded timeout",
    "details": {
      "timeout_ms": 300000,
      "provider": "google_ai"
    }
  }
}
```

Status Code: 504

#### Response (Error - Rate Limited)

```json
{
  "status": "error",
  "error": {
    "type": "rate_limited",
    "message": "Provider rate limit exceeded",
    "details": {
      "provider": "openrouter",
      "retry_after_seconds": 60
    }
  }
}
```

Status Code: 429  
Header: `Retry-After: 60`

---

## Admin Provider Management

### GET /admin/providers

List all configured LLM providers.

#### Request

```
GET /admin/providers
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "providers": [
      {
        "id": "groq",
        "name": "Groq",
        "display_name": "Groq (Responses API)",
        "base_url": "https://api.groq.com",
        "active": true,
        "supported_models": ["mixtral-8x7b", "llama-3-70b"],
        "default_model": "mixtral-8x7b",
        "config_status": "valid",
        "last_tested": "2026-01-17T10:30:00Z",
        "last_test_result": "success"
      },
      {
        "id": "google_ai",
        "name": "Google AI",
        "display_name": "Google AI (Gemini)",
        "base_url": "generativelanguage.googleapis.com",
        "active": false,
        "supported_models": ["gemini-2.0-flash", "gemini-pro"],
        "default_model": "gemini-2.0-flash",
        "config_status": "incomplete",
        "last_tested": null,
        "last_test_result": null
      }
    ]
  }
}
```

### GET /admin/providers/{provider_id}

Get detailed configuration for a specific provider.

#### Request

```
GET /admin/providers/groq
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "id": "groq",
    "name": "Groq",
    "display_name": "Groq (Responses API)",
    "base_url": "https://api.groq.com",
    "endpoint_path_template": "/openai/v1/responses",
    "auth_header_template": "Authorization: Bearer {api_key}",
    "active": true,
    "default_model": "mixtral-8x7b",
    "supported_models": ["mixtral-8x7b", "llama-3-70b", "llama-3.1-405b"],
    "timeout_seconds": 300,
    "request_builder_config": {
      "version": "1.0",
      "payload_structure": {
        /* Provider-specific request structure */
      }
    },
    "response_extractor_config": {
      "version": "1.0",
      /* Provider-specific response structure */
    },
    "created_at": "2026-01-10T00:00:00Z",
    "updated_at": "2026-01-17T10:00:00Z"
  }
}
```

### POST /admin/providers/{provider_id}/test

Test connection to a provider.

#### Request

```json
{
  "model": "mixtral-8x7b",
  "test_message": "Hello"
}
```

#### Response (Success)

```json
{
  "status": "success",
  "data": {
    "provider": "groq",
    "model": "mixtral-8x7b",
    "status": "success",
    "latency_ms": 234,
    "response": "Hello! I'm here to help.",
    "usage": {
      "input_tokens": 5,
      "output_tokens": 12,
      "total_tokens": 17
    },
    "timestamp": "2026-01-17T10:30:00Z"
  }
}
```

#### Response (Error)

```json
{
  "status": "success",
  "data": {
    "provider": "google_ai",
    "model": "gemini-2.0-flash",
    "status": "error",
    "error": "Invalid API key for provider",
    "error_type": "authentication_failed",
    "timestamp": "2026-01-17T10:30:00Z"
  }
}
```

Note: Even though the test failed, the HTTP status is 200 because the API call itself succeeded.

### PUT /admin/providers/{provider_id}/activate

Activate a provider (deactivates all others).

#### Request

```
PUT /admin/providers/google_ai/activate
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "active_provider": "google_ai",
    "previous_provider": "groq",
    "message": "Google AI is now the active provider",
    "switched_at": "2026-01-17T10:30:00Z"
  }
}
```

### PUT /admin/providers/{provider_id}

Update provider configuration.

#### Request

```json
{
  "base_url": "https://api.groq.com",
  "default_model": "llama-3.1-405b",
  "timeout_seconds": 600,
  "config_json": {
    "enable_mcp_tools": true
  }
}
```

#### Response

```json
{
  "status": "success",
  "data": {
    "provider_id": "groq",
    "updated_fields": ["default_model", "timeout_seconds"],
    "message": "Provider configuration updated",
    "updated_at": "2026-01-17T10:30:00Z"
  }
}
```

---

## A/B Testing

### GET /admin/ab-testing/config

Get current A/B testing configuration.

#### Request

```
GET /admin/ab-testing/config
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "test_name": "Provider Migration - Phase 1",
    "primary_provider": "groq",
    "secondary_provider": "openrouter",
    "traffic_split": {
      "groq": 80,
      "openrouter": 20
    },
    "metrics_tracked": ["latency", "cost", "quality"],
    "test_duration": {
      "start": "2026-01-10T00:00:00Z",
      "end": "2026-02-10T00:00:00Z"
    },
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

### PUT /admin/ab-testing/traffic-split

Update traffic split percentages.

#### Request

```json
{
  "split": {
    "groq": 70,
    "openrouter": 30
  },
  "test_name": "Provider Migration - Phase 2"
}
```

#### Response

```json
{
  "status": "success",
  "data": {
    "message": "Traffic split updated",
    "previous_split": {
      "groq": 80,
      "openrouter": 20
    },
    "new_split": {
      "groq": 70,
      "openrouter": 30
    },
    "affected_requests": "All new requests will use new split",
    "updated_at": "2026-01-17T10:30:00Z"
  }
}
```

### GET /admin/ab-testing/comparison

Get provider comparison metrics.

#### Query Parameters

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| time_range | String | 24h | 1h, 24h, 7d, 30d, or custom |
| metric | String | all | all, latency, cost, quality, errors |

#### Request

```
GET /admin/ab-testing/comparison?time_range=7d&metric=all
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "time_range": "7d",
    "comparison": {
      "groq": {
        "total_requests": 5000,
        "avg_latency_ms": 234,
        "avg_input_tokens": 150,
        "avg_output_tokens": 85,
        "total_cost": 2.50,
        "cost_per_request": 0.0005,
        "error_rate": 0.002,
        "avg_quality_score": 8.7
      },
      "openrouter": {
        "total_requests": 1200,
        "avg_latency_ms": 189,
        "avg_input_tokens": 150,
        "avg_output_tokens": 85,
        "total_cost": 1.44,
        "cost_per_request": 0.0012,
        "error_rate": 0.001,
        "avg_quality_score": 8.9
      }
    },
    "recommendation": "OpenRouter has better latency and quality at lower cost",
    "generated_at": "2026-01-17T10:30:00Z"
  }
}
```

### GET /admin/ab-testing/cost-analysis

Get cost analysis and potential savings.

#### Request

```
GET /admin/ab-testing/cost-analysis?period=week
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "period": "week",
    "start_date": "2026-01-10",
    "end_date": "2026-01-17",
    "providers": {
      "groq": {
        "input_tokens": 500000,
        "output_tokens": 250000,
        "rate_per_million": {
          "input": 0.0,
          "output": 0.0
        },
        "total_cost": 0.00,
        "cost_per_request": 0.0
      },
      "openrouter": {
        "input_tokens": 150000,
        "output_tokens": 75000,
        "rate_per_million": {
          "input": 0.8,
          "output": 1.5
        },
        "total_cost": 19.35,
        "cost_per_request": 0.016
      }
    },
    "total_cost": 19.35,
    "cheapest_provider": "groq",
    "savings_potential": "If 100% groq: $19.35/week savings vs current split"
  }
}
```

---

## Metrics & Observability

### GET /admin/metrics/summary

Get dashboard summary metrics.

#### Query Parameters

| Parameter | Type | Default |
|-----------|------|---------|
| time_range | String | 24h |

#### Request

```
GET /admin/metrics/summary?time_range=24h
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "time_range": "24h",
    "summary": {
      "total_requests": 12453,
      "total_input_tokens": 1234567,
      "total_output_tokens": 567890,
      "total_cached_tokens": 123456,
      "total_cost": 125.50,
      "avg_latency_ms": 234,
      "error_rate": 0.0015,
      "p50_latency_ms": 180,
      "p75_latency_ms": 450,
      "p95_latency_ms": 850,
      "p99_latency_ms": 2100
    }
  }
}
```

### GET /admin/metrics/providers

Compare metrics by provider.

#### Request

```
GET /admin/metrics/providers?time_range=7d
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "time_range": "7d",
    "providers": {
      "groq": {
        "requests": 8000,
        "avg_latency_ms": 234,
        "total_cost": 80.00,
        "error_rate": 0.001,
        "input_tokens": 800000,
        "output_tokens": 300000,
        "cached_tokens": 50000
      },
      "google_ai": {
        "requests": 2000,
        "avg_latency_ms": 321,
        "total_cost": 36.00,
        "error_rate": 0.0005,
        "input_tokens": 200000,
        "output_tokens": 100000,
        "cached_tokens": 30000
      },
      "chatgpt": {
        "requests": 1200,
        "avg_latency_ms": 189,
        "total_cost": 250.00,
        "error_rate": 0.002,
        "input_tokens": 120000,
        "output_tokens": 60000,
        "cached_tokens": 0
      },
      "openrouter": {
        "requests": 800,
        "avg_latency_ms": 267,
        "total_cost": 15.00,
        "error_rate": 0.0025,
        "input_tokens": 80000,
        "output_tokens": 40000,
        "cached_tokens": 0
      }
    }
  }
}
```

### GET /admin/metrics/tokens/timeline

Get token usage over time.

#### Query Parameters

| Parameter | Type | Default |
|-----------|------|---------|
| time_range | String | 7d |
| interval | String | 1h |

#### Request

```
GET /admin/metrics/tokens/timeline?time_range=7d&interval=1h
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "time_range": "7d",
    "interval": "1h",
    "points": [
      {
        "timestamp": "2026-01-16T10:00:00Z",
        "input_tokens": 50000,
        "output_tokens": 25000,
        "total_tokens": 75000,
        "cached_tokens": 10000
      },
      {
        "timestamp": "2026-01-16T11:00:00Z",
        "input_tokens": 48000,
        "output_tokens": 24000,
        "total_tokens": 72000,
        "cached_tokens": 9000
      }
    ]
  }
}
```

### GET /admin/metrics/latency/distribution

Get latency distribution histogram.

#### Request

```
GET /admin/metrics/latency/distribution?time_range=24h
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "latency_distribution": {
      "0-100ms": 2000,
      "100-200ms": 3500,
      "200-500ms": 4000,
      "500-1000ms": 2000,
      "1000-2000ms": 800,
      "2000ms+": 153
    },
    "percentiles": {
      "p50": 185,
      "p75": 320,
      "p90": 650,
      "p95": 850,
      "p99": 2100
    }
  }
}
```

### GET /admin/metrics/errors

Get error analysis.

#### Request

```
GET /admin/metrics/errors?time_range=24h
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "total_errors": 18,
    "error_rate": 0.0015,
    "by_type": {
      "network_error": 5,
      "timeout": 2,
      "rate_limit": 8,
      "invalid_request": 1,
      "other": 2
    },
    "by_provider": {
      "groq": {
        "count": 8,
        "error_rate": 0.001,
        "top_error": "rate_limit"
      },
      "google_ai": {
        "count": 1,
        "error_rate": 0.0005,
        "top_error": "timeout"
      },
      "chatgpt": {
        "count": 5,
        "error_rate": 0.004,
        "top_error": "network_error"
      }
    }
  }
}
```

### GET /admin/metrics/cost

Get cost breakdown.

#### Query Parameters

| Parameter | Type | Default |
|-----------|------|---------|
| time_range | String | 30d |
| breakdown | String | provider |

#### Request

```
GET /admin/metrics/cost?time_range=30d&breakdown=provider
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "time_range": "30d",
    "total_cost": 3750.00,
    "by_provider": {
      "groq": {
        "cost": 0.00,
        "percentage": 0,
        "input_cost": 0.00,
        "output_cost": 0.00,
        "requests": 150000
      },
      "google_ai": {
        "cost": 600.00,
        "percentage": 16,
        "input_cost": 450.00,
        "output_cost": 150.00,
        "requests": 40000
      },
      "chatgpt": {
        "cost": 3000.00,
        "percentage": 80,
        "input_cost": 1500.00,
        "output_cost": 1500.00,
        "requests": 20000
      },
      "openrouter": {
        "cost": 150.00,
        "percentage": 4,
        "input_cost": 100.00,
        "output_cost": 50.00,
        "requests": 10000
      }
    },
    "trend": [
      {
        "date": "2026-01-17",
        "cost": 125.00
      }
    ]
  }
}
```

### GET /admin/metrics/logs

Search request logs.

#### Query Parameters

| Parameter | Type | Default |
|-----------|------|---------|
| provider | String | - |
| status | String | all |
| limit | Integer | 50 |
| offset | Integer | 0 |
| sort | String | created_at:desc |

#### Request

```
GET /admin/metrics/logs?provider=groq&status=error&limit=20&offset=0
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "log_abc123",
        "request_id": "req_def456",
        "provider": "groq",
        "model": "mixtral-8x7b",
        "status": "success",
        "input_tokens": 100,
        "output_tokens": 50,
        "total_tokens": 150,
        "cached_tokens": 0,
        "latency_ms": 234,
        "cost": 0.00,
        "error_type": null,
        "error_message": null,
        "created_at": "2026-01-17T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 5000,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  }
}
```

### GET /admin/metrics/anomalies

Get detected anomalies.

#### Request

```
GET /admin/metrics/anomalies?time_range=24h
Authorization: Bearer <token>
```

#### Response

```json
{
  "status": "success",
  "data": {
    "anomalies": [
      {
        "id": "anom_xyz789",
        "type": "high_error_rate",
        "provider": "chatgpt",
        "severity": "warning",
        "message": "Error rate increased to 4% (normal: 0.2%)",
        "detected_at": "2026-01-17T10:30:00Z",
        "impact": "8 failed requests in last hour"
      },
      {
        "id": "anom_abc123",
        "type": "cost_spike",
        "provider": "chatgpt",
        "severity": "info",
        "message": "Cost increased 20% in last hour",
        "detected_at": "2026-01-17T10:20:00Z",
        "impact": "Cost increased from $5.00 to $6.00"
      }
    ]
  }
}
```

---

## Error Handling

### Standard HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid input validation failed |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Backend error |
| 502 | Bad Gateway | Provider connection error |
| 503 | Service Unavailable | Backend service down |
| 504 | Gateway Timeout | Request timeout |

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "type": "error_type_enum",
    "message": "Human readable message",
    "details": {
      "field": "value",
      "context": "additional info"
    }
  }
}
```

### Error Types

| Type | HTTP Status | Cause |
|------|------------|-------|
| invalid_request | 400 | Malformed JSON or missing required fields |
| validation_error | 400 | Field validation failed |
| provider_not_found | 404 | Provider ID doesn't exist |
| provider_not_active | 400 | No active provider configured |
| unauthorized | 401 | Missing or invalid auth token |
| forbidden | 403 | User doesn't have admin role |
| network_error | 502 | Cannot reach provider |
| timeout | 504 | Request exceeded timeout |
| rate_limited | 429 | Provider rate limit hit |
| internal_error | 500 | Backend error |

---

## Rate Limiting

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705420800
```

### Rate Limit Tiers

| Endpoint Type | Requests/Minute | Requests/Hour |
|--------------|-----------------|---------------|
| LLM Execution | 60 | 3000 |
| Admin APIs | 100 | 5000 |
| Metrics APIs | 120 | 6000 |

### Rate Limit Response

```
Status: 429
X-RateLimit-Retry-After: 60

{
  "status": "error",
  "error": {
    "type": "rate_limited",
    "message": "Rate limit exceeded",
    "details": {
      "retry_after_seconds": 60,
      "limit": 60,
      "window": "1m"
    }
  }
}
```

---

## Implementation Checklist for Frontend

### Phase 1: Core LLM Execution
- [ ] Implement POST /llm/execute
- [ ] Handle all error responses (400, 404, 502, 504, 429)
- [ ] Display latency and token usage
- [ ] Show request_id for logging

### Phase 2: Admin Provider Management
- [ ] Implement GET /admin/providers (list)
- [ ] Implement GET /admin/providers/{id} (details)
- [ ] Implement POST /admin/providers/{id}/test (test connection)
- [ ] Implement PUT /admin/providers/{id}/activate (switch provider)
- [ ] Create provider configuration form

### Phase 3: A/B Testing UI
- [ ] Display GET /admin/ab-testing/config
- [ ] Implement traffic split slider (PUT /admin/ab-testing/traffic-split)
- [ ] Display comparison metrics (GET /admin/ab-testing/comparison)
- [ ] Show cost analysis (GET /admin/ab-testing/cost-analysis)

### Phase 4: Metrics Dashboard
- [ ] Display summary metrics (GET /admin/metrics/summary)
- [ ] Show provider comparison chart (GET /admin/metrics/providers)
- [ ] Show token timeline graph (GET /admin/metrics/tokens/timeline)
- [ ] Show latency distribution histogram (GET /admin/metrics/latency/distribution)
- [ ] Show error breakdown chart (GET /admin/metrics/errors)
- [ ] Show cost breakdown pie chart (GET /admin/metrics/cost)
- [ ] Show searchable logs table (GET /admin/metrics/logs)
- [ ] Display anomaly alerts (GET /admin/metrics/anomalies)

---

## Authentication Examples

### cURL with Bearer Token

```bash
curl -X GET http://localhost:8000/admin/providers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript/TypeScript

```typescript
const response = await fetch('/admin/providers', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Common Integration Patterns

### Pattern 1: LLM Execution with Fallback

```typescript
async function executeQuery(messages, model) {
  try {
    const response = await fetch('/llm/execute', {
      method: 'POST',
      body: JSON.stringify({ messages, model })
    });
    
    if (response.ok) {
      return response.json();
    } else if (response.status === 429) {
      // Retry after delay
      const retryAfter = response.headers.get('Retry-After');
      await sleep(parseInt(retryAfter) * 1000);
      return executeQuery(messages, model);
    } else if (response.status === 404) {
      // Provider not found
      throw new Error('Provider not configured');
    }
  } catch (error) {
    // Handle network error
    console.error('LLM request failed:', error);
  }
}
```

### Pattern 2: Provider Switching

```typescript
async function switchProvider(providerId) {
  const response = await fetch(`/admin/providers/${providerId}/activate`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  if (result.status === 'success') {
    // Update UI to show new active provider
    showNotification(`Switched to ${result.data.active_provider}`);
  }
}
```

### Pattern 3: Metrics Dashboard Updates

```typescript
async function fetchMetrics() {
  const [summary, providers, errors] = await Promise.all([
    fetch('/admin/metrics/summary?time_range=24h').then(r => r.json()),
    fetch('/admin/metrics/providers?time_range=24h').then(r => r.json()),
    fetch('/admin/metrics/errors?time_range=24h').then(r => r.json())
  ]);
  
  return {
    summary: summary.data,
    providers: providers.data,
    errors: errors.data
  };
}
```

---

## Versioning

**Current Version:** 1.0  
**Release Date:** January 17, 2026  
**Stability:** Production

### Future Versions

- v1.1: WebSocket support for streaming responses
- v1.2: Batch request API
- v2.0: Advanced provider chaining

---

## Support & Questions

For API issues or clarifications:
1. Check [error responses](#error-handling) section
2. Review [common patterns](#common-integration-patterns)
3. Test with provided curl examples
4. Contact backend team with request_id from failed requests

