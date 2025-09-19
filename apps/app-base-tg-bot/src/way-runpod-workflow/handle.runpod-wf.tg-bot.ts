import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

import { RunpodWfContext, RunpodWfMatchContext } from './types'
import { ViewRunpodWfTgBot } from './view.runpod-wf.tg-bot'

// import * as kb from '@kb'
// import { GEOLOCATION } from '@const'

@Injectable()
export class HandleRunpodWfTgBot {
  constructor(
    private readonly view: ViewRunpodWfTgBot,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly runpodlib: lib.RunpodLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly herr: lib.ErrorHelperLibService,
  ) {}

  commandStart (ctx: RunpodWfContext, next: () => Promise<void>) {
    if (ctx.session.way !== 'runpod-wf') {
      return next()
    }

    this.view.showWorkflowMenu(ctx)
  }

  textMessage (ctx, next) {
    if (ctx.session.way === 'runpod-wf') {
      const message = ctx.message.text
        .replace(/\r\n/g, '\n')     // Windows → Unix переносы
        .replace(/\n+/g, ' ')       // убираем лишние переводы строк
        .replace(/\s+/g, ' ')       // схлопываем все пробелы/табы
        .trim()

      if (ctx.session.inputWaiting?.startsWith('act:rp-wf:workflow-param:')) {
        const paramName = ctx.session.inputWaiting.replace('act:rp-wf:workflow-param:', '')
        ctx.session.inputWaiting = null
        ctx.session.workflowParams[paramName] = message
        return this.view.showWorkflowRunMenu(ctx)
      }

      if (ctx.session.workflowParams?.positivePrompt) {
        ctx.session.workflowParams.positivePrompt = message
        return this.view.showWorkflowRunMenu(ctx)
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

    const workflow = this.wflib.compileWorkflow({ workflowId, workflowParams: ctx.session.workflowParams })

    this.tgbotlib.safeAnswerCallback(ctx)
    ctx.reply('Generating image, please wait... ⏳')

    let data: any

    console.time('log_time_mark_actionWorkflowRun_runSync')
    try {
      data = await this.runpodlib.runSync({ workflow })
    } catch (error) {
      console.error('Error in runpodlib.runSync:', this.herr.parseAxiosError(error))
      ctx.reply('Error generating image. Please try again later.')
      return
    } finally {
      console.timeEnd('log_time_mark_actionWorkflowRun_runSync')
    }

    const base64Data = data.output.images?.[0].data
    const imgBuffer = Buffer.from(base64Data, 'base64')

    ctx.sendPhoto({ source: imgBuffer, filename: 'image' }, { caption: 'Here is your generated image.' })
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

      if (wfParam.type === 'number') {
        ctx.session.workflowParams[paramName] = Number(ctx.session.workflowParams[paramName])
      }

      this.view.showWorkflowRunMenu(ctx)
      return
    }

    if (wfParam.enum) {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`
      const enumOptions: [string, string][][] = wfParam.enum
        .map((value, i) => [[value, `act:own-i:workflow:${workflowId}:param:${paramName}:${i}`]])
      enumOptions.push([['Back', `act:own-i:workflow:${workflowId}:run`]])

      const keyboard = this.tgbotlib.generateInlineKeyboard(enumOptions)
      this.tgbotlib.reply(ctx, message, keyboard)
      return
    }

    if (wfParam.type === 'string' || wfParam.type === 'number') {
      ctx.session.inputWaiting = `act:own-i:workflow-param:${paramName}`
      this.tgbotlib.safeAnswerCallback(ctx)

      const message = this.msglib.genCodeMessage(String(currentValue))
      this.tgbotlib.reply(ctx, message , { parse_mode: 'HTML' })
      // this.tgbotlib.reply(ctx, `Enter value for parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*` , { parse_mode: 'Markdown' })
      return
    }
  }

  actionWorkflowSelect (ctx: RunpodWfMatchContext) {
    const [,workflowId] = ctx.match

    // if (workflowId === ctx.session.workflowId) {
    //   this.view.showWorkflowRunMenu(ctx)
    //   return
    // }
    //
    // ctx.session.workflowId = workflowId

    const workflow = this.wflib.getWorkflow(workflowId)
    const workflowParams = workflow.params

    Object.entries(workflowParams).forEach(([name, props]) => {
      ctx.session.workflowParams[name] = ctx.session.workflowParams[name] || props?.default
    })

    Object.keys(ctx.session.workflowParams).forEach((name) => {
      if (!workflowParams[name]) {
        delete ctx.session.workflowParams[name]
      }
    })

    this.view.showWorkflowRunMenu(ctx)
  }
}