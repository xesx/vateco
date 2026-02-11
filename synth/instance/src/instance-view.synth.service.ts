import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
// import * as repo from '@repo'
import * as kb from '@kb'

@Injectable()
export class InstanceViewSynthService {
  private readonly l = new Logger(InstanceViewSynthService.name)

  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
  ) {}

  async showOfferMenu (ctx) {
    const message = 'Search parameters:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceOfferParamsMenu(ctx.session.offer || {}))

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async showInstanceCreateMenu({ ctx, offerId }: { ctx?: any; offerId: string }) {
    const message = 'Now you can create your own instance ⤵️'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceCreateMenu(offerId))

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async showInstanceManageMenu ({ ctx, chatId }: { ctx?: any; chatId?: string }) {
    const message = 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceManageMenu())

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: keyboard })
  }

  async showInstanceStatus ({ ctx, instanceId, status, state, gpu, startDate, durationInHrs, appsMenuLink, comfyuiLink, jupyterLink }:
    { ctx: any, instanceId: string; status: string; state: string; gpu: string; startDate: string; durationInHrs: string; appsMenuLink: string, comfyuiLink: string; jupyterLink: string }) {
    const message = this.msglib.generateMessage({
      type: 'instance-status',
      data: { instanceId, status, state, gpu, startDate, durationInHrs, appsMenuLink, comfyuiLink, jupyterLink },
    })

    await this.tgbotlib.safeAnswerCallback(ctx)
    const keyboard = this.tgbotlib.generateInlineKeyboard([
      [[`⬅️ Back`, 'instance:manage'], [`🔄 Refresh`, 'instance:status']],
    ])

    await this.tgbotlib.reply(ctx, message, { parse_mode: 'HTML', ...keyboard })
  }
}
