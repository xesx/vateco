import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { WorkflowVariant, UpdateWorkflowVariantDto } from './use-workflow-variants'

export function useWorkflowVariant(id: number | null) {
  return useQuery({
    queryKey: ['workflow-variants', id],
    queryFn: async () => {
      const { data } = await api.post<{ success: boolean; data: WorkflowVariant }>('/wf/variant/get', { workflowVariantId: id })
      return data.data
    },
    enabled: !!id,
  })
}

export function useUpdateWorkflowVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variantData: UpdateWorkflowVariantDto) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/wf/variant/update', variantData)
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-variants'] })
      if (variables.workflowVariantId) {
        queryClient.invalidateQueries({ queryKey: ['workflow-variants', variables.workflowVariantId] })
      }
    },
  })
}

export function useDeleteWorkflowVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (workflowVariantId: number) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/wf/variant/delete', { workflowVariantId })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-variants'] })
    },
  })
}
