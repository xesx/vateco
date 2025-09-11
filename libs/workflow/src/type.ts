export type TWorkflow = {
  models: string[]
  params: Record<string, TWorkflowParam>
  schema: Record<string, any>
}

export type TWorkflowParam = {
  type: 'string' | 'number' | 'boolean'
  enum?: string[]
  default: string | number | boolean
}