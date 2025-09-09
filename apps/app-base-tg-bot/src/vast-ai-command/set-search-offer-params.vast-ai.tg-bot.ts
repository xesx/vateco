import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'

import { TelegramContext } from '../types'

@Injectable()
export class SetSearchOfferParamsVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
  ) {
    // Команда, чтобы показать меню параметров поиска
    this.bot.action('act:own-instance', (ctx) => this.handleActOwnInstance(ctx))
    this.bot.action('act:own-instance:search-params', (ctx) => this.handleActOwnInstanceSearchParams(ctx))
    this.bot.action('act:own-instance:search-params:gpu', (ctx) => this.handleActOwnInstanceSearchParamsGpu(ctx))
    this.bot.action('act:own-instance:search-params:geolocation', (ctx) => this.handleActOwnInstanceSearchParamsGeolocation(ctx))
    this.bot.action('act:own-instance:search-params:in-data-center-only', (ctx) => this.handleActOwnInstanceSearchParamsInDataCenterOnly(ctx))

    // ----------------------------

    // Обработка выбора GPU с использованием регулярного выражения
    this.bot.action(/^action:search:params:gpu:select:(.+)$/, (ctx) => {
      const gpuModel = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.gpuName = gpuModel

      this.tgbotlib.safeAnswerCallback(ctx)
      this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
    })

    // Обработка выбора геолокации с использованием регулярного выражения
    this.bot.action(/^action:search:params:geolocation:select:(.+)$/, (ctx) => {
      const geolocation = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.geolocation = geolocation

      this.tgbotlib.safeAnswerCallback(ctx)
      this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
    })

    // Обработка выбора флага "In data center only"
    this.bot.action(/^action:search:params:in-data-center-only:select:(.+)$/, (ctx) => {
      const inDataCenterOnly = ctx.match[1] === 'true'
      ctx.session.inDataCenterOnly = inDataCenterOnly
      this.tgbotlib.safeAnswerCallback(ctx)
      this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
    })
  }

  private handleActOwnInstance(ctx: TelegramContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
  }

  private handleActOwnInstanceSearchParams(ctx: TelegramContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsGpu(ctx: TelegramContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.showGpuSelectionMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsGeolocation(ctx: TelegramContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.showGeolocationSelectionMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsInDataCenterOnly(ctx: TelegramContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.showInDataCenterOnlySelectionMenu(ctx)
  }

  //- --------------------------------

  private showGpuSelectionMenu(ctx: TelegramContext) {
    ctx.editMessageText(
      'Select GPU:',
      this.tgbotlib.generateInlineKeyboard([
        [['RTX 3060', 'action:search:params:gpu:select:RTX 3060']],
        [['RTX 3090', 'action:search:params:gpu:select:RTX 3090']],
        [['RTX 4090', 'action:search:params:gpu:select:RTX 4090']],
        [['RTX 5090', 'action:search:params:gpu:select:RTX 5090']],
      ]),
    )
  }

  private showInDataCenterOnlySelectionMenu(ctx: TelegramContext) {
    ctx.editMessageText(
      'In data center only:',
      this.tgbotlib.generateInlineKeyboard([
        [['yes', 'action:search:params:in-data-center-only:select:true']],
        [['no', 'action:search:params:in-data-center-only:select:false']],
      ]),
    )
  }

  private showGeolocationSelectionMenu(ctx: TelegramContext) {
    ctx.editMessageText(
      'Select Geolocation:',
      this.tgbotlib.generateInlineKeyboard([
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