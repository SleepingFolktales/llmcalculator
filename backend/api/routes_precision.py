"""
API routes for precision formats
"""

from fastapi import APIRouter
from typing import List, Dict
from utils.data_loader import get_data_loader

router = APIRouter(prefix="/precision", tags=["precision"])


@router.get("/formats", response_model=List[Dict])
async def get_precision_formats():
    """
    Get all available precision formats.
    
    Returns list of precision formats with metadata:
    - id: unique identifier (e.g. "fp16", "int8", "q4_k_m")
    - name: full display name
    - short_name: abbreviated name
    - bits: effective bits per parameter
    - bytes_per_param: bytes per parameter multiplier
    - category: format category
    - quality_score: quality percentage (0-100)
    - memory_reduction_pct: memory reduction vs FP32
    - use_case: primary use case
    - hardware_requirements: required hardware
    - popular: whether this is a popular choice
    - inference_recommended: whether recommended for inference
    """
    loader = get_data_loader()
    return loader.get_all_precision_formats()


@router.get("/formats/{precision_id}", response_model=Dict)
async def get_precision_format(precision_id: str):
    """Get specific precision format by ID."""
    loader = get_data_loader()
    precision = loader.get_precision_by_id(precision_id)
    if not precision:
        return {"error": f"Precision format '{precision_id}' not found"}
    return precision
