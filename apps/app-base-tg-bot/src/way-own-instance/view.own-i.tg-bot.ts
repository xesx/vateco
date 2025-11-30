import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext } from './types'

import * as kb from '@kb'

@Injectable()
export class ViewOwnITgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  async showOfferParamsMenu (ctx: OwnInstanceContext) {
    const message = 'Search parameters:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceOfferParamsMenu(ctx.session.offer || {}))

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async showInstanceCreateMenu(ctx: OwnInstanceContext) {
    const offerId = ctx.session.offer?.id

    const message = 'Now you can create your own instance ⤵️'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceCreateMenu(offerId))

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async showInstanceManageMenu (ctx: OwnInstanceContext) {
    const message = 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceManageMenu(ctx.session.step))

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async showWfvList (ctx: OwnInstanceContext) {
    const workflows = await this.wfrepo.findWorkflowVariantsByTags(['own-instance'])

    const message = '*Select workflow variant*'
    const keyboardSchema = kb.workflowsMenu({
      workflows,
      prefixAction: 'act:own-i',
      backAction: 'act:own-i:instance:manage',
    })
    const keyboard = this.tgbotlib.generateInlineKeyboard(keyboardSchema)

    await this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  async showWfvRunMenu (ctx: OwnInstanceContext) {
    const { workflowVariantId, userId } = ctx.session

    if (!workflowVariantId) {
      throw new Error('Workflow variant ID not set in session')
    }

    const workflowVariant = await this.wfrepo.getWorkflowVariant(workflowVariantId)
    const wfvParams = await this.wfrepo.getWorkflowMergedWorkflowVariantParams({ userId, workflowVariantId })

    const message = `Workflow ${workflowVariant.name}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      workflowVariantId,
      wfvParams,
      prefixAction: `act:own-i`,
      backAction: 'act:own-i:wfv:list'
    }))

    await this.tgbotlib.reply(ctx, message, keyboard)
  }


  async showWfvReplyMenu (ctx) {
    const replyKeyboard = this.tgbotlib.generateReplyKeyboard(kb.WORKFLOW_VARIANT_REPLY)
    await ctx.sendMessage('Use for fast work ⤵', replyKeyboard)
  }
}