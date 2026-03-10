"""
Main calculator orchestration - runs a full scenario calculation
"""

from typing import Dict, List
from .scenarios import ModelInstance, aggregate_scenario_memory
from .scoring import calculate_tier
from .quantization import quant_description


def calculate_hardware_recommendations(
    model_instances: List[ModelInstance],
    deployment_mode: str,
    gpu_db: List[Dict],
    cpu_db: List[Dict],
    prefer_single_gpu: bool = True,
) -> Dict:
    """
    Main orchestration function that calculates hardware recommendations.
    
    Args:
        model_instances: List of model instances to run
        deployment_mode: "concurrent", "sequential", or "batched"
        gpu_db: GPU database
        cpu_db: CPU database
        prefer_single_gpu: Prefer single GPU over multi-GPU
    
    Returns:
        Dictionary with minimum, ideal, and best tier recommendations
    """
    memory_req = aggregate_scenario_memory(model_instances, deployment_mode)
    
    base_vram = memory_req.total_vram_gb
    
    largest_model = max(model_instances, key=lambda m: m.params_b)
    
    minimum_tier = calculate_tier(
        tier_name="minimum",
        requirement_vram_gb=base_vram,
        params_b=largest_model.params_b,
        context_tokens=largest_model.context_tokens,
        gpu_db=gpu_db,
        cpu_db=cpu_db,
        is_moe=largest_model.is_moe,
        active_params_b=largest_model.active_params_b,
    )
    
    ideal_tier = calculate_tier(
        tier_name="ideal",
        requirement_vram_gb=base_vram,
        params_b=largest_model.params_b,
        context_tokens=largest_model.context_tokens,
        gpu_db=gpu_db,
        cpu_db=cpu_db,
        is_moe=largest_model.is_moe,
        active_params_b=largest_model.active_params_b,
    )
    
    best_tier = calculate_tier(
        tier_name="best",
        requirement_vram_gb=base_vram,
        params_b=largest_model.params_b,
        context_tokens=largest_model.context_tokens,
        gpu_db=gpu_db,
        cpu_db=cpu_db,
        is_moe=largest_model.is_moe,
        active_params_b=largest_model.active_params_b,
    )
    
    upgrade_path = generate_upgrade_path(minimum_tier, ideal_tier, best_tier)
    
    scenario_summary = generate_scenario_summary(model_instances, deployment_mode)
    
    return {
        "minimum": minimum_tier,
        "ideal": ideal_tier,
        "best": best_tier,
        "memory_requirement": memory_req,
        "upgrade_path": upgrade_path,
        "scenario_summary": scenario_summary,
    }


def generate_upgrade_path(minimum, ideal, best) -> List[str]:
    """Generate upgrade recommendations between tiers."""
    path = []
    
    if minimum.gpu and ideal.gpu:
        vram_diff = ideal.vram_total_gb - minimum.vram_total_gb
        if vram_diff > 0:
            path.append(
                f"Adding {vram_diff:.0f}GB VRAM (upgrade to {ideal.gpu.short_name}) "
                f"improves performance from {minimum.estimated_tps_per_instance:.1f} to "
                f"{ideal.estimated_tps_per_instance:.1f} tok/s"
            )
    
    if ideal.gpu and best.gpu and ideal.gpu.short_name != best.gpu.short_name:
        path.append(
            f"Upgrading to {best.gpu.short_name} provides maximum performance "
            f"at {best.estimated_tps_per_instance:.1f} tok/s"
        )
    
    quant_improvement = f"Using {ideal.recommended_quant} instead of {minimum.recommended_quant} balances quality and speed"
    if ideal.recommended_quant != minimum.recommended_quant:
        path.append(quant_improvement)
    
    return path


def generate_scenario_summary(instances: List[ModelInstance], mode: str) -> str:
    """Generate human-readable scenario summary."""
    if len(instances) == 1:
        inst = instances[0]
        if inst.n_instances == 1:
            return f"Running single {inst.model_name} ({inst.params_b:.1f}B params) at {inst.context_tokens}k context"
        else:
            return f"Running {inst.n_instances}× {inst.model_name} ({inst.params_b:.1f}B params) in {mode} mode"
    else:
        total_instances = sum(i.n_instances for i in instances)
        model_summary = ", ".join([f"{i.n_instances}× {i.model_name}" for i in instances])
        return f"Multi-model scenario: {model_summary} ({total_instances} total instances, {mode} mode)"
