"""
Pydantic output schemas for API responses
"""

from pydantic import BaseModel
from typing import Optional, List, Dict


class GPURecommendation(BaseModel):
    """GPU hardware recommendation."""
    name: str
    short_name: str
    vram_gb: float
    vram_bandwidth_gbps: float
    tdp_watts: int
    msrp_usd: Optional[int]
    form_factor: str
    n_units: int
    total_vram_gb: float


class CPURecommendation(BaseModel):
    """CPU hardware recommendation."""
    name: str
    cores_total: int
    memory_bandwidth_gbps: float
    tdp_watts: int
    msrp_usd: Optional[int]
    max_ram_gb: int


class PerformanceEstimate(BaseModel):
    """Performance metrics."""
    per_instance_tps: float
    total_system_tps: float
    latency_first_token_ms: float
    latency_per_token_ms: float
    run_mode: str
    recommended_quant: str
    quant_quality_note: str


class PowerEstimate(BaseModel):
    """Power consumption estimate."""
    total_watts: int
    gpu_watts: int
    cpu_watts: int
    monthly_kwh: float
    monthly_cost_usd: Optional[float]
    thermal_note: str


class HardwareTierOutput(BaseModel):
    """Complete hardware tier recommendation."""
    tier: str
    tier_label: str
    tier_description: str
    
    gpu: Optional[GPURecommendation]
    cpu: Optional[CPURecommendation]
    ram_gb: int
    ram_type: str
    
    performance: PerformanceEstimate
    
    estimated_cost_usd: Optional[int]
    power: PowerEstimate
    
    vram_used_gb: float
    vram_total_gb: float
    vram_headroom_pct: float
    ram_used_gb: float
    
    bottleneck: Optional[str]
    fit_notes: List[str]
    trade_offs: str


class ScenarioBreakdown(BaseModel):
    """Per-model breakdown."""
    model_name: str
    provider: str
    params_b: float
    n_instances: int
    quant_used: str
    memory_per_instance_gb: float
    total_memory_gb: float
    is_moe: bool
    moe_note: Optional[str]


class LaptopGPURecommendation(BaseModel):
    """Laptop GPU/SoC hardware recommendation."""
    name: str
    short_name: str
    brand: str
    form_factor: str
    vram_gb: Optional[float]
    unified_memory_max_gb: Optional[float]
    effective_vram_gb: float
    bandwidth_gbps: float
    typical_laptop_price_usd: Optional[int]
    backends: List[str]
    typical_laptop_brands: List[str]
    is_unified_memory: bool
    notes: str


class LaptopTierOutput(BaseModel):
    """Laptop hardware tier recommendation."""
    tier_name: str
    laptop_gpu: LaptopGPURecommendation
    estimated_tps: float
    notes: str


class RaspberryPiRecommendation(BaseModel):
    """Raspberry Pi SBC recommendation."""
    device: str
    form_factor: str
    ram_gb: int
    cpu: str
    estimated_tps: float
    notes: str
    typical_price_usd: int
    power_consumption_watts: int


class LaptopHardwareRecommendations(BaseModel):
    """Laptop hardware recommendations container."""
    minimum: Optional[LaptopTierOutput]
    ideal: Optional[LaptopTierOutput]
    best: Optional[LaptopTierOutput]
    raspberry_pi: Optional[RaspberryPiRecommendation]


class SupercomputerRecommendation(BaseModel):
    """Supercomputer/AI accelerator system recommendation."""
    id: str
    name: str
    short_name: str
    brand: str
    category: str
    subcategory: str
    
    total_vram_gb: float
    vram_bandwidth_tbps: Optional[float]
    compute_performance: Dict
    
    power_watts: int
    form_factor: str
    msrp_usd: Optional[int]
    
    use_cases: List[str]
    availability: str
    notes: str
    backends: List[str]


class SupercomputerTierOutput(BaseModel):
    """Supercomputer tier recommendation."""
    tier_name: str
    system: SupercomputerRecommendation
    fit_rationale: str


class SupercomputerRecommendations(BaseModel):
    """Supercomputer recommendations container."""
    minimum: Optional[SupercomputerTierOutput]
    ideal: Optional[SupercomputerTierOutput]
    best: Optional[SupercomputerTierOutput]


class TierRecommendations(BaseModel):
    """Unified tier recommendations across all hardware types."""
    desktop: HardwareTierOutput
    laptop: Optional[LaptopTierOutput]
    supercomputer: Optional[SupercomputerTierOutput]


class CalculationResponse(BaseModel):
    """Complete calculation response."""
    scenario_summary: str
    deployment_mode: str
    
    model_breakdown: List[ScenarioBreakdown]
    
    minimum: TierRecommendations
    ideal: TierRecommendations
    best: TierRecommendations
    
    upgrade_path: List[str]
    
    calculation_notes: List[str]
    data_freshness: str
