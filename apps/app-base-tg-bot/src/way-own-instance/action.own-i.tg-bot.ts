import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext, OwnInstanceMatchContext } from './types'
import { ViewOwnITgBot } from './view.own-i.tg-bot'

import { WorkflowSynthService } from '@synth'

import * as kb from '@kb'
import { GEOLOCATION } from '@const'

@Injectable()
export class ActionOwnITgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
    private readonly view: ViewOwnITgBot,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,
    private readonly wfsynth: WorkflowSynthService,
  ) {}

  async actionWfvList (ctx: OwnInstanceContext) {
    delete ctx.session.workflowVariantId
    await this.tgbotlib.removeReplyKeyboard(ctx)

    await this.view.showWfvList(ctx)

    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async actionWfvSelect (ctx: OwnInstanceMatchContext) {
    const { wfParamSchema } = this.wflib

    const { step, userId, instance } = ctx.session
    const modelInfoLoaded = instance?.modelInfoLoaded || []

    const [,workflowVariantIdStr] = ctx.match

    const workflowVariantId = Number(workflowVariantIdStr)
    ctx.session.workflowVariantId = workflowVariantId

    if (step === 'running') {
      const workflowVariant = await this.wfrepo.getWorkflowVariant(ctx.session.workflowVariantId)
      const workflowTemplate = await this.wfrepo.getWorkflowTemplate(workflowVariant.workflowTemplateId)

      await this.cloudapilib.vastAiWorkflowTemplateLoad({
        baseUrl: ctx.session.instance?.apiUrl,
        instanceId: ctx.session.instance?.id,
        token: ctx.session.instance?.token,
        workflowTemplate,
      })

      const wfvMergedParamsMap = await this.wfrepo.getMergedWorkflowVariantParamsValueMap({ userId, workflowVariantId })

      for (const [paramName, value] of Object.entries(wfvMergedParamsMap)) {
        const modelName = String(value.value ?? value)

        if (
          !wfParamSchema[paramName].isComfyUiModel ||
          ['❓', 'N/A'].includes(modelName) ||
          modelInfoLoaded?.includes(modelName)
        ) {
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

    await this.view.showWfvRunMenu(ctx)
    await this.view.showWfvReplyMenu(ctx)

    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async actionWfvParamSelect (ctx: OwnInstanceMatchContext) {
    const { wfParamSchema } = this.wflib

    const [,workflowVariantParamId] = ctx.match
    const { userId } = ctx.session

    const wfvParam = await this.wfrepo.getWorkflowVariantParamById(Number(workflowVariantParamId))
    const paramName = wfvParam.paramName
    const workflowVariantId = wfvParam.workflowVariantId

    const wfvParamType = wfParamSchema[paramName].type
    const wfvUserParam = await this.wfrepo.findWorkflowVariantUserParam({ userId, workflowVariantId, paramName })
    const currentValue = (wfvUserParam?.value ?? wfvParam?.value ?? '❌') as string | number | boolean

    let wfvParamEnum = wfvParam?.enum ?? wfParamSchema[paramName].enum

    if (typeof wfvParamEnum === 'string' && wfvParamEnum?.startsWith?.('$.')) {
      const enumCompilerName = wfvParamEnum.replace('$.', '')
      wfvParamEnum = await this.wfsynth.compileEnum(enumCompilerName)
    }

    // suggest value form enum
    if (wfvParamEnum && Array.isArray(wfvParamEnum)) {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`

      const maxLineLength = 30
      const enumOptions: [string, string][][] = []
      let currentRow: any[] = []
      let currentLength = 0

      wfvParamEnum
        .map((value: any) => typeof value === 'object' ? value.label : String(value))
        .forEach((value, i) => {
          const button = [value, `act:own-i:wfvp:${workflowVariantParamId}:set:${i}`]
          const buttonLength = value.length + 2 // запас на формат Telegram

          // Если не помещается — перенос
          if (currentLength + buttonLength > maxLineLength) {
            enumOptions.push(currentRow)
            currentRow = []
            currentLength = 0
          }

          currentRow.push(button)
          currentLength += buttonLength
        })

      enumOptions.push(currentRow)
      currentRow = []
      currentLength = 0

      enumOptions.push([['Back', `act:own-i:wfv:${workflowVariantId}`]])

      const keyboard = this.tgbotlib.generateInlineKeyboard(enumOptions)
      await this.tgbotlib.reply(ctx, message, keyboard)
      return
    }

    // suggest boolean value (true/false)
    if (wfvParamType === 'boolean') {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`
      const keyboard = this.tgbotlib.generateInlineKeyboard([
        [
          ['True', `act:own-i:wfvp:${workflowVariantParamId}:set:true`],
          ['False', `act:own-i:wfvp:${workflowVariantParamId}:set:false`],
        ],
        [['Back', `act:own-i:wfv:${workflowVariantId}`]],
      ])
      await this.tgbotlib.reply(ctx, message, keyboard)
      return
    }

    // suggest value form text input
    ctx.session.inputWaiting = paramName
    await this.tgbotlib.safeAnswerCallback(ctx)

    const message = this.msglib.genCodeMessage(String(currentValue) || '❌')
    await this.tgbotlib.reply(ctx, message , { parse_mode: 'HTML' })
  }

  async actionWfvParamSet (ctx: OwnInstanceMatchContext) {
    const [,workflowVariantParamId, rawValue] = ctx.match
    const { userId, step } = ctx.session

    const wfvParam = await this.wfrepo.getWorkflowVariantParamById(Number(workflowVariantParamId))
    const paramName = wfvParam.paramName
    const workflowVariantId = wfvParam.workflowVariantId
    let wfvParamEnum = wfvParam.enum

    let value: any = rawValue

    if (typeof wfvParamEnum === 'string' && wfvParamEnum?.startsWith?.('$.')) {
      const enumCompilerName = wfvParamEnum.replace('$.', '')
      wfvParamEnum = await this.wfsynth.compileEnum(enumCompilerName)
    }

    // value is enum index
    if (wfvParamEnum && Array.isArray(wfvParamEnum)) {
      value = wfvParamEnum[Number(rawValue)]
    } else if (this.wflib.wfParamSchema[paramName].type === 'boolean') {
      value = rawValue === 'true'
    }

    await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })

    if (this.wflib.wfParamSchema[paramName].isComfyUiModel && step === 'running') {
      const modelName = String(value.value ?? value)
      const modelData = await this.modelrepo.getModelByName(modelName)

      await this.cloudapilib.vastAiModelInfoLoad({
        baseUrl: ctx.session.instance?.apiUrl,
        instanceId: ctx.session.instance?.id,
        token: ctx.session.instance?.token,
        modelName,
        modelData,
      })
    }

    await this.view.showWfvRunMenu(ctx)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async actionWfvRun (ctx: OwnInstanceContext) {
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

  async actionUseImageAsInput (ctx: OwnInstanceMatchContext) {
    const { workflowVariantId, userId } = ctx.session

    if (!workflowVariantId) {
      return this.tgbotlib.safeAnswerCallback(ctx)
    }

    const imageWorkflowVariantParams = await this.wfrepo.findWorkflowVariantParamsByNameStartsWith({
      workflowVariantId,
      startsWith: 'image',
    })

    if (!imageWorkflowVariantParams.length) {
      return await this.tgbotlib.safeAnswerCallback(ctx)
    }

    const fileId = this.tgbotlib.getImageFileIdFromMessage({ message: ctx.update?.callback_query?.message })
    console.log('HandleOwnITgBot_actionUseImageAsInput_23 fileId', fileId)

    if (fileId) {
      // TODO more than one image param?
      await this.wfrepo.setWorkflowVariantUserParam({
        userId,
        workflowVariantId,
        paramName: imageWorkflowVariantParams[0].paramName,
        value: fileId,
      })
    } else {
      console.log('HandleOwnITgBot_actionUseImageAsInput_34 No fileId found in message')
      await ctx.reply('No image found in message')
    }

    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}