import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { RunpodWfContext } from './types'

import * as kb from '@kb'

@Injectable()
export class ViewRunpodWfTgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  showWorkflowVariants (ctx: RunpodWfContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    delete ctx.session.workflowId
    ctx.session.workflowParams = {}
    this.tgbotlib.removeReplyKeyboard(ctx)

    // const workflows = this.wflib.findWorkflowsByTags({ tags: ['runpod'] })
    //
    // const message = '*Select workflow*'
    // const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowsMenu({
    //   workflows,
    //   prefixAction: 'act:rp-wf',
    //   backAction: 'act:main-menu'
    // }))
    //
    // this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  async showWorkflowRunMenu (ctx: RunpodWfContext) {
    if (!ctx.session.workflowId) {
      throw new Error('Workflow ID not set in session')
    }

    const { workflowId } = ctx.session

    const workflowVariant = await this.wfrepo.getWorkflowVariant(workflowId)
    // const workflowVariantParams = await this.wfrepo.getWorkflowVariantParamsMap(workflowId)

    const wfvParams = await this.wfrepo.getWorkflowMergedWorkflowVariantParams({
      userId: 1,
      workflowVariantId: workflowId,
    })

    const message = `Workflow ${workflowVariant.name}`

    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      workflowVariantId: workflowId,
      wfvParams,
      prefixAction: `act:rp-wf`,
      backAction: 'act:rp-wf:wf:variants'
    }))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }
}