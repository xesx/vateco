import { Injectable } from '@nestjs/common'

import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

import * as lib from '@lib'

import { CommonOwnITgBot } from './common.own-i.tg-bot'
import { OwnInstanceContext, OwnInstanceMatchContext } from './types'

import {
  ownInstanceWorkflowsMenu
} from '@kb'

@Injectable()
export class Act10WorkflowsOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly common: CommonOwnITgBot,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {
    this.bot.action('act:own-instance:workflow', (ctx) => this.handleActOwnInstanceWorkflow(ctx))
    this.bot.action(/^act:own-instance:workflow:(.+)$/, (ctx) => this.handleActOwnInstanceWorkflowSelect(ctx))
    this.bot.action(/^act:own-instance:workflow-param:(.+)$/, (ctx) => this.handleActOwnInstanceWorkflowParam(ctx))
    this.bot.action(/act:own-instance:workflow-run/, (ctx) => this.handleActOwnInstanceWorkflowRun(ctx))

    this.bot.on(message('text'), async (ctx, next) => {
      const message = ctx.message.text

      if (ctx.session.inputWaiting?.startsWith('act:own-instance:workflow-param:')) {
        const paramName = ctx.session.inputWaiting.replace('act:own-instance:workflow-param:', '')
        ctx.session.inputWaiting = null
        ctx.session.workflowParams[paramName] = message
        return this.handleActOwnInstanceWorkflowParamInput(ctx)
      }

      return next()
    })
  }

  private async handleActOwnInstanceWorkflowRun(ctx: OwnInstanceContext) {
    const workflowId = ctx.session.workflowId

    await this.cloudapilib.vastAiWorkflowRun({
      baseUrl: `http://${ctx.session.instanceIp}:${ctx.session.instanceApiPort}`,
      instanceId: ctx.session.instanceId,
      token: ctx.session.instanceToken,
      workflowId,
      workflowParams: ctx.session.workflowParams,
    })

    this.tgbotlib.safeAnswerCallback(ctx)
    // this.common.showWorkflowRunMenu(ctx)
  }

  private handleActOwnInstanceWorkflowParamInput(ctx) {
    this.common.showWorkflowRunMenu(ctx)
  }

  private handleActOwnInstanceWorkflowParam(ctx: OwnInstanceMatchContext) {
    const workflowId = ctx.session.workflowId

    if (!workflowId) {
      ctx.deleteMessage()
      return
    }

    const paramName: string = ctx.match[1] || '__undefined__'
    const wf = this.wflib.getWorkflow(workflowId)
    const wfParam = wf?.params[paramName]
    const currentValue = ctx.session.workflowParams[paramName]

    // if (!wfParam) {
    //   ctx.deleteMessage()
    //   return
    // }

    if (wfParam.type === 'string') {
      ctx.session.inputWaiting = `act:own-instance:workflow-param:${paramName}`
      this.tgbotlib.safeAnswerCallback(ctx)
      this.tgbotlib.reply(ctx, `Enter value for parameter *${paramName}*\nCurrent value *${currentValue}*` , { parse_mode: 'Markdown' })
      return
    }

    // this.tgbotlib.safeAnswerCallback(ctx)
    //
    // const message = '*Select workflow*'
    // const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceWorkflowsMenu())
    //
    // this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  private handleActOwnInstanceWorkflow(ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceWorkflowsMenu())

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  private async handleActOwnInstanceWorkflowSelect(ctx: OwnInstanceMatchContext) {
    const step = ctx.session.step

    if (!['running'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const [workflowId] = ctx.match
    ctx.session.workflowId = workflowId

    const wf = this.wflib.getWorkflow(workflowId)
    const workflowParams = wf.params

    Object.entries(workflowParams).forEach(([name, props]) => {
      ctx.session.workflowParams[name] = ctx.session.workflowParams[name] || props?.default
    })

    await this.cloudapilib.vastAiWorkflowLoad({
      baseUrl: `http://${ctx.session.instanceIp}:${ctx.session.instanceApiPort}`,
      instanceId: ctx.session.instanceId,
      token: ctx.session.instanceToken,
      workflowId
    })

    this.tgbotlib.safeAnswerCallback(ctx)
    this.common.showInstanceManageMenu(ctx, `Workflow ${workflowId} start loading...`)
  }
}