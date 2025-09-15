import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'

import { CommonOwnITgBot } from './common.own-i.tg-bot'
import { OwnInstanceContext } from './types'

@Injectable()
export class Act03CreateOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly common: CommonOwnITgBot,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
  ) {
    this.bot.action('act:own-i:create', (ctx) => this.handleActOwnInstanceCreate(ctx))
  }

  private async handleActOwnInstanceCreate(ctx: OwnInstanceContext) {
    const step = ctx.session.step
    const offerId = ctx.session.offerId

    if (!offerId || step !== 'start') {
      ctx.reply('Error way', { offerId, step } as any)
      return
    }

    const result = await this.vastlib.createInstance({
      offerId,
      env: {
        'TG_CHAT_ID': ctx.chat?.id.toString(),
        'COMFY_UI_ARCHIVE_FILE': 'comfyui-portable-cu128-py312-v0.tar.zst', // todo: make it configurable
      },
    })

    ctx.session.step = 'loading'
    ctx.session.instanceId = result.new_contract

    this.common.showInstanceManageMenu(ctx)
  }
}