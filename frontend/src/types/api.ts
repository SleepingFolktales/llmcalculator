/**
 * TypeScript types matching backend Pydantic schemas
 */

export interface ModelInstanceInput {
  model_name: string
  n_instances: number
  context_tokens: number
  quant_preference?: string
  precision_format: string
  use_case: 'general' | 'coding' | 'reasoning' | 'chat' | 'embedding' | 'multimodal'
}

export interface PrecisionFormat {
  id: string
  name: string
  short_name: string
  bits: number
  bytes_per_param: number
  category: string
  quality_score: number
  memory_reduction_pct: number
  use_case: string
  pros: string
  cons: string
  hardware_requirements: string[]
  popular: boolean
  inference_recommended: boolean
  special_note?: string
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
  cores_total: number
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

export interface LaptopGPURecommendation {
  name: string
  short_name: string
  brand: string
  form_factor: string
  vram_gb: number | null
  unified_memory_max_gb: number | null
  effective_vram_gb: number
  bandwidth_gbps: number
  typical_laptop_price_usd: number | null
  backends: string[]
  typical_laptop_brands: string[]
  is_unified_memory: boolean
  notes: string
}

export interface LaptopTierOutput {
  tier_name: string
  laptop_gpu: LaptopGPURecommendation
  estimated_tps: number
  notes: string
}

export interface RaspberryPiRecommendation {
  device: string
  form_factor: string
  ram_gb: number
  cpu: string
  estimated_tps: number
  notes: string
  typical_price_usd: number
  power_consumption_watts: number
}

export interface LaptopHardwareRecommendations {
  minimum: LaptopTierOutput | null
  ideal: LaptopTierOutput | null
  best: LaptopTierOutput | null
  raspberry_pi: RaspberryPiRecommendation | null
}

export interface SupercomputerRecommendation {
  id: string
  name: string
  short_name: string
  brand: string
  category: string
  subcategory: string
  total_vram_gb: number
  vram_bandwidth_tbps: number | null
  compute_performance: Record<string, any>
  power_watts: number
  form_factor: string
  msrp_usd: number | null
  use_cases: string[]
  availability: string
  notes: string
  backends: string[]
}

export interface SupercomputerTierOutput {
  tier_name: string
  system: SupercomputerRecommendation
  fit_rationale: string
}

export interface SupercomputerRecommendations {
  minimum: SupercomputerTierOutput | null
  ideal: SupercomputerTierOutput | null
  best: SupercomputerTierOutput | null
}

export interface TierRecommendations {
  desktop: HardwareTierOutput
  laptop: LaptopTierOutput | null
  supercomputer: SupercomputerTierOutput | null
}

export interface CalculationResponse {
  scenario_summary: string
  deployment_mode: string
  model_breakdown: ScenarioBreakdown[]
  minimum: TierRecommendations
  ideal: TierRecommendations
  best: TierRecommendations
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
