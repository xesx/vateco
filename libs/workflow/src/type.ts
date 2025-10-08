export type TWorkflow = {
  models: string[]
  name: string
  params: Record<string, TWorkflowParam>
  template: Record<string, any>
}

export type TWorkflowParamCommon = {
  type: 'string' | 'integer' | 'boolean' | 'number'
  default?: string | number | boolean
  value?: string | number | boolean
  description: string
  label: string
  enum?: string[]
  multiple?: number
  isComfyUiModel?: boolean
  compile?: (params: Record<string, any>) => any
}

export type TWorkflowParamExtra = {
  user?: boolean
  value?: any
  advanced?: boolean
}

export type TWorkflowParam = TWorkflowParamCommon & TWorkflowParamExtra