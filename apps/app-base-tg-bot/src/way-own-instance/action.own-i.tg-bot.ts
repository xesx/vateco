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

    // const keyboard = await this.wfsynth.generateWorkflowVariantRunMenu({ workflowVariantId, userId, })

    await this.view.showWfvRunMenu(ctx)
    await this.view.showWfvReplyMenu(ctx)

    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async actionWfvParamSelect (ctx: OwnInstanceMatchContext) {
    const { wfParamSchema } = this.wflib

    const [,workflowVariantParamId] = ctx.match
    // const [paramName, rawValue] = param.split(':')

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

    // set value
    // if (rawValue) {
    //   const value = wfvParamEnum ? wfvParamEnum[Number(rawValue)] : rawValue
    //   // value is enum index
    //   await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })
    //
    //   if (wfParamSchema[paramName].isComfyUiModel) {
    //     const modelName = String(value.value ?? value)
    //     const modelData = await this.modelrepo.getModelByName(modelName)
    //
    //     await this.cloudapilib.vastAiModelInfoLoad({
    //       baseUrl: ctx.session.instance?.apiUrl,
    //       instanceId: ctx.session.instance?.id,
    //       token: ctx.session.instance?.token,
    //       modelName,
    //       modelData,
    //     })
    //   }
    //
    //   await this.view.showWfvRunMenu(ctx)
    //   return
    // }

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
          const button = [value, `act:own-i:wf:${workflowVariantId}:param:${paramName}:${i}`]
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

      enumOptions.push([['Back', `act:own-i:wf:${workflowVariantId}`]])

      const keyboard = this.tgbotlib.generateInlineKeyboard(enumOptions)
      await this.tgbotlib.reply(ctx, message, keyboard)
      return
    }

    // suggest boolean value (true/false)
    if (wfvParamType === 'boolean') {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`
      const keyboard = this.tgbotlib.generateInlineKeyboard([
        [
          ['True', `act:own-i:wf:${workflowVariantId}:param:${paramName}:true`],
          ['False', `act:own-i:wf:${workflowVariantId}:param:${paramName}:false`]
        ],
        [['Back', `act:own-i:wf:${workflowVariantId}`]],
      ])
      await this.tgbotlib.reply(ctx, message, keyboard)
      return
    }

    // suggest value form text input
    ctx.session.inputWaiting = paramName
    await this.tgbotlib.safeAnswerCallback(ctx)

    const message = this.msglib.genCodeMessage(String(currentValue))
    await this.tgbotlib.reply(ctx, message , { parse_mode: 'HTML' })
  }
}