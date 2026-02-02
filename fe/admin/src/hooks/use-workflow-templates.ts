import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface WorkflowTemplate {
  id: number
  name: string
  description: string | null
  schema: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateWorkflowTemplateDto {
  name?: string
  description?: string
  schema?: Record<string, unknown>
}

export interface UpdateWorkflowTemplateDto {
  id: number
  name?: string
  description?: string
}

export interface UpdateWorkflowTemplateSchemaDto {
  id: number
  schema?: Record<string, unknown>
}

// Получение списка всех workflow templates
export function useWorkflowTemplates() {
  return useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data } = await api.post<{ success: boolean; data: WorkflowTemplate[] }>('/wf/template/list', {})
      return data.data
    },
  })
}

// Получение одного workflow template по ID
export function useWorkflowTemplate(id: number | null) {
  return useQuery({
    queryKey: ['workflow-templates', id],
    queryFn: async () => {
      const { data } = await api.post<{ success: boolean; data: WorkflowTemplate }>('/wf/template/get', { id })
      return data.data
    },
    enabled: !!id,
  })
}

// Создание нового workflow template
export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateData: CreateWorkflowTemplateDto) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/wf/template/create', templateData)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
    },
  })
}

// Обновление workflow template (name и description)
export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateData: UpdateWorkflowTemplateDto) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/wf/template/update', templateData)
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-templates', variables.id] })
    },
  })
}

// Обновление схемы workflow template
export function useUpdateWorkflowTemplateSchema() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateData: UpdateWorkflowTemplateSchemaDto) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/wf/template/update-schema', templateData)
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-templates', variables.id] })
    },
  })
}

// Удаление workflow template
export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<{ success: boolean; data: { id: number } }>('/wf/template/delete', { id })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
    },
  })
}
