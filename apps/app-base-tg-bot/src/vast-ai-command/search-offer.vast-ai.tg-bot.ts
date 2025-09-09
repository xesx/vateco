import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastLibService } from '@libs/vast'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'

import { TelegramContext } from '../types'

@Injectable()
export class SearchOfferVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
    private readonly vastlib: VastLibService,
  ) {
    this.bot.action('action:search:offers', (ctx) => this.handleSearchVastAiOffer(ctx))

    // Обработка выбора инстанса
    this.bot.action(/^action:search:offers:select:(.+)$/, (ctx) => {
      const offerId = ctx.match[1] // извлекаем часть после подчеркивания

      ctx.session.offerId = Number(offerId)

      this.tgbotlib.safeAnswerCallback(ctx)

      this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
    })
  }

  private async handleSearchVastAiOffer(ctx: TelegramContext) {
    const gpu = ctx.session.gpuName
    const selectedGeo = ctx.session.geolocation
    const inDataCenterOnly = ctx.session.inDataCenterOnly

    console.log('\x1b[36m', 'in handleSearchVastAiOffer', '\x1b[0m')

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
    const keyboard = this.tgbotlib.generateInlineKeyboard(
      offers.map(o => {
        return [
          [
            `${o?.num_gpus}x ${o.gpu_name}`,
            (o.geolocation?.split(',')?.[1] || o.geolocation || 'N/A')?.trim?.(),
            o.dph_total.toFixed(2) + '$',
            `cuda ${o.cuda_max_good} `,
            `[${o.reliability2?.toFixed?.(2)}]`
          ].join(' '),
          `action:search:offers:select:${o.id}`
        ]
      }).concat([
        ['🔄 Refresh', 'action:search:offers'],
        ['⬅️ Back', 'action:search:params']
      ])
    )


    // await this.tgbotlib.sendInlineKeyboard({ chatId: ctx.chat.id, keyboard })
    this.tgbotlib.safeAnswerCallback(ctx)
    if (ctx.callbackQuery) {
      ctx.editMessageText(message, keyboard)
    } else {
      ctx.reply(message, keyboard)
    }
  }
}
