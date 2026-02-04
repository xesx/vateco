import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface WorkflowVariant {
  id: number
  name: string
  description: string | null
  workflowTemplateId: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateWorkflowVariantDto {
  workflowTemplateId: number
  name: string
  description?: string
}

export interface UpdateWorkflowVariantDto {
  workflowVariantId: number
  name?: string
  description?: string
}

export function useWorkflowVariants() {
  return useQuery({
    queryKey: ['workflow-variants'],
    queryFn: async () => {
      const { data } = await api.post<{ success: boolean; data: WorkflowVariant[] }>('/wf/variant/list', {})
      return data.data
    },
  })
}

export function useCreateWorkflowVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variantData: CreateWorkflowVariantDto) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/wf/variant/create', variantData)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-variants'] })
    },
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
