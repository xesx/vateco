import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { VastService } from '@libs/vast'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SearchVastAiOfferCallbackTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppTelegramBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('search', (ctx) => this.handleSearchVastAiOffer(ctx))

    // Обработка выбора инстанса
    this.bot.action(/^action:select_vast_offer:(.+)$/, (ctx) => {
      const offerId = ctx.match[1] // извлекаем часть после подчеркивания

      console.log('\x1b[36m', 'offerId', offerId, '\x1b[0m');

      ctx.session.vastAi.instance.offerId = Number(offerId)

      this.tgbotsrv.safeAnswerCallback(ctx)
      ctx.reply('Selected offer Id: ' + offerId)
      // this.showSearchParamsMenu(ctx)
    })
  }

  @Step('start')
  private async handleSearchVastAiOffer(ctx: TelegramContext) {
    const gpu = ctx.session.vastAi.searchParams.gpu
    const selectedGeo = ctx.session.vastAi.searchParams.geolocation

    let geolocation: string[] | undefined

    if (selectedGeo.length === 2) {
      geolocation = [selectedGeo]
    } else if (selectedGeo === 'europe') {
      geolocation = ['RU', 'SE', 'GB', 'PL', 'PT', 'SI', 'DE', 'IT']
    }

    const result = await this.vastService.importOffers({ gpu, geolocation })
    const offers = result.offers

    const message = 'Результаты поиска:'
    const keyboard = Markup.inlineKeyboard(
      offers.map(o => {
        return [Markup.button.callback(
          [
            `${o.num_gpus}x ${o.gpu_name}`,
            o.geolocation,
            o.dph_total.toFixed(2) + '$',
            `cuda ${o.cuda_max_good}`,
            `rel${o.reliability2?.toFixed?.(2)}`
          ].join(' '),
          `action:select_vast_offer:${o.id}`)
        ]
      })
    )

    if (ctx.callbackQuery) {
      ctx.editMessageText(message, keyboard)
    } else {
      ctx.reply(message, keyboard)
    }
  }
}
