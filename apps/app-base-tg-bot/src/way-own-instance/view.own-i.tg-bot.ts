import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

import { OwnInstanceContext } from './types'

import * as kb from '@kb'

@Injectable()
export class ViewOwnITgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
  ) {}

  showInstanceSearchParamsMenu (ctx: OwnInstanceContext) {
    const message = 'Search parameters:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceOfferParamsMenu(ctx.session))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceCreateMenu(ctx: OwnInstanceContext) {
    const offerId = ctx.session.offerId

    const message = 'Now you can create your own instance ⤵️'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceCreateMenu(offerId))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceManageMenu(ctx: OwnInstanceContext, extraMessage?: string) {
    const message = extraMessage ? `${extraMessage}\nManage instance:`: 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceManageMenu(ctx.session.step))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showWorkflowMenu (ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceWorkflowSelectMenu())

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  showWorkflowRunMenu(ctx: OwnInstanceContext) {
    const message = `Workflow ${ctx.session.workflowId}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      workflowId: ctx.session.workflowId || '',
      workflowParams: ctx.session.workflowParams,
      prefixAction: `act:own-i`,
      backAction: 'act:own-i:workflow'
    }))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }
}