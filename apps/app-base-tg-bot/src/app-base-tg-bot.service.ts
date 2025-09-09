import { Injectable } from '@nestjs/common'

import { TgBotLibService } from '@libs/tg-bot'

import { TelegramContext } from './types'

import {
  MAIN_MENU,
  ownInstanceSearchParamsMenu,
  ownInstanceManageMenu,
} from './inline-keyboard'

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: TgBotLibService,
  ) {}

  showMainMenu(ctx: TelegramContext) {
    const message = 'Параметры поиска:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(MAIN_MENU)

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceSearchParamsMenu(ctx: TelegramContext) {
    const message = 'Search parameters:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceSearchParamsMenu(ctx))

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceManageMenu(ctx: TelegramContext) {
    const message = 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceManageMenu(ctx))

    this.tgbotlib.reply(ctx, message, keyboard)
  }
}