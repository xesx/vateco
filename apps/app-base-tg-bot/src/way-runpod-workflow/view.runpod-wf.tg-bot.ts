import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

import { RunpodWfContext } from './types'

import * as kb from '@kb'

@Injectable()
export class ViewRunpodWfTgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {}

  showWorkflowVariants (ctx: RunpodWfContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    delete ctx.session.workflowId
    ctx.session.workflowParams = {}

    const workflows = this.wflib.findWorkflowsByTags({ tags: ['runpod'] })

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowsMenu({
      workflows,
      prefixAction: 'act:rp-wf',
      backAction: 'act:main-menu'
    }))

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  showWorkflowRunMenu (ctx: RunpodWfContext) {
    if (!ctx.session.workflowId) {
      throw new Error('Workflow ID not set in session')
    }

    const message = `Workflow ${ctx.session.workflowId}`
    const workflow = this.wflib.getWorkflow(ctx.session.workflowId)

    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      workflow,
      workflowUserParams: ctx.session.workflowParams,
      prefixAction: `act:rp-wf`,
      backAction: 'act:rp-wf:wf:variants'
    }))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }
}