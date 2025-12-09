import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
// import * as repo from '@repo'
import * as kb from '@kb'

@Injectable()
export class OfferViewSynthService {
  private readonly l = new Logger(OfferViewSynthService.name)

  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    // private readonly msglib: lib.MessageLibService,
  ) {}

  async showOfferMenu (ctx) {
    const message = 'Search parameters:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceOfferParamsMenu(ctx.session.offer || {}))

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async showOfferParamMenu ({ ctx, offerParamName }: { ctx?: any, offerParamName: string }) {
    const menuMap = {
      'gpu': kb.OWN_INSTANCE_GPU_MENU,
      'geolocation': kb.OWN_INSTANCE_GEOLOCATION_MENU,
      'inDataCenterOnly': kb.OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU,
    }

    console.log('\x1b[36m', 'offerParamName', offerParamName, '\x1b[0m')
    const keyboard = this.tgbotlib.generateInlineKeyboard(menuMap[offerParamName])
    const message = `Select "${offerParamName}":`

    await this.tgbotlib.reply(ctx, message, keyboard)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async showOffersList ({ ctx, offers }: { ctx?: any, offers: any[] }) {
    const message = 'Search results:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceOffersMenu(offers))

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }
}
