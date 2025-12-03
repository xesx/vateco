import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext, OwnInstanceMatchContext } from './types'
import { ViewOwnITgBot } from './view.own-i.tg-bot'
import { CommonHandlerOwnITgBot } from './common-handler.own-i.tg-bot'

import { WorkflowSynthService } from '@synth'

import * as kb from '@kb'
import { GEOLOCATION } from '@const'

@Injectable()
export class ActionOwnITgBot {
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

  async actionOffer (ctx: OwnInstanceContext) {
    ctx.session.offer = ctx.session.offer || {}
    await this.view.showOfferParamsMenu(ctx)
  }

  async actionSetSearchOfferParams (ctx: OwnInstanceMatchContext) {
    const [name, value] = ctx.match[1].split(':')

    const menuMap = {
      'gpu': kb.OWN_INSTANCE_GPU_MENU,
      'geolocation': kb.OWN_INSTANCE_GEOLOCATION_MENU,
      'inDataCenterOnly': kb.OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU,
    }

    if (value) {
      Object.assign(ctx.session.offer || {}, { [name]: value })
      await this.view.showOfferParamsMenu(ctx)
    } else {
      await ctx.editMessageText(`Select "${name}":`, this.tgbotlib.generateInlineKeyboard(menuMap[name]))
      await this.tgbotlib.safeAnswerCallback(ctx)
    }
  }

  async actionSearchOffers (ctx: OwnInstanceContext) {
    const gpu = ctx.session.offer?.gpu ?? 'any'
    const selectedGeo = ctx.session.offer?.geolocation ?? 'any'
    const inDataCenterOnly = ctx.session.offer?.inDataCenterOnly === 'true'

    let geolocation: string[] | undefined

    if (GEOLOCATION[selectedGeo]) {
      geolocation = [selectedGeo]
    } else {
      geolocation = Object.entries(GEOLOCATION)
        .filter(([,value]) => value.region === selectedGeo)
        .map(([key]) => key)
    }

    const result = await this.vastlib.importOffers({ gpu, geolocation, inDataCenterOnly })
    const offers = result.offers

    const message = 'Search results:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceOffersMenu(offers))


    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async actionOfferSelect (ctx: OwnInstanceMatchContext) {
    const offerId = ctx.match[1]

    Object.assign(ctx.session.offer || {}, { id: offerId })

    await this.tgbotlib.safeAnswerCallback(ctx)
    await this.view.showInstanceCreateMenu(ctx)
  }

  async actionWfvList (ctx: OwnInstanceContext) {
    delete ctx.session.workflowVariantId
    await this.tgbotlib.removeReplyKeyboard(ctx)

    await this.view.showWfvList(ctx)

    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async actionInstanceCreate (ctx: OwnInstanceContext) {
    const step = ctx.session.step
    const offerId = ctx.session.offer?.id
    const chatId = ctx.chat?.id

    if (!offerId || step !== 'start') {
      await ctx.reply('Error way', { offerId, step } as any)
      return
    }

    const result = await this.vastlib.createInstance({
      offerId,
      clientId: 'base_' + chatId,
      env: {
        'TG_CHAT_ID': chatId?.toString(),
        // 'COMFY_UI_ARCHIVE_FILE': 'comfyui-cu128-py312-iface-v2.tar.zst',
        'COMFY_UI_ARCHIVE_FILE': 'comfyui-cu128-py312-v3.tar.zst', // todo: make it configurable
      },
    })

    ctx.session.step = 'loading'
    ctx.session.instance = { id: result.new_contract }

    await this.view.showInstanceManageMenu(ctx)
  }

  async actionInstanceManage (ctx: OwnInstanceContext) {
    await this.view.showInstanceManageMenu(ctx)
  }


  async actionInstanceStatus (ctx: OwnInstanceContext) {
    const step = ctx.session.step || '__undefined__'
    const instanceId = ctx.session.instance?.id

    if (!['loading', 'running'].includes(step)) {
      await ctx.deleteMessage()
      return
    }

    if (!ctx.session.instance || !instanceId) {
      console.log('WayOwnInstance_actionInstanceStatus_24 No instanceId in session')
      await ctx.reply('Error getting instance status: no instance ID in session')
      return
    }

    const instance = await this.vastlib.importInstanceInfo(instanceId)

    const token = instance.jupyter_token || 'N/A'
    const ipAddress = instance.public_ipaddr || 'N/A'
    const instanceApiPort = instance.ports?.['3042/tcp']?.[0]?.HostPort || 'N/A'
    const instanceAppPort = instance.ports?.['1111/tcp']?.[0]?.HostPort

    if (instanceApiPort === 'N/A' || ipAddress === 'N/A') {
      console.log('WayOwnInstance_actionInstanceStatus_31 instanceApiPort not found, instance:', JSON.stringify(instance))
    }

    ctx.session.instance.token = instance.jupyter_token
    ctx.session.instance.ip = ipAddress
    ctx.session.instance.apiPort = instanceApiPort
    ctx.session.instance.apiUrl = `http://${ipAddress}:${instanceApiPort}`

    if (instance.actual_status === 'running') {
      ctx.session.step = 'running'
    }

    const appsMenuLink = instanceAppPort && `http://${ipAddress}:${instanceAppPort}?token=${token}`

    const startDate = new Date(Math.round(((instance.start_date || 0) * 1000))).toLocaleString()

    const message = `🖥️ *Instance #${instance.id}*\n`
      + `\n📊 *Status:* ${instance.actual_status || 'unknown'}`
      + `\n📊 *State:* ${instance.cur_state || 'unknown'}`
      + `\n🖥️ *GPU:* ${instance.gpu_name || 'N/A'}`
      + `\n💰 *Price:* $${(instance.dph_total?.toFixed(2)) || '0'}/hour`
      + `\n⏰ *Start at:* ${startDate}\n (duration: ${((Date.now() / 1000 - (instance.start_date || 0)) / 60 / 60).toFixed(2)} hrs)`
      + `\n⏰ *Remaining:* ${((instance.duration ?? 0) / (60 * 60 * 24)).toFixed(2)} days)`
      + (appsMenuLink ? `\n🔗 *Apps Menu Link:* [-->>](${appsMenuLink})`: '')

    await this.tgbotlib.safeAnswerCallback(ctx)
    const keyboard = this.tgbotlib.generateInlineKeyboard([
      [[`⬅️ Back`, 'act:own-i:instance:manage'], [`🔄 Refresh`, 'act:own-i:instance:status']],
    ])

    await this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  async actionInstanceDestroy (ctx: OwnInstanceContext) {
    const instanceId = ctx.session.instance?.id

    try {
      const result = await this.vastlib.destroyInstance({ instanceId })
      console.log('HandleOwnITgBot_actionInstanceDestroy_10', result)
    } catch (error) {
      console.log('HandleOwnITgBot_actionInstanceDestroy_13', this.h.herr.parseAxiosError(error))

      if (error.response?.data?.error === 'no_such_instance') {
        console.log('HandleOwnITgBot_actionInstanceDestroy_31 Instance already destroyed')
      } else {
        console.log('HandleOwnITgBot_actionInstanceDestroy_37 Unexpected error on destroy instance')
        return
      }
    }

    delete ctx.session.instance
    ctx.session.step = 'start'

    await ctx.sendMessage('Instance destroyed')
    await this.tgbotlib.safeAnswerCallback(ctx)

    await this.view.showOfferParamsMenu(ctx)
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
    await this.common.runWfv(ctx)
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