export type TWorkflow = {
  models: string[]
  name: string
  params: Record<string, TWorkflowParam>
  schema: Record<string, any>
}

export type TWorkflowParamCommon = {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'integer'
  default?: any
  description: string
  label: string
  enum?: any[]
  compile?: (params: Record<string, any>) => any
}

export type TWorkflowParamExtra = {
  user?: boolean
  value?: any
  advanced?: boolean
}

export type TWorkflowParam = TWorkflowParamCommon & TWorkflowParamExtra