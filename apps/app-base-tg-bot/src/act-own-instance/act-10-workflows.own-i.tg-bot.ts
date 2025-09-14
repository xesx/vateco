import { Injectable } from '@nestjs/common'

import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

import * as lib from '@lib'

import { CommonOwnITgBot } from './common.own-i.tg-bot'
import { OwnInstanceContext, OwnInstanceMatchContext } from './types'

@Injectable()
export class Act10WorkflowsOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly common: CommonOwnITgBot,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
  ) {
    this.bot.action(/^act:own-instance:workflow:([^:]+)$/, (ctx) => this.handleActOwnInstanceWorkflowSelect(ctx))
    this.bot.action(/^act:own-instance:workflow:([^:]+):param:(.+)$/, (ctx) => this.handleActOwnInstanceWorkflowParam(ctx))
    this.bot.action(/^act:own-instance:workflow:([^:]+):run$/, (ctx) => this.handleActOwnInstanceWorkflowRun(ctx))

    this.bot.on(message('text'), async (ctx, next) => {
      if (ctx.session.way !== 'own-instance') {
        return next()
      }

      const message = ctx.message.text
        .replace(/\r\n/g, '\n')     // Windows → Unix переносы
        .replace(/\n+/g, ' ')       // убираем лишние переводы строк
        .replace(/\s+/g, ' ')       // схлопываем все пробелы/табы
        .trim()

      if (ctx.session.inputWaiting?.startsWith('act:own-instance:workflow-param:')) {
        const paramName = ctx.session.inputWaiting.replace('act:own-instance:workflow-param:', '')
        ctx.session.inputWaiting = null
        ctx.session.workflowParams[paramName] = message
        return this.handleActOwnInstanceWorkflowParamInput(ctx)
      }

      if (ctx.session.workflowParams?.positivePrompt) {
        ctx.session.workflowParams.positivePrompt = message
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
      count: ctx.session.workflowParams.__count__ || 1,
      workflowId,
      workflowParams: ctx.session.workflowParams,
    })

    this.tgbotlib.safeAnswerCallback(ctx)
  }

  private handleActOwnInstanceWorkflowParamInput(ctx) {
    this.common.showWorkflowRunMenu(ctx)
  }

  private handleActOwnInstanceWorkflowParam(ctx: OwnInstanceMatchContext) {
    const [,workflowId, param] = ctx.match
    const [paramName, value] = param.split(':')

    const workflow = this.wflib.getWorkflow(workflowId)
    const wfParam = workflow?.params[paramName]
    const currentValue = ctx.session.workflowParams[paramName]

    if (value) {
      if (wfParam.enum) {
        ctx.session.workflowParams[paramName] = wfParam.enum[value]
      } else {
        ctx.session.workflowParams[paramName] = value
      }

      if (wfParam.type === 'number') {
        ctx.session.workflowParams[paramName] = Number(ctx.session.workflowParams[paramName])
      }

      this.common.showWorkflowRunMenu(ctx)
      return
    }

    if (wfParam.enum) {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`
      const enumOptions: [string, string][][] = wfParam.enum
        .map((value, i) => [[value, `act:own-instance:workflow:${workflowId}:param:${paramName}:${i}`]])
      enumOptions.push([['Back', `act:own-instance:workflow:${workflowId}:run`]])

      const keyboard = this.tgbotlib.generateInlineKeyboard(enumOptions)
      this.tgbotlib.reply(ctx, message, keyboard)
      return
    }

    if (wfParam.type === 'string' || wfParam.type === 'number') {
      ctx.session.inputWaiting = `act:own-instance:workflow-param:${paramName}`
      this.tgbotlib.safeAnswerCallback(ctx)

      const message = this.msglib.genCodeMessage(String(currentValue))
      this.tgbotlib.reply(ctx, message , { parse_mode: 'HTML' })
      // this.tgbotlib.reply(ctx, `Enter value for parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*` , { parse_mode: 'Markdown' })
      return
    }
  }

  private async handleActOwnInstanceWorkflowSelect(ctx: OwnInstanceMatchContext) {
    const step = ctx.session.step

    if (!['running', 'loading'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const [,workflowId] = ctx.match

    if (workflowId === ctx.session.workflowId) {
      this.common.showWorkflowRunMenu(ctx)
      return
    }

    ctx.session.workflowId = workflowId

    const workflow = this.wflib.getWorkflow(workflowId)
    const workflowParams = workflow.params

    Object.entries(workflowParams).forEach(([name, props]) => {
      ctx.session.workflowParams[name] = ctx.session.workflowParams[name] || props?.default
    })

    await this.cloudapilib.vastAiWorkflowLoad({
      baseUrl: `http://${ctx.session.instanceIp}:${ctx.session.instanceApiPort}`,
      instanceId: ctx.session.instanceId,
      token: ctx.session.instanceToken,
      workflowId
    })

    this.common.showWorkflowRunMenu(ctx)
  }
}