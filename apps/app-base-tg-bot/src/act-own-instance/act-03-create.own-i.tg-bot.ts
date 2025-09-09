import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'
import { VastLibService } from '@libs/vast'

import { TelegramContext } from '../types'

@Injectable()
export class Act03CreateOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
    private readonly vastlib: VastLibService,
  ) {
    this.bot.action('act:own-instance:create', (ctx) => this.handleActOwnInstanceCreate(ctx))
  }

  private async handleActOwnInstanceCreate(ctx: TelegramContext) {
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