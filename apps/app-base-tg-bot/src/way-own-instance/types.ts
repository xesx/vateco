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

export interface Instance {
  id: number
  token?: string
  ip?: string
  apiPort?: string
  apiUrl?: string
  modelInfoLoaded?: string[]
  // [key: string]: any
}

export interface SessionData {
  telegramId: number
  userId: number
  step: string
  offer?: Offer
  instance?: Instance
  way?: string
  workflowVariantId?: number
  inputWaiting?: string
  // [key: string]: any
}
