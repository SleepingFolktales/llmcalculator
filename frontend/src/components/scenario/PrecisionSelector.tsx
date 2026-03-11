import { useState, useEffect } from 'react'
import { getPrecisionFormats } from '../../api/client'
import type { PrecisionFormat } from '../../types/api'
import { Info } from 'lucide-react'

interface PrecisionSelectorProps {
  value: string
  onChange: (precisionId: string) => void
  instanceIndex: number
}

export default function PrecisionSelector({ value, onChange, instanceIndex }: PrecisionSelectorProps) {
  const [formats, setFormats] = useState<PrecisionFormat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState<PrecisionFormat | null>(null)

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

  const handleChange = (precisionId: string) => {
    onChange(precisionId)
    const selected = formats.find(f => f.id === precisionId)
    if (selected) setSelectedFormat(selected)
  }

  // Group formats by category
  const groupedFormats = formats.reduce((acc, format) => {
    const category = format.category
    if (!acc[category]) acc[category] = []
    acc[category].push(format)
    return acc
  }, {} as Record<string, PrecisionFormat[]>)

  const categoryLabels: Record<string, string> = {
    full_precision: '🔵 Full Precision (FP32/FP16/BF16)',
    compressed: '🟡 Compressed (FP8/INT8)',
    highly_compressed: '🟠 Highly Compressed (4-bit)',
    gguf: '🔴 GGUF (CPU Optimized)',
    extreme: '⚡ Extreme (BitNet)'
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <label htmlFor={`precision-${instanceIndex}`} className="block text-sm font-medium text-gray-300">
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
        <div className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-500">
          Loading precision formats...
        </div>
      ) : (
        <select
          id={`precision-${instanceIndex}`}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          aria-label="Precision format"
        >
          {Object.entries(groupedFormats).map(([category, categoryFormats]) => (
            <optgroup key={category} label={categoryLabels[category] || category}>
              {categoryFormats.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.short_name} - {format.bits}bit ({format.memory_reduction_pct}% reduction)
                  {format.popular ? ' ⭐' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}

      {selectedFormat && (
        <div className="mt-2 flex items-center gap-2 text-xs">
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
    </div>
  )
}
