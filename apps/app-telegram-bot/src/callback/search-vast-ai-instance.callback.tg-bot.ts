import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { VastService } from '@libs/vast'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SearchVastAiInstanceCallbackTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly appTelegramBotService: AppTelegramBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('search', (ctx) => this.handleSearch(ctx))
  }

  @Step('start')
  private async handleSearch(ctx: TelegramContext) {
    const gpu = ctx.session.vastAi.searchParams.gpu
    const selectedGeo = ctx.session.vastAi.searchParams.geolocation

    let geolocation: string[] | undefined

    if (selectedGeo.length === 2) {
      geolocation = [selectedGeo]
    } else if (selectedGeo === 'europe') {
      geolocation = ['RU', 'SE', 'GB', 'PL', 'PT', 'SI', 'DE', 'IT']
    }

    const result = await this.vastService.importOffers({ gpu, geolocation })
    // console.log(result.offers.map(i => ({gpu_name, geolocation})))
    const offers = result.offers.sort((a, b) => a.dph_total - b.dph_total)

    const message = 'Результаты поиска:'
    const keyboard = Markup.inlineKeyboard(
      offers.map(o => {
        return [Markup.button.callback(
          [
            `${o.num_gpus}x ${o.gpu_name}`,
            o.geolocation,
            o.dph_total.toFixed(2) + '$',
            `cuda ${o.cuda_max_good}`,
          ].join(' '),
          // `${o.geolocation} ${o.dph_total}`,
          `action:select_vast_inctance:${o.id}`)
        ]
      })
    )

    if (ctx.callbackQuery) {
      ctx.editMessageText(message, keyboard)
    } else {
      ctx.reply(message, keyboard)
    }
    // console.log(JSON.stringify(offers.offers[0], null, 4))
    // this.showSearchParamsMenu(ctx)
  }

  // private showSearchParamsMenu(ctx: TelegramContext) {
  //   const message = 'Параметры поиска:'
  //   const keyboard = Markup.inlineKeyboard([
  //     [Markup.button.callback(`GPU name (${ctx.session.vastAi.searchParams.gpu})`, 'action:gpu')],
  //     [Markup.button.callback(`Geolocation (${ctx.session.vastAi.searchParams.geolocation})`, 'action:geolocation')],
  //     [Markup.button.callback('❌ Закрыть', 'action:close')],
  //   ])
  //
  //   if (ctx.callbackQuery) {
  //     ctx.editMessageText(message, keyboard)
  //   } else {
  //     ctx.reply(message, keyboard)
  //   }
  // }
}
