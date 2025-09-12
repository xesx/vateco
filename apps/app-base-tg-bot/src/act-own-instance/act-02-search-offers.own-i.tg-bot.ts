import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'

import { CommonOwnITgBot } from './common.own-i.tg-bot'
import { OwnInstanceContext, OwnInstanceMatchContext } from './types'

import {
  ownInstanceOffersMenu
} from '@kb'

@Injectable()
export class Act02SearchOffersOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly common: CommonOwnITgBot,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
  ) {
    this.bot.action('act:own-instance:search-offers', (ctx) => this.handleActOwnInstanceSearchOffers(ctx))
    this.bot.action(/^act:own-instance:offer:(.+)$/, (ctx) => this.handleActOwnInstanceOfferSelect(ctx))
  }

  private async handleActOwnInstanceSearchOffers(ctx: OwnInstanceContext) {
    const gpu = ctx.session.gpu
    const selectedGeo = ctx.session.geolocation
    const inDataCenterOnly = ctx.session.inDataCenterOnly === 'true'

    let geolocation: string[] | undefined

    if (selectedGeo.length === 2) {
      geolocation = [selectedGeo]
    } else if (selectedGeo === 'europe') {
      geolocation = ['RU', 'SE', 'GB', 'PL', 'PT', 'SI', 'DE', 'IT']
    } else if (selectedGeo === 'north-america') {
      geolocation = ['US', 'CA']
    }

    const result = await this.vastlib.importOffers({ gpu, geolocation, inDataCenterOnly })
    const offers = result.offers

    const message = 'Результаты поиска:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceOffersMenu(offers))


    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  private handleActOwnInstanceOfferSelect(ctx: OwnInstanceMatchContext) {
    const offerId = ctx.match[1]

    ctx.session.offerId = Number(offerId)

    this.tgbotlib.safeAnswerCallback(ctx)
    this.common.showInstanceCreateMenu(ctx)
  }
}