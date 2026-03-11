/**
 * Zustand store for scenario state management
 */

import { create } from 'zustand'
import type { ModelInstanceInput, CalculationResponse } from '../types/api'

interface ScenarioState {
  modelInstances: ModelInstanceInput[]
  deploymentMode: 'concurrent' | 'sequential' | 'batched'
  results: CalculationResponse | null
  isCalculating: boolean
  error: string | null
  
  addModelInstance: (instance: ModelInstanceInput) => void
  removeModelInstance: (index: number) => void
  updateModelInstance: (index: number, instance: ModelInstanceInput) => void
  setDeploymentMode: (mode: 'concurrent' | 'sequential' | 'batched') => void
  setResults: (results: CalculationResponse | null) => void
  setCalculating: (isCalculating: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialInstance: ModelInstanceInput = {
  model_name: '',
  n_instances: 1,
  context_tokens: 4096,
  precision_format: 'fp16',
  use_case: 'general',
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  modelInstances: [{ ...initialInstance }],
  deploymentMode: 'concurrent',
  results: null,
  isCalculating: false,
  error: null,
  
  addModelInstance: (instance) =>
    set((state) => ({
      modelInstances: [...state.modelInstances, instance],
    })),
  
  removeModelInstance: (index) =>
    set((state) => ({
      modelInstances: state.modelInstances.filter((_, i) => i !== index),
    })),
  
  updateModelInstance: (index, instance) =>
    set((state) => ({
      modelInstances: state.modelInstances.map((item, i) =>
        i === index ? instance : item
      ),
    })),
  
  setDeploymentMode: (mode) => set({ deploymentMode: mode }),
  
  setResults: (results) => set({ results }),
  
  setCalculating: (isCalculating) => set({ isCalculating }),
  
  setError: (error) => set({ error }),
  
  reset: () =>
    set({
      modelInstances: [{ ...initialInstance }],
      deploymentMode: 'concurrent',
      results: null,
      isCalculating: false,
      error: null,
    }),
}))
