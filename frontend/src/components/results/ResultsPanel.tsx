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

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `llm-calc-${timestamp}.txt`
    const content = `LLM Hardware Calculator Results
Generated: ${new Date().toLocaleString()}

Scenario: ${results.scenario_summary}
Deployment: ${results.deployment_mode}

=== MINIMUM TIER ===
${results.minimum.desktop.tier_label}
Cost: $${results.minimum.desktop.estimated_cost_usd?.toLocaleString()}
GPU: ${results.minimum.desktop.gpu?.name}

=== IDEAL TIER ===
${results.ideal.desktop.tier_label}
Cost: $${results.ideal.desktop.estimated_cost_usd?.toLocaleString()}
GPU: ${results.ideal.desktop.gpu?.name}

=== BEST TIER ===
${results.best.desktop.tier_label}
Cost: $${results.best.desktop.estimated_cost_usd?.toLocaleString()}
GPU: ${results.best.desktop.gpu?.name}

Upgrade Path:
${results.upgrade_path.join('\n')}
`
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
