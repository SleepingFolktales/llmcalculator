/**
 * Axios API client with typed endpoints
 */

import axios from 'axios'
import type { CalculationRequest, CalculationResponse, Model, PrecisionFormat } from '../types/api'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const calculateHardware = async (request: CalculationRequest): Promise<CalculationResponse> => {
  const { data } = await api.post<CalculationResponse>('/calculate', request)
  return data
}

export const searchModels = async (query: string, limit: number = 20): Promise<Model[]> => {
  const { data } = await api.get<Model[]>('/models', {
    params: { q: query, limit },
  })
  return data
}

export const getModel = async (modelId: string): Promise<Model> => {
  const { data } = await api.get<Model>(`/models/${modelId}`)
  return data
}

export const getPrecisionFormats = async (): Promise<PrecisionFormat[]> => {
  const { data } = await api.get<PrecisionFormat[]>('/precision/formats')
  return data
}

export const getPrecisionFormat = async (precisionId: string): Promise<PrecisionFormat> => {
  const { data } = await api.get<PrecisionFormat>(`/precision/formats/${precisionId}`)
  return data
}

export default api
