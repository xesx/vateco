import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastService } from '@libs/vast'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class CreateInstanceVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('create', (ctx) => this.handleCreateVastAiInstance(ctx))
    this.bot.action('action:instance:create', (ctx) => this.handleCreateVastAiInstance(ctx))
  }

  @Step('start')
  private async handleCreateVastAiInstance(ctx: TelegramContext) {
    const offerId = ctx.session.offerId

    if (!offerId) {
      ctx.reply('No instance selected. Use /search to find an instance first.')
      return
    }

    const result = await this.vastService.createInstance({
      offerId,
      env: {
        'TG_CHAT_ID': ctx.chat?.id.toString(),
      },
    })

    ctx.session.step = 'loading'
    ctx.session.instanceId = result.new_contract

    console.log('\x1b[36m', 'result', result, '\x1b[0m');

    ctx.reply('Instance creation initiated.')
    this.tgbotsrv.safeAnswerCallback(ctx)
    this.tgbotsrv.showInstanceMenu(ctx)
  }
}
