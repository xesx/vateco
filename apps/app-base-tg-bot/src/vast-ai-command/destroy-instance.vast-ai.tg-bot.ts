import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastService } from '@libs/vast'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class DestroyInstanceVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('destroy', (ctx) => this.handleDestroyVastAiInstance(ctx))
    this.bot.action('action:instance:destroy', (ctx) => this.handleDestroyVastAiInstance(ctx))
  }

  @Step('loading', 'running')
  private async handleDestroyVastAiInstance(ctx: TelegramContext) {
    const instanceId = ctx.session.instanceId
    console.log('\x1b[36m', 'instanceId', instanceId, '\x1b[0m');

    const result = await this.vastService.destroyInstance({ instanceId })
    delete ctx.session.instanceId
    ctx.session.step = 'start'

    console.log('\x1b[36m', 'result', result, '\x1b[0m');

    ctx.reply('Instance destroyed:\n' + JSON.stringify(result))
    this.tgbotsrv.showSearchParamsMenu(ctx)
  }
}
