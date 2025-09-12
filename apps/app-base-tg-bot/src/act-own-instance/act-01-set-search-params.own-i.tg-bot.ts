import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'

import { CommonOwnITgBot } from './common.own-i.tg-bot'
import { OwnInstanceContext } from './types'

import {
  OWN_INSTANCE_GPU_MENU,
  OWN_INSTANCE_GEOLOCATION_MENU,
  OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU,
} from '@kb'

@Injectable()
export class Act01SetSearchParamsOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly common: CommonOwnITgBot,
    private readonly tgbotlib: lib.TgBotLibService,
  ) {
    this.bot.action('act:own-instance', (ctx) => this.handleActOwnInstance(ctx))
    this.bot.action('act:own-instance:search-params', (ctx) => this.handleActOwnInstanceSearchParams(ctx))

    this.bot.action('act:own-instance:search-params:gpu', (ctx) => this.handleActOwnInstanceSearchParamsGpu(ctx))
    this.bot.action(/^act:own-instance:search-params:gpu:(.+)$/, (ctx) => this.handleActOwnInstanceSearchParamsGpuSelect(ctx))

    this.bot.action('act:own-instance:search-params:geolocation', (ctx) => this.handleActOwnInstanceSearchParamsGeolocation(ctx))
    this.bot.action(/^act:own-instance:search-params:geolocation:(.+)$/, (ctx) => this.handleActOwnInstanceSearchParamsGeolocationSelect(ctx))

    this.bot.action('act:own-instance:search-params:in-data-center-only', (ctx) => this.handleActOwnInstanceSearchParamsInDataCenterOnly(ctx))
    this.bot.action(/^act:own-instance:search-params:in-data-center-only:(.+)$/, (ctx) => this.handleActOwnInstanceSearchParamsInDataCenterOnlySelect(ctx))
  }

  private handleActOwnInstanceSearchParamsGpuSelect(ctx: OwnInstanceContext) {
    const gpuModel = ctx.match?.[1]
    ctx.session.gpuName = gpuModel || 'any'

    this.tgbotlib.safeAnswerCallback(ctx)
    this.common.showInstanceSearchParamsMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsGeolocationSelect(ctx: OwnInstanceContext) {
    const geolocation = ctx.match?.[1]
    ctx.session.geolocation = geolocation || 'any'

    this.tgbotlib.safeAnswerCallback(ctx)
    this.common.showInstanceSearchParamsMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsInDataCenterOnlySelect(ctx: OwnInstanceContext) {
    const inDataCenterOnly = ctx.match?.[1] === 'true'
    ctx.session.inDataCenterOnly = inDataCenterOnly

    this.tgbotlib.safeAnswerCallback(ctx)
    this.common.showInstanceSearchParamsMenu(ctx)
  }

  private handleActOwnInstance(ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.common.showInstanceSearchParamsMenu(ctx)
  }

  private handleActOwnInstanceSearchParams(ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.common.showInstanceSearchParamsMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsGpu(ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.showGpuSelectionMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsGeolocation(ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.showGeolocationSelectionMenu(ctx)
  }

  private handleActOwnInstanceSearchParamsInDataCenterOnly(ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.showInDataCenterOnlySelectionMenu(ctx)
  }

  private showGpuSelectionMenu(ctx: OwnInstanceContext) {
    ctx.editMessageText('Select GPU:', this.tgbotlib.generateInlineKeyboard(OWN_INSTANCE_GPU_MENU))
  }

  private showInDataCenterOnlySelectionMenu(ctx: OwnInstanceContext) {
    ctx.editMessageText('In data center only:', this.tgbotlib.generateInlineKeyboard(OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU))
  }

  private showGeolocationSelectionMenu(ctx: OwnInstanceContext) {
    ctx.editMessageText('Select Geolocation:', this.tgbotlib.generateInlineKeyboard(OWN_INSTANCE_GEOLOCATION_MENU))
  }
}