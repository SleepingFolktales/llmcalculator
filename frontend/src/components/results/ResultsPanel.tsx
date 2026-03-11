import { CalculationResponse } from '../../types/api'
import TierCard from './TierCard'
import LaptopHardwarePanel from './LaptopHardwarePanel'
import { Download } from 'lucide-react'

interface ResultsPanelProps {
  results: CalculationResponse
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  const handleDownload = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `llm-calculator-results-${timestamp}.txt`

    const formatMoney = (amount?: number) => {
      if (amount === undefined || amount === null) return 'N/A'
      return `$${amount.toLocaleString()}`
    }

    const formatNumber = (num: number) => num.toLocaleString()

    // Safe access helpers for laptop hardware
    const safeJoin = (arr: string[] | undefined | null, separator = ', ') => {
      if (!arr || !Array.isArray(arr)) return 'N/A'
      return arr.slice(0, 3).join(separator)
    }

    const safeFixed = (num: number | undefined | null, digits = 1) => {
      if (num === undefined || num === null || isNaN(num)) return 'N/A'
      return num.toFixed(digits)
    }

    const generateTierSection = (tier: CalculationResponse['minimum'], tierName: string) => {
      const gpu = tier.gpu
      const cpu = tier.cpu
      const perf = tier.performance
      const power = tier.power

      return `
================================================================================
${tierName.toUpperCase()} TIER - ${tier.tier_label}
================================================================================
${tier.tier_description}

HARDWARE SPECIFICATIONS:
------------------------
GPU: ${gpu ? `${gpu.name} (${gpu.short_name})` : 'None'}
${gpu ? `  - VRAM: ${formatNumber(gpu.vram_gb)} GB per unit (${formatNumber(gpu.total_vram_gb)} GB total)` : ''}
${gpu ? `  - Units: ${gpu.n_units} GPU(s)` : ''}
${gpu ? `  - Bandwidth: ${gpu.vram_bandwidth_gbps} Gbps` : ''}
${gpu ? `  - TDP: ${gpu.tdp_watts} W` : ''}
${gpu ? `  - Form Factor: ${gpu.form_factor}` : ''}

CPU: ${cpu ? cpu.name : 'None'}
${cpu ? `  - Cores: ${formatNumber(cpu.cores_total)}` : ''}
${cpu ? `  - Memory Bandwidth: ${cpu.memory_bandwidth_gbps} Gbps` : ''}
${cpu ? `  - TDP: ${cpu.tdp_watts} W` : ''}
${cpu ? `  - Max RAM: ${formatNumber(cpu.max_ram_gb)} GB` : ''}

RAM: ${formatNumber(tier.ram_gb)} GB (${tier.ram_type})
VRAM Usage: ${formatNumber(tier.vram_used_gb)} GB / ${formatNumber(tier.vram_total_gb)} GB (${tier.vram_headroom_pct.toFixed(1)}% headroom)
RAM Usage: ${formatNumber(tier.ram_used_gb)} GB

PERFORMANCE ESTIMATES:
----------------------
Per Instance TPS: ${formatNumber(perf.per_instance_tps)}
Total System TPS: ${formatNumber(perf.total_system_tps)}
Latency (First Token): ${formatNumber(perf.latency_first_token_ms)} ms
Latency (Per Token): ${formatNumber(perf.latency_per_token_ms)} ms
Run Mode: ${perf.run_mode}
Recommended Quantization: ${perf.recommended_quant}
Quality Note: ${perf.quant_quality_note}

POWER & COST:
-------------
Power Consumption:
  - Total: ${formatNumber(power.total_watts)} W
  - GPU: ${formatNumber(power.gpu_watts)} W
  - CPU: ${formatNumber(power.cpu_watts)} W
  - Monthly: ${power.monthly_kwh.toFixed(1)} kWh${power.monthly_cost_usd ? ` (~$${power.monthly_cost_usd.toFixed(2)}/month at $0.12/kWh)` : ''}
Thermal Note: ${power.thermal_note}

Estimated Cost: ${formatMoney(tier.estimated_cost_usd)}

NOTES:
------
Bottleneck: ${tier.bottleneck || 'None identified'}
Fit Notes: ${tier.fit_notes.length > 0 ? tier.fit_notes.join(', ') : 'None'}
Trade-offs: ${tier.trade_offs}
`
    }

