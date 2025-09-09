import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
// import { Markup } from 'telegraf'

import { TelegramContext } from '../types'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

@Injectable()
export class BaseCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
  ) {
    this.bot.command('start', (ctx) => this.handleStart(ctx))
    this.bot.command('help', (ctx) => this.handleHelp(ctx))

    bot.use(async (ctx, next) => {
      if (ctx.callbackQuery) {
        console.log('🔥 Middleware for action:', ctx.callbackQuery)
      }

      return await next()
    })
  }

  private handleStart(ctx: TelegramContext) {
    const step = ctx.session.step || '__undefined__'

    if (step === 'start') {
      this.tgbotsrv.showMainMenu(ctx)
    } else if (['loading', 'running'].includes(step)) {
      this.tgbotsrv.showInstanceManageMenu(ctx)
    }
  }

  private handleHelp(ctx: TelegramContext) {
    ctx.reply(
      '/start — начать диалог',
      {
        parse_mode: 'Markdown',
        // ...Markup.removeKeyboard(),
      },
    )
  }
}
