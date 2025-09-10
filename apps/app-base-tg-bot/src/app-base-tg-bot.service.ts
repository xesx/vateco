import { Injectable } from '@nestjs/common'

import { TgBotLibService } from '@libs/tg-bot'

import { TelegramContext } from './types'

import {
  MAIN_MENU,
  ownInstanceSearchParamsMenu,
  ownInstanceManageMenu,
  ownInstanceCreateMenu,
} from './inline-keyboard'

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: TgBotLibService,
  ) {}

  showMainMenu(ctx: TelegramContext) {
    const message = 'Main menu:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(MAIN_MENU)

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceSearchParamsMenu(ctx: TelegramContext, extraMessage?: string) {

    const message = extraMessage ? `${extraMessage}\nSearch parameters:`: 'Search parameters:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceSearchParamsMenu(ctx))

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceCreateMenu(ctx: TelegramContext) {
    const offerId = ctx.session.offerId

    const message = 'Now you can create your own instance ⤵️'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceCreateMenu(offerId))

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceManageMenu(ctx: TelegramContext) {
    const message = 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceManageMenu(ctx))

    this.tgbotlib.reply(ctx, message, keyboard)
  }
}