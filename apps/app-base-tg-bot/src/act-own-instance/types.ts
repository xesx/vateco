import { Context } from 'telegraf'

export interface OwnInstanceContext extends Context {
  session: SessionData
  match?: RegExpMatchArray
}

export interface SessionData {
  chatId: number
  step: string
  instanceId?: number
  instanceToken?: string
  instanceIp?: string
  instanceComfyuiPort?: string
  instanceRclonePort?: string
  instanceApiPort?: string
  offerId?: number
  gpuName: string
  geolocation: string
  inDataCenterOnly: boolean
  workflowId?: string
  workflowParams: Record<string, string | number | boolean>
  [key: string]: any
}
