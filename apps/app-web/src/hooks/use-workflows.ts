import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Workflow {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateWorkflowDto {
  name: string
  description: string
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await api.get<Workflow[]>('/workflows')
      return data
    },
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: async () => {
      const { data } = await api.get<Workflow>(`/workflows/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workflowData: CreateWorkflowDto) => {
      const { data } = await api.post<Workflow>('/workflows', workflowData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...workflowData }: Partial<Workflow> & { id: string }) => {
      const { data } = await api.patch<Workflow>(`/workflows/${id}`, workflowData)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflows', data.id] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useRunWorkflow() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/workflows/${id}/run`)
      return data
    },
  })
}

