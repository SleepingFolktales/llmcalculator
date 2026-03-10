"""
Hardware tier classification - the core "reverse engineering" logic.
Given memory + performance requirements, classify hardware into Minimum / Ideal / Best tiers.
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from .memory import best_quant_for_budget, estimate_memory_gb
from .speed import estimate_tps_single


@dataclass
class GPUSpec:
    """GPU specification from database."""
    id: str
    name: str
    short_name: str
    brand: str
    vram_gb: float
    vram_bandwidth_gbps: float
    tdp_watts: int
    msrp_usd: Optional[int]
    form_factor: str
    backends: List[str]


@dataclass
class CPUSpec:
    """CPU specification from database."""
    id: str
    name: str
    short_name: str
    cores_total: int
    memory_bandwidth_gbps: float
    tdp_watts: int
    msrp_usd: Optional[int]
    max_ram_gb: int


@dataclass
class HardwareTier:
    """Complete hardware recommendation for a specific tier."""
    tier: str
    gpu: Optional[GPUSpec]
    n_gpus: int
    vram_total_gb: float
    cpu: Optional[CPUSpec]
    ram_gb: int
    ram_type: str
    estimated_tps_per_instance: float
    estimated_total_tps: float
    estimated_power_watts: int
    estimated_cost_usd: Optional[int]
    run_mode: str
    recommended_quant: str
    thermal_notes: str
    bottleneck: Optional[str]
    fit_notes: List[str]


def find_matching_gpu(
    vram_needed_gb: float,
    tier: str,
    gpu_db: List[Dict],
    prefer_single: bool = True
) -> tuple[Optional[Dict], int]:
    """
    Find the best matching GPU from gpu_specs.json.
    
    Args:
        vram_needed_gb: VRAM requirement
        tier: "minimum", "ideal", or "best"
        gpu_db: List of GPU specs from database
        prefer_single: Prefer single GPU over multi-GPU if possible
    
    Returns:
        Tuple of (gpu_dict, n_gpus)
    """
    headroom_multipliers = {
        "minimum": 1.05,
        "ideal": 1.25,
        "best": 1.45,
    }
    
    target_vram = vram_needed_gb * headroom_multipliers.get(tier, 1.2)
    
    suitable_gpus = [
        gpu for gpu in gpu_db
        if gpu["vram_gb"] >= target_vram
    ]
    
    if suitable_gpus:
        if tier == "minimum":
            best_gpu = min(suitable_gpus, key=lambda g: (g["vram_gb"], g.get("msrp_usd", 999999)))
        elif tier == "ideal":
            best_gpu = min(
                suitable_gpus,
                key=lambda g: (
                    abs(g["vram_gb"] - target_vram * 1.3),
                    -g["vram_bandwidth_gbps"]
                )
            )
        else:
            best_gpu = max(suitable_gpus, key=lambda g: g["vram_bandwidth_gbps"])
        
        return (best_gpu, 1)
    
    if not prefer_single:
        consumer_gpus = [g for g in gpu_db if g["form_factor"] == "consumer" and g["vram_gb"] >= vram_needed_gb * 0.4]
        if consumer_gpus:
            affordable_gpu = min(consumer_gpus, key=lambda g: g.get("msrp_usd", 999999))
            n_gpus = int((target_vram / affordable_gpu["vram_gb"]) + 0.5)
            n_gpus = max(2, min(n_gpus, 4))
            return (affordable_gpu, n_gpus)
    
    fallback_gpus = sorted(gpu_db, key=lambda g: g["vram_gb"], reverse=True)
    if fallback_gpus:
        return (fallback_gpus[0], 1)
    
    return (None, 0)


def find_matching_cpu(
    tier: str,
    cpu_db: List[Dict],
    min_cores: int = 4
) -> Optional[Dict]:
    """Find the best matching CPU for the tier."""
    core_requirements = {
        "minimum": 4,
        "ideal": 8,
        "best": 16,
    }
    
    target_cores = max(min_cores, core_requirements.get(tier, 8))
    
    suitable_cpus = [
        cpu for cpu in cpu_db
        if cpu["cores_total"] >= target_cores
    ]
    
    if not suitable_cpus:
        suitable_cpus = cpu_db
    
    if tier == "minimum":
        return min(suitable_cpus, key=lambda c: (c["cores_total"], c.get("msrp_usd", 999999)))
    elif tier == "ideal":
        return min(
            suitable_cpus,
            key=lambda c: abs(c["cores_total"] - target_cores)
        )
    else:
        return max(suitable_cpus, key=lambda c: (c["memory_bandwidth_gbps"], c["cores_total"]))


def calculate_tier(
    tier_name: str,
    requirement_vram_gb: float,
    params_b: float,
    context_tokens: int,
    gpu_db: List[Dict],
    cpu_db: List[Dict],
    is_moe: bool = False,
    active_params_b: Optional[float] = None,
) -> HardwareTier:
    """
    Calculate hardware recommendation for a specific tier.
    
    Args:
        tier_name: "minimum", "ideal", or "best"
        requirement_vram_gb: Base VRAM requirement
        params_b: Model parameters in billions
        context_tokens: Context window
        gpu_db: GPU database
        cpu_db: CPU database
        is_moe: Whether this is a MoE model
        active_params_b: Active parameters for MoE
    
    Returns:
        HardwareTier with complete hardware recommendation
    """
    gpu, n_gpus = find_matching_gpu(requirement_vram_gb, tier_name, gpu_db)
    
    cpu = find_matching_cpu(tier_name, cpu_db)
    
    headroom = {
        "minimum": 1.1,
        "ideal": 1.2,
        "best": 1.5,
    }
    
    if gpu:
        vram_total = gpu["vram_gb"] * n_gpus
        budget_gb = vram_total / headroom[tier_name]
        
        quant_result = best_quant_for_budget(
            params_b, budget_gb, context_tokens, is_moe, active_params_b
        )
        
        if quant_result:
            recommended_quant, actual_mem = quant_result
        else:
            from .quantization import QUANT_HIERARCHY
            recommended_quant = QUANT_HIERARCHY[-1]
            actual_mem = requirement_vram_gb
        
        run_mode = "gpu"
        backend = gpu["backends"][0] if gpu["backends"] else "CUDA"
    else:
        vram_total = 0.0
        from .quantization import QUANT_HIERARCHY
        recommended_quant = QUANT_HIERARCHY[3] if len(QUANT_HIERARCHY) > 3 else "Q4_K_M"
        actual_mem = estimate_memory_gb(params_b, recommended_quant, context_tokens, is_moe, active_params_b)
        run_mode = "cpu_only"
        backend = "CpuX86"
    
    ram_multipliers = {
        "minimum": 1.1,
        "ideal": 1.3,
        "best": 2.0,
    }
    
    if run_mode == "cpu_only":
        ram_gb = int(actual_mem * ram_multipliers[tier_name] + 8)
    else:
        ram_gb = max(int(vram_total * 0.2), 16)
    
    ram_type = "DDR5" if tier_name in ["ideal", "best"] else "DDR4"
    
    tps = estimate_tps_single(
        params_b=params_b,
        quant=recommended_quant,
        gpu_name=gpu["short_name"] if gpu else None,
        backend=backend,
        run_mode=run_mode,
        cpu_cores=cpu["cores_total"] if cpu else 8,
        is_moe=is_moe,
        active_params_b=active_params_b,
    )
    
    power_watts = estimate_power_consumption(gpu, cpu, n_gpus)
    
    cost_usd = estimate_cost(gpu, cpu, n_gpus, ram_gb, ram_type)
    
    thermal = estimate_thermal_requirements(power_watts, n_gpus)
    
    bottleneck = identify_bottleneck(gpu, vram_total, actual_mem, tier_name)
    
    fit_notes = generate_fit_notes(tier_name, gpu, n_gpus, run_mode, recommended_quant)
    
    return HardwareTier(
        tier=tier_name,
        gpu=GPUSpec(**gpu) if gpu else None,
        n_gpus=n_gpus,
        vram_total_gb=vram_total,
        cpu=CPUSpec(**cpu) if cpu else None,
        ram_gb=ram_gb,
        ram_type=ram_type,
        estimated_tps_per_instance=tps,
        estimated_total_tps=tps,
        estimated_power_watts=power_watts,
        estimated_cost_usd=cost_usd,
        run_mode=run_mode,
        recommended_quant=recommended_quant,
        thermal_notes=thermal,
        bottleneck=bottleneck,
        fit_notes=fit_notes,
    )


def estimate_power_consumption(
    gpu: Optional[Dict],
    cpu: Optional[Dict],
    n_gpus: int
) -> int:
    """Total system power draw estimate (watts)."""
    gpu_watts = int((gpu["tdp_watts"] * n_gpus * 0.85)) if gpu else 0
    cpu_watts = cpu["tdp_watts"] if cpu else 65
    system_watts = 100
    
    return gpu_watts + cpu_watts + system_watts


def estimate_cost(
    gpu: Optional[Dict],
    cpu: Optional[Dict],
    n_gpus: int,
    ram_gb: int,
    ram_type: str
) -> Optional[int]:
    """Rough build cost estimate in USD."""
    gpu_cost = (gpu.get("msrp_usd", 0) or 0) * n_gpus
    cpu_cost = cpu.get("msrp_usd", 0) or 0
    
    ram_cost_per_gb = 3 if ram_type == "DDR4" else 4.5
    ram_cost = int(ram_gb * ram_cost_per_gb)
    
    mobo_psu_case = 400
    
    total = gpu_cost + cpu_cost + ram_cost + mobo_psu_case
    
    return total if total > 0 else None


def estimate_thermal_requirements(total_watts: int, n_gpus: int) -> str:
    """Cooling notes based on power consumption."""
    if total_watts < 300:
        return "Stock cooling sufficient"
    elif total_watts < 500:
        return "Good airflow recommended"
    elif total_watts < 800:
        return "High-airflow case + quality PSU (850W+) required"
    else:
        return "Server-grade cooling or liquid cooling recommended; 1200W+ PSU"


def identify_bottleneck(
    gpu: Optional[Dict],
    vram_total: float,
    required_mem: float,
    tier: str
) -> Optional[str]:
    """Identify the primary performance bottleneck."""
    if not gpu:
        return "compute"
    
    headroom = (vram_total - required_mem) / required_mem if required_mem > 0 else 1.0
    
    if headroom < 0.15:
        return "vram"
    
    if gpu.get("vram_bandwidth_gbps", 0) < 500:
        return "bandwidth"
    
    return None


def generate_fit_notes(
    tier: str,
    gpu: Optional[Dict],
    n_gpus: int,
    run_mode: str,
    quant: str
) -> List[str]:
    """Generate human-readable fit reasoning."""
    notes = []
    
    if tier == "minimum":
        notes.append("Bare minimum configuration to run the model")
        notes.append(f"Using {quant} quantization to minimize memory footprint")
        if run_mode == "cpu_only":
            notes.append("CPU-only execution will be significantly slower")
    elif tier == "ideal":
        notes.append("Recommended balanced configuration for most users")
        notes.append("Good performance-to-cost ratio")
        if gpu:
            notes.append(f"Single {gpu['short_name']} provides comfortable headroom")
    else:
        notes.append("Maximum performance configuration")
        notes.append("No compromises on quality or speed")
        if n_gpus > 1:
            notes.append(f"Multi-GPU setup ({n_gpus}× GPUs) for optimal performance")
    
    return notes
