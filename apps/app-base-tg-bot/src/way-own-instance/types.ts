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
  way?: string
  instanceId?: number
  instanceToken?: string
  instanceIp?: string
  instanceApiPort?: string
  instanceApiUrl?: string
  offerId?: number
  gpu: string
  geolocation: string
  inDataCenterOnly: string
  workflowId?: string
  workflowParams: Record<string, string | number | boolean>
  inputWaiting?: string
  // [key: string]: any
}
