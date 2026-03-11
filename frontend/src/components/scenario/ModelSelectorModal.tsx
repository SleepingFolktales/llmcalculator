import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { searchModels } from '../../api/client'
import type { Model } from '../../types/api'

interface ModelSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (modelName: string) => void
  currentValue: string
}

export default function ModelSelectorModal({ isOpen, onClose, onSelect, currentValue }: ModelSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load initial models when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      // Load initial models on open
      const loadInitialModels = async () => {
        setIsLoading(true)
        try {
          const results = await searchModels('', 1000)
          setModels(results)
        } catch (error) {
          console.error('Failed to load models:', error)
          setModels([])
        } finally {
          setIsLoading(false)
        }
      }
      loadInitialModels()
    }
  }, [isOpen])

  // Search models when query changes
  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true)
      try {
        const results = await searchModels(searchQuery, 1000)
        setModels(results)
      } catch (error) {
        console.error('Failed to search models:', error)
        setModels([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSelectModel = (modelName: string) => {
    onSelect(modelName)
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-700 w-full max-w-4xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-700 bg-gray-800/50">
          <div>
            <h2 className="text-3xl font-bold text-white">Select LLM Model</h2>
            <p className="text-sm text-gray-400 mt-1.5">Choose from 536+ models</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-7 h-7 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-700 bg-gray-800/30">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search: llama, qwen, mistral, phi, gemma..."
              className="w-full bg-gray-800 border-2 border-gray-600 rounded-xl pl-14 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-xl"
              autoFocus
            />
          </div>
          {currentValue && (
            <div className="mt-2 text-sm text-gray-400">
              Current: <span className="text-white font-medium">{currentValue}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Searching models...</div>
            </div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-500 mb-2">
                No models found
              </div>
              <div className="text-sm text-gray-600">
                Try: llama, qwen, mistral, phi, gemma, deepseek
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => handleSelectModel(model.name)}
                  className="w-full text-left p-5 bg-gray-800/60 hover:bg-gray-700 rounded-xl border-2 border-gray-700 hover:border-blue-500 transition-all group shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Model Name - Extra Large and Clear */}
                      <div className="text-xl font-bold text-white mb-3 break-words group-hover:text-blue-400 transition-colors leading-tight">
                        {model.name}
                      </div>
                      
                      {/* Model Details */}
                      <div className="flex items-center gap-4 text-base text-gray-400 flex-wrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-gray-500 text-sm">Provider:</span>
                          <span className="text-gray-200 font-semibold">{model.provider}</span>
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="inline-flex items-center gap-2">
                          <span className="text-gray-500 text-sm">Size:</span>
                          <span className="text-blue-400 font-bold text-lg">{model.parameter_count}</span>
                        </span>
                        {model.context_length && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="inline-flex items-center gap-2">
                              <span className="text-gray-500 text-sm">Context:</span>
                              <span className="text-gray-200 font-medium">{model.context_length.toLocaleString()}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Use Case Badge */}
                    {model.use_case && (
                      <span className="px-3 py-1.5 bg-blue-900/50 text-blue-300 rounded-lg text-sm font-bold shrink-0">
                        {model.use_case}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              {models.length > 0 && `${models.length} model${models.length !== 1 ? 's' : ''} found`}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
