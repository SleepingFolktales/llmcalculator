"""
Supercomputer and AI accelerator recommendation logic.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class SupercomputerSpec:
    """Supercomputer/AI system specification."""
    id: str
    name: str
    short_name: str
    brand: str
    category: str
    subcategory: str
    
    # Compute resources
    total_vram_gb: float
    vram_bandwidth_tbps: Optional[float]
    compute_performance: Dict
    
    # System specs
    power_watts: int
    form_factor: str
    msrp_usd: Optional[int]
    
    # Use case info
    use_cases: List[str]
    availability: str
    notes: str
    backends: List[str]


def extract_vram_from_system(system: Dict) -> float:
    """Extract total VRAM from various system structures."""
    # DGX systems with multiple GPUs
    if "gpus" in system and isinstance(system["gpus"], dict):
        return system["gpus"].get("total_vram_gb", 0)
    
    # Single chip systems (DGX Spark)
    if "memory" in system and isinstance(system["memory"], dict):
        capacity = system["memory"].get("capacity_gb", 0)
        if system["memory"].get("unified", False):
            return capacity
    
    # Direct vram_gb field
    if "vram_gb" in system:
        return system["vram_gb"]
    
    # GB200 NVL72
    if "total_vram_tb" in system.get("gpus", {}):
        return system["gpus"]["total_vram_tb"] * 1024
    
    return 0


def extract_bandwidth_tbps(system: Dict) -> Optional[float]:
    """Extract memory bandwidth in TB/s."""
    # GPU systems
    if "gpus" in system and isinstance(system["gpus"], dict):
        gpus = system["gpus"]
        if "total_vram_bandwidth_tbps" in gpus:
            return gpus["total_vram_bandwidth_tbps"]
        if "vram_bandwidth_per_gpu_tbps" in gpus and "count" in gpus:
            return gpus["vram_bandwidth_per_gpu_tbps"] * gpus["count"]
    
    # Memory bandwidth in GB/s
    if "memory" in system and "bandwidth_gbps" in system["memory"]:
        return system["memory"]["bandwidth_gbps"] / 1000
    
    # Direct field
    if "vram_bandwidth_tbps" in system:
        return system["vram_bandwidth_tbps"]
    
    return None


def extract_power_watts(system: Dict) -> int:
    """Extract system power consumption."""
    if "power" in system:
        power = system["power"]
        if "system_max_watts" in power:
            return power["system_max_watts"]
        if "system_max_kw" in power:
            return power["system_max_kw"] * 1000
    
    if "tdp_watts_per_chip" in system:
        return system["tdp_watts_per_chip"]
    
    return 500  # Default estimate


def extract_compute_performance(system: Dict) -> Dict:
    """Extract compute performance metrics."""
    perf = {}
    
    if "compute_performance" in system:
        cp = system["compute_performance"]
        for key in ["fp4_pflops", "fp8_pflops", "fp16_pflops", "fp16_tflops", "int8_tops"]:
            if key in cp:
                perf[key] = cp[key]
    
    return perf


def determine_availability(system: Dict) -> str:
    """Determine system availability."""
    avail = system.get("availability", "")
    if avail in ["cloud_only", "cloud_api_only", "internal_only", "azure_internal_only"]:
        return "cloud_only"
    
    if system.get("msrp_usd") or system.get("msrp_usd_approx"):
        return "purchasable"
    
    # Check release date - if future, it's announced
    release = system.get("release_date", "")
    if release and release > "2026-03-11":
        return "announced"
    
    return "purchasable"


def calculate_supercomputer_recommendations(
    vram_needed_gb: float,
    params_b: float,
    use_case: str,
    supercomputer_db: List[Dict]
) -> Dict:
    """
    Calculate supercomputer recommendations for minimum, ideal, and best tiers.
    
    Args:
        vram_needed_gb: VRAM requirement from calculation
        params_b: Largest model parameter count
        use_case: Use case (general, coding, reasoning, etc.)
        supercomputer_db: List of supercomputer systems
    
    Returns:
        Dict with minimum, ideal, and best recommendations
    """
    
    # Filter out cloud-only systems
    purchasable_systems = []
    for system in supercomputer_db:
        availability = determine_availability(system)
        if availability != "cloud_only":
            vram = extract_vram_from_system(system)
            if vram >= vram_needed_gb:  # Must meet VRAM requirement
                purchasable_systems.append(system)
    
    if not purchasable_systems:
        return {"minimum": None, "ideal": None, "best": None}
    
    # Score systems
    scored_systems = []
    for system in purchasable_systems:
        spec = SupercomputerSpec(
            id=system["id"],
            name=system["name"],
            short_name=system["short_name"],
            brand=system["brand"],
            category=system["category"],
            subcategory=system.get("subcategory", ""),
            total_vram_gb=extract_vram_from_system(system),
            vram_bandwidth_tbps=extract_bandwidth_tbps(system),
            compute_performance=extract_compute_performance(system),
            power_watts=extract_power_watts(system),
            form_factor=system.get("physical", {}).get("form_factor", system.get("form_factor", "unknown")),
            msrp_usd=system.get("msrp_usd") or system.get("msrp_usd_approx"),
            use_cases=system.get("llm_capability", {}).get("use_cases", []),
            availability=determine_availability(system),
            notes=system.get("notes", ""),
            backends=system.get("backends", [])
        )
        
        # Scoring with stronger differentiation
        score = 0
        
        # Price efficiency (lower is better) - increased weight
        if spec.msrp_usd:
            price_per_gb_vram = spec.msrp_usd / spec.total_vram_gb if spec.total_vram_gb > 0 else 999999
            # Higher weight to differentiate better
            score += (1000000 / price_per_gb_vram) * 20
        
        # VRAM capacity bonus - reward higher VRAM
        if spec.total_vram_gb >= 1000:  # 1TB+
            score += 200
        elif spec.total_vram_gb >= 500:
            score += 150
        elif spec.total_vram_gb >= 300:
            score += 100
        elif spec.total_vram_gb >= 100:
            score += 50
        
        # Form factor preference (desktop > workstation > rack) - increased weights
        form_factor_scores = {
            "desktop_sff": 150,
            "tower_workstation": 100,
            "rack_server": 50,
            "rack_scale": 25
        }
        score += form_factor_scores.get(spec.form_factor, 40)
        
        # Use case match - increased weight
        if "inference" in spec.use_cases:
            score += 60
        if "training" in spec.use_cases and params_b > 70:
            score += 40
        
        # Power efficiency - increased weight
        if spec.power_watts < 500:
            score += 100
        elif spec.power_watts < 2000:
            score += 60
        elif spec.power_watts < 5000:
            score += 30
        
        scored_systems.append((score, spec))
    
    scored_systems.sort(key=lambda x: x[0], reverse=True)
    
    # Tier selection
    minimum_system = None
    ideal_system = None
    best_system = None
    
    # Minimum: Cheapest that fits
    cheapest = min(scored_systems, key=lambda x: x[1].msrp_usd or 999999999)
    minimum_system = cheapest[1]
    
    # Ideal: Best score (hybrid of price, performance, form factor)
    if len(scored_systems) > 0:
        ideal_system = scored_systems[0][1]
    
    # Best: Highest VRAM + compute, practical form factor
    practical_systems = [s for s in scored_systems if s[1].form_factor in ["desktop_sff", "tower_workstation", "rack_server"]]
    if practical_systems:
        best_system = max(practical_systems, key=lambda x: x[1].total_vram_gb)[1]
    elif scored_systems:
        best_system = max(scored_systems, key=lambda x: x[1].total_vram_gb)[1]
    
    return {
        "minimum": _spec_to_dict(minimum_system) if minimum_system else None,
        "ideal": _spec_to_dict(ideal_system) if ideal_system else None,
        "best": _spec_to_dict(best_system) if best_system else None,
    }


def _spec_to_dict(spec: SupercomputerSpec) -> Dict:
    """Convert SupercomputerSpec to dict."""
    return {
        "id": spec.id,
        "name": spec.name,
        "short_name": spec.short_name,
        "brand": spec.brand,
        "category": spec.category,
        "subcategory": spec.subcategory,
        "total_vram_gb": spec.total_vram_gb,
        "vram_bandwidth_tbps": spec.vram_bandwidth_tbps,
        "compute_performance": spec.compute_performance,
        "power_watts": spec.power_watts,
        "form_factor": spec.form_factor,
        "msrp_usd": spec.msrp_usd,
        "use_cases": spec.use_cases,
        "availability": spec.availability,
        "notes": spec.notes,
        "backends": spec.backends,
    }
