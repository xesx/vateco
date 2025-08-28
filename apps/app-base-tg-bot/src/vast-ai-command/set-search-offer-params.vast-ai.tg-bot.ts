import { Injectable, Inject } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SetSearchOfferParamsVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    @Inject() private readonly tgbotsrv: AppBaseTgBotService,
  ) {
    // Команда, чтобы показать меню
    // this.bot.command('start', (ctx) => this.handleSearchParams(ctx))
    this.bot.action('action:search:params', (ctx) => this.handleSearchParams(ctx))

    // Обработка нажатия кнопки "GPU name"
    this.bot.action('action:search:params:gpu', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx) // подтверждаем нажатие
      this.showGpuSelectionMenu(ctx)
    })

    // Обработка нажатия кнопки "Geolocation"
    this.bot.action('action:search:params:geolocation', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx) // подтверждаем нажатие
      this.showGeolocationSelectionMenu(ctx)
    })

    // Обработка нажатия кнопки "Закрыть"
    this.bot.action('action:search:params:close', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx)
      // ctx.editMessageText('Меню закрыто.')
    })

    // Обработка выбора GPU с использованием регулярного выражения
    this.bot.action(/^action:search:params:gpu:select:(.+)$/, (ctx) => {
      const gpuModel = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.gpuName = gpuModel

      this.tgbotsrv.safeAnswerCallback(ctx)
      // ctx.reply('Selected GPU: ' + gpuModel)
      this.showSearchParamsMenu(ctx)
    })

    // Обработка выбора геолокации с использованием регулярного выражения
    this.bot.action(/^action:search:params:geolocation:select:(.+)$/, (ctx) => {
      const geolocation = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.geolocation = geolocation

      this.tgbotsrv.safeAnswerCallback(ctx)
      // ctx.reply('Selected Geolocation: ' + geolocation)
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
      [[`GPU name (${ctx.session.gpuName})`, 'action:search:params:gpu']],
      [[`Geolocation (${ctx.session.geolocation})`, 'action:search:params:geolocation']],
      [[`Start search`, 'action:search:offers']],
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
        [['RTX 3060', 'action:search:params:gpu:select:RTX 3060']],
        [['RTX 3090', 'action:search:params:gpu:select:RTX 3090']],
        [['RTX 4090', 'action:search:params:gpu:select:RTX 4090']],
      ]),
    )
  }

  private showGeolocationSelectionMenu(ctx: TelegramContext) {
    ctx.editMessageText(
      'Select Geolocation:',
      this.tgbotsrv.generateInlineKeyboard([
        [['ALL WORLD', 'action:search:params:geolocation:select:any']],
        [['Europe', 'action:search:params:geolocation:select:europe']],
        [
          ['RU', 'action:search:params:geolocation:select:RU'],
          ['SE', 'action:search:params:geolocation:select:SE'],
          ['GB', 'action:search:params:geolocation:select:GB'],
          ['PL', 'action:search:params:geolocation:select:PL'],
          ['PT', 'action:search:params:geolocation:select:PT'],
          ['SI', 'action:search:params:geolocation:select:SI'],
          ['DE', 'action:search:params:geolocation:select:DE'],
          ['IT', 'action:search:params:geolocation:select:IT'],
        ],
        [
          ['LT', 'action:search:params:geolocation:select:LT'],
          ['GR', 'action:search:params:geolocation:select:GR'],
          ['FI', 'action:search:params:geolocation:select:FI'],
          ['IS', 'action:search:params:geolocation:select:IS'],
          ['AT', 'action:search:params:geolocation:select:AT'],
          ['FR', 'action:search:params:geolocation:select:FR'],
          ['RO', 'action:search:params:geolocation:select:RO'],
          ['MD', 'action:search:params:geolocation:select:MD'],
        ],
        [
          ['HU', 'action:search:params:geolocation:select:HU'],
          ['NO', 'action:search:params:geolocation:select:NO'],
          ['MK', 'action:search:params:geolocation:select:MK'],
          ['BG', 'action:search:params:geolocation:select:BG'],
          ['ES', 'action:search:params:geolocation:select:ES'],
        ],
        [
          ['CH', 'action:search:params:geolocation:select:CH'],
          ['HR', 'action:search:params:geolocation:select:HR'],
          ['NL', 'action:search:params:geolocation:select:NL'],
          ['CZ', 'action:search:params:geolocation:select:CZ'],
          ['EE', 'action:search:params:geolocation:select:EE'],
        ],
        [['North America', 'action:search:params:geolocation:select:north-america']],
        [
          ['US', 'action:search:params:geolocation:select:US'],
          ['CA', 'action:search:params:geolocation:select:CA'],
        ],
        [['South America', 'action:search:params:geolocation:select:south-america']],
        [
          ['BR', 'action:search:params:geolocation:select:BR'],
          ['AR', 'action:search:params:geolocation:select:AR'],
          ['CL', 'action:search:params:geolocation:select:CL'],
        ],
        [['Asia', 'action:search:params:geolocation:select:asia']],
        [
          ['CN', 'action:search:params:geolocation:select:CN'],
          ['JP', 'action:search:params:geolocation:select:JP'],
          ['KR', 'action:search:params:geolocation:select:KR'],
          ['ID', 'action:search:params:geolocation:select:ID'],
          ['IN', 'action:search:params:geolocation:select:IN'],
          ['HK', 'action:search:params:geolocation:select:HK'],
          ['MY', 'action:search:params:geolocation:select:MY'],
        ],
        [
          ['IL', 'action:search:params:geolocation:select:IL'],
          ['TH', 'action:search:params:geolocation:select:TH'],
          ['QA', 'action:search:params:geolocation:select:QA'],
          ['TR', 'action:search:params:geolocation:select:TR'],
          ['VN', 'action:search:params:geolocation:select:VN'],
        ],
        [
          ['TW', 'action:search:params:geolocation:select:TW'],
          ['OM', 'action:search:params:geolocation:select:OM'],
          ['SG', 'action:search:params:geolocation:select:SG'],
          ['AE', 'action:search:params:geolocation:select:AE'],
          ['KZ', 'action:search:params:geolocation:select:KZ'],
        ],
      ]),
    )
  }
}