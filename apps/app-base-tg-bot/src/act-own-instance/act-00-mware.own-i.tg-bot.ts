import { Injectable } from '@nestjs/common'

import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

// import * as lib from '@lib'

// import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { TelegramContext } from '../types'

@Injectable()
export class Act00MwareOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
  ) {
    this.bot.action(/^act:own-instance(.*)$/, (ctx, next) => this.handleCommonAction(ctx, next))
  }

  private async handleCommonAction(ctx: TelegramContext, next: () => Promise<void>) {
    // Common pre-processing for all own-instance actions can be done here
    // For example, logging, session validation, etc.
    // console.log(`Handling action: ${ctx.match[0]}`)
    return await next()
  }
}