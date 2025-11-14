import { Context } from 'telegraf'
import type {
  // CallbackQuery,
  // CommonMessageBundle,
  // Message,
  // CallbackQueryUpdate,
  Update,
} from '@telegraf/types'

export interface OwnInstanceContext extends Context {
  session: SessionData
}

export interface OwnInstanceMatchContext extends OwnInstanceContext {
  match: RegExpMatchArray
  update: Update.CallbackQueryUpdate
}

export interface Offer {
  id?: string
  gpu?: string
  geolocation?: string
  inDataCenterOnly?: string
  // [key: string]: any
}

export interface SessionData {
  telegramId: number
  userId: number
  step: string
  offer?: Offer
  way?: string
  instanceId?: number
  instanceToken?: string
  instanceIp?: string
  instanceApiPort?: string
  instanceApiUrl?: string
  // offerId?: number
  // gpu: string
  // geolocation: string
  // inDataCenterOnly: string
  workflowId?: string
  workflowParams: Record<string, string | number | boolean>
  inputWaiting?: string
  // [key: string]: any
}
