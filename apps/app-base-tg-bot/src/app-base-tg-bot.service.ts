import { Injectable } from '@nestjs/common'

import { TAppBaseTgBotContext } from './types'

import * as lib from '@lib'

import {
  MAIN_MENU,
} from '@kb'

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
  ) {}

  showMainMenu(ctx: TAppBaseTgBotContext) {
    const message = 'Main menu:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(MAIN_MENU)

    ctx.session.step = 'start'
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  resetSession(ctx: TAppBaseTgBotContext) {
    ctx.session = {
      lastTimestamp: Date.now(),
      chatId: ctx.session.chatId,
      step: 'start',
    }
  }
}