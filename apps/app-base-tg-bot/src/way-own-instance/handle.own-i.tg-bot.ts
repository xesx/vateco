import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext, OwnInstanceMatchContext } from './types'
import { ViewOwnITgBot } from './view.own-i.tg-bot'

import * as kb from '@kb'
import { GEOLOCATION } from '@const'

@Injectable()
export class HandleOwnITgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
    private readonly view: ViewOwnITgBot,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,

    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  commandStart (ctx: OwnInstanceContext, next: () => Promise<void>) {
    if (ctx.session.way !== 'own-instance') {
      return next()
    }

    const step = ctx.session.step

    if (step === 'start') {
      this.view.showOfferParamsMenu(ctx)
    } else if (['loading', 'running'].includes(step)) {
      if (ctx.session.workflowId) {
        this.view.showWorkflowRunMenu(ctx)
      } else {
        this.view.showInstanceManageMenu(ctx)
      }
    } else {
      this.view.showOfferParamsMenu(ctx)
    }
  }

  textMessage (ctx, next) {
    if (ctx.session.way !== 'own-instance') {
      return next()
    }

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
      const message = this.msglib.genMessageForCopy(prompt)
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

    return next()
  }

  async photo (ctx, next) {
    if (ctx.session.way === 'own-instance') {
      return next()
    }

    let paramKey = ctx.session.inputWaiting

    if (!paramKey) {
      const imageWfParamKeys = Object.keys(ctx.session.workflowParams)
        .filter(key => key.includes('image'))
      paramKey = imageWfParamKeys[0]
    }

    const fileId = this.tgbotlib.getImageFileIdFromMessage({ message: ctx.message })
    console.log('HandleOwnITgBot_photo_23 fileId', fileId)

    // TODO more than one image param?
    if (fileId) {
      ctx.session.workflowParams[paramKey] = fileId
    }

    delete ctx.session.inputWaiting
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  actionOffer (ctx: OwnInstanceContext) {
    ctx.session.offer = ctx.session.offer || {}
    this.view.showOfferParamsMenu(ctx)
  }

  actionSetSearchOfferParams(ctx: OwnInstanceMatchContext) {
    const [name, value] = ctx.match[1].split(':')

    const menuMap = {
      'gpu': kb.OWN_INSTANCE_GPU_MENU,
      'geolocation': kb.OWN_INSTANCE_GEOLOCATION_MENU,
      'inDataCenterOnly': kb.OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU,
    }

    if (value) {
      Object.assign(ctx.session.offer || {}, { [name]: value })
      this.view.showOfferParamsMenu(ctx)
    } else {
      ctx.editMessageText(`Select "${name}":`, this.tgbotlib.generateInlineKeyboard(menuMap[name]))
      this.tgbotlib.safeAnswerCallback(ctx)
    }
  }

  async actionSearchOffers(ctx: OwnInstanceContext) {
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


    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  actionOfferSelect (ctx: OwnInstanceMatchContext) {
    const offerId = ctx.match[1]

    Object.assign(ctx.session.offer || {}, { id: offerId })

    this.tgbotlib.safeAnswerCallback(ctx)
    this.view.showInstanceCreateMenu(ctx)
  }

  async actionInstanceCreate (ctx: OwnInstanceContext) {
    const step = ctx.session.step
    const offerId = ctx.session.offer?.id
    const chatId = ctx.chat?.id

    if (!offerId || step !== 'start') {
      ctx.reply('Error way', { offerId, step } as any)
      return
    }

    const result = await this.vastlib.createInstance({
      offerId,
      clientId: 'base_' + chatId,
      env: {
        'TG_CHAT_ID': chatId?.toString(),
        // 'COMFY_UI_ARCHIVE_FILE': 'comfyui-cu128-py312-iface-v2.tar.zst',
        'COMFY_UI_ARCHIVE_FILE': 'comfyui-cu128-py312-v2.tar.zst', // todo: make it configurable
      },
    })

    ctx.session.step = 'loading'
    ctx.session.instanceId = result.new_contract

    this.view.showInstanceManageMenu(ctx)
  }

  async actionInstanceStatus (ctx: OwnInstanceContext) {
    const step = ctx.session.step || '__undefined__'
    const instanceId = ctx.session.instanceId

    if (!['loading', 'running'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const instance = await this.vastlib.showInstance({ instanceId })

    const token = instance.jupyter_token || 'N/A'
    const ipAddress = instance.public_ipaddr || 'N/A'
    const instanceApiPort = instance.ports?.['3042/tcp']?.[0]?.HostPort || 'N/A'
    const instanceAppPort = instance.ports?.['1111/tcp']?.[0]?.HostPort

    if (instanceApiPort === 'N/A' || ipAddress === 'N/A') {
      console.log('WayOwnInstance_actionInstanceStatus_31 instanceApiPort not found, instance:', JSON.stringify(instance))
      await ctx.reply('Error getting instance status: API port or IP address not found')
      return
    }

    ctx.session.instanceToken = instance.jupyter_token || 'N/A'
    ctx.session.instanceIp = ipAddress
    ctx.session.instanceApiPort = instanceApiPort
    ctx.session.instanceApiUrl = `http://${ipAddress}:${instanceApiPort}`

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

    this.tgbotlib.safeAnswerCallback(ctx)
    const keyboard = this.tgbotlib.generateInlineKeyboard([
      [[`⬅️ Back`, 'act:own-i:instance:manage'], [`🔄 Refresh`, 'act:own-i:instance:status']],
    ])

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  async actionInstanceDestroy (ctx: OwnInstanceContext) {
    const instanceId = ctx.session.instanceId

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

    delete ctx.session.instanceId
    ctx.session.step = 'start'

    ctx.sendMessage('Instance destroyed')
    this.tgbotlib.safeAnswerCallback(ctx)

    this.view.showOfferParamsMenu(ctx)
  }

  async actionWorkflowRun (ctx: OwnInstanceContext) {
    const workflowId = ctx.session.workflowId

    await this.cloudapilib.vastAiWorkflowRun({
      baseUrl: `http://${ctx.session.instanceIp}:${ctx.session.instanceApiPort}`,
      instanceId: ctx.session.instanceId,
      token: ctx.session.instanceToken,
      count: ctx.session.workflowParams.generationNumber || 1,
      workflowId,
      workflowParams: ctx.session.workflowParams,
    })

    this.tgbotlib.safeAnswerCallback(ctx)
  }

  actionWorkflowParamSelect (ctx: OwnInstanceMatchContext) {
    const [,workflowId, param] = ctx.match
    const [paramName, value] = param.split(':')

    const workflow = this.wflib.getWorkflow(workflowId)
    const wfParam = workflow?.params[paramName]
    const currentValue = ctx.session.workflowParams[paramName]

    if (value) {
      if (wfParam.enum) { // value is enum index
        ctx.session.workflowParams[paramName] = wfParam.enum[value]
      } else {
        ctx.session.workflowParams[paramName] = value
      }

      this.view.showWorkflowRunMenu(ctx)
      return
    }

    if (wfParam.enum) {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`
      const enumOptions: [string, string][][] = wfParam.enum
        .map((value: any) => typeof value === 'object' ? value.label : String(value))
        .map((value, i) => [[value, `act:own-i:wf:${workflowId}:param:${paramName}:${i}`]])

      enumOptions.push([['Back', `act:own-i:wf:${workflowId}`]])

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

    if (wfParam.type === 'boolean') {
      const message = `Set parameter *"${paramName}"*\nCurrent value: *"${currentValue}"*`
      const keyboard = this.tgbotlib.generateInlineKeyboard([
        [['True', `act:own-i:wf:${workflowId}:param:${paramName}:true`], ['False', `act:own-i:wf:${workflowId}:param:${paramName}:false`]],
        [['Back', `act:own-i:wf:${workflowId}`]],
      ])
      this.tgbotlib.reply(ctx, message, keyboard)
      return
    }
  }

  async actionWorkflowSelect (ctx: OwnInstanceMatchContext) {
    const step = ctx.session.step

    if (!['running', 'loading'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const [,workflowId] = ctx.match

    const wfVariantParams = await this.wfrepo.getWorkflowVariantUserParams(workflowId)
    console.log('\x1b[36m', 'wfVariantParams', wfVariantParams, '\x1b[0m')
    ctx.session.workflowParams = this.wflib.getWfParamsForSession({ workflowId })

    if (workflowId === ctx.session.workflowId) {
      this.view.showWorkflowRunMenu(ctx)
      return
    }

    ctx.session.workflowId = workflowId

    await this.cloudapilib.vastAiWorkflowLoad({
      baseUrl: `http://${ctx.session.instanceIp}:${ctx.session.instanceApiPort}`,
      instanceId: ctx.session.instanceId,
      token: ctx.session.instanceToken,
      workflowId
    })

    this.view.showWorkflowRunMenu(ctx)

    const replyKeyboard = this.tgbotlib.generateReplyKeyboard(kb.WORKFLOW_REPLY)
    ctx.sendMessage('Use for fast work ⤵', replyKeyboard)
  }

  async actionUseImageAsInput (ctx: OwnInstanceMatchContext) {
    if (!ctx.session.workflowId) {
      return this.tgbotlib.safeAnswerCallback(ctx)
    }

    const imageWfParamKeys = Object.keys(ctx.session.workflowParams)
      .filter(key => key.includes('image'))

    if (!imageWfParamKeys.length) {
      return this.tgbotlib.safeAnswerCallback(ctx)
    }

    const fileId = this.tgbotlib.getImageFileIdFromMessage({ message: ctx.update?.callback_query?.message })
    console.log('HandleOwnITgBot_actionUseImageAsInput_23 fileId', fileId)

    // TODO more than one image param?
    if (fileId) {
      ctx.session.workflowParams[imageWfParamKeys[0]] = fileId
    }

    this.tgbotlib.safeAnswerCallback(ctx)
  }
}