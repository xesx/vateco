import { Injectable } from '@nestjs/common'
// import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { TelegramContext } from './types'
// import { message } from 'telegraf/filters'

@Injectable()
export class AppBaseTgBotService {
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
  }

  showSearchParamsMenu(ctx: TelegramContext) {
    const message = 'Параметры поиска:'
    const keyboardDescription = [
      [[`GPU name (${ctx.session.gpuName})`, 'action:search:params:gpu']],
      [[`Geolocation (${ctx.session.geolocation})`, 'action:search:params:geolocation']],
      [[`Start search`, 'action:search:offers']],
    ] as [string, string][][]

    if (ctx.session.offerId) {
      keyboardDescription.push([[`Create instance`, 'action:instance:create']])
    }

    const keyboard = this.generateInlineKeyboard(keyboardDescription)

    if (ctx.callbackQuery) {
      ctx.editMessageText(message, keyboard)
    } else {
      ctx.reply(message, keyboard)
    }
  }

  showInstanceMenu(ctx: TelegramContext) {
    const message = 'Instance menu:'
    const keyboardDescription = [
      [[`Check instance status`, 'action:instance:show']],
      [[`Destroy instance`, 'action:instance:destroy']],
    ] as [string, string][][]

    const keyboard = this.generateInlineKeyboard(keyboardDescription)

    if (ctx.callbackQuery) {
      ctx.editMessageText(message, keyboard)
    } else {
      ctx.reply(message, keyboard)
    }
  }
}