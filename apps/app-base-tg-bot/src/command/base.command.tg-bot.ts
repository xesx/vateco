import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { session } from 'telegraf'
import { message } from 'telegraf/filters'

import * as repo from '@repo'

import { TAppBaseTgBotContext } from '../types'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

@Injectable()
export class BaseCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly userrepo: repo.UserRepository,
    store: repo.TgBotSessionsStoreRepository,
  ) {
    bot.use(session({ store }))

    bot.use(async (ctx, next) => {
      // @ts-expect-error todo
      const { username } = ctx.chat ?? {}

      // todo: remove this in production
      if (!['alexxxalart', 'alexxxiy'].includes(username)) {
        return ctx.reply('Access denied. You are not authorized to use this bot.')
      }

      if (!ctx.session?.userId) {
        await this.initSession(ctx)
      }


      return await next()
    })

    this.bot.command('start', (ctx, next) => this.handleStart(ctx, next))
    this.bot.action('act:main-menu', (ctx) => this.tgbotsrv.actionMainMenu(ctx))

    this.bot.on(message('text'), (ctx, next) => this.tgbotsrv.textMessage(ctx, next))
  }

  private async initSession(ctx) {
    const { username, 'first_name': firstName, 'last_name': lastName, id: telegramId } = ctx.chat ?? {}

    const userId = await this.userrepo.createUser({ telegramId, username, firstName, lastName })

    ctx.session ??= {}

    ctx.session.userId = userId
    ctx.session.telegramId = telegramId
    ctx.session.step ??= 'start'
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
