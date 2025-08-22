import { Injectable, Inject } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SetVastAiInstanceSearchParamsCallbackTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    @Inject() private readonly appTelegramBotService: AppTelegramBotService,
  ) {
    // Команда, чтобы показать меню
    this.bot.command('searchparams', (ctx) => this.handleSearchParams(ctx))

    // Обработка нажатия кнопки "GPU name"
    this.bot.action('action:gpu', (ctx) => {
      this.appTelegramBotService.safeAnswerCallback(ctx) // подтверждаем нажатие
      this.showGpuSelectionMenu(ctx)
    })

    // Обработка нажатия кнопки "Geolocation"
    this.bot.action('action:geolocation', (ctx) => {
      this.appTelegramBotService.safeAnswerCallback(ctx) // подтверждаем нажатие
      this.showGeolocationSelectionMenu(ctx)
    })

    // Обработка нажатия кнопки "Закрыть"
    this.bot.action('action:close', (ctx) => {
      this.appTelegramBotService.safeAnswerCallback(ctx)
      ctx.editMessageText('Меню закрыто.')
    })

    // Обработка выбора GPU с использованием регулярного выражения
    this.bot.action(/^action:gpuselect_(.+)$/, (ctx) => {
      const gpuModel = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.vastAi.searchParams.gpu = gpuModel

      this.appTelegramBotService.safeAnswerCallback(ctx)
      ctx.reply('Selected GPU: ' + gpuModel)
      this.showSearchParamsMenu(ctx)
    })

    // Обработка выбора геолокации с использованием регулярного выражения
    this.bot.action(/^action:geolocationselect:(.+)$/, (ctx) => {
      const geolocation = ctx.match[1] // извлекаем часть после подчеркивания
      ctx.session.vastAi.searchParams.geolocation = geolocation

      this.appTelegramBotService.safeAnswerCallback(ctx)
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
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`GPU name (${ctx.session.vastAi.searchParams.gpu})`, 'action:gpu')],
      [Markup.button.callback(`Geolocation (${ctx.session.vastAi.searchParams.geolocation})`, 'action:geolocation')],
      [Markup.button.callback('❌ Закрыть', 'action:close')],
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
      Markup.inlineKeyboard([
        [Markup.button.callback('RTX 3060', 'action:gpuselect_RTX 3060')],
        [Markup.button.callback('RTX 3090', 'action:gpuselect_RTX 3090')],
        [Markup.button.callback('RTX 4090', 'action:gpuselect_RTX 4090')],
      ]),
    )
  }

  private showGeolocationSelectionMenu(ctx: TelegramContext) {
    ctx.editMessageText(
      'Select Geolocation:',
      Markup.inlineKeyboard([
        [Markup.button.callback('ALL WORLD', 'action:geolocationselect:any')],
        [Markup.button.callback('Europe', 'action:geolocationselect:europe')],
        [
          Markup.button.callback('RU', 'action:geolocationselect:RU'),
          Markup.button.callback('SE', 'action:geolocationselect:SE'),
          Markup.button.callback('GB', 'action:geolocationselect:GB'),
          Markup.button.callback('PL', 'action:geolocationselect:PL'),
          Markup.button.callback('PT', 'action:geolocationselect:PT'),
          Markup.button.callback('SI', 'action:geolocationselect:SI'),
          Markup.button.callback('DE', 'action:geolocationselect:DE'),
          Markup.button.callback('IT', 'action:geolocationselect:IT'),
        ],
        [
          Markup.button.callback('LT', 'action:geolocationselect:LT'),
          Markup.button.callback('GR', 'action:geolocationselect:GR'),
          Markup.button.callback('FI', 'action:geolocationselect:FI'),
          Markup.button.callback('IS', 'action:geolocationselect:IS'),
          Markup.button.callback('AT', 'action:geolocationselect:AT'),
          Markup.button.callback('FR', 'action:geolocationselect:FR'),
          Markup.button.callback('RO', 'action:geolocationselect:RO'),
          Markup.button.callback('MD', 'action:geolocationselect:MD'),
        ],
        [
          Markup.button.callback('HU', 'action:geolocationselect:HU'),
          Markup.button.callback('NO', 'action:geolocationselect:NO'),
          Markup.button.callback('MK', 'action:geolocationselect:MK'),
          Markup.button.callback('BG', 'action:geolocationselect:BG'),
          Markup.button.callback('ES', 'action:geolocationselect:ES'),
        ],
        [
          Markup.button.callback('CH', 'action:geolocationselect:CH'),
          Markup.button.callback('HR', 'action:geolocationselect:HR'),
          Markup.button.callback('NL', 'action:geolocationselect:NL'),
          Markup.button.callback('CZ', 'action:geolocationselect:CZ'),
          Markup.button.callback('EE', 'action:geolocationselect:EE'),
        ],
        [Markup.button.callback('North America', 'action:geolocationselect:north-america')],
        [
          Markup.button.callback('US', 'action:geolocationselect:US'),
          Markup.button.callback('CA', 'action:geolocationselect:CA'),
        ],
        [Markup.button.callback('South America', 'action:geolocationselect:south-america')],
        [
          Markup.button.callback('BR', 'action:geolocationselect:BR'),
          Markup.button.callback('AR', 'action:geolocationselect:AR'),
          Markup.button.callback('CL', 'action:geolocationselect:CL'),
        ],
        [Markup.button.callback('Asia', 'action:geolocationselect:asia')],
        [
          Markup.button.callback('CN', 'action:geolocationselect:CN'),
          Markup.button.callback('JP', 'action:geolocationselect:JP'),
          Markup.button.callback('KR', 'action:geolocationselect:KR'),
          Markup.button.callback('ID', 'action:geolocationselect:ID'),
          Markup.button.callback('IN', 'action:geolocationselect:IN'),
          Markup.button.callback('HK', 'action:geolocationselect:HK'),
          Markup.button.callback('MY', 'action:geolocationselect:MY'),
        ],
        [
          Markup.button.callback('IL', 'action:geolocationselect:IL'),
          Markup.button.callback('TH', 'action:geolocationselect:TH'),
          Markup.button.callback('QA', 'action:geolocationselect:QA'),
          Markup.button.callback('TR', 'action:geolocationselect:TR'),
          Markup.button.callback('VN', 'action:geolocationselect:VN'),
        ],
        [
          Markup.button.callback('TW', 'action:geolocationselect:TW'),
          Markup.button.callback('OM', 'action:geolocationselect:OM'),
          Markup.button.callback('SG', 'action:geolocationselect:SG'),
          Markup.button.callback('AE', 'action:geolocationselect:AE'),
          Markup.button.callback('KZ', 'action:geolocationselect:KZ'),
        ],
      ]),
    )
  }
}