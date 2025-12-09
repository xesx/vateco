import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { session } from 'telegraf'

import * as lib from '@lib'
import * as repo from '@repo'
// import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class MiddlewareTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly userrepo: repo.UserRepository,
    store: repo.TgBotSessionsStoreRepository,
  ) {
    bot.use(session({ store }))

    bot.use((ctx, next) => this.errorHandler(ctx, next))
    bot.use((ctx, next) => this.assertUserAuthorized(ctx, next))
    bot.use((ctx, next) => this.initSession(ctx, next))
  }

  async errorHandler (ctx, next) {
    try {
      return await next()
    } catch (err) {
      console.error('BaseCommandTgBot_bot_use_57 Error processing update:', err)

      await this.tgbotlib.safeAnswerCallback(ctx)
      return await ctx.reply(`An error occurred: ${err.message}`)
    }
  }

  async assertUserAuthorized (ctx, next) {
    const username = ctx.chat?.username

    console.log('----->>>>>>>action:', ctx.update?.callback_query?.data)

    // todo: remove this in production
    if (!['alexxxalart', 'alexxxiy'].includes(username)) {
      return ctx.reply('Access denied. You are not authorized to use this bot.')
    }

    await next()
  }

  private async initSession(ctx, next) {
    const { username, 'first_name': firstName, 'last_name': lastName, id: telegramId } = ctx.chat ?? {}

    ctx.session ??= {}

    if (!ctx.session?.userId) {
      ctx.session.userId = await this.userrepo.createUser({ telegramId, username, firstName, lastName })
    }

    ctx.session.telegramId = telegramId
    ctx.session.step ??= 'start'
    ctx.session.offer ??= {}

    ctx.session.offer.gpu ??= 'any'
    ctx.session.offer.geolocation ??= 'any'
    ctx.session.offer.inDataCenterOnly ??= 'false'

    // ctx.session.inputWaiting = undefined

    return await next()
  }
}
