import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { VastService } from '@libs/vast'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class DestroyVastAiInstanceCallbackTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppTelegramBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('destroy', (ctx) => this.handleDestroyVastAiInstance(ctx))
  }

  @Step('rent')
  private async handleDestroyVastAiInstance(ctx: TelegramContext) {
    const instanceId = ctx.session.vastAi.instance.id
    console.log('\x1b[36m', 'instanceId', instanceId, '\x1b[0m');

    const result = await this.vastService.destroyInstance({ instanceId })
    ctx.session.vastAi.instance = {}
    ctx.session.step = 'start'

    console.log('\x1b[36m', 'result', result, '\x1b[0m');

    ctx.reply('Instance destroyed:\n' + JSON.stringify(result))
  }
}
