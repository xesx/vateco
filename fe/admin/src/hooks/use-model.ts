import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Model } from './use-models'

export function useModel(id: number | null) {
  return useQuery({
    queryKey: ['model', id],
    queryFn: async () => {
      if (!id) return null
      const { data } = await api.post<{ success: boolean; data: Model }>('/model/get', { id })
      return data.data
    },
    enabled: !!id,
  })
}

