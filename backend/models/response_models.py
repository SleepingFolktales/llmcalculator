"""
Pydantic output schemas for API responses
"""

from pydantic import BaseModel
from typing import Optional, List


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
    cores: int
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


class CalculationResponse(BaseModel):
    """Complete calculation response."""
    scenario_summary: str
    deployment_mode: str
    
    model_breakdown: List[ScenarioBreakdown]
    
    minimum: HardwareTierOutput
    ideal: HardwareTierOutput
    best: HardwareTierOutput
    
    upgrade_path: List[str]
    
    calculation_notes: List[str]
    data_freshness: str
