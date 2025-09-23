import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

import { RunpodWfContext } from './types'

import * as kb from '@kb'

@Injectable()
export class ViewRunpodWfTgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
  ) {}

  showWorkflowMenu (ctx: RunpodWfContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    delete ctx.session.workflowId

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowMenu({
      tags: ["runpod"],
      prefixAction: 'act:rp-wf',
      backAction: 'act:main-menu'
    }))

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  showWorkflowRunMenu(ctx: RunpodWfContext) {
    const message = `Workflow ${ctx.session.workflowId}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      workflowId: ctx.session.workflowId || '',
      workflowParams: ctx.session.workflowParams,
      prefixAction: `act:rp-wf`,
      backAction: 'act:rp-wf:workflow'
    }))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }
}