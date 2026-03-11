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
)
from utils.data_loader import get_data_loader
from utils.model_resolver import resolve_model, extract_model_info
from core.scenarios import ModelInstance
from core.calculator import calculate_hardware_recommendations
from core.quantization import quant_description

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
    
    return CalculationResponse(
        scenario_summary=results["scenario_summary"],
        deployment_mode=request.deployment_mode,
        model_breakdown=model_breakdown,
        minimum=minimum_output,
        ideal=ideal_output,
        best=best_output,
        upgrade_path=results["upgrade_path"],
        calculation_notes=calc_notes,
        data_freshness="Hardware data as of March 2026",
    )
