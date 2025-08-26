import { Injectable } from '@nestjs/common'
// import { InjectBot } from 'nestjs-telegraf'
// import { Telegraf } from 'telegraf'

import { TelegramContext } from './types'

@Injectable()
export class SessionTgBotService {
  // constructor(
  //   @InjectBot() private readonly bot: Telegraf<TelegramContext>
  // ) {}

  initTgBotSession (ctx: TelegramContext) {
    if (!ctx.session) {
      ctx.session = {
        step: '__undefined__',
        gpuName: 'any',
        geolocation: 'any',
      }
    }
  }

  getTgBotSessionValue (ctx: TelegramContext, key: string) {
    return ctx.session[key]
  }

  setTgBotSessionValue (ctx: TelegramContext, key: string, value: any) {
    ctx.session[key] = value
  }
}