import { Context } from 'telegraf'

export interface TAppBaseTgBotContext extends Context {
  session: SessionData
  match?: RegExpMatchArray
}

export interface SessionData {
  telegramId: number
  userId: number
  step?: string
  // [key: string]: any
}
