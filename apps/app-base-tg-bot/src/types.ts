import { Context } from 'telegraf'

export interface TelegramContext extends Context {
  session: SessionData
  match?: RegExpMatchArray
}

export interface SessionData {
  chatId: number
  step?: string
  lastTimestamp: number
  [key: string]: any
}
