import { Injectable } from '@nestjs/common'
// import { InjectBot } from 'nestjs-telegraf'

// import { Telegraf } from 'telegraf'
import { TelegramContext } from './types'
// import { message } from 'telegraf/filters'

@Injectable()
export class AppTelegramBotService {
  // constructor(
  //   @InjectBot() private readonly bot: Telegraf<TelegramContext>
  // ) {}

  safeAnswerCallback(ctx: TelegramContext, text?: string) {
    try {
      ctx.answerCbQuery(text)
    } catch (error) {
      // Игнорируем ошибки timeout для answerCbQuery
      if (!error.message?.includes('query is too old')) {
        console.error('AnswerCbQuery error:', error)
      }
    }
  }
}