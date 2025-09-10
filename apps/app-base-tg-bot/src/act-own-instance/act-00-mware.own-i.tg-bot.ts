import { Injectable } from '@nestjs/common'

import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'

import { TelegramContext } from '../types'

@Injectable()
export class Act00MwareOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
  ) {
    this.bot.action(/^act:own-instance(.*)$/, (ctx, next) => this.handleCommon(ctx, next))
    this.bot.hears('⬅️ Back', (ctx) => this.handleActOwnInstanceBack(ctx))
  }

  private handleActOwnInstanceBack(ctx: TelegramContext) {
    this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
  }

  private async handleCommon(ctx: TelegramContext, next: () => Promise<void>) {
    // console.log('\x1b[36m', 'ctx.callbackQuery', ctx.callbackQuery, '\x1b[0m')

    // if (ctx.callbackQuery) {
    //   const messageId = ctx.callbackQuery.message?.message_id
    //   const chatId = ctx.callbackQuery.message?.chat.id
    //
    //   if (messageId && chatId) {
    //     try {
    //       await this.tgbotlib.removeMessage({ chatId, messageId })
    //     } catch (error) {
    //       console.error('Failed to delete message:', error)
    //     }
    //   }
    // }

    return await next()
  }
}