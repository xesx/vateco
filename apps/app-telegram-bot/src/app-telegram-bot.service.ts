import { Injectable } from '@nestjs/common'
// import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

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

  generateInlineKeyboard (options: [string, string][][]){
    // Пример генерации клавиатуры
    return Markup.inlineKeyboard(
      options.map(row =>
        row.map(([label, action]) =>
          Markup.button.callback(label, action)
        )
      )
    )
    // Пример жестко закодированной клавиатуры
    // return Markup.inlineKeyboard([
    //   [Markup.button.callback('RTX 3060', 'action:gpuselect:RTX 3060')],
    //   [Markup.button.callback('RTX 3090', 'action:gpuselect:RTX 3090')],
    //   [Markup.button.callback('RTX 4090', 'action:gpuselect:RTX 4090')],
    // ])
  }
}