import { useState } from 'react'
import { Plus, Trash2, Play, Info, Search } from 'lucide-react'
import { useScenarioStore } from '../../store/scenarioStore'
import ModelSelectorModal from './ModelSelectorModal'

interface ScenarioBuilderProps {
  onCalculate: () => void
  isCalculating: boolean
}

export default function ScenarioBuilder({ onCalculate, isCalculating }: ScenarioBuilderProps) {
  const { modelInstances, deploymentMode, updateModelInstance, addModelInstance, removeModelInstance, setDeploymentMode } = useScenarioStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleOpenModal = (index: number) => {
    setEditingIndex(index)
    setModalOpen(true)
  }

  const handleSelectModel = (modelName: string) => {
    if (editingIndex !== null) {
      updateModelInstance(editingIndex, { ...modelInstances[editingIndex], model_name: modelName })
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Configure Scenario</h2>

      {/* Model Instances */}
      <div className="space-y-4 mb-6">
        {modelInstances.map((instance, index) => (
          <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400">Model {index + 1}</span>
              {modelInstances.length > 1 && (
                <button
                  onClick={() => removeModelInstance(index)}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Remove model instance"
                  title="Remove this model"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Model Name Input */}
            <div className="mb-3">
              <label htmlFor={`model-${index}`} className="block text-sm font-medium text-gray-300 mb-2">
                Model Name
              </label>
              <button
                type="button"
                onClick={() => handleOpenModal(index)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-left flex items-center justify-between hover:border-blue-500 transition-colors group"
              >
                <span className={instance.model_name ? "text-white" : "text-gray-500"}>
                  {instance.model_name || "Click to select model..."}
                </span>
                <Search className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
              </button>
              {!instance.model_name && (
                <p className="mt-1 text-xs text-gray-500">
                  Search from 536+ models: llama, qwen, mistral, phi, etc.
                </p>
              )}
            </div>

            {/* Number of Instances */}
            <div className="mb-3">
              <label htmlFor={`instances-${index}`} className="block text-sm font-medium text-gray-300 mb-2">
                Instances
              </label>
              <input
                id={`instances-${index}`}
                type="number"
                min="1"
                max="100"
                value={instance.n_instances}
                onChange={(e) => updateModelInstance(index, { ...instance, n_instances: parseInt(e.target.value) || 1 })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                aria-label="Number of instances"
              />
            </div>

            {/* Context Tokens */}
            <div className="mb-3">
              <label htmlFor={`context-${index}`} className="block text-sm font-medium text-gray-300 mb-2">
                Context Window
              </label>
              <select
                id={`context-${index}`}
                value={instance.context_tokens}
                onChange={(e) => updateModelInstance(index, { ...instance, context_tokens: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                aria-label="Context window size"
              >
                <option value={2048}>2K tokens</option>
                <option value={4096}>4K tokens</option>
                <option value={8192}>8K tokens</option>
                <option value={16384}>16K tokens</option>
                <option value={32768}>32K tokens</option>
                <option value={65536}>64K tokens</option>
                <option value={131072}>128K tokens</option>
              </select>
            </div>

            {/* Use Case */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor={`usecase-${index}`} className="block text-sm font-medium text-gray-300">
                  Use Case
                </label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="hidden group-hover:block absolute left-0 top-6 z-20 w-72 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-300">
                    <div className="font-semibold text-white mb-1">Why Use Case Matters</div>
                    <p className="mb-2">
                      Different use cases affect memory allocation and performance estimates:
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><span className="text-blue-400">Coding:</span> Higher batch sizes, more activation memory</li>
                      <li><span className="text-blue-400">Reasoning:</span> Longer sequences, increased KV cache</li>
                      <li><span className="text-blue-400">Chat:</span> Variable context, interactive latency focus</li>
                      <li><span className="text-blue-400">Embedding:</span> Different memory patterns</li>
                    </ul>
                    <p className="mt-2 text-gray-400">
                      The calculator adjusts memory overhead and performance multipliers based on your selection.
                    </p>
                  </div>
                </div>
              </div>
              <select
                id={`usecase-${index}`}
                value={instance.use_case}
                onChange={(e) => updateModelInstance(index, { ...instance, use_case: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                aria-label="Model use case"
              >
                <option value="general">General</option>
                <option value="coding">Coding</option>
                <option value="reasoning">Reasoning</option>
                <option value="chat">Chat</option>
                <option value="embedding">Embedding</option>
                <option value="multimodal">Multimodal</option>
              </select>
            </div>
          </div>
        ))}

        <button
          onClick={() => addModelInstance({ model_name: '', n_instances: 1, context_tokens: 4096, use_case: 'general' })}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Another Model
        </button>
      </div>

      {/* Deployment Mode */}
      <div className="mb-6">
        <label htmlFor="deployment-mode" className="block text-sm font-medium text-gray-300 mb-2">
          Deployment Mode
        </label>
        <select
          id="deployment-mode"
          value={deploymentMode}
          onChange={(e) => setDeploymentMode(e.target.value as any)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          aria-label="Deployment mode"
        >
          <option value="concurrent">Concurrent (Parallel)</option>
          <option value="sequential">Sequential (Queue)</option>
          <option value="batched">Batched (Shared)</option>
        </select>
      </div>

      {/* Calculate Button */}
      <button
        onClick={onCalculate}
        disabled={isCalculating}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 transition-colors"
      >
        {isCalculating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Calculating...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Calculate Hardware
          </>
        )}
      </button>

      {/* Model Selection Modal */}
      <ModelSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectModel}
        currentValue={editingIndex !== null ? modelInstances[editingIndex]?.model_name : ''}
      />
    </div>
  )
}
