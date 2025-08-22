import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { TelegramContext } from '../types'

@Injectable()
export class StartCommandTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<TelegramContext>) {
    this.bot.command('start', (ctx) => {
      console.log('\x1b[36m', 'ctx.session', ctx.session, '\x1b[0m')
      ctx.session.counter = ctx.session.counter || 0
      ctx.session.counter++
      ctx.reply(
        '🚀 Привет! Я — Telegram-бот на NestJS.\n' +
        'Используй /help, чтобы увидеть список команд.',
        {
          parse_mode: 'Markdown',
        },
      )
    })
  }
}