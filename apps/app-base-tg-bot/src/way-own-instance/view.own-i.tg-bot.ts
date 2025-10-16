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

  showOfferParamsMenu (ctx: OwnInstanceContext) {
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

  showInstanceInfo (ctx: OwnInstanceContext) {

  }

  showInstanceManageMenu (ctx: OwnInstanceContext) {
    const message = 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceManageMenu(ctx.session.step))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showWorkflowVariants (ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    delete ctx.session.workflowId

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowsMenu({
      workflows: this.wflib.findWorkflowsByTags({ tags: ['own-instance'] }),
      prefixAction: 'act:own-i',
      backAction: 'act:own-i:instance:manage'
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
      backAction: 'act:own-i:wf:variants'
    }))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }
}