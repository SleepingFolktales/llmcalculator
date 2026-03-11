import { LaptopHardwareRecommendations } from '../../types/api'
import { Laptop, Cpu, HardDrive, Zap, DollarSign, Info } from 'lucide-react'

interface LaptopHardwarePanelProps {
  laptopHardware: LaptopHardwareRecommendations
}

export default function LaptopHardwarePanel({ laptopHardware }: LaptopHardwarePanelProps) {
  const hasTiers = laptopHardware.minimum || laptopHardware.ideal || laptopHardware.best
  const hasRaspberryPi = laptopHardware.raspberry_pi

  if (!hasTiers && !hasRaspberryPi) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">💻 Laptop & Portable Hardware</h2>
        <p className="text-gray-400">No suitable laptop hardware found for this scenario.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">💻 Laptop & Portable Hardware</h2>
      <p className="text-gray-400 mb-6 text-sm">
        Laptop GPUs, Apple Silicon, and edge devices that can run this scenario
      </p>

      {/* Laptop Tier Cards */}
      {hasTiers && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {laptopHardware.minimum && (
            <LaptopTierCard tier={laptopHardware.minimum} color="blue" />
          )}
          {laptopHardware.ideal && (
            <LaptopTierCard tier={laptopHardware.ideal} color="green" />
          )}
          {laptopHardware.best && (
            <LaptopTierCard tier={laptopHardware.best} color="purple" />
          )}
        </div>
      )}

      {/* Raspberry Pi Card */}
      {hasRaspberryPi && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-pink-400" />
            Edge Computing Option
          </h3>
          <RaspberryPiCard pi={laptopHardware.raspberry_pi} />
        </div>
      )}
    </div>
  )
}

interface LaptopTierCardProps {
  tier: any
  color: 'blue' | 'green' | 'purple'
}

function LaptopTierCard({ tier, color }: LaptopTierCardProps) {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-900/10',
    green: 'border-green-500/30 bg-green-900/10',
    purple: 'border-purple-500/30 bg-purple-900/10',
  }

  const badgeClasses = {
    blue: 'bg-blue-900/50 text-blue-300 border-blue-500/50',
    green: 'bg-green-900/50 text-green-300 border-green-500/50',
    purple: 'bg-purple-900/50 text-purple-300 border-purple-500/50',
  }

  const gpu = tier.laptop_gpu

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{tier.tier_name}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {gpu.is_unified_memory ? '🔄 Unified Memory' : '💾 Dedicated VRAM'}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs border rounded ${badgeClasses[color]}`}>
          {gpu.form_factor}
        </span>
      </div>

      {/* GPU Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Laptop className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">{gpu.short_name}</span>
        </div>
        <p className="text-xs text-gray-400">{gpu.brand}</p>
      </div>

      {/* Specs */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">VRAM:</span>
          <span className="text-white font-medium">
            {gpu.vram_gb ? `${gpu.vram_gb} GB` : `${gpu.unified_memory_max_gb} GB Unified`}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Bandwidth:</span>
          <span className="text-white font-medium">{gpu.bandwidth_gbps.toFixed(1)} GB/s</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Estimated Speed:</span>
          <span className="text-white font-medium">{tier.estimated_tps.toFixed(1)} tok/s</span>
        </div>
        {gpu.typical_laptop_price_usd && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Typical Price:</span>
            <span className="text-green-400 font-medium">${gpu.typical_laptop_price_usd}</span>
          </div>
        )}
      </div>

      {/* Laptop Brands */}
      {gpu.typical_laptop_brands && gpu.typical_laptop_brands.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Found in:</p>
          <div className="flex flex-wrap gap-1">
            {gpu.typical_laptop_brands.slice(0, 3).map((brand: string, idx: number) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded">
                {brand}
              </span>
            ))}
            {gpu.typical_laptop_brands.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded">
                +{gpu.typical_laptop_brands.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Backends */}
      <div className="flex flex-wrap gap-1 mb-3">
        {gpu.backends.map((backend: string, idx: number) => (
          <span key={idx} className="text-xs px-2 py-0.5 bg-gray-800/70 text-blue-400 rounded border border-blue-500/30">
            {backend}
          </span>
        ))}
      </div>

      {/* Notes */}
      {tier.notes && (
        <div className="pt-3 border-t border-gray-700/50">
          <p className="text-xs text-gray-400">{tier.notes}</p>
        </div>
      )}
    </div>
  )
}

interface RaspberryPiCardProps {
  pi: any
}

function RaspberryPiCard({ pi }: RaspberryPiCardProps) {
  return (
    <div className="border border-pink-500/30 bg-pink-900/10 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-pink-400" />
          <h4 className="text-lg font-semibold text-white">{pi.device}</h4>
        </div>
        <span className="px-2 py-1 text-xs border border-pink-500/50 bg-pink-900/50 text-pink-300 rounded">
          {pi.form_factor.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">RAM</span>
          </div>
          <p className="text-white font-medium">{pi.ram_gb} GB</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Power</span>
          </div>
          <p className="text-white font-medium">{pi.power_consumption_watts}W</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">CPU</span>
          </div>
          <p className="text-white text-xs font-medium">{pi.cpu}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Price</span>
          </div>
          <p className="text-green-400 font-medium">${pi.typical_price_usd}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">Performance</span>
        </div>
        <p className="text-white">~{pi.estimated_tps.toFixed(1)} tok/s (CPU-only)</p>
      </div>

      <div className="pt-3 border-t border-pink-700/50">
        <p className="text-xs text-gray-400">{pi.notes}</p>
      </div>
    </div>
  )
}
