import { CalculationResponse } from '../../types/api'
import TierCard from './TierCard'

interface ResultsPanelProps {
  results: CalculationResponse
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Scenario Summary */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Scenario Summary</h3>
        <p className="text-gray-300">{results.scenario_summary}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
            {results.deployment_mode}
          </span>
          <span>•</span>
          <span>{results.model_breakdown.length} model(s)</span>
        </div>
      </div>

      {/* Three Tier Cards */}
      <div className="space-y-4">
        <TierCard tier={results.minimum} />
        <TierCard tier={results.ideal} />
        <TierCard tier={results.best} />
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
    </div>
  )
}
