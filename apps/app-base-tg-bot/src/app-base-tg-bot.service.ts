import { Injectable } from '@nestjs/common'
import { Context } from 'telegraf'

import { TgBotLibService } from '@libs/tg-bot'

import {
  MAIN_MENU,
} from '@kb'

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: TgBotLibService,
  ) {}

  showMainMenu(ctx: Context) {
    const message = 'Main menu:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(MAIN_MENU)

    this.tgbotlib.reply(ctx, message, keyboard)
  }
}