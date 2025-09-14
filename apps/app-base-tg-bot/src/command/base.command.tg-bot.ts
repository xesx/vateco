import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { TelegramContext } from '../types'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

@Injectable()
export class BaseCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
  ) {
    bot.use(async (ctx, next) => {
      this.initSession(ctx)
      return await next()
    })

    this.bot.command('start', (ctx, next) => this.handleStart(ctx, next))
    this.bot.command('menu', (ctx, next) => this.handleStart(ctx, next))
    this.bot.action('act:main-menu', (ctx, next) => this.handleStart(ctx, next))
  }

  private initSession(ctx: TelegramContext) {
    ctx.session.lastTimestamp = Date.now()
    ctx.session.chatId ??= ctx.chat?.id || -1
    ctx.session.step ??= 'start'
  }
  private handleStart(ctx: TelegramContext, next) {
    const step = ctx.session.step || '__undefined__'

    if (step === 'start') {
      this.tgbotsrv.showMainMenu(ctx)
    } else {
      return next()
    }
  }
}
