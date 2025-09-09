import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'
import { VastLibService } from '@libs/vast'

import { TelegramContext } from '../types'

import {
  ownInstanceOffersMenu
} from '../inline-keyboard'

@Injectable()
export class Act01SetSearchParamsOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
    private readonly vastlib: VastLibService,
  ) {
    this.bot.action('act:own-instance:search-offers', (ctx) => this.handleActOwnInstanceSearchOffers(ctx))
    this.bot.action(/^act:own-instance:offer:(.+)$/, (ctx) => this.handleActOwnInstanceOfferSelect(ctx))
  }

  private async handleActOwnInstanceSearchOffers(ctx: TelegramContext) {
    const gpu = ctx.session.gpuName
    const selectedGeo = ctx.session.geolocation
    const inDataCenterOnly = ctx.session.inDataCenterOnly

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

  private handleActOwnInstanceOfferSelect(ctx: TelegramContext) {
    const offerId = ctx.match?.[1]

    ctx.session.offerId = Number(offerId)

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
  }
}