"""
Memory estimation logic ported from llmfit models.rs
Calculates VRAM/RAM requirements for LLM inference.
"""

from typing import Dict, Tuple, Optional
from .quantization import (
    quant_bpp,
    QUANT_HIERARCHY,
    get_next_lower_quant,
)


def estimate_memory_gb(
    params_b: float,
    quant: str,
    context_tokens: int,
    is_moe: bool = False,
    active_params_b: Optional[float] = None,
    bytes_per_param: Optional[float] = None,
) -> float:
    """
    Total memory = model weights + KV cache + runtime overhead.
    
    Args:
        params_b: Model parameters in billions
        quant: Quantization level (e.g., "Q4_K_M")
        context_tokens: Context window size
        is_moe: Whether this is a Mixture of Experts model
        active_params_b: Active parameters for MoE (if applicable)
        bytes_per_param: Override bytes per parameter (from precision format)
    
    Returns:
        Total memory required in GB
    """
    # Use precision format bytes_per_param if provided, otherwise use quant_bpp
    bpp = bytes_per_param if bytes_per_param is not None else quant_bpp(quant)
    
    if is_moe and active_params_b:
        model_weights = active_params_b * bpp
    else:
        model_weights = params_b * bpp
    
    kv_cache = 0.000008 * params_b * context_tokens
    
    overhead = 0.5
    
    return model_weights + kv_cache + overhead


def best_quant_for_budget(
    params_b: float,
    budget_gb: float,
    context_tokens: int,
    is_moe: bool = False,
    active_params_b: Optional[float] = None,
    bytes_per_param: Optional[float] = None,
) -> Optional[Tuple[str, float]]:
    """
    Walk QUANT_HIERARCHY from best quality to worst.
    Return first (quant, memory_gb) that fits in budget.
    
    Args:
        params_b: Model parameters in billions
        budget_gb: Available memory budget
        context_tokens: Context window size
        is_moe: Whether this is a Mixture of Experts model
        active_params_b: Active parameters for MoE
        bytes_per_param: Override bytes per parameter (from precision format)
    
    Returns:
        Tuple of (quantization, memory_gb) or None if nothing fits
    """
    for quant in QUANT_HIERARCHY:
        mem_gb = estimate_memory_gb(params_b, quant, context_tokens, is_moe, active_params_b, bytes_per_param)
        if mem_gb <= budget_gb:
            return (quant, mem_gb)
    
    if context_tokens > 2048:
        half_context = context_tokens // 2
        for quant in QUANT_HIERARCHY:
            mem_gb = estimate_memory_gb(params_b, quant, half_context, is_moe, active_params_b, bytes_per_param)
            if mem_gb <= budget_gb:
                return (quant, mem_gb)
    
    return None


def moe_active_memory_gb(active_params_b: float, quant: str, context_tokens: int) -> float:
    """VRAM needed for active MoE experts only (×1.1 safety headroom)."""
    base_mem = active_params_b * quant_bpp(quant)
    kv_cache = 0.000008 * active_params_b * context_tokens
    overhead = 0.5
    return (base_mem + kv_cache + overhead) * 1.1


def moe_offloaded_memory_gb(
    total_params_b: float,
    active_params_b: float,
    quant: str,
) -> float:
    """RAM needed to hold inactive MoE experts."""
    inactive_params_b = total_params_b - active_params_b
    return inactive_params_b * quant_bpp(quant)


def scenario_memory_gb(
    params_b: float,
    quant: str,
    context_tokens: int,
    n_instances: int,
    is_moe: bool = False,
    active_params_b: Optional[float] = None,
    bytes_per_param: Optional[float] = None,
) -> Dict[str, float]:
    """
    Calculate total memory for N model instances running concurrently.
    
    Strategies:
    - 'stacked': All instances in GPU (n × single_model_mem)
    - 'batched': Single model with batched inference (1× model + n× KV cache)
    - 'sequential': One model, instances run sequentially (1× memory)
    
    Returns:
        Dictionary with memory requirements for different deployment strategies
    """
    single_instance_mem = estimate_memory_gb(
        params_b, quant, context_tokens, is_moe, active_params_b, bytes_per_param
    )
    
    # Use precision format bytes_per_param if provided, otherwise use quant_bpp
    bpp = bytes_per_param if bytes_per_param is not None else quant_bpp(quant)
    
    model_weights = (active_params_b if is_moe and active_params_b else params_b) * bpp
    kv_cache_per_instance = 0.000008 * params_b * context_tokens
    overhead = 0.5
    
    stacked_vram = single_instance_mem * n_instances
    
    batched_vram = model_weights + (kv_cache_per_instance * n_instances) + overhead
    
    sequential_vram = single_instance_mem
    
    return {
        "stacked_vram_gb": stacked_vram,
        "batched_vram_gb": batched_vram,
        "sequential_vram_gb": sequential_vram,
        "per_instance_gb": single_instance_mem,
        "kv_cache_per_instance_gb": kv_cache_per_instance,
        "model_weights_gb": model_weights,
    }
