import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { session } from 'telegraf'

import * as repo from '@repo'

import { TAppBaseTgBotContext } from '../types'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

@Injectable()
export class BaseCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    store: repo.TgBotSessionStoreRepository,
  ) {
    bot.use(session({ store }))

    bot.use(async (ctx, next) => {
      // @ts-expect-error todo
      const username = ctx.chat?.username

      // todo: remove this in production
      if (!['alexxxalart', 'alexxxiy'].includes(username)) {
        return ctx.reply('Access denied. You are not authorized to use this bot.')
      }

      this.initSession(ctx)
      return await next()
    })

    this.bot.command('start', (ctx, next) => this.handleStart(ctx, next))
    this.bot.action('act:main-menu', (ctx) => this.tgbotsrv.actionMainMenu(ctx))
  }

  private initSession(ctx: TAppBaseTgBotContext) {
    ctx.session ??= {
      lastTimestamp: Date.now(),
      chatId: ctx.chat?.id || -1,
      step: 'start',
    }

    ctx.session.lastTimestamp = Date.now()
  }

  private handleStart(ctx: TAppBaseTgBotContext, next) {
    const step = ctx.session.step || '__undefined__'

    if (step === 'start') {
      this.tgbotsrv.showMainMenu(ctx)
    } else {
      return next()
    }
  }
}
