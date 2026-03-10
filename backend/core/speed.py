"""
Throughput estimation logic ported from llmfit fit.rs
Estimates tokens per second based on hardware and model configuration.
"""

from typing import Dict, Optional
from .quantization import quant_bytes_per_param, quant_speed_multiplier

GPU_BANDWIDTH_TABLE: Dict[str, float] = {
    "RTX 3060 12GB": 360.0,
    "RTX 3070": 448.0,
    "RTX 3080": 760.0,
    "RTX 3090": 936.2,
    "RTX 4060": 272.0,
    "RTX 4060 Ti 16GB": 288.0,
    "RTX 4070": 504.0,
    "RTX 4070 Ti": 504.0,
    "RTX 4070 Ti Super": 672.0,
    "RTX 4080": 716.8,
    "RTX 4080 Super": 736.0,
    "RTX 4090": 1008.0,
    "RTX 5080": 960.0,
    "RTX 5090": 1792.0,
    "RTX A4000": 448.0,
    "RTX A5000": 768.0,
    "RTX A6000": 768.0,
    "RTX 4000 Ada": 360.0,
    "RTX 5000 Ada": 576.0,
    "L4": 300.0,
    "L40": 864.0,
    "L40S": 864.0,
    "T4": 320.0,
    "A10": 600.0,
    "A100 40GB": 1555.0,
    "A100 80GB": 2039.0,
    "H100 PCIe": 2000.0,
    "H100 SXM": 3350.0,
    "H200": 4800.0,
    "B200": 8000.0,
    "RX 6600": 224.0,
    "RX 6700 XT": 384.0,
    "RX 6800 XT": 512.0,
    "RX 6900 XT": 512.0,
    "RX 7600": 288.0,
    "RX 7700 XT": 432.0,
    "RX 7800 XT": 624.1,
    "RX 7900 XTX": 960.0,
    "MI250X": 3276.8,
    "MI300X": 5300.0,
    "MI300A": 5300.0,
    "M1": 68.25,
    "M1 Pro": 200.0,
    "M1 Max": 400.0,
    "M1 Ultra": 800.0,
    "M2": 100.0,
    "M2 Pro": 200.0,
    "M2 Max": 400.0,
    "M2 Ultra": 800.0,
    "M3": 100.0,
    "M3 Pro": 150.0,
    "M3 Max": 400.0,
    "M3 Ultra": 819.0,
    "M4": 120.0,
    "M4 Pro": 273.0,
    "M4 Max": 546.0,
    "Arc A770": 560.0,
    "Arc B580": 456.0,
}

BACKEND_CONSTANTS: Dict[str, float] = {
    "CUDA": 220.0,
    "Metal": 160.0,
    "ROCm": 180.0,
    "CpuX86": 70.0,
    "CpuArm": 90.0,
}


def estimate_tps_single(
    params_b: float,
    quant: str,
    gpu_name: Optional[str],
    backend: str,
    run_mode: str,
    cpu_cores: int = 8,
    is_moe: bool = False,
    active_params_b: Optional[float] = None,
) -> float:
    """
    Primary bandwidth-based estimation.
    Falls back to constant if GPU name not recognized.
    
    Args:
        params_b: Model parameters in billions
        quant: Quantization level
        gpu_name: GPU model name (e.g., "RTX 4090")
        backend: Computing backend (CUDA, Metal, ROCm, etc.)
        run_mode: "gpu", "moe_offload", "cpu_offload", or "cpu_only"
        cpu_cores: Number of CPU cores
        is_moe: Whether this is a MoE model
        active_params_b: Active parameters for MoE
    
    Returns:
        Estimated tokens per second
    """
    if is_moe and active_params_b:
        effective_params = active_params_b
    else:
        effective_params = params_b
    
    model_gb = effective_params * quant_bytes_per_param(quant)
    
    if gpu_name and gpu_name in GPU_BANDWIDTH_TABLE and run_mode != "cpu_only":
        bandwidth_gbps = GPU_BANDWIDTH_TABLE[gpu_name]
        raw_tps = (bandwidth_gbps / model_gb) * 0.55
    else:
        k_constant = BACKEND_CONSTANTS.get(backend, 70.0)
        raw_tps = (k_constant / effective_params) * quant_speed_multiplier(quant)
        if run_mode == "cpu_only":
            raw_tps *= min(cpu_cores / 4, 2.0)
    
    run_mode_factors = {
        "gpu": 1.0,
        "moe_offload": 0.8,
        "cpu_offload": 0.5,
        "cpu_only": 0.3,
    }
    
    tps = raw_tps * run_mode_factors.get(run_mode, 1.0)
    
    return max(tps, 0.1)


def estimate_tps_scenario(
    params_b: float,
    quant: str,
    gpu_name: Optional[str],
    backend: str,
    n_instances: int,
    deployment_mode: str,
    cpu_cores: int = 8,
    is_moe: bool = False,
    active_params_b: Optional[float] = None,
) -> Dict[str, float]:
    """
    Total system throughput for N model instances.
    
    Args:
        deployment_mode: "concurrent", "sequential", or "batched"
    
    Returns:
        Dictionary with per-instance and total throughput estimates
    """
    run_mode = "gpu" if gpu_name else "cpu_only"
    
    per_instance_tps = estimate_tps_single(
        params_b, quant, gpu_name, backend, run_mode, cpu_cores, is_moe, active_params_b
    )
    
    if deployment_mode == "concurrent":
        total_tps = per_instance_tps * n_instances
        latency_ms = 1000 / per_instance_tps if per_instance_tps > 0 else 10000
    elif deployment_mode == "batched":
        total_tps = per_instance_tps * 1.5
        latency_ms = 1000 / (per_instance_tps * 1.5) if per_instance_tps > 0 else 10000
    else:
        total_tps = per_instance_tps
        latency_ms = (1000 / per_instance_tps * n_instances) if per_instance_tps > 0 else 10000
    
    return {
        "per_instance_tps": per_instance_tps,
        "total_system_tps": total_tps,
        "latency_ms_estimate": latency_ms,
        "deployment_mode": deployment_mode,
    }
