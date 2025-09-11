import { Injectable } from '@nestjs/common'

import { TgBotLibService } from '@libs/tg-bot'

import { TelegramContext } from './types'

import {
  MAIN_MENU,
  ownInstanceSearchParamsMenu,
  ownInstanceManageMenu,
  ownInstanceCreateMenu,
  workflowRunMenu,
} from '@kb'

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
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceSearchParamsMenu(ctx.session))

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceCreateMenu(ctx: TelegramContext) {
    const offerId = ctx.session.offerId

    const message = 'Now you can create your own instance ⤵️'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceCreateMenu(offerId))

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceManageMenu(ctx: TelegramContext, extraMessage?: string) {
    const message = extraMessage ? `${extraMessage}\nManage instance:`: 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceManageMenu(ctx.session.step))

    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showWorkflowRunMenu(ctx: TelegramContext) {
    const message = `Workflow ${ctx.session.workflowId}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(workflowRunMenu({
      workflowParams: ctx.session.workflowParams,
      prefixAction: `act:own-instance`,
      backAction: 'act:own-instance:workflow'
    }))

    this.tgbotlib.reply(ctx, message, keyboard)
  }
}