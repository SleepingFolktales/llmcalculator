import { HardwareTierOutput } from '../../types/api'
import { Cpu, MemoryStick, Zap, DollarSign, TrendingUp } from 'lucide-react'

interface TierCardProps {
  tier: HardwareTierOutput
}

export default function TierCard({ tier }: TierCardProps) {
  const tierColors = {
    minimum: 'border-yellow-500/50 bg-yellow-500/5',
    ideal: 'border-green-500/50 bg-green-500/5',
    best: 'border-blue-500/50 bg-blue-500/5',
  }

  const tierLabelColors = {
    minimum: 'bg-yellow-500/20 text-yellow-400',
    ideal: 'bg-green-500/20 text-green-400',
    best: 'bg-blue-500/20 text-blue-400',
  }

  return (
    <div className={`rounded-lg border-2 ${tierColors[tier.tier as keyof typeof tierColors]} backdrop-blur-sm p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${tierLabelColors[tier.tier as keyof typeof tierLabelColors]}`}>
            {tier.tier_label}
          </span>
          <p className="text-gray-400 text-sm mt-1">{tier.tier_description}</p>
        </div>
        {tier.estimated_cost_usd && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">${tier.estimated_cost_usd.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Est. Build Cost</div>
          </div>
        )}
      </div>

      {/* Hardware Specs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* GPU */}
        {tier.gpu && (
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-400">GPU</span>
            </div>
            <div className="text-white font-semibold">{tier.gpu.short_name}</div>
            {tier.gpu.n_units > 1 && (
              <div className="text-sm text-gray-500">×{tier.gpu.n_units}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">{tier.gpu.vram_gb}GB VRAM</div>
          </div>
        )}

        {/* CPU */}
        {tier.cpu && (
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-400">CPU</span>
            </div>
            <div className="text-white font-semibold text-sm">{tier.cpu.name.split(' ').slice(-2).join(' ')}</div>
            <div className="text-xs text-gray-500 mt-1">{tier.cpu.cores} cores</div>
          </div>
        )}

        {/* RAM */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-400">RAM</span>
          </div>
          <div className="text-white font-semibold">{tier.ram_gb}GB</div>
          <div className="text-xs text-gray-500 mt-1">{tier.ram_type}</div>
        </div>

        {/* Performance */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-400">Speed</span>
          </div>
          <div className="text-white font-semibold">{tier.performance.per_instance_tps.toFixed(1)} tok/s</div>
          <div className="text-xs text-gray-500 mt-1">{tier.performance.recommended_quant}</div>
        </div>
      </div>

      {/* Power Consumption */}
      <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-400">Power</span>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">{tier.power.total_watts}W</div>
            <div className="text-xs text-gray-500">${tier.power.monthly_cost_usd?.toFixed(2)}/mo</div>
          </div>
        </div>
      </div>

      {/* VRAM Usage Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">VRAM Usage</span>
          <span className="text-gray-300">
            {tier.vram_used_gb.toFixed(1)}GB / {tier.vram_total_gb.toFixed(1)}GB ({tier.vram_headroom_pct.toFixed(0)}% headroom)
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${(tier.vram_used_gb / tier.vram_total_gb) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Fit Notes */}
      {tier.fit_notes.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs text-gray-400 space-y-1">
            {tier.fit_notes.map((note, index) => (
              <div key={index} className="flex items-start gap-1">
                <span>•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
