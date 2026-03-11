"""
Main calculation endpoint - POST /api/calculate
"""

from fastapi import APIRouter, HTTPException
from typing import List
from models.request_models import CalculationRequest
from models.response_models import (
    CalculationResponse,
    HardwareTierOutput,
    ScenarioBreakdown,
    GPURecommendation,
    CPURecommendation,
    PerformanceEstimate,
    PowerEstimate,
    LaptopHardwareRecommendations,
    LaptopTierOutput,
    LaptopGPURecommendation,
    RaspberryPiRecommendation,
)
from utils.data_loader import get_data_loader
from utils.model_resolver import resolve_model, extract_model_info
from core.scenarios import ModelInstance
from core.calculator import calculate_hardware_recommendations
from core.quantization import quant_description
from core.laptop_scoring import calculate_laptop_recommendations, LaptopGPUSpec

router = APIRouter()


@router.post("/calculate", response_model=CalculationResponse)
async def calculate_hardware(request: CalculationRequest):
    """
    Calculate hardware requirements for a given LLM scenario.
    
    Flow:
    1. Resolve each model_name to actual model from database
    2. Calculate memory requirements
    3. Generate minimum, ideal, and best tier recommendations
    4. Return complete response with breakdown
    """
    loader = get_data_loader()
    
    model_instances: List[ModelInstance] = []
    
    for input_instance in request.model_instances:
        model_data = resolve_model(input_instance.model_name)
        
        if not model_data:
            raise HTTPException(
                status_code=404,
                detail=f"Model '{input_instance.model_name}' not found in database"
            )
        
        model_info = extract_model_info(model_data)
        
        quant = input_instance.quant_preference or model_info["quantization"]
        
        # Get precision format bytes_per_param
        precision_format = loader.get_precision_by_id(input_instance.precision_format)
        bytes_per_param = precision_format["bytes_per_param"] if precision_format else None
        
        model_instance = ModelInstance(
            model_name=model_info["name"],
            params_b=model_info["params_b"],
            quant=quant,
            n_instances=input_instance.n_instances,
            context_tokens=input_instance.context_tokens,
            use_case=input_instance.use_case,
            is_moe=model_info["is_moe"],
            active_params_b=model_info["active_params_b"],
            provider=model_info["provider"],
            bytes_per_param=bytes_per_param,
        )
        
        model_instances.append(model_instance)
    
    gpu_db = loader.get_all_gpus()
    cpu_db = loader.get_all_cpus()
    
    results = calculate_hardware_recommendations(
        model_instances=model_instances,
        deployment_mode=request.deployment_mode,
        gpu_db=gpu_db,
        cpu_db=cpu_db,
        prefer_single_gpu=request.prefer_single_gpu,
    )
    
    model_breakdown = []
    for inst in model_instances:
        breakdown = ScenarioBreakdown(
            model_name=inst.model_name,
            provider=inst.provider,
            params_b=inst.params_b,
            n_instances=inst.n_instances,
            quant_used=inst.quant,
            memory_per_instance_gb=results["memory_requirement"].total_vram_gb / inst.n_instances,
            total_memory_gb=results["memory_requirement"].total_vram_gb,
            is_moe=inst.is_moe,
            moe_note=f"Active params: {inst.active_params_b:.1f}B" if inst.is_moe else None,
        )
        model_breakdown.append(breakdown)
    
    def tier_to_output(tier, tier_label: str, tier_desc: str) -> HardwareTierOutput:
        """Convert HardwareTier to HardwareTierOutput."""
        gpu_rec = None
        if tier.gpu:
            gpu_rec = GPURecommendation(
                name=tier.gpu.name,
                short_name=tier.gpu.short_name,
                vram_gb=tier.gpu.vram_gb,
                vram_bandwidth_gbps=tier.gpu.vram_bandwidth_gbps,
                tdp_watts=tier.gpu.tdp_watts,
                msrp_usd=tier.gpu.msrp_usd,
                form_factor=tier.gpu.form_factor,
                n_units=tier.n_gpus,
                total_vram_gb=tier.vram_total_gb,
            )
        
        cpu_rec = None
        if tier.cpu:
            cpu_rec = CPURecommendation(
                name=tier.cpu.name,
                cores_total=tier.cpu.cores_total,  # Fixed: use cores_total not cores
                memory_bandwidth_gbps=tier.cpu.memory_bandwidth_gbps,
                tdp_watts=tier.cpu.tdp_watts,
                msrp_usd=tier.cpu.msrp_usd,
                max_ram_gb=tier.cpu.max_ram_gb,
            )
        
        perf = PerformanceEstimate(
            per_instance_tps=tier.estimated_tps_per_instance,
            total_system_tps=tier.estimated_total_tps,
            latency_first_token_ms=100.0,
            latency_per_token_ms=1000.0 / tier.estimated_tps_per_instance if tier.estimated_tps_per_instance > 0 else 1000.0,
            run_mode=tier.run_mode,
            recommended_quant=tier.recommended_quant,
            quant_quality_note=quant_description(tier.recommended_quant),
        )
        
        monthly_kwh = (tier.estimated_power_watts / 1000) * 24 * 30
        
        power = PowerEstimate(
            total_watts=tier.estimated_power_watts,
            gpu_watts=tier.gpu.tdp_watts * tier.n_gpus if tier.gpu else 0,
            cpu_watts=tier.cpu.tdp_watts if tier.cpu else 65,
            monthly_kwh=monthly_kwh,
            monthly_cost_usd=monthly_kwh * 0.12,
            thermal_note=tier.thermal_notes,
        )
        
        vram_used = results["memory_requirement"].total_vram_gb
        vram_headroom = ((tier.vram_total_gb - vram_used) / vram_used * 100) if vram_used > 0 else 0
        
        trade_offs_map = {
            "minimum": "Lower quantization, tight memory fit, slower performance",
            "ideal": "Balanced quality and speed, comfortable headroom",
            "best": "Maximum quality, best performance, premium hardware",
        }
        
        return HardwareTierOutput(
            tier=tier.tier,
            tier_label=tier_label,
            tier_description=tier_desc,
            gpu=gpu_rec,
            cpu=cpu_rec,
            ram_gb=tier.ram_gb,
            ram_type=tier.ram_type,
            performance=perf,
            estimated_cost_usd=tier.estimated_cost_usd,
            power=power,
            vram_used_gb=vram_used,
            vram_total_gb=tier.vram_total_gb,
            vram_headroom_pct=vram_headroom,
            ram_used_gb=tier.ram_gb * 0.7,
            bottleneck=tier.bottleneck,
            fit_notes=tier.fit_notes,
            trade_offs=trade_offs_map.get(tier.tier, ""),
        )
    
    minimum_output = tier_to_output(
        results["minimum"],
        "Minimum",
        "Bare minimum to run - may be slow"
    )
    
    ideal_output = tier_to_output(
        results["ideal"],
        "Ideal",
        "Recommended balanced configuration"
    )
    
    best_output = tier_to_output(
        results["best"],
        "Best",
        "Maximum performance, no compromises"
    )
    
    calc_notes = [
        "Hardware recommendations based on bandwidth and memory calculations",
        "Performance estimates are theoretical - actual results may vary",
        "Multi-GPU configurations require NVLink or similar for optimal performance",
    ]
    
    # Calculate laptop hardware recommendations
    laptop_gpus_db = loader.get_all_laptop_gpus()
    vram_needed = results["minimum"].vram_total_gb
    max_context = max(inst.context_tokens for inst in model_instances)
    
    laptop_recs = calculate_laptop_recommendations(vram_needed, max_context, laptop_gpus_db)
    
    # Convert laptop recommendations to Pydantic models
    def laptop_tier_to_output(tier_data):
        if tier_data is None:
            return None
        
        gpu_spec = tier_data["laptop_gpu"]
        gpu_rec = LaptopGPURecommendation(
            name=gpu_spec.name,
            short_name=gpu_spec.short_name,
            brand=gpu_spec.brand,
            form_factor=gpu_spec.form_factor,
            vram_gb=gpu_spec.vram_gb,
            unified_memory_max_gb=gpu_spec.unified_memory_max_gb,
            effective_vram_gb=tier_data["effective_vram_gb"],
            bandwidth_gbps=tier_data["bandwidth_gbps"],
            typical_laptop_price_usd=gpu_spec.typical_laptop_price_usd,
            backends=gpu_spec.backends,
            typical_laptop_brands=tier_data["typical_laptop_brands"],
            is_unified_memory=tier_data["is_unified_memory"],
            notes=gpu_spec.notes
        )
        
        return LaptopTierOutput(
            tier_name=tier_data["tier_name"],
            laptop_gpu=gpu_rec,
            estimated_tps=tier_data["estimated_tps"],
            notes=f"Effective VRAM: {tier_data['effective_vram_gb']:.1f}GB, Bandwidth: {tier_data['bandwidth_gbps']:.1f} GB/s"
        )
    
    laptop_minimum = laptop_tier_to_output(laptop_recs["minimum"])
    laptop_ideal = laptop_tier_to_output(laptop_recs["ideal"])
    laptop_best = laptop_tier_to_output(laptop_recs["best"])
    
    # Raspberry Pi recommendation
    raspberry_pi = None
    if laptop_recs["raspberry_pi"]:
        pi_data = laptop_recs["raspberry_pi"]
        raspberry_pi = RaspberryPiRecommendation(
            device=pi_data["device"],
            form_factor=pi_data["form_factor"],
            ram_gb=pi_data["ram_gb"],
            cpu=pi_data["cpu"],
            estimated_tps=pi_data["estimated_tps"],
            notes=pi_data["notes"],
            typical_price_usd=pi_data["typical_price_usd"],
            power_consumption_watts=pi_data["power_consumption_watts"]
        )
    
    laptop_hardware = LaptopHardwareRecommendations(
        minimum=laptop_minimum,
        ideal=laptop_ideal,
        best=laptop_best,
        raspberry_pi=raspberry_pi
    )
    
    return CalculationResponse(
        scenario_summary=results["scenario_summary"],
        deployment_mode=request.deployment_mode,
        model_breakdown=model_breakdown,
        minimum=minimum_output,
        ideal=ideal_output,
        best=best_output,
        laptop_hardware=laptop_hardware,
        upgrade_path=results["upgrade_path"],
        calculation_notes=calc_notes,
        data_freshness="Hardware data as of March 2026",
    )
