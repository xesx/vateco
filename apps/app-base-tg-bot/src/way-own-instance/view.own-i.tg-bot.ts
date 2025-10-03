import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

import { OwnInstanceContext } from './types'

import * as kb from '@kb'

@Injectable()
export class ViewOwnITgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
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

  showWorkflowsMenu (ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    delete ctx.session.workflowId

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowsMenu({
      workflows: this.wflib.findWorkflowsByTags({ tags: ['own-instance'] }),
      prefixAction: 'act:own-i',
      backAction: 'act:own-i:manage'
    }))

    this.tgbotlib.removeReplyKeyboard(ctx)
    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  showWorkflowRunMenu (ctx: OwnInstanceContext) {
    if (!ctx.session.workflowId) {
      throw new Error('Workflow ID not set in session')
    }

    const workflow = this.wflib.getWorkflow(ctx.session.workflowId)

    const message = `Workflow ${workflow.name}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      workflow,
      workflowUserParams: ctx.session.workflowParams,
      prefixAction: `act:own-i`,
      backAction: 'act:own-i:workflow'
    }))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }
}