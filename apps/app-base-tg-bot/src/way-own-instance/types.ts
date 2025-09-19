import { Context } from 'telegraf'

export interface OwnInstanceContext extends Context {
  session: SessionData
}

export interface OwnInstanceMatchContext extends OwnInstanceContext {
  match: RegExpMatchArray
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
  gpu: string
  geolocation: string
  inDataCenterOnly: string
  workflowId?: string
  workflowParams: Record<string, string | number | boolean>
  [key: string]: any
}
