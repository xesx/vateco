import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface UpdateWorkflowVariantParamInput {
  workflowVariantParamId: number
  workflowVariantId: number // нужен для ключа кэша
  user?: boolean
  name?: string
  value?: unknown
  label?: string
  enum?: unknown
  positionX?: number
  positionY?: number
}

export function useUpdateWorkflowVariantParam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateWorkflowVariantParamInput) => {
      const { data } = await api.post<{ success: boolean; message: string }>(
        '/wf/variant/params/update',
        input
      )
      if (!data.success) throw new Error(data.message || 'Ошибка обновления параметра')
      return data
    },
    onSuccess: (_data, variables) => {
      // Оптимистично обновляем user в кэше параметров
      queryClient.setQueryData(['workflow-variant-params', variables.workflowVariantId], (oldParams: any) => {
        if (!Array.isArray(oldParams)) return oldParams
        return oldParams.map((param: any) =>
          param.id === variables.workflowVariantParamId
            ? { ...param, user: variables.user }
            : param
        )
      })
    },
  })
}
