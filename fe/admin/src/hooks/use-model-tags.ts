import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ModelTag {
  id: number
  modelId: number
  tag: string
}

export function useModelTags(modelId: number | null) {
  return useQuery({
    queryKey: ['model-tags', modelId],
    queryFn: async () => {
      if (!modelId) return []
      const { data } = await api.post<{ success: boolean; data: ModelTag[] }>('/model/get-tags', { id: modelId })
      return data.data
    },
    enabled: !!modelId,
  })
}

export function useSetModelTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ modelId, tags }: { modelId: number; tags: string[] }) => {
      const { data } = await api.post<{ success: boolean }>('/model/set-tags', { id: modelId, tags })
      return data.success
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['model-tags', variables.modelId] })
    },
  })
}

