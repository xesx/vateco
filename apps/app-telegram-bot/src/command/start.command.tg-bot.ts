import { Injectable } from '@nestjs/common'
import { Context, Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

@Injectable()
export class StartCommandTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {
    this.bot.command('start', (ctx) => {
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