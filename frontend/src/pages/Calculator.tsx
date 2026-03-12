import { useState } from 'react'
import { Cpu, Zap, DollarSign, TrendingUp } from 'lucide-react'
import { useScenarioStore } from '../store/scenarioStore'
import { calculateHardware } from '../api/client'
import toast from 'react-hot-toast'
import ScenarioBuilder from '../components/scenario/ScenarioBuilder'
import ResultsPanel from '../components/results/ResultsPanel'

export default function Calculator() {
  const {
    modelInstances,
    deploymentMode,
    results,
    isCalculating,
    setResults,
    setCalculating,
    setError,
  } = useScenarioStore()

  const handleCalculate = async () => {
    if (modelInstances.some(inst => !inst.model_name.trim())) {
      toast.error('Please enter a model name for all instances')
      return
    }

    setCalculating(true)
    setError(null)
    setResults(null)

    try {
      const response = await calculateHardware({
        model_instances: modelInstances,
        deployment_mode: deploymentMode,
        include_cpu_paths: true,
        prefer_single_gpu: true,
      })

      setResults(response)
      toast.success('Hardware recommendations calculated!')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Calculation failed'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">LLM Calculator</h1>
              <p className="text-gray-400 text-sm mt-1">
                Find the perfect hardware for your LLM deployment
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scenario Builder */}
          <div className="lg:col-span-1">
            <ScenarioBuilder onCalculate={handleCalculate} isCalculating={isCalculating} />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2">
            {!results && !isCalculating && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-12 text-center">
                <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Ready to Calculate
                </h3>
                <p className="text-gray-500">
                  Configure your scenario and click "Calculate Hardware" to see recommendations
                </p>
              </div>
            )}

            {isCalculating && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Calculating...
                </h3>
                <p className="text-gray-500">
                  Analyzing hardware requirements for your scenario
                </p>
              </div>
            )}

            {results && !isCalculating && <ResultsPanel results={results} />}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <h4 className="text-sm font-medium text-gray-400">Cost Optimization</h4>
            </div>
            <p className="text-2xl font-bold text-white">3 Tiers</p>
            <p className="text-sm text-gray-500 mt-1">From minimum to best performance</p>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              <h4 className="text-sm font-medium text-gray-400">Hardware Database</h4>
            </div>
            <p className="text-2xl font-bold text-white">105+</p>
            <p className="text-sm text-gray-500 mt-1">GPUs and CPUs supported</p>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-medium text-gray-400">Model Coverage</h4>
            </div>
            <p className="text-2xl font-bold text-white">536</p>
            <p className="text-sm text-gray-500 mt-1">LLM models in database</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-gray-700">
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-2">
            Created by <span className="text-gray-300 font-medium">Razi Ashary</span>
          </p>
          <p className="mb-2">
            <a href="mailto:razi@airsfoundry.com" className="text-blue-400 hover:text-blue-300 transition-colors">
              razi@airsfoundry.com
            </a>
          </p>
          <p>
            <a 
              href="https://github.com/SleepingFolktales/llmcalculator" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub Repository
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
