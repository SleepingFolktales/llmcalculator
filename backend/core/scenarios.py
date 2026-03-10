"""
Multi-model scenario logic - handles "swarm" concept (N instances of M model types)
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from .memory import scenario_memory_gb, estimate_memory_gb


@dataclass
class ModelInstance:
    """Represents a single model configuration in a scenario."""
    model_name: str
    params_b: float
    quant: str
    n_instances: int
    context_tokens: int
    use_case: str
    is_moe: bool = False
    active_params_b: Optional[float] = None
    provider: str = "Unknown"


@dataclass
class ScenarioRequest:
    """Complete scenario request with multiple model instances."""
    instances: List[ModelInstance]
    target_tps_per_instance: Optional[float] = None
    total_target_tps: Optional[float] = None
    deployment_mode: str = "concurrent"
    budget_usd: Optional[float] = None


@dataclass
class ScenarioMemoryRequirement:
    """Aggregated memory requirements for a scenario."""
    total_vram_gb: float
    total_ram_gb: float
    per_model_breakdown: List[Dict]
    deployment_mode: str
    total_instances: int


def aggregate_scenario_memory(
    instances: List[ModelInstance],
    strategy: str = "concurrent"
) -> ScenarioMemoryRequirement:
    """
    Total VRAM/RAM needed for running the full scenario.
    
    Args:
        instances: List of model instances to run
        strategy: "concurrent", "sequential", or "batched"
    
    Returns:
        ScenarioMemoryRequirement with aggregated memory needs
    """
    per_model_breakdown = []
    total_vram_concurrent = 0.0
    total_ram_offload = 0.0
    
    for instance in instances:
        mem_calc = scenario_memory_gb(
            params_b=instance.params_b,
            quant=instance.quant,
            context_tokens=instance.context_tokens,
            n_instances=instance.n_instances,
            is_moe=instance.is_moe,
            active_params_b=instance.active_params_b,
        )
        
        if strategy == "concurrent":
            vram_needed = mem_calc["stacked_vram_gb"]
        elif strategy == "batched":
            vram_needed = mem_calc["batched_vram_gb"]
        else:  # sequential
            vram_needed = mem_calc["sequential_vram_gb"]
        
        total_vram_concurrent += vram_needed
        
        breakdown_entry = {
            "model_name": instance.model_name,
            "provider": instance.provider,
            "params_b": instance.params_b,
            "quant": instance.quant,
            "n_instances": instance.n_instances,
            "context_tokens": instance.context_tokens,
            "is_moe": instance.is_moe,
            "vram_gb": vram_needed,
            "per_instance_gb": mem_calc["per_instance_gb"],
            "kv_cache_gb": mem_calc["kv_cache_per_instance_gb"],
        }
        per_model_breakdown.append(breakdown_entry)
    
    if strategy == "sequential":
        total_vram_gb = max([b["vram_gb"] for b in per_model_breakdown]) if per_model_breakdown else 0.0
    else:
        total_vram_gb = total_vram_concurrent
    
    total_ram_gb = max(total_vram_gb * 0.15, 8.0)
    
    total_instances_count = sum(inst.n_instances for inst in instances)
    
    return ScenarioMemoryRequirement(
        total_vram_gb=total_vram_gb,
        total_ram_gb=total_ram_gb,
        per_model_breakdown=per_model_breakdown,
        deployment_mode=strategy,
        total_instances=total_instances_count,
    )


def aggregate_scenario_throughput(
    instances: List[ModelInstance],
    hardware_config: Dict,
    deployment_mode: str = "concurrent"
) -> Dict:
    """
    System-level throughput aggregation.
    
    Args:
        instances: List of model instances
        hardware_config: Dict with gpu_name, backend, cpu_cores
        deployment_mode: How instances are deployed
    
    Returns:
        Dictionary with per-instance and total tok/s
    """
    from .speed import estimate_tps_scenario
    
    total_system_tps = 0.0
    per_model_tps = []
    
    for instance in instances:
        tps_result = estimate_tps_scenario(
            params_b=instance.params_b,
            quant=instance.quant,
            gpu_name=hardware_config.get("gpu_name"),
            backend=hardware_config.get("backend", "CUDA"),
            n_instances=instance.n_instances,
            deployment_mode=deployment_mode,
            cpu_cores=hardware_config.get("cpu_cores", 8),
            is_moe=instance.is_moe,
            active_params_b=instance.active_params_b,
        )
        
        per_model_tps.append({
            "model_name": instance.model_name,
            "per_instance_tps": tps_result["per_instance_tps"],
            "total_tps": tps_result["total_system_tps"],
        })
        
        total_system_tps += tps_result["total_system_tps"]
    
    return {
        "total_system_tps": total_system_tps,
        "per_model_breakdown": per_model_tps,
        "deployment_mode": deployment_mode,
    }