    const content = `================================================================================
                    LLM HARDWARE CALCULATOR REPORT
================================================================================
Generated: ${new Date().toLocaleString()}
Data Freshness: ${results.data_freshness}

================================================================================
                          SCENARIO SUMMARY
================================================================================
${results.scenario_summary}

Deployment Mode: ${results.deployment_mode}
Total Models: ${results.model_breakdown.length}

================================================================================
                          MODEL BREAKDOWN
================================================================================
${results.model_breakdown.map((model, index) => `
Model ${index + 1}: ${model.model_name}
  - Provider: ${model.provider}
  - Parameters: ${model.params_b}B
  - Instances: ${model.n_instances}
  - Quantization: ${model.quant_used}
  - Memory per Instance: ${model.memory_per_instance_gb.toFixed(1)} GB
  - Total Memory: ${model.total_memory_gb.toFixed(1)} GB
  - MoE Model: ${model.is_moe ? 'Yes' : 'No'}${model.moe_note ? ` (${model.moe_note})` : ''}
`).join('')}

${generateTierSection(results.minimum, 'Minimum')}

${generateTierSection(results.ideal, 'Ideal')}

${generateTierSection(results.best, 'Best')}

================================================================================
                          UPGRADE PATH
================================================================================
${results.upgrade_path.length > 0 ? results.upgrade_path.map((path, index) => `${index + 1}. ${path}`).join('\n') : 'No upgrade path suggested for this configuration.'}

${results.laptop_hardware ? `
================================================================================
                    LAPTOP & PORTABLE HARDWARE OPTIONS
================================================================================

${results.laptop_hardware?.minimum ? `
MINIMUM LAPTOP CONFIGURATION:
-----------------------------
GPU: ${results.laptop_hardware.minimum.laptop_gpu?.short_name || 'N/A'}
  - Brand: ${results.laptop_hardware.minimum.laptop_gpu?.brand || 'N/A'}
  - Form Factor: ${results.laptop_hardware.minimum.laptop_gpu?.form_factor || 'N/A'}
  - VRAM: ${results.laptop_hardware.minimum.laptop_gpu?.vram_gb ? `${results.laptop_hardware.minimum.laptop_gpu.vram_gb} GB` : results.laptop_hardware.minimum.laptop_gpu?.unified_memory_max_gb ? `${results.laptop_hardware.minimum.laptop_gpu.unified_memory_max_gb} GB Unified Memory` : 'N/A'}
  - Bandwidth: ${safeFixed(results.laptop_hardware.minimum.laptop_gpu?.bandwidth_gbps)} GB/s
  - Estimated Speed: ${safeFixed(results.laptop_hardware.minimum.estimated_tps)} tok/s
  - Price: ${results.laptop_hardware.minimum.laptop_gpu?.typical_laptop_price_usd ? `$${results.laptop_hardware.minimum.laptop_gpu.typical_laptop_price_usd}` : 'N/A'}
  - Found in: ${safeJoin(results.laptop_hardware.minimum.laptop_gpu?.typical_laptop_brands)}
  - Backends: ${safeJoin(results.laptop_hardware.minimum.laptop_gpu?.backends)}

` : ''}${results.laptop_hardware?.ideal ? `
IDEAL LAPTOP CONFIGURATION:
---------------------------
GPU: ${results.laptop_hardware.ideal.laptop_gpu?.short_name || 'N/A'}
  - Brand: ${results.laptop_hardware.ideal.laptop_gpu?.brand || 'N/A'}
  - Form Factor: ${results.laptop_hardware.ideal.laptop_gpu?.form_factor || 'N/A'}
  - VRAM: ${results.laptop_hardware.ideal.laptop_gpu?.vram_gb ? `${results.laptop_hardware.ideal.laptop_gpu.vram_gb} GB` : results.laptop_hardware.ideal.laptop_gpu?.unified_memory_max_gb ? `${results.laptop_hardware.ideal.laptop_gpu.unified_memory_max_gb} GB Unified Memory` : 'N/A'}
  - Bandwidth: ${safeFixed(results.laptop_hardware.ideal.laptop_gpu?.bandwidth_gbps)} GB/s
  - Estimated Speed: ${safeFixed(results.laptop_hardware.ideal.estimated_tps)} tok/s
  - Price: ${results.laptop_hardware.ideal.laptop_gpu?.typical_laptop_price_usd ? `$${results.laptop_hardware.ideal.laptop_gpu.typical_laptop_price_usd}` : 'N/A'}
  - Found in: ${safeJoin(results.laptop_hardware.ideal.laptop_gpu?.typical_laptop_brands)}
  - Backends: ${safeJoin(results.laptop_hardware.ideal.laptop_gpu?.backends)}

` : ''}${results.laptop_hardware?.best ? `
BEST LAPTOP CONFIGURATION:
--------------------------
GPU: ${results.laptop_hardware.best.laptop_gpu?.short_name || 'N/A'}
  - Brand: ${results.laptop_hardware.best.laptop_gpu?.brand || 'N/A'}
  - Form Factor: ${results.laptop_hardware.best.laptop_gpu?.form_factor || 'N/A'}
  - VRAM: ${results.laptop_hardware.best.laptop_gpu?.vram_gb ? `${results.laptop_hardware.best.laptop_gpu.vram_gb} GB` : results.laptop_hardware.best.laptop_gpu?.unified_memory_max_gb ? `${results.laptop_hardware.best.laptop_gpu.unified_memory_max_gb} GB Unified Memory` : 'N/A'}
  - Bandwidth: ${safeFixed(results.laptop_hardware.best.laptop_gpu?.bandwidth_gbps)} GB/s
  - Estimated Speed: ${safeFixed(results.laptop_hardware.best.estimated_tps)} tok/s
  - Price: ${results.laptop_hardware.best.laptop_gpu?.typical_laptop_price_usd ? `$${results.laptop_hardware.best.laptop_gpu.typical_laptop_price_usd}` : 'N/A'}
  - Found in: ${safeJoin(results.laptop_hardware.best.laptop_gpu?.typical_laptop_brands)}
  - Backends: ${safeJoin(results.laptop_hardware.best.laptop_gpu?.backends)}

` : ''}${results.laptop_hardware?.raspberry_pi ? `
RASPBERRY PI OPTION (Edge Computing):
--------------------------------------
Device: ${results.laptop_hardware.raspberry_pi?.device || 'N/A'}
  - CPU: ${results.laptop_hardware.raspberry_pi?.cpu || 'N/A'}
  - RAM: ${results.laptop_hardware.raspberry_pi?.ram_gb || 'N/A'} GB
  - Power: ${results.laptop_hardware.raspberry_pi?.power_consumption_watts || 'N/A'}W
  - Estimated Speed: ~${safeFixed(results.laptop_hardware.raspberry_pi?.estimated_tps)} tok/s (CPU-only)
  - Price: $${results.laptop_hardware.raspberry_pi?.typical_price_usd || 'N/A'}
  - Note: ${results.laptop_hardware.raspberry_pi?.notes || 'N/A'}

` : ''}` : ''}
================================================================================
                          CALCULATION NOTES
================================================================================
${results.calculation_notes.map((note, index) => `• ${note}`).join('\n')}

================================================================================
                              END OF REPORT
================================================================================
Generated by LLM Hardware Calculator
https://github.com/yourusername/llmcalculator
`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download results. Check console for details.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Scenario Summary */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-lg font-semibold text-white">Scenario Summary</h3>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            title="Download results as text file"
          >
            <Download className="w-4 h-4" />
            Download Results
          </button>
        </div>
        <p className="text-gray-300">{results.scenario_summary}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
            {results.deployment_mode}
          </span>
          <span>•</span>
          <span>{results.model_breakdown.length} model(s)</span>
        </div>
      </div>

      {/* Three Tier Cards */}
      <div className="space-y-4">
        <TierCard tier={results.minimum} />
        <TierCard tier={results.ideal} />
        <TierCard tier={results.best} />
      </div>

      {/* Laptop Hardware Recommendations */}
      {results.laptop_hardware && (
        <LaptopHardwarePanel laptopHardware={results.laptop_hardware} />
      )}

      {/* Upgrade Path */}
      {results.upgrade_path.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Upgrade Path</h3>
          <ul className="space-y-2">
            {results.upgrade_path.map((path, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-300">
                <span className="text-blue-400 mt-1">→</span>
                <span>{path}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
