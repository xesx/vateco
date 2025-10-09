import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

import { RunpodWfContext, RunpodWfMatchContext } from './types'
import { ViewRunpodWfTgBot } from './view.runpod-wf.tg-bot'

import * as kb from '@kb'
// import { GEOLOCATION } from '@const'

@Injectable()
export class HandleRunpodWfTgBot {
  constructor(
    private readonly view: ViewRunpodWfTgBot,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly runpodlib: lib.RunpodLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,
  ) {}

  commandStart (ctx: RunpodWfContext, next: () => Promise<void>) {
    if (ctx.session.way !== 'runpod-wf') {
      return next()
    }

    if (ctx.session.workflowId) {
      return this.view.showWorkflowRunMenu(ctx)
    }

    this.view.showWorkflowVariants(ctx)
  }

  textMessage (ctx, next) {
    if (ctx.session.way === 'runpod-wf') {
      const message = ctx.message.text
        .replace(/\r\n/g, '\n')     // Windows → Unix переносы
        .replace(/\n+/g, ' ')       // убираем лишние переводы строк
        .replace(/\s+/g, ' ')       // схлопываем все пробелы/табы
        .trim()

      if (message === '🚀 Generate') {
        return this.actionWorkflowRun(ctx)
      }

      if (message === '🎛 Params') {
        return this.view.showWorkflowRunMenu(ctx)
      }

      if (message === '📝 Show prompt') {
        const prompt = ctx.session.workflowParams?.positivePrompt || 'N/A'
        const message = this.msglib.genCodeMessage(prompt)
        return this.tgbotlib.reply(ctx, message , { parse_mode: 'HTML' })
      }

      if (ctx.session.inputWaiting) {
        const paramName = ctx.session.inputWaiting
        ctx.session.workflowParams[paramName] = message

        delete ctx.session.inputWaiting

        return this.view.showWorkflowRunMenu(ctx)
      }

      if (ctx.session.workflowParams?.positivePrompt) {
        ctx.session.workflowParams.positivePrompt = message
        return this.actionWorkflowRun(ctx)
        // return this.view.showWorkflowRunMenu(ctx)
      }
    }

    return next()
  }

  async actionWorkflowRun (ctx: RunpodWfContext) {
    const workflowId = ctx.session.workflowId

    if (!workflowId) {
      this.tgbotlib.safeAnswerCallback(ctx, 'Workflow not selected')
      return
    }

    const workflowParams =  structuredClone(ctx.session.workflowParams)
    const generationNumber = Number(workflowParams.generationNumber) || 1

    this.tgbotlib.safeAnswerCallback(ctx)
    ctx.reply('Generating image, please wait... ⏳')

    let data: any

    for (let i = 0; i < generationNumber; i++) {
      const workflow = this.wflib.compileWorkflow({ id: workflowId, params: workflowParams })

      try {
        data = await this.runpodlib.runSync({ workflow })
      } catch (error) {
        console.log('Error in runpodlib.runSync:', this.h.herr.parseAxiosError(error))
        ctx.reply('Error generating image. Please try again later.')
        return
      }

      const base64Data = data.output.images?.[0].data
      const imgBuffer = Buffer.from(base64Data, 'base64')

      await ctx.sendPhoto({ source: imgBuffer, filename: 'image' }, { caption: 'Here is your generated image.' })
    }
  }

  actionWorkflowParamSelect (ctx: RunpodWfMatchContext) {
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

      if (['integer', 'number'].includes(wfParam.type)) {
        ctx.session.workflowParams[paramName] = Number(ctx.session.workflowParams[paramName])
      }

      this.view.showWorkflowRunMenu(ctx)
      return
    }

    if (wfParam.enum) {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`
      const enumOptions: [string, string][][] = wfParam.enum
        .map((value, i) => [[value, `act:rp-wf:wf:${workflowId}:param:${paramName}:${i}`]])
      enumOptions.push([['Back', `act:rp-wf:wf:${workflowId}`]])

      const keyboard = this.tgbotlib.generateInlineKeyboard(enumOptions)
      this.tgbotlib.reply(ctx, message, keyboard)
      return
    }

    if (wfParam.type === 'string' || ['integer', 'number'].includes(wfParam.type)) {
      ctx.session.inputWaiting = paramName
      this.tgbotlib.safeAnswerCallback(ctx)

      const message = this.msglib.genCodeMessage(String(currentValue))
      this.tgbotlib.reply(ctx, message , { parse_mode: 'HTML' })
      // this.tgbotlib.reply(ctx, `Enter value for parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*` , { parse_mode: 'Markdown' })
      return
    }
  }

  actionWorkflowSelect (ctx: RunpodWfMatchContext) {
    const [,workflowId] = ctx.match
    ctx.session.workflowId = workflowId
    ctx.session.step = 'generating'
    ctx.session.workflowParams = this.wflib.getWfParamsForSession({ workflowId })

    this.view.showWorkflowRunMenu(ctx)

    const replyKeyboard = this.tgbotlib.generateReplyKeyboard(kb.WORKFLOW_REPLY)
    ctx.sendMessage('Use for fast work ⤵', replyKeyboard)
  }
}