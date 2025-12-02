import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext } from './types'

// import * as kb from '@kb'

@Injectable()
export class CommonHandlerOwnITgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wfrepo: repo.WorkflowRepository,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly modelrepo: repo.ModelRepository,
  ) {}

  async runWfv (ctx: OwnInstanceContext) {
    const { workflowVariantId, userId, instance } = ctx.session
    const modelInfoLoaded = instance?.modelInfoLoaded || []

    if (!workflowVariantId) {
      console.log('ActionOwnITgBot_actionWfvRun_21 No workflowId in session')
      return this.tgbotlib.safeAnswerCallback(ctx)
    }

    const workflowVariantParams = await this.wfrepo.getMergedWorkflowVariantParamsValueMap({ userId, workflowVariantId })

    for (const paramName in workflowVariantParams) {
      if (this.wflib.wfParamSchema[paramName]?.isComfyUiModel) {
        const value = workflowVariantParams[paramName]

        const modelName = String(value.value ?? value)

        if (['❓', 'N/A'].includes(modelName)) {
          continue
        }

        if (modelInfoLoaded?.includes(modelName)) {
          continue
        }

        const modelData = await this.modelrepo.getModelByName(modelName)

        await this.cloudapilib.vastAiModelInfoLoad({
          baseUrl: ctx.session.instance?.apiUrl,
          instanceId: ctx.session.instance?.id,
          token: ctx.session.instance?.token,
          modelName,
          modelData,
        })

        if (ctx.session.instance) {
          ctx.session.instance.modelInfoLoaded = ctx.session.instance.modelInfoLoaded || []
          ctx.session.instance?.modelInfoLoaded.push(modelName)
        }
      }
    }

    await this.cloudapilib.vastAiWorkflowRun({
      baseUrl: ctx.session.instance?.apiUrl,
      instanceId: ctx.session.instance?.id,
      token: ctx.session.instance?.token,
      count: workflowVariantParams.generationNumber || 1,
      workflowVariantId,
      workflowVariantParams,
      chatId: ctx.session.telegramId,
    })

    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}