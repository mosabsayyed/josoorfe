"""
ADD THIS TO YOUR BACKEND'S ADMIN ROUTES FILE
=============================================
Find the file that handles /api/admin/providers (likely admin_routes.py or similar).
Add this POST endpoint alongside the existing GET and PUT endpoints.

Prerequisites:
- The existing GET /api/admin/providers endpoint already works
- The llm_provider_configs table exists in Supabase (confirmed)
- The backend uses FastAPI + Supabase client
"""

# --- PASTE THIS ENDPOINT INTO YOUR ADMIN ROUTER ---

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# If your router is already defined, just add the endpoint function below.
# router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateProviderRequest(BaseModel):
    provider_name: str
    display_name: str
    description: Optional[str] = None
    api_key_encrypted: Optional[str] = None
    auth_scheme: str = "bearer"
    auth_header_template: Optional[str] = "Authorization: Bearer {api_key}"
    base_url: str
    endpoint_path_template: str
    http_method: str = "POST"
    additional_headers: Optional[Dict[str, Any]] = None
    request_builder_config: Dict[str, Any]
    response_extractor_config: Dict[str, Any]
    default_model: str
    supported_models: Optional[List[str]] = None
    model_capabilities: Optional[Dict[str, Any]] = None
    context_window_tokens: Optional[int] = None
    max_output_tokens_limit: Optional[int] = None
    is_enabled: bool = True
    enable_mcp_tools: bool = False


# ADD THIS ENDPOINT to your existing admin router:

@router.post("/providers")
async def create_provider(request: CreateProviderRequest):
    """Create a new LLM provider configuration."""
    try:
        data = request.dict(exclude_none=True)

        # Ensure supported_models is JSONB
        if "supported_models" in data:
            import json
            if isinstance(data["supported_models"], list):
                pass  # Supabase client handles list → jsonb

        result = supabase.table("llm_provider_configs").insert(data).execute()

        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create provider")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- THAT'S IT ---
# After adding this endpoint, restart the backend service.
# The frontend's adminService.createProvider() will call POST /api/admin/providers
# and the "Add Provider" button in ProviderManagement.tsx will work.
