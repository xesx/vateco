import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { TelegramContext } from '../types'
import { Step } from '../step.decorator'


@Injectable()
export class BaseCommandTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<TelegramContext>) {
    this.bot.command('start', (ctx) => this.handleStart(ctx))
    this.bot.command('help', (ctx) => this.handleHelp(ctx))
    // this.bot.command('next', (ctx) => this.handleNext(ctx))
  }

  @Step('__undefined__', '_test')
  private handleStart(ctx: TelegramContext) {
    ctx.session.counter = ctx.session.counter || 0
    ctx.session.counter++
    ctx.session.step = 'start'
    ctx.reply(
      '🚀 Привет! Я — Telegram-бот на NestJS.\n' +
      'Используй /help, чтобы увидеть список команд.',
      {
        parse_mode: 'Markdown',
      },
    )
  }

  private handleHelp(ctx: TelegramContext) {
    ctx.reply(
      '*Доступные команды:*\n' +
      '/start — начать диалог\n' +
      '/help — это сообщение\n' +
      '/searchparams\n' +
      '/search\n' +
      '/create\n' +
      '/show\n' +
      '/destroy\n' +
      '/test — показать меню',
      {
        parse_mode: 'Markdown',
        ...Markup.removeKeyboard(),
      },
    )
  }

  // @Step('started', 'processing')
  // private handleNext(ctx: TelegramContext) {
  //   ctx.session.step = 'completed'
  //   ctx.reply('✅ Следующий шаг выполнен.')
  // }
}
