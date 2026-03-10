"""
Model search endpoints - GET /api/models
"""

from fastapi import APIRouter, Query
from typing import List, Dict
from utils.data_loader import get_data_loader

router = APIRouter()


@router.get("/models", response_model=List[Dict])
async def search_models(
    q: str = Query("", description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results")
):
    """
    Search for models in the database.
    
    Args:
        q: Search query (model name, provider, parameter count)
        limit: Maximum number of results
    
    Returns:
        List of matching models
    """
    loader = get_data_loader()
    
    if not q:
        return loader.get_all_models()[:limit]
    
    results = loader.search_models(q, limit=limit)
    
    return results


@router.get("/models/{model_id}")
async def get_model(model_id: str):
    """
    Get full model metadata by ID.
    
    Args:
        model_id: Model identifier
    
    Returns:
        Model metadata
    """
    loader = get_data_loader()
    
    model = loader.get_model_by_id(model_id)
    
    if not model:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Model not found")
    
    return model
