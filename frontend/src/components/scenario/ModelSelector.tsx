import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { searchModels } from '../../api/client'
import type { Model } from '../../types/api'

interface ModelSelectorProps {
  value: string
  onChange: (modelName: string) => void
  instanceIndex: number
}

export default function ModelSelector({ value, onChange, instanceIndex }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search models when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setModels([])
        return
      }

      setIsLoading(true)
      try {
        const results = await searchModels(searchQuery, 20)
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
    onChange(modelName)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    onChange('')
    setSearchQuery('')
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearchQuery(value)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <label htmlFor={`model-${instanceIndex}`} className="block text-sm font-medium text-gray-300 mb-2">
        Model Name
      </label>

      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-500" />
        </div>
        
        <input
          id={`model-${instanceIndex}`}
          type="text"
          value={isOpen ? searchQuery : value}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder="Search models... (e.g., llama-3.3-70b)"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-20 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          autoComplete="off"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300"
            aria-label="Toggle dropdown"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              Searching models...
            </div>
          ) : models.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              {searchQuery.length < 2 ? 'Type 2+ characters to search' : 'No models found'}
            </div>
          ) : (
            <ul className="py-1">
              {models.map((model) => (
                <li key={model.name}>
                  <button
                    type="button"
                    onClick={() => handleSelectModel(model.name)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors border-b border-gray-700/50 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-white mb-1 break-words">
                          {model.name}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-300">{model.provider}</span>
                          <span>•</span>
                          <span className="font-medium text-blue-400">{model.parameter_count}</span>
                          {model.context_length && (
                            <>
                              <span>•</span>
                              <span>{model.context_length.toLocaleString()} ctx</span>
                            </>
                          )}
                        </div>
                      </div>
                      {model.use_case && (
                        <span className="text-xs px-2 py-1 bg-blue-900/40 text-blue-300 rounded shrink-0 font-medium">
                          {model.use_case}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Helper Text */}
      {!value && !isOpen && (
        <p className="mt-1 text-xs text-gray-500">
          Search from 536+ models: llama, mistral, qwen, phi, etc.
        </p>
      )}
    </div>
  )
}
