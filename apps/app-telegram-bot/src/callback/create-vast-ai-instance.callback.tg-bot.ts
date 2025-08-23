import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { VastService } from '@libs/vast'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class CreateVastAiInstanceCallbackTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppTelegramBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('create', (ctx) => this.handleCreateVastAiInstance(ctx))
  }

  @Step('start')
  private async handleCreateVastAiInstance(ctx: TelegramContext) {
    const offerId = ctx.session.vastAi.instance?.offerId

    if (!offerId) {
      ctx.reply('No instance selected. Use /search to find an instance first.')
      return
    }

    const result = await this.vastService.createInstance({ offerId })
    ctx.session.step = 'rent'
    ctx.session.vastAi.instance.id = result.new_contract

    console.log('\x1b[36m', 'result', result, '\x1b[0m');

    ctx.reply('Instance creation initiated. Check your Vast.ai dashboard for details.' + JSON.stringify(result))
    // if (ctx.callbackQuery) {
    //   ctx.editMessageText(message, keyboard)
    // } else {
    //   ctx.reply(message, keyboard)
    // }
    // console.log(JSON.stringify(offers.offers[0], null, 4))
    // this.showSearchParamsMenu(ctx)
  }
}
