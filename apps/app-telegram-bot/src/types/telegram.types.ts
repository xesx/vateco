import { Context } from 'telegraf'

export interface TelegramContext extends Context {
  session: SessionData
}

export interface BotCommand {
  command: string
  description: string
}

export interface CallbackData {
  action: string
  data?: any
}

export interface SessionData {
  step?: string
  userId?: number
  counter?: number
  vastAi: {
    instance: any
    searchParams: {
      gpu: string
      geolocation: string
      [key: string]: any
    }
  }
}
