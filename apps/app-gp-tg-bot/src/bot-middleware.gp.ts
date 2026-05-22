import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { session } from 'telegraf'

import * as lib from '@lib'
import * as repo from '@repo'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class BotMiddlewareGp {
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
      console.error('BotMiddlewareGp_errorHandler_57 Error processing update:', err)

      await this.tgbotlib.safeAnswerCallback(ctx)
      return await ctx.reply(`An error occurred: ${err.message.slice(0, 300)}...`)
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
    const { username, 'first_name': firstName, 'last_name': lastName, id: chatId } = ctx.chat ?? {}

    ctx.session ??= {}

    if (!ctx.session?.userId) {
      ctx.session.userId = await this.userrepo.createUser({ telegramId: chatId, username, firstName, lastName })
    }

    ctx.session.chatId = chatId

    return await next()
  }
}
