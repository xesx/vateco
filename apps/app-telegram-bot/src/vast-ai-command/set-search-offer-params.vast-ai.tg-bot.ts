import { Injectable, Inject } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SetSearchOfferParamsVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    @Inject() private readonly tgbotsrv: AppTelegramBotService,
  ) {
    // Команда, чтобы показать меню
    this.bot.command('searchparams', (ctx) => this.handleSearchParams(ctx))

    // Обработка нажатия кнопки "GPU name"
    this.bot.action('action:gpu', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx) // подтверждаем нажатие
      this.showGpuSelectionMenu(ctx)
    })

    // Обработка нажатия кнопки "Geolocation"
    this.bot.action('action:geolocation', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx) // подтверждаем нажатие
      this.showGeolocationSelectionMenu(ctx)
    })

    // Обработка нажатия кнопки "Закрыть"
    this.bot.action('action:close', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx)
      // ctx.editMessageText('Меню закрыто.')
    })

    // Обработка выбора GPU с использованием регулярного выражения
    this.bot.action(/^action:gpuselect:(.+)$/, (ctx) => {
      const gpuModel = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.vastAi.searchParams.gpu = gpuModel

      this.tgbotsrv.safeAnswerCallback(ctx)
      ctx.reply('Selected GPU: ' + gpuModel)
      this.showSearchParamsMenu(ctx)
    })

    // Обработка выбора геолокации с использованием регулярного выражения
    this.bot.action(/^action:geolocationselect:(.+)$/, (ctx) => {
      const geolocation = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.vastAi.searchParams.geolocation = geolocation

      this.tgbotsrv.safeAnswerCallback(ctx)
      ctx.reply('Selected Geolocation: ' + geolocation)
      this.showSearchParamsMenu(ctx)
    })
  }

  @Step('start')
  private handleSearchParams(ctx: TelegramContext) {
    this.showSearchParamsMenu(ctx)
  }

  private showSearchParamsMenu(ctx: TelegramContext) {
    const message = 'Параметры поиска:'
    const keyboard = this.tgbotsrv.generateInlineKeyboard([
      [[`GPU name (${ctx.session.vastAi.searchParams.gpu})`, 'action:gpu']],
      [[`Geolocation (${ctx.session.vastAi.searchParams.geolocation})`, 'action:geolocation']],
      [['❌ Закрыть', 'action:close']],
    ])

    if (ctx.callbackQuery) {
      ctx.editMessageText(message, keyboard)
    } else {
      ctx.reply(message, keyboard)
    }
  }

  private showGpuSelectionMenu(ctx: TelegramContext) {
    ctx.editMessageText(
      'Select GPU:',
      this.tgbotsrv.generateInlineKeyboard([
        [['RTX 3060', 'action:gpuselect:RTX 3060']],
        [['RTX 3090', 'action:gpuselect:RTX 3090']],
        [['RTX 4090', 'action:gpuselect:RTX 4090']],
      ]),
    )
  }

  private showGeolocationSelectionMenu(ctx: TelegramContext) {
    ctx.editMessageText(
      'Select Geolocation:',
      this.tgbotsrv.generateInlineKeyboard([
        [['ALL WORLD', 'action:geolocationselect:any']],
        [['Europe', 'action:geolocationselect:europe']],
        [
          ['RU', 'action:geolocationselect:RU'],
          ['SE', 'action:geolocationselect:SE'],
          ['GB', 'action:geolocationselect:GB'],
          ['PL', 'action:geolocationselect:PL'],
          ['PT', 'action:geolocationselect:PT'],
          ['SI', 'action:geolocationselect:SI'],
          ['DE', 'action:geolocationselect:DE'],
          ['IT', 'action:geolocationselect:IT'],
        ],
        [
          ['LT', 'action:geolocationselect:LT'],
          ['GR', 'action:geolocationselect:GR'],
          ['FI', 'action:geolocationselect:FI'],
          ['IS', 'action:geolocationselect:IS'],
          ['AT', 'action:geolocationselect:AT'],
          ['FR', 'action:geolocationselect:FR'],
          ['RO', 'action:geolocationselect:RO'],
          ['MD', 'action:geolocationselect:MD'],
        ],
        [
          ['HU', 'action:geolocationselect:HU'],
          ['NO', 'action:geolocationselect:NO'],
          ['MK', 'action:geolocationselect:MK'],
          ['BG', 'action:geolocationselect:BG'],
          ['ES', 'action:geolocationselect:ES'],
        ],
        [
          ['CH', 'action:geolocationselect:CH'],
          ['HR', 'action:geolocationselect:HR'],
          ['NL', 'action:geolocationselect:NL'],
          ['CZ', 'action:geolocationselect:CZ'],
          ['EE', 'action:geolocationselect:EE'],
        ],
        [['North America', 'action:geolocationselect:north-america']],
        [
          ['US', 'action:geolocationselect:US'],
          ['CA', 'action:geolocationselect:CA'],
        ],
        [['South America', 'action:geolocationselect:south-america']],
        [
          ['BR', 'action:geolocationselect:BR'],
          ['AR', 'action:geolocationselect:AR'],
          ['CL', 'action:geolocationselect:CL'],
        ],
        [['Asia', 'action:geolocationselect:asia']],
        [
          ['CN', 'action:geolocationselect:CN'],
          ['JP', 'action:geolocationselect:JP'],
          ['KR', 'action:geolocationselect:KR'],
          ['ID', 'action:geolocationselect:ID'],
          ['IN', 'action:geolocationselect:IN'],
          ['HK', 'action:geolocationselect:HK'],
          ['MY', 'action:geolocationselect:MY'],
        ],
        [
          ['IL', 'action:geolocationselect:IL'],
          ['TH', 'action:geolocationselect:TH'],
          ['QA', 'action:geolocationselect:QA'],
          ['TR', 'action:geolocationselect:TR'],
          ['VN', 'action:geolocationselect:VN'],
        ],
        [
          ['TW', 'action:geolocationselect:TW'],
          ['OM', 'action:geolocationselect:OM'],
          ['SG', 'action:geolocationselect:SG'],
          ['AE', 'action:geolocationselect:AE'],
          ['KZ', 'action:geolocationselect:KZ'],
        ],
      ]),
    )
  }
}