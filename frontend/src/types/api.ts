/**
 * TypeScript types matching backend Pydantic schemas
 */

export interface ModelInstanceInput {
  model_name: string
  n_instances: number
  context_tokens: number
  quant_preference?: string
  use_case: 'general' | 'coding' | 'reasoning' | 'chat' | 'embedding' | 'multimodal'
}

export interface CalculationRequest {
  model_instances: ModelInstanceInput[]
  target_tps_per_instance?: number
  total_target_tps?: number
  deployment_mode: 'concurrent' | 'sequential' | 'batched'
  budget_usd?: number
  include_cpu_paths: boolean
  prefer_single_gpu: boolean
}

export interface GPURecommendation {
  name: string
  short_name: string
  vram_gb: number
  vram_bandwidth_gbps: number
  tdp_watts: number
  msrp_usd?: number
  form_factor: string
  n_units: number
  total_vram_gb: number
}

export interface CPURecommendation {
  name: string
  cores: number
  memory_bandwidth_gbps: number
  tdp_watts: number
  msrp_usd?: number
  max_ram_gb: number
}

export interface PerformanceEstimate {
  per_instance_tps: number
  total_system_tps: number
  latency_first_token_ms: number
  latency_per_token_ms: number
  run_mode: string
  recommended_quant: string
  quant_quality_note: string
}

export interface PowerEstimate {
  total_watts: number
  gpu_watts: number
  cpu_watts: number
  monthly_kwh: number
  monthly_cost_usd?: number
  thermal_note: string
}

export interface HardwareTierOutput {
  tier: string
  tier_label: string
  tier_description: string
  
  gpu?: GPURecommendation
  cpu?: CPURecommendation
  ram_gb: number
  ram_type: string
  
  performance: PerformanceEstimate
  
  estimated_cost_usd?: number
  power: PowerEstimate
  
  vram_used_gb: number
  vram_total_gb: number
  vram_headroom_pct: number
  ram_used_gb: number
  
  bottleneck?: string
  fit_notes: string[]
  trade_offs: string
}

export interface ScenarioBreakdown {
  model_name: string
  provider: string
  params_b: number
  n_instances: number
  quant_used: string
  memory_per_instance_gb: number
  total_memory_gb: number
  is_moe: boolean
  moe_note?: string
}

export interface CalculationResponse {
  scenario_summary: string
  deployment_mode: string
  
  model_breakdown: ScenarioBreakdown[]
  
  minimum: HardwareTierOutput
  ideal: HardwareTierOutput
  best: HardwareTierOutput
  
  upgrade_path: string[]
  
  calculation_notes: string[]
  data_freshness: string
}

export interface Model {
  name: string
  provider: string
  parameter_count: string
  parameters_raw: number
  min_ram_gb: number
  recommended_ram_gb: number
  min_vram_gb: number
  quantization: string
  context_length: number
  use_case: string
  is_moe: boolean
  release_date: string
}
