import { Injectable } from '@nestjs/common'
import { Context, Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

@Injectable()
export class MenuCallbackTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {
    // Команда, чтобы показать меню
    this.bot.command('menu', (ctx) => {
      ctx.reply(
        'Выберите действие:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔍 Поиск', 'action:search')],
          [Markup.button.callback('⚙️ Настройки', 'action:settings')],
          [Markup.button.callback('❌ Закрыть', 'action:close')],
        ]),
      )
    })

    // Обработка нажатий
    this.bot.action('action:search', (ctx) => {
      ctx.answerCbQuery() // подтверждаем нажатие
      ctx.reply('🔍 Запускаю поиск...')
    })

    this.bot.action('action:settings', (ctx) => {
      ctx.answerCbQuery()
      ctx.reply('⚙️ Настройки пока недоступны.')
    })

    this.bot.action('action:close', (ctx) => {
      ctx.answerCbQuery()
      ctx.editMessageText('Меню закрыто.')
    })
  }
}