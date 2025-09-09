import { Context } from 'telegraf'

export interface TelegramContext extends Context {
  session: SessionData
  match?: RegExpMatchArray
}

export interface BotCommand {
  command: string
  description: string
}

export interface CallbackData {
  action: string
  data?: any
}

export type VastAiInstance = {
  id?: number
  offerId?: number
  [key: string]: any
}

export interface SessionData {
  step?: string
  instanceId?: number
  instanceToken?: string
  instanceIp?: string
  instanceComfyuiPort?: string
  instanceRclonePort?: string
  offerId?: number
  gpuName: string
  geolocation: string
  inDataCenterOnly: boolean
  [key: string]: number | string | boolean | undefined
}
