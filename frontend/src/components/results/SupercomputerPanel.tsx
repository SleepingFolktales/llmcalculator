import { SupercomputerRecommendations } from '../../types/api'
import { Cpu, Zap, DollarSign, HardDrive, Gauge } from 'lucide-react'

interface SupercomputerPanelProps {
  recommendations: SupercomputerRecommendations
}

export default function SupercomputerPanel({ recommendations }: SupercomputerPanelProps) {
  const { minimum, ideal, best } = recommendations

  if (!minimum && !ideal && !best) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center text-gray-400">
          <Cpu className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-lg font-semibold mb-2">No Supercomputer Recommendations Available</p>
          <p className="text-sm">
            Your requirements may be too small for supercomputer-class hardware, or no suitable systems are available for purchase.
          </p>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact vendor'
    return `$${price.toLocaleString()}`
  }

  const formatVRAM = (vram: number) => {
    if (vram >= 1000) {
      return `${(vram / 1024).toFixed(1)} TB`
    }
    return `${vram.toFixed(0)} GB`
  }

  const formatBandwidth = (bw: number | null) => {
    if (!bw) return 'N/A'
    return `${bw.toFixed(1)} TB/s`
  }

  const formatPower = (watts: number) => {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)} kW`
    }
    return `${watts} W`
  }

  const getFormFactorBadge = (formFactor: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'desktop_sff': { color: 'bg-green-900/30 text-green-400 border-green-700', label: '🖥️ Desktop' },
      'tower_workstation': { color: 'bg-blue-900/30 text-blue-400 border-blue-700', label: '🏢 Workstation' },
      'rack_server': { color: 'bg-purple-900/30 text-purple-400 border-purple-700', label: '🔧 Rack Server' },
      'rack_scale': { color: 'bg-red-900/30 text-red-400 border-red-700', label: '⚡ Rack Scale' },
    }
    const badge = badges[formFactor] || { color: 'bg-gray-700 text-gray-300', label: formFactor }
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      'ai_system': 'bg-blue-900/30 text-blue-300 border-blue-700',
      'ai_accelerator': 'bg-purple-900/30 text-purple-300 border-purple-700',
    }
    return badges[category] || 'bg-gray-700 text-gray-300'
  }

  const extractComputeMetrics = (perf: Record<string, any>) => {
    const metrics = []
    if (perf.fp4_pflops || perf.fp4_pflops_sparse) {
      metrics.push(`FP4: ${perf.fp4_pflops || perf.fp4_pflops_sparse} PFLOPS`)
    }
    if (perf.fp8_pflops || perf.fp8_pflops_training) {
      metrics.push(`FP8: ${perf.fp8_pflops || perf.fp8_pflops_training} PFLOPS`)
    }
    if (perf.fp16_pflops) {
      metrics.push(`FP16: ${perf.fp16_pflops} PFLOPS`)
    }
    if (perf.fp16_tflops) {
      metrics.push(`FP16: ${perf.fp16_tflops} TFLOPS`)
    }
    if (perf.int8_tops) {
      metrics.push(`INT8: ${perf.int8_tops} TOPS`)
    }
    return metrics.length > 0 ? metrics : ['See notes for details']
  }

  const renderTier = (tier: typeof minimum, tierLabel: string, tierColor: string) => {
    if (!tier) return null

    const { system, fit_rationale } = tier
    const computeMetrics = extractComputeMetrics(system.compute_performance)

    return (
      <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-blue-500 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-2xl font-bold ${tierColor}`}>{tierLabel}</h3>
              {getFormFactorBadge(system.form_factor)}
            </div>
            <h4 className="text-xl font-bold text-white mb-1">{system.name}</h4>
            <p className="text-sm text-gray-400 mb-2">{system.brand} • {system.short_name}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getCategoryBadge(system.category)}`}>
                {system.category.replace('_', ' ').toUpperCase()}
              </span>
              {system.subcategory && (
                <span className="px-2.5 py-1 rounded-md text-xs bg-gray-700 text-gray-300">
                  {system.subcategory.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
          {system.msrp_usd && (
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">{formatPrice(system.msrp_usd)}</div>
              <div className="text-xs text-gray-500">MSRP</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <div className="text-xs text-gray-500">VRAM</div>
            </div>
            <div className="text-lg font-bold text-cyan-400">{formatVRAM(system.total_vram_gb)}</div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-purple-400" />
              <div className="text-xs text-gray-500">Bandwidth</div>
            </div>
            <div className="text-lg font-bold text-purple-400">{formatBandwidth(system.vram_bandwidth_tbps)}</div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <div className="text-xs text-gray-500">Power</div>
            </div>
            <div className="text-lg font-bold text-yellow-400">{formatPower(system.power_watts)}</div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-blue-400" />
              <div className="text-xs text-gray-500">Backends</div>
            </div>
            <div className="text-sm font-semibold text-blue-400">{system.backends.slice(0, 2).join(', ')}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Compute Performance</div>
          <div className="flex flex-wrap gap-2">
            {computeMetrics.map((metric, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-md text-xs font-mono">
                {metric}
              </span>
            ))}
          </div>
        </div>

        {system.use_cases && system.use_cases.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Optimized For</div>
            <div className="flex flex-wrap gap-2">
              {system.use_cases.map((useCase, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-900/30 text-green-300 rounded-md text-xs capitalize border border-green-700">
                  {useCase}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mb-3">
          <div className="text-sm font-semibold text-blue-300 mb-1">Why This System?</div>
          <div className="text-sm text-blue-200">{fit_rationale}</div>
        </div>

        {system.notes && (
          <div className="text-xs text-gray-400 bg-gray-900/50 rounded p-3 border border-gray-700">
            <span className="font-semibold text-gray-300">Note:</span> {system.notes}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-lg font-bold text-white">AI Supercomputers & Accelerators</h3>
            <p className="text-sm text-gray-400">
              High-end systems for enterprise AI workloads, training, and large-scale inference
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {renderTier(minimum, '💰 Minimum (Budget)', 'text-yellow-400')}
        {renderTier(ideal, '⚡ Ideal (Recommended)', 'text-green-400')}
        {renderTier(best, '🚀 Best (Maximum)', 'text-blue-400')}
      </div>
    </div>
  )
}
