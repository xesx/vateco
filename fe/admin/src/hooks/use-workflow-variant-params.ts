import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface WorkflowVariantParam {
  id: number
  workflowVariantId: number
  paramName: string
  label?: string
  value?: unknown
  positionX?: number
  positionY?: number
  user?: boolean
  enum?: unknown
}

export function useWorkflowVariantParams(workflowVariantId: number | null) {
  return useQuery({
    queryKey: ['workflow-variant-params', workflowVariantId],
    queryFn: async () => {
      if (!workflowVariantId) return []
      const { data } = await api.post<{ success: boolean; data: WorkflowVariantParam[] }>('/wf/variant/params/get', { workflowVariantId })
      return data.data
    },
    enabled: !!workflowVariantId,
  })
}
