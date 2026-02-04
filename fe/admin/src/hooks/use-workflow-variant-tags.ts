import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface WorkflowVariantTag {
  id: number
  workflowVariantId: number
  tag: string
}

export function useWorkflowVariantTags(workflowVariantId: number | null) {
  return useQuery({
    queryKey: ['workflow-variant-tags', workflowVariantId],
    queryFn: async () => {
      if (!workflowVariantId) return []
      const { data } = await api.post<{ success: boolean; data: WorkflowVariantTag[] }>('/wf/variant/tags/list', { workflowVariantId })
      return data.data
    },
    enabled: !!workflowVariantId,
  })
}

export function useAddWorkflowVariantTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ workflowVariantId, tag }: { workflowVariantId: number; tag: string }) => {
      const { data } = await api.post<{ success: boolean }>('/wf/variant/tags/add', { workflowVariantId, tag })
      return data.success
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-variant-tags', variables.workflowVariantId] })
    },
  })
}

export function useDeleteWorkflowVariantTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ workflowVariantId, tag }: { workflowVariantId: number; tag: string }) => {
      const { data } = await api.post<{ success: boolean }>('/wf/variant/tags/delete', { workflowVariantId, tag })
      return data.success
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-variant-tags', variables.workflowVariantId] })
    },
  })
}
