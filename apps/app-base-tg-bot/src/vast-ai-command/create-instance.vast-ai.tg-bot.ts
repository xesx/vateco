import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastLibService } from '@libs/vast'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class CreateInstanceVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
    private readonly vastlib: VastLibService,
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

    const result = await this.vastlib.createInstance({
      offerId,
      env: {
        'TG_CHAT_ID': ctx.chat?.id.toString(),
        'COMFY_UI_ARCHIVE_FILE': 'comfyui-portable-cu128-py312-v0.tar.zst',
      },
    })

    ctx.session.step = 'loading'
    ctx.session.instanceId = result.new_contract

    ctx.reply('Instance creation initiated.')
    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotsrv.showInstanceManageMenu(ctx)
  }
}
