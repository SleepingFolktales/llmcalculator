import React from 'react'
import { X, Cpu, Zap, DollarSign, HardDrive, Activity } from 'lucide-react'
import type { HardwareTierOutput, LaptopTierOutput, SupercomputerTierOutput } from '../../types/api'

interface HardwareDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  hardware: HardwareTierOutput | LaptopTierOutput | SupercomputerTierOutput | null
  type: 'desktop' | 'laptop' | 'supercomputer'
}

export function HardwareDetailModal({ isOpen, onClose, title, hardware, type }: HardwareDetailModalProps) {
  if (!isOpen || !hardware) return null

  const renderDesktopDetails = (hw: HardwareTierOutput) => (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {hw.gpu && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Cpu className="w-5 h-5" />
              <span className="font-semibold">GPU</span>
            </div>
            <p className="text-white font-medium">{hw.gpu.name}</p>
            <p className="text-sm text-gray-400 mt-1">{hw.gpu.vram_gb}GB VRAM</p>
            <p className="text-sm text-gray-400">{hw.gpu.n_units}x unit(s)</p>
          </div>
        )}

        {hw.cpu && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Cpu className="w-5 h-5" />
              <span className="font-semibold">CPU</span>
            </div>
            <p className="text-white font-medium">{hw.cpu.name}</p>
            <p className="text-sm text-gray-400 mt-1">{hw.cpu.cores_total} cores</p>
          </div>
        )}

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <HardDrive className="w-5 h-5" />
            <span className="font-semibold">Memory</span>
          </div>
          <p className="text-white">{hw.ram_gb}GB {hw.ram_type}</p>
          <p className="text-sm text-gray-400 mt-1">VRAM: {hw.vram_total_gb.toFixed(0)}GB ({hw.vram_headroom_pct.toFixed(0)}% headroom)</p>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">Power</span>
          </div>
          <p className="text-white">{hw.power.total_watts}W</p>
          <p className="text-sm text-gray-400 mt-1">GPU: {hw.power.gpu_watts}W, CPU: {hw.power.cpu_watts}W</p>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-orange-400 mb-2">
          <Activity className="w-5 h-5" />
          <span className="font-semibold">Performance</span>
        </div>
        <p className="text-sm text-gray-300">{hw.performance.total_system_tps.toFixed(0)} tok/s</p>
        <p className="text-xs text-gray-400 mt-1">Latency: {hw.performance.latency_per_token_ms.toFixed(0)}ms per token</p>
      </div>

      {hw.fit_notes && hw.fit_notes.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg mb-4">
          <p className="text-sm text-blue-300 font-semibold mb-2">Fit Notes</p>
          <ul className="text-xs text-blue-200 space-y-1">
            {hw.fit_notes.map((note: string, i: number) => <li key={i}>• {note}</li>)}
          </ul>
        </div>
      )}

      {hw.trade_offs && (
        <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded-lg">
          <p className="text-sm text-yellow-300 font-semibold mb-2">Trade-offs</p>
          <p className="text-xs text-yellow-200">{hw.trade_offs}</p>
        </div>
      )}
    </>
  )

  const renderLaptopDetails = (hw: LaptopTierOutput) => (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg col-span-2">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Cpu className="w-5 h-5" />
            <span className="font-semibold">GPU</span>
          </div>
          <p className="text-white font-medium">{hw.laptop_gpu.name}</p>
          <p className="text-sm text-gray-400 mt-1">
            {hw.laptop_gpu.vram_gb ? `${hw.laptop_gpu.vram_gb}GB VRAM` : `${hw.laptop_gpu.unified_memory_max_gb}GB Unified Memory`}
          </p>
          <p className="text-sm text-gray-400">Brand: {hw.laptop_gpu.brand}</p>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <HardDrive className="w-5 h-5" />
            <span className="font-semibold">Memory</span>
          </div>
          <p className="text-white">{hw.laptop_gpu.effective_vram_gb.toFixed(1)}GB effective</p>
          <p className="text-sm text-gray-400 mt-1">Bandwidth: {hw.laptop_gpu.bandwidth_gbps} GB/s</p>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">Price</span>
          </div>
          <p className="text-white">${hw.laptop_gpu.typical_laptop_price_usd?.toLocaleString() || 'N/A'}</p>
          <p className="text-sm text-gray-400 mt-1">Form: {hw.laptop_gpu.form_factor}</p>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-orange-400 mb-2">
          <Activity className="w-5 h-5" />
          <span className="font-semibold">Performance</span>
        </div>
        <p className="text-sm text-gray-300">{hw.estimated_tps.toFixed(0)} tok/s</p>
        <p className="text-xs text-gray-400 mt-1">Unified Memory: {hw.laptop_gpu.is_unified_memory ? 'Yes' : 'No'}</p>
      </div>

      <div className="bg-green-900/30 border border-green-700 p-3 rounded-lg mb-4">
        <p className="text-sm text-green-300 font-semibold mb-2">Backends</p>
        <div className="flex gap-2 flex-wrap">
          {hw.laptop_gpu.backends.map((b: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">{b}</span>
          ))}
        </div>
      </div>

      {hw.notes && (
        <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg">
          <p className="text-xs text-blue-200">{hw.notes}</p>
        </div>
      )}
    </>
  )

  const renderSupercomputerDetails = (hw: SupercomputerTierOutput) => (
    <>
      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <p className="text-white font-bold text-lg mb-2">{hw.system.name}</p>
        <div className="flex gap-2 flex-wrap mb-3">
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">{hw.system.brand}</span>
          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">{hw.system.category}</span>
          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">{hw.system.form_factor}</span>
        </div>
        <p className="text-sm text-gray-300 mb-2">{hw.fit_rationale}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <HardDrive className="w-5 h-5" />
            <span className="font-semibold">VRAM</span>
          </div>
          <p className="text-white font-medium">{hw.system.total_vram_gb}GB</p>
          {hw.system.vram_bandwidth_tbps && (
            <p className="text-sm text-gray-400">{hw.system.vram_bandwidth_tbps} TB/s bandwidth</p>
          )}
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">Power</span>
          </div>
          <p className="text-white">{hw.system.power_watts}W</p>
        </div>

        {hw.system.msrp_usd && (
          <div className="bg-gray-700 p-4 rounded-lg col-span-2">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="font-semibold">Price</span>
            </div>
            <p className="text-white font-bold text-xl">${hw.system.msrp_usd.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <p className="text-sm text-gray-300 font-semibold mb-2">Use Cases</p>
        <div className="flex gap-2 flex-wrap">
          {hw.system.use_cases.map((uc: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">{uc}</span>
          ))}
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <p className="text-sm text-gray-300 font-semibold mb-2">Backends</p>
        <div className="flex gap-2 flex-wrap">
          {hw.system.backends.map((b: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded">{b}</span>
          ))}
        </div>
      </div>

      {hw.system.notes && (
        <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg">
          <p className="text-xs text-blue-200">{hw.system.notes}</p>
        </div>
      )}
    </>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {type === 'desktop' && renderDesktopDetails(hardware as HardwareTierOutput)}
          {type === 'laptop' && renderLaptopDetails(hardware as LaptopTierOutput)}
          {type === 'supercomputer' && renderSupercomputerDetails(hardware as SupercomputerTierOutput)}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
