import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { getPrecisionFormats } from '../../api/client'
import type { PrecisionFormat } from '../../types/api'

interface PrecisionSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (precisionId: string) => void
  currentValue: string
}

export default function PrecisionSelectorModal({ isOpen, onClose, onSelect, currentValue }: PrecisionSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [formats, setFormats] = useState<PrecisionFormat[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load precision formats when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      const loadFormats = async () => {
        setIsLoading(true)
        try {
          const results = await getPrecisionFormats()
          setFormats(results)
        } catch (error) {
          console.error('Failed to load precision formats:', error)
          setFormats([])
        } finally {
          setIsLoading(false)
        }
      }
      loadFormats()
    }
  }, [isOpen])

  // Filter formats based on search query
  useEffect(() => {
    if (!searchQuery) return
    
    const filtered = formats.filter(format => {
      const query = searchQuery.toLowerCase()
      return (
        format.name.toLowerCase().includes(query) ||
        format.short_name.toLowerCase().includes(query) ||
        format.category.toLowerCase().includes(query) ||
        format.use_case.toLowerCase().includes(query)
      )
    })
    setFormats(filtered)
  }, [searchQuery])

  const handleSelectFormat = (precisionId: string) => {
    onSelect(precisionId)
    onClose()
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'full_precision':
        return 'bg-blue-900/20 border-blue-700 text-blue-300'
      case 'compressed':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-300'
      case 'highly_compressed':
        return 'bg-orange-900/20 border-orange-700 text-orange-300'
      case 'gguf':
        return 'bg-red-900/20 border-red-700 text-red-300'
      case 'extreme':
        return 'bg-purple-900/20 border-purple-700 text-purple-300'
      default:
        return 'bg-gray-800 border-gray-700 text-gray-300'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      full_precision: '🔵 Full Precision',
      compressed: '🟡 Compressed',
      highly_compressed: '🟠 Highly Compressed',
      gguf: '🔴 GGUF',
      extreme: '⚡ Extreme'
    }
    return labels[category] || category
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-700 w-full max-w-5xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-700 bg-gray-800/50">
          <div>
            <h2 className="text-3xl font-bold text-white">Select Precision Format</h2>
            <p className="text-sm text-gray-400 mt-1.5">Choose quantization level for your model</p>
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
              placeholder="Search: FP32, INT8, Q4, GGUF, BitNet..."
              className="w-full bg-gray-800 border-2 border-gray-600 rounded-xl pl-14 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-lg"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading precision formats...</div>
            </div>
          ) : formats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-500 mb-2">No formats found</div>
              <div className="text-sm text-gray-600">Try searching for FP32, INT8, Q4, GGUF, or BitNet</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleSelectFormat(format.id)}
                  className={`w-full text-left p-5 bg-gray-800/60 hover:bg-gray-700 rounded-xl border-2 border-gray-700 hover:border-blue-500 transition-all group shadow-lg hover:shadow-xl ${
                    currentValue === format.id ? 'border-blue-500 bg-gray-700' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {format.name}
                        </div>
                        <div className="text-sm text-gray-400">{format.short_name}</div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold shrink-0 ${getCategoryColor(format.category)}`}>
                        {getCategoryLabel(format.category)}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      <div className="bg-gray-900/50 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500 mb-0.5">Bits</div>
                        <div className="text-lg font-bold text-blue-400">{format.bits}</div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500 mb-0.5">Bytes/Param</div>
                        <div className="text-lg font-bold text-cyan-400">{format.bytes_per_param}</div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500 mb-0.5">Quality Score</div>
                        <div className="text-lg font-bold text-green-400">{format.quality_score}%</div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500 mb-0.5">Memory Reduction</div>
                        <div className="text-lg font-bold text-purple-400">{format.memory_reduction_pct}%</div>
                      </div>
                    </div>

                    {/* Use Case */}
                    <div className="pt-1">
                      <div className="text-xs text-gray-500 mb-1">Use Case</div>
                      <div className="text-sm text-gray-300">{format.use_case}</div>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                        <div className="text-xs text-green-400 font-semibold mb-1">✓ Pros</div>
                        <div className="text-sm text-green-200">{format.pros}</div>
                      </div>
                      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                        <div className="text-xs text-red-400 font-semibold mb-1">✗ Cons</div>
                        <div className="text-sm text-red-200">{format.cons}</div>
                      </div>
                    </div>

                    {/* Hardware Requirements */}
                    <div className="pt-1">
                      <div className="text-xs text-gray-500 mb-1.5">Hardware Requirements</div>
                      <div className="flex flex-wrap gap-2">
                        {format.hardware_requirements.map((req, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-gray-800 border border-gray-600 rounded-md text-xs text-gray-300">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Special Notes and Recommendations */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {format.inference_recommended && (
                        <span className="px-3 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded-lg text-xs font-semibold">
                          ✓ Inference Recommended
                        </span>
                      )}
                      {format.popular && (
                        <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded-lg text-xs font-semibold">
                          ⭐ Popular Choice
                        </span>
                      )}
                      {format.special_note && (
                        <span className="px-3 py-1 bg-orange-900/30 border border-orange-700 text-orange-300 rounded-lg text-xs font-semibold">
                          ⚠️ {format.special_note}
                        </span>
                      )}
                    </div>
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
              {formats.length > 0 && `${formats.length} format${formats.length !== 1 ? 's' : ''} available`}
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
