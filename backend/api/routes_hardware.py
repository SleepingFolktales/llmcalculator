"""
Hardware search endpoints - GET /api/hardware
"""

from fastapi import APIRouter, Query
from typing import List, Dict
from utils.data_loader import get_data_loader

router = APIRouter()


@router.get("/hardware/gpus", response_model=List[Dict])
async def search_gpus(
    q: str = Query("", description="Search query"),
    limit: int = Query(20, ge=1, le=100)
):
    """Search for GPUs in the database."""
    loader = get_data_loader()
    
    if not q:
        return loader.get_all_gpus()[:limit]
    
    results = loader.search_gpus(q, limit=limit)
    
    return results


@router.get("/hardware/cpus", response_model=List[Dict])
async def get_cpus(limit: int = Query(50, ge=1, le=200)):
    """Get all CPUs from the database."""
    loader = get_data_loader()
    
    return loader.get_all_cpus()[:limit]


@router.get("/hardware/gpus/{gpu_id}")
async def get_gpu(gpu_id: str):
    """Get specific GPU by ID."""
    loader = get_data_loader()
    
    gpu = loader.get_gpu_by_id(gpu_id)
    
    if not gpu:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="GPU not found")
    
    return gpu


@router.get("/hardware/cpus/{cpu_id}")
async def get_cpu(cpu_id: str):
    """Get specific CPU by ID."""
    loader = get_data_loader()
    
    cpu = loader.get_cpu_by_id(cpu_id)
    
    if not cpu:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="CPU not found")
    
    return cpu
