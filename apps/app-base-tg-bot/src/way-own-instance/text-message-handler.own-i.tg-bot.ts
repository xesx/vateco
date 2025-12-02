import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext, OwnInstanceMatchContext } from './types'
import { ViewOwnITgBot } from './view.own-i.tg-bot'
import { CommonHandlerOwnITgBot } from './common-handler.own-i.tg-bot'

import { WorkflowSynthService } from '@synth'

// import * as kb from '@kb'
// import { GEOLOCATION } from '@const'

@Injectable()
export class TextMessageHandlerOwnITgBot {
  constructor(
    private readonly view: ViewOwnITgBot,
    private readonly common: CommonHandlerOwnITgBot,

    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,

    private readonly wfsynth: WorkflowSynthService,
  ) {}

  async textGenerate (ctx: OwnInstanceContext) {
    await this.common.runWfv(ctx)
  }

  async textShowPrompt (ctx: OwnInstanceContext) {
    await this.view.showCurrentPositivePrompt(ctx)
  }

  async textParams (ctx: OwnInstanceContext) {
    await this.view.showWfvRunMenu(ctx)
  }

  async textAnyOther (ctx, next) {
    const { way, userId, workflowVariantId } = ctx.session

    if (way !== 'own-instance') {
      return next()
    }

    if (ctx.message.text.startsWith('https://')) {
      // todo
    }

    const message = ctx.message.text
      .replace(/\r\n/g, '\n')     // Windows → Unix переносы
      .replace(/\n+/g, ' ')       // убираем лишние переводы строк
      .replace(/\s+/g, ' ')       // схлопываем все пробелы/табы
      .trim()

    if (ctx.session.inputWaiting) {
      const { inputWaiting: paramName } = ctx.session

      const value = message

      await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })

      delete ctx.session.inputWaiting

      return this.view.showWfvRunMenu(ctx)
    }

    if (workflowVariantId) {
      const positivePromptParam = await this.wfrepo.getWorkflowVariantParamByName({ workflowVariantId, paramName: 'positivePrompt' })

      if (positivePromptParam) {
        await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName: 'positivePrompt', value: message })
        return await this.common.runWfv(ctx)
      }
    }

    return next()
  }
}