import { Plus, Trash2, Play } from 'lucide-react'
import { useScenarioStore } from '../../store/scenarioStore'

interface ScenarioBuilderProps {
  onCalculate: () => void
  isCalculating: boolean
}

export default function ScenarioBuilder({ onCalculate, isCalculating }: ScenarioBuilderProps) {
  const { modelInstances, deploymentMode, updateModelInstance, addModelInstance, removeModelInstance, setDeploymentMode } = useScenarioStore()

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
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Model Name Input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={instance.model_name}
                onChange={(e) => updateModelInstance(index, { ...instance, model_name: e.target.value })}
                placeholder="e.g., llama-3.3-70b"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Number of Instances */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instances
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={instance.n_instances}
                onChange={(e) => updateModelInstance(index, { ...instance, n_instances: parseInt(e.target.value) || 1 })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Context Tokens */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Context Window
              </label>
              <select
                value={instance.context_tokens}
                onChange={(e) => updateModelInstance(index, { ...instance, context_tokens: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Use Case
              </label>
              <select
                value={instance.use_case}
                onChange={(e) => updateModelInstance(index, { ...instance, use_case: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Deployment Mode
        </label>
        <select
          value={deploymentMode}
          onChange={(e) => setDeploymentMode(e.target.value as any)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
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
    </div>
  )
}
