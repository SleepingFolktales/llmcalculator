import { useState, useEffect } from 'react'
import { getPrecisionFormats } from '../../api/client'
import type { PrecisionFormat } from '../../types/api'
import { Info, ChevronDown } from 'lucide-react'
import PrecisionSelectorModal from './PrecisionSelectorModal'

interface PrecisionSelectorProps {
  value: string
  onChange: (precisionId: string) => void
  instanceIndex: number
}

export default function PrecisionSelector({ value, onChange, instanceIndex }: PrecisionSelectorProps) {
  const [formats, setFormats] = useState<PrecisionFormat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState<PrecisionFormat | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadFormats = async () => {
      try {
        const data = await getPrecisionFormats()
        setFormats(data)
        const selected = data.find(f => f.id === value)
        if (selected) setSelectedFormat(selected)
      } catch (error) {
        console.error('Failed to load precision formats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFormats()
  }, [value])

  const handleSelectFormat = (precisionId: string) => {
    onChange(precisionId)
    const selected = formats.find(f => f.id === precisionId)
    if (selected) setSelectedFormat(selected)
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Precision Format
        </label>
        {selectedFormat && (
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-500 cursor-help" />
            <div className="hidden group-hover:block absolute left-0 top-6 z-20 w-80 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-300">
              <div className="font-semibold text-white mb-1">{selectedFormat.name}</div>
              <div className="space-y-2">
                <p><span className="text-gray-500">Bits:</span> <span className="text-blue-400 font-bold">{selectedFormat.bits}</span> ({selectedFormat.bytes_per_param} bytes/param)</p>
                <p><span className="text-gray-500">Quality:</span> <span className="text-green-400">{selectedFormat.quality_score}%</span></p>
                <p><span className="text-gray-500">Memory Reduction:</span> <span className="text-purple-400">{selectedFormat.memory_reduction_pct}%</span> vs FP32</p>
                <p className="text-gray-400"><span className="text-gray-500">Use Case:</span> {selectedFormat.use_case}</p>
                <hr className="border-gray-700" />
                <p className="text-green-400">✓ {selectedFormat.pros}</p>
                <p className="text-red-400">✗ {selectedFormat.cons}</p>
                {selectedFormat.special_note && (
                  <p className="text-yellow-400 mt-2">⚠️ {selectedFormat.special_note}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-500">
          Loading precision formats...
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white hover:border-blue-500 hover:bg-gray-700 transition-all flex items-center justify-between group"
        >
          <div className="text-left">
            {selectedFormat ? (
              <div>
                <div className="font-medium">{selectedFormat.short_name}</div>
                <div className="text-xs text-gray-400">{selectedFormat.name}</div>
              </div>
            ) : (
              <div className="text-gray-400">Select a precision format...</div>
            )}
          </div>
          <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
        </button>
      )}

      {selectedFormat && (
        <div className="mt-2 flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
            {selectedFormat.bytes_per_param}× bytes/param
          </span>
          <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded">
            {selectedFormat.quality_score}% quality
          </span>
          {selectedFormat.inference_recommended && (
            <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded">
              ✓ Recommended
            </span>
          )}
        </div>
      )}

      <PrecisionSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFormat}
        currentValue={value}
      />
    </div>
  )
}
