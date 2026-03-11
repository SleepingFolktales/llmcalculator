import React, { useState } from 'react'
import { Download, Cpu, Laptop, Server, ChevronRight, DollarSign, Zap } from 'lucide-react'
import type { CalculationResponse, TierRecommendations } from '../../types/api'
import { HardwareDetailModal } from './HardwareDetailModal'

interface ResultsPanelProps {
  results: CalculationResponse
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    hardware: any
    type: 'desktop' | 'laptop' | 'supercomputer'
  }>({
    isOpen: false,
    title: '',
    hardware: null,
    type: 'desktop'
  })

  const openModal = (title: string, hardware: any, type: 'desktop' | 'laptop' | 'supercomputer') => {
    setModalState({ isOpen: true, title, hardware, type })
  }

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false })
  }

  const getTierColor = (tierName: string) => {
    switch(tierName.toLowerCase()) {
      case 'minimum': return 'blue'
      case 'ideal': return 'green'
      case 'best': return 'purple'
      default: return 'gray'
    }
  }

  const TierCard = ({ tier, tierName }: { tier: TierRecommendations, tierName: string }) => {
    const color = getTierColor(tierName)
    const desktop = tier.desktop
    
    return (
      <div className={`bg-gray-800 rounded-xl border-2 border-${color}-500/30 overflow-hidden`}>
        <div className={`bg-${color}-600/20 border-b border-${color}-500/30 px-6 py-4`}>
          <h3 className={`text-xl font-bold text-${color}-400 uppercase tracking-wide`}>{tierName}</h3>
          <p className="text-sm text-gray-300 mt-1">{desktop.tier_label}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Desktop Hardware */}
          <button
            onClick={() => openModal(`${tierName} - Desktop Hardware`, desktop, 'desktop')}
            className="w-full bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 transition-colors text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Cpu className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Desktop Hardware</p>
                  <p className="text-sm text-gray-400">{desktop.gpu?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Est. Cost</p>
                  <p className="font-bold text-white">${desktop.estimated_cost_usd?.toLocaleString() || 'N/A'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </button>

          {/* Laptop Hardware */}
          {tier.laptop ? (
            <button
              onClick={() => openModal(`${tierName} - Laptop Hardware`, tier.laptop, 'laptop')}
              className="w-full bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 transition-colors text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Laptop className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Laptop Option</p>
                    <p className="text-sm text-gray-400">{tier.laptop.laptop_gpu?.short_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Est. Speed</p>
                    <p className="font-bold text-white">{tier.laptop.estimated_tps?.toFixed(0) || 'N/A'} tok/s</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </button>
          ) : (
            <div className="w-full bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-600/20 rounded-lg">
                  <Laptop className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-400">Laptop Option</p>
                  <p className="text-xs text-gray-500">VRAM requirements exceed laptop GPU capabilities</p>
                </div>
              </div>
            </div>
          )}

          {/* Supercomputer Hardware */}
          {tier.supercomputer && (
            <button
              onClick={() => openModal(`${tierName} - Supercomputer`, tier.supercomputer, 'supercomputer')}
              className="w-full bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 transition-colors text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600/20 rounded-lg">
                    <Server className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Supercomputer Option</p>
                    <p className="text-sm text-gray-400">{tier.supercomputer.system.short_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">VRAM</p>
                    <p className="font-bold text-white">{tier.supercomputer.system.total_vram_gb}GB</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </button>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400">Power</p>
              <p className="text-sm font-semibold text-white">{desktop.power?.total_watts || 0}W</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">VRAM</p>
              <p className="text-sm font-semibold text-white">{desktop.vram_total_gb?.toFixed(0) || 0}GB</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Speed</p>
              <p className="text-sm font-semibold text-white">{desktop.performance?.total_system_tps?.toFixed(0) || 0} tok/s</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatTierDetails = (tier: TierRecommendations, tierName: string) => {
    const desktop = tier.desktop
    let details = `\n${'='.repeat(80)}\n${tierName.toUpperCase()} TIER\n${'='.repeat(80)}\n`
    details += `Tier Label: ${desktop.tier_label}\n`
    details += `Estimated Cost: $${desktop.estimated_cost_usd?.toLocaleString() || 'N/A'}\n\n`

    // Desktop Hardware Details
    details += `DESKTOP HARDWARE:\n${'-'.repeat(40)}\n`
    if (desktop.gpu) {
      details += `GPU: ${desktop.gpu.name}\n`
      details += `  - Short Name: ${desktop.gpu.short_name}\n`
      details += `  - VRAM: ${desktop.gpu.vram_gb}GB per unit\n`
      details += `  - Total VRAM: ${desktop.gpu.total_vram_gb}GB (${desktop.gpu.n_units} unit(s))\n`
      details += `  - Bandwidth: ${desktop.gpu.vram_bandwidth_gbps} Gbps\n`
      details += `  - TDP: ${desktop.gpu.tdp_watts}W\n`
      details += `  - Form Factor: ${desktop.gpu.form_factor}\n`
      details += `  - Price: $${desktop.gpu.msrp_usd?.toLocaleString() || 'N/A'}\n`
    }
    if (desktop.cpu) {
      details += `\nCPU: ${desktop.cpu.name}\n`
      details += `  - Cores: ${desktop.cpu.cores_total}\n`
      details += `  - Memory Bandwidth: ${desktop.cpu.memory_bandwidth_gbps} Gbps\n`
      details += `  - TDP: ${desktop.cpu.tdp_watts}W\n`
      details += `  - Max RAM: ${desktop.cpu.max_ram_gb}GB\n`
    }
    details += `\nMemory Configuration:\n`
    details += `  - System RAM: ${desktop.ram_gb}GB (${desktop.ram_type})\n`
    details += `  - VRAM Usage: ${desktop.vram_used_gb.toFixed(1)}GB / ${desktop.vram_total_gb.toFixed(0)}GB\n`
    details += `  - VRAM Headroom: ${desktop.vram_headroom_pct.toFixed(1)}%\n`
    details += `  - System RAM Usage: ${desktop.ram_used_gb.toFixed(1)}GB\n`

    // Performance Details
    details += `\nPerformance Estimates:\n`
    details += `  - Per Instance: ${desktop.performance.per_instance_tps.toFixed(0)} tok/s\n`
    details += `  - Total System: ${desktop.performance.total_system_tps.toFixed(0)} tok/s\n`
    details += `  - First Token Latency: ${desktop.performance.latency_first_token_ms.toFixed(1)}ms\n`
    details += `  - Per Token Latency: ${desktop.performance.latency_per_token_ms.toFixed(1)}ms\n`
    details += `  - Run Mode: ${desktop.performance.run_mode}\n`
    details += `  - Recommended Quantization: ${desktop.performance.recommended_quant}\n`
    details += `  - Quality Note: ${desktop.performance.quant_quality_note}\n`

    // Power Details
    details += `\nPower & Thermal:\n`
    details += `  - Total Power: ${desktop.power.total_watts}W\n`
    details += `  - GPU Power: ${desktop.power.gpu_watts}W\n`
    details += `  - CPU Power: ${desktop.power.cpu_watts}W\n`
    details += `  - Monthly Usage: ${desktop.power.monthly_kwh.toFixed(1)} kWh\n`
    if (desktop.power.monthly_cost_usd) {
      details += `  - Monthly Cost: $${desktop.power.monthly_cost_usd.toFixed(2)} (at $0.12/kWh)\n`
    }
    details += `  - Thermal Note: ${desktop.power.thermal_note}\n`

    // Fit Notes
    if (desktop.fit_notes && desktop.fit_notes.length > 0) {
      details += `\nFit Notes:\n`
      desktop.fit_notes.forEach(note => {
        details += `  • ${note}\n`
      })
    }

    // Trade-offs
    if (desktop.trade_offs) {
      details += `\nTrade-offs:\n  ${desktop.trade_offs}\n`
    }

    // Bottleneck
    if (desktop.bottleneck) {
      details += `\nBottleneck: ${desktop.bottleneck}\n`
    }

    // Laptop Option
    if (tier.laptop) {
      details += `\nLAPTOP OPTION:\n${'-'.repeat(40)}\n`
      details += `GPU: ${tier.laptop.laptop_gpu.name}\n`
      details += `  - Short Name: ${tier.laptop.laptop_gpu.short_name}\n`
      details += `  - Brand: ${tier.laptop.laptop_gpu.brand}\n`
      details += `  - Form Factor: ${tier.laptop.laptop_gpu.form_factor}\n`
      details += `  - VRAM: ${tier.laptop.laptop_gpu.vram_gb ? `${tier.laptop.laptop_gpu.vram_gb}GB` : `${tier.laptop.laptop_gpu.unified_memory_max_gb}GB Unified Memory`}\n`
      details += `  - Effective VRAM: ${tier.laptop.laptop_gpu.effective_vram_gb.toFixed(1)}GB\n`
      details += `  - Bandwidth: ${tier.laptop.laptop_gpu.bandwidth_gbps} GB/s\n`
      details += `  - Estimated Speed: ${tier.laptop.estimated_tps.toFixed(0)} tok/s\n`
      if (tier.laptop.laptop_gpu.typical_laptop_price_usd) {
        details += `  - Typical Laptop Price: $${tier.laptop.laptop_gpu.typical_laptop_price_usd.toLocaleString()}\n`
      }
      details += `  - Backends: ${tier.laptop.laptop_gpu.backends.join(', ')}\n`
      details += `  - Unified Memory: ${tier.laptop.laptop_gpu.is_unified_memory ? 'Yes' : 'No'}\n`
      if (tier.laptop.notes) {
        details += `  - Notes: ${tier.laptop.notes}\n`
      }
    }

    // Supercomputer Option
    if (tier.supercomputer) {
      details += `\nSUPERCOMPUTER OPTION:\n${'-'.repeat(40)}\n`
      details += `System: ${tier.supercomputer.system.name}\n`
      details += `  - Short Name: ${tier.supercomputer.system.short_name}\n`
      details += `  - Brand: ${tier.supercomputer.system.brand}\n`
      details += `  - Category: ${tier.supercomputer.system.category}\n`
      details += `  - Subcategory: ${tier.supercomputer.system.subcategory}\n`
      details += `  - Form Factor: ${tier.supercomputer.system.form_factor}\n`
      details += `  - Total VRAM: ${tier.supercomputer.system.total_vram_gb >= 1000 ? `${(tier.supercomputer.system.total_vram_gb / 1024).toFixed(1)}TB` : `${tier.supercomputer.system.total_vram_gb.toFixed(0)}GB`}\n`
      if (tier.supercomputer.system.vram_bandwidth_tbps) {
        details += `  - Memory Bandwidth: ${tier.supercomputer.system.vram_bandwidth_tbps.toFixed(1)} TB/s\n`
      }
      details += `  - Power: ${tier.supercomputer.system.power_watts >= 1000 ? `${(tier.supercomputer.system.power_watts / 1000).toFixed(1)}kW` : `${tier.supercomputer.system.power_watts}W`}\n`
      if (tier.supercomputer.system.msrp_usd) {
        details += `  - Price: $${tier.supercomputer.system.msrp_usd.toLocaleString()}\n`
      }
      details += `  - Use Cases: ${tier.supercomputer.system.use_cases.join(', ')}\n`
      details += `  - Backends: ${tier.supercomputer.system.backends.join(', ')}\n`
      details += `  - Why This Tier: ${tier.supercomputer.fit_rationale}\n`
      if (tier.supercomputer.system.notes) {
        details += `  - Notes: ${tier.supercomputer.system.notes}\n`
      }
    }

    return details
  }

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `llm-calc-${timestamp}.txt`
    
    let content = `${'='.repeat(80)}\n`
    content += `LLM HARDWARE CALCULATOR - DETAILED RESULTS\n`
    content += `${'='.repeat(80)}\n\n`
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Data Freshness: ${results.data_freshness}\n\n`
    
    content += `SCENARIO SUMMARY:\n${'-'.repeat(80)}\n`
    content += `${results.scenario_summary}\n\n`
    content += `Deployment Mode: ${results.deployment_mode}\n`
    content += `Total Models: ${results.model_breakdown.length}\n\n`

    content += `MODEL BREAKDOWN:\n${'-'.repeat(80)}\n`
    results.model_breakdown.forEach((model, i) => {
      content += `\nModel ${i + 1}: ${model.model_name}\n`
      content += `  - Provider: ${model.provider}\n`
      content += `  - Parameters: ${model.params_b}B\n`
      content += `  - Instances: ${model.n_instances}\n`
      content += `  - Quantization: ${model.quant_used}\n`
      content += `  - Memory per Instance: ${model.memory_per_instance_gb.toFixed(1)}GB\n`
      content += `  - Total Memory: ${model.total_memory_gb.toFixed(1)}GB\n`
      if (model.is_moe) {
        content += `  - MoE Model: Yes${model.moe_note ? ` (${model.moe_note})` : ''}\n`
      }
    })

    // Add detailed tier information
    content += formatTierDetails(results.minimum, 'Minimum')
    content += formatTierDetails(results.ideal, 'Ideal')
    content += formatTierDetails(results.best, 'Best')

    // Upgrade Path
    if (results.upgrade_path.length > 0) {
      content += `\n${'='.repeat(80)}\nUPGRADE PATH\n${'='.repeat(80)}\n`
      results.upgrade_path.forEach((path, i) => {
        content += `${i + 1}. ${path}\n`
      })
    }

    // Calculation Notes
    if (results.calculation_notes.length > 0) {
      content += `\n${'='.repeat(80)}\nCALCULATION NOTES\n${'='.repeat(80)}\n`
      results.calculation_notes.forEach(note => {
        content += `• ${note}\n`
      })
    }

    content += `\n${'='.repeat(80)}\nEND OF REPORT\n${'='.repeat(80)}\n`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header with Download */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="text-lg font-semibold text-white">Hardware Recommendations</h3>
            <p className="text-sm text-gray-400 mt-1">{results.scenario_summary}</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
            {results.deployment_mode}
          </span>
          <span>•</span>
          <span>{results.model_breakdown.length} model(s)</span>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid gap-6">
        <TierCard tier={results.minimum} tierName="Minimum" />
        <TierCard tier={results.ideal} tierName="Ideal" />
        <TierCard tier={results.best} tierName="Best" />
      </div>

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

      {/* Modal */}
      <HardwareDetailModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        hardware={modalState.hardware}
        type={modalState.type}
      />
    </div>
  )
}
