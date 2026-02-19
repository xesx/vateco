import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Model {
  id: number
  name: string
  label: string
  comfyUiDirectory: string
  comfyUiFileName: string
  baseModel?: string | null
  description?: string | null
  meta?: unknown
  createdAt?: string
  updatedAt?: string
}

export interface CreateModelDto {
  name: string
  label: string
  comfyUiDirectory: string
  comfyUiFileName: string
  baseModel?: string
}

export interface UpdateModelDto {
  id: number
  name?: string
  label?: string
  comfyUiDirectory?: string
  comfyUiFileName?: string
  baseModel?: string
  description?: string
  meta?: unknown
}

export function useModels(comfyUiDirectory: string = '') {
  return useQuery({
    queryKey: ['models', comfyUiDirectory],
    queryFn: async () => {
      const { data } = await api.post<{ success: boolean; data: Model[] }>('/model/list', {
        comfyUiDirectory,
        limit: 100,
        page: 0,
      })
      return data.data
    },
  })
}

export function useCreateModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (modelData: CreateModelDto) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/model/create', modelData)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
  })
}

export function useUpdateModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (modelData: UpdateModelDto) => {
      const { data } = await api.post<{ success: boolean }>('/model/update', modelData)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      queryClient.invalidateQueries({ queryKey: ['model', variables.id] })
    },
  })
}

export function useCreateModelFromCivitai() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { url: string; comfyUiDirectory: string; label?: string; baseModel?: string }) => {
      const { data } = await api.post<{ success: boolean; data: { id: number; name: string } }>('/model/create-from-civitai', dto)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
  })
}

export function useCreateModelFromHuggingface() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { url: string; comfyUiDirectory: string; label?: string; baseModel?: string }) => {
      const { data } = await api.post<{ success: boolean; data: { id: number; name: string } }>('/model/create-from-huggingface', dto)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
  })
}

