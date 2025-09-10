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
    const step = ctx.session.step
    const offerId = ctx.session.offerId
    const instanceId = ctx.session.instanceId

    if (!instanceId) {
      if (!offerId || step !== 'start') {
        ctx.reply('Error way', { offerId, step } as any)
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
    }

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotsrv.showInstanceManageMenu(ctx)
  }
}