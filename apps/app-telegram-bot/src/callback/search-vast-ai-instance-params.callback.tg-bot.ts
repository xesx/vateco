import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { TelegramContext } from '../types'

@Injectable()
export class SearchVastAiInstanceParamsCallbackTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<TelegramContext>) {
    // Команда, чтобы показать меню
    this.bot.command('searchparams', (ctx) => {
      ctx.reply(
        'Параметры поиска:',
        Markup.inlineKeyboard([
          [Markup.button.callback('GPU name', 'action:gpu')],
          // [Markup.button.callback('⚙️ Настройки', 'action:settings')],
          [Markup.button.callback('❌ Закрыть', 'action:close')],
        ]),
      )
    })

    // Обработка нажатий
    this.bot.action('action:gpu', (ctx) => {
      this.bot.action(/^action:gpuselect_(.+)$/, (ctx) => {
        const gpuModel = ctx.match[1] // извлекаем часть после подчеркивания
        console.log('Выбранная модель GPU:', gpuModel)

        ctx.answerCbQuery()
        ctx.reply('⚙️ Настройки пока недоступны.')
      })

      ctx.answerCbQuery() // подтверждаем нажатие
      ctx.reply(
        'Select GPU:',
        Markup.inlineKeyboard([
          [Markup.button.callback('RTX 3060', 'action:gpuselect_3060')],
          [Markup.button.callback('RTX 3090', 'action:gpuselect_3090')],
          [Markup.button.callback('RTX 4090', 'action:gpuselect_4000')],
        ]),
      )
    })

    // this.bot.action('action:settings', (ctx) => {
    //   ctx.answerCbQuery()
    //   ctx.reply('⚙️ Настройки пока недоступны.')
    // })

    this.bot.action('action:close', (ctx) => {
      ctx.answerCbQuery()
      ctx.editMessageText('Меню закрыто.')
    })
  }
}