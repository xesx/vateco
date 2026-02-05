import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useAllTags() {
  return useQuery({
    queryKey: ['all-tags'],
    queryFn: async () => {
      const { data } = await api.post<string[]>('/tag/list')
      return data
    },
  })
}
