import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastLibService } from '@libs/vast'

import { TgBotLibService } from '@libs/tg-bot'
import { MessageLibService } from '@libs/message'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { TelegramContext } from '../types'

@Injectable()
export class DestroyInstanceVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
    private readonly vastlib: VastLibService,
    private readonly msglib: MessageLibService,
  ) {
    this.bot.action('action:instance:destroy', (ctx) => this.handleDestroyVastAiInstance(ctx))
  }

  private async handleDestroyVastAiInstance(ctx: TelegramContext) {
    const instanceId = ctx.session.instanceId

    const result = await this.vastlib.destroyInstance({ instanceId })
    delete ctx.session.instanceId
    ctx.session.step = 'start'

    ctx.reply('Instance destroyed:\n' + JSON.stringify(result))
    this.tgbotlib.safeAnswerCallback(ctx)
    ctx.reply(this.msglib.genCodeMessage('Unpacking ComfyUI...'))
    this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
  }
}
