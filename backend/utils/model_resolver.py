"""
Model resolver - fuzzy search and resolve model by name/query
"""

from typing import Optional, Dict
from .data_loader import get_data_loader


def resolve_model(query: str) -> Optional[Dict]:
    """
    Resolve a model query to a specific model entry.
    
    Supports:
    - Exact model name: "meta-llama/Llama-3.1-70B-Instruct"
    - Partial name: "llama 70b"
    - Parameter count: "70b"
    
    Args:
        query: Model search query
    
    Returns:
        Model dict or None if not found
    """
    loader = get_data_loader()
    
    query_lower = query.lower().strip()
    
    for model in loader.get_all_models():
        if model.get("name", "").lower() == query_lower:
            return model
    
    search_results = loader.search_models(query, limit=1)
    if search_results:
        return search_results[0]
    
    return None


def extract_model_info(model: Dict) -> Dict:
    """
    Extract key information from a model entry.
    
    Returns:
        Dict with standardized model information
    """
    params_raw = model.get("parameters_raw", 0)
    params_b = params_raw / 1_000_000_000 if params_raw > 0 else 0.0
    
    is_moe = model.get("is_moe", False)
    active_params = None
    if is_moe and "active_parameters" in model:
        active_params = model["active_parameters"] / 1_000_000_000
    
    return {
        "name": model.get("name", "Unknown"),
        "provider": model.get("provider", "Unknown"),
        "params_b": params_b,
        "parameter_count": model.get("parameter_count", ""),
        "context_length": model.get("context_length", 4096),
        "use_case": model.get("use_case", "general"),
        "is_moe": is_moe,
        "active_params_b": active_params,
        "quantization": model.get("quantization", "Q4_K_M"),
        "min_ram_gb": model.get("min_ram_gb", 0),
        "recommended_ram_gb": model.get("recommended_ram_gb", 0),
    }
