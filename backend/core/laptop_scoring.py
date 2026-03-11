"""
Laptop hardware scoring and recommendation logic
"""

from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class LaptopGPUSpec:
    """Laptop GPU specification for scoring."""
    id: str
    name: str
    short_name: str
    brand: str
    form_factor: str
    vram_gb: Optional[float]
    unified_memory_max_gb: Optional[float]
    vram_bandwidth_gbps: float
    compute_tflops_fp32: float
    typical_laptop_price_usd: Optional[int]
    backends: List[str]
    notes: str = ""


def calculate_laptop_tier(
    vram_needed: float,
    laptop_gpus: List[Dict],
    tier_name: str = "Minimum"
) -> Optional[Dict]:
    """
    Find best laptop GPU that fits the VRAM requirement.
    
    Args:
        vram_needed: VRAM required in GB
        laptop_gpus: List of laptop GPU specs
        tier_name: Tier name (Minimum, Ideal, Best)
    
    Returns:
        Dictionary with laptop GPU recommendation or None
    """
    candidates = []
    
    for gpu_data in laptop_gpus:
        # Get effective VRAM (either vram_gb or unified_memory_max_gb)
        effective_vram = gpu_data.get("vram_gb")
        if effective_vram is None:
            effective_vram = gpu_data.get("unified_memory_max_gb")
        
        if effective_vram is None:
            continue
        
        # Check if GPU can fit the model
        if effective_vram >= vram_needed:
            # Calculate score based on VRAM fit and bandwidth
            vram_overhead = effective_vram - vram_needed
            bandwidth = gpu_data.get("vram_bandwidth_gbps") or gpu_data.get("unified_memory_bandwidth_gbps", 0)
            
            # Score: prefer tighter VRAM fit but good bandwidth
            score = bandwidth * 10 + (100 - min(vram_overhead * 10, 100))
            
            candidates.append({
                "gpu": gpu_data,
                "score": score,
                "effective_vram": effective_vram,
                "bandwidth": bandwidth
            })
    
    if not candidates:
        return None
    
    # Sort by score (higher is better)
    candidates.sort(key=lambda x: x["score"], reverse=True)
    
    # For different tiers, pick different quality levels
    if tier_name == "Minimum":
        # Pick cheapest that fits
        candidates_sorted_price = sorted(
            [c for c in candidates if c["gpu"].get("typical_laptop_price_usd")],
            key=lambda x: x["gpu"].get("typical_laptop_price_usd", 999999)
        )
        selected = candidates_sorted_price[0] if candidates_sorted_price else candidates[0]
    elif tier_name == "Ideal":
        # Pick middle ground - good bandwidth and reasonable price
        mid_idx = len(candidates) // 2
        selected = candidates[mid_idx]
    else:  # Best
        # Pick highest bandwidth and VRAM
        selected = candidates[0]
    
    gpu_spec = selected["gpu"]
    
    # Build LaptopGPUSpec
    laptop_gpu = LaptopGPUSpec(
        id=gpu_spec["id"],
        name=gpu_spec["name"],
        short_name=gpu_spec["short_name"],
        brand=gpu_spec["brand"],
        form_factor=gpu_spec.get("form_factor", "laptop"),
        vram_gb=gpu_spec.get("vram_gb"),
        unified_memory_max_gb=gpu_spec.get("unified_memory_max_gb"),
        vram_bandwidth_gbps=selected["bandwidth"],
        compute_tflops_fp32=gpu_spec.get("compute_tflops_fp32", 0),
        typical_laptop_price_usd=gpu_spec.get("typical_laptop_price_usd"),
        backends=gpu_spec.get("backends", []),
        notes=gpu_spec.get("notes", "")
    )
    
    # Estimate performance
    base_tps = selected["bandwidth"] * 0.5  # Rough estimate
    
    return {
        "tier_name": tier_name,
        "laptop_gpu": laptop_gpu,
        "effective_vram_gb": selected["effective_vram"],
        "bandwidth_gbps": selected["bandwidth"],
        "estimated_tps": base_tps,
        "typical_laptop_brands": gpu_spec.get("typical_laptop_brands", []),
        "is_unified_memory": gpu_spec.get("vram_gb") is None
    }


def can_run_on_raspberry_pi(vram_needed: float, context_tokens: int) -> Optional[Dict]:
    """
    Check if scenario can run on Raspberry Pi.
    
    Criteria:
    - VRAM needed <= 4GB (Pi 5 16GB config with conservative headroom)
    - Context tokens <= 8192 (reasonable for CPU inference)
    - Only for very small models
    
    Returns:
        Raspberry Pi recommendation or None
    """
    # Raspberry Pi is viable only for very small models
    if vram_needed > 4.0:
        return None
    
    if context_tokens > 8192:
        return None
    
    # Recommend Pi 5 16GB
    return {
        "device": "Raspberry Pi 5 (16GB)",
        "form_factor": "sbc",
        "ram_gb": 16,
        "cpu": "4x Cortex-A76 @ 2.4 GHz",
        "estimated_tps": 1.5,  # Very slow CPU-only inference
        "notes": "CPU-only inference via llama.cpp. Suitable for 1B-3B models only. Consider Hailo-8 HAT for acceleration.",
        "typical_price_usd": 80,
        "power_consumption_watts": 12
    }


def calculate_laptop_recommendations(
    vram_needed: float,
    context_tokens: int,
    laptop_gpus: List[Dict]
) -> Dict:
    """
    Calculate all laptop hardware recommendations.
    
    Returns:
        Dictionary with minimum, ideal, best laptop tiers, and optional Raspberry Pi
    """
    minimum = calculate_laptop_tier(vram_needed, laptop_gpus, "Minimum")
    ideal = calculate_laptop_tier(vram_needed * 1.3, laptop_gpus, "Ideal")
    best = calculate_laptop_tier(vram_needed * 1.5, laptop_gpus, "Best")
    
    raspberry_pi = can_run_on_raspberry_pi(vram_needed, context_tokens)
    
    return {
        "minimum": minimum,
        "ideal": ideal,
        "best": best,
        "raspberry_pi": raspberry_pi
    }
