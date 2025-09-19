import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

import { OwnInstanceContext, OwnInstanceMatchContext } from './types'
import { ViewOwnITgBot } from './view.own-i.tg-bot'

import * as kb from '@kb'

@Injectable()
export class HandleOwnITgBot {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
    private readonly view: ViewOwnITgBot,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
  ) {}

  commandStart (ctx: OwnInstanceContext, next: () => Promise<void>) {
    if (ctx.session.way !== 'own-instance') {
      return next()
    }

    const step = ctx.session.step

    if (step === 'start') {
      this.view.showInstanceSearchParamsMenu(ctx)
    } else if (['loading', 'running'].includes(step)) {
      if (ctx.session.workflowId) {
        this.view.showWorkflowRunMenu(ctx)
      } else {
        this.view.showInstanceManageMenu(ctx)
      }
    } else {
      this.view.showInstanceSearchParamsMenu(ctx)
    }
  }

  textMessage (ctx, next) {
    if (ctx.session.way === 'own-instance') {
      const message = ctx.message.text
        .replace(/\r\n/g, '\n')     // Windows → Unix переносы
        .replace(/\n+/g, ' ')       // убираем лишние переводы строк
        .replace(/\s+/g, ' ')       // схлопываем все пробелы/табы
        .trim()

      if (ctx.session.inputWaiting?.startsWith('act:own-i:workflow-param:')) {
        const paramName = ctx.session.inputWaiting.replace('act:own-i:workflow-param:', '')
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

  actionSetSearchOfferParams(ctx: OwnInstanceMatchContext) {
    const [name, value] = ctx.match[1].split(':')

    const menuMap = {
      'gpu': kb.OWN_INSTANCE_GPU_MENU,
      'geolocation': kb.OWN_INSTANCE_GEOLOCATION_MENU,
      'inDataCenterOnly': kb.OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU,
    }

    if (value) {
      ctx.session[name] = value
      this.view.showInstanceSearchParamsMenu(ctx)
    } else {
      ctx.editMessageText(`Select "${name}":`, this.tgbotlib.generateInlineKeyboard(menuMap[name]))
      this.tgbotlib.safeAnswerCallback(ctx)
    }
  }

  async actionSearchOffers(ctx: OwnInstanceContext) {
    const gpu = ctx.session.gpu
    const selectedGeo = ctx.session.geolocation
    const inDataCenterOnly = ctx.session.inDataCenterOnly === 'true'

    let geolocation: string[] | undefined

    if (selectedGeo.length === 2) {
      geolocation = [selectedGeo]
    } else if (selectedGeo === 'europe') {
      geolocation = ['RU', 'SE', 'GB', 'PL', 'PT', 'SI', 'DE', 'IT', 'LT', 'GR', 'FI', 'IS', 'AT', 'FR', 'RO', 'MD', 'HU', 'NO', 'MK', 'BG', 'ES', 'CH', 'HR', 'NL', 'CZ', 'EE']
    } else if (selectedGeo === 'north-america') {
      geolocation = ['US', 'CA']
    }

    const result = await this.vastlib.importOffers({ gpu, geolocation, inDataCenterOnly })
    const offers = result.offers

    const message = 'Результаты поиска:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceOffersMenu(offers))


    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  actionOfferSelect (ctx: OwnInstanceMatchContext) {
    const offerId = ctx.match[1]

    ctx.session.offerId = Number(offerId)

    this.tgbotlib.safeAnswerCallback(ctx)
    this.view.showInstanceCreateMenu(ctx)
  }

  async actionInstanceCreate (ctx: OwnInstanceContext) {
    const step = ctx.session.step
    const offerId = ctx.session.offerId

    if (!offerId || step !== 'start') {
      ctx.reply('Error way', { offerId, step } as any)
      return
    }

    const result = await this.vastlib.createInstance({
      offerId,
      env: {
        'TG_CHAT_ID': ctx.chat?.id.toString(),
        'COMFY_UI_ARCHIVE_FILE': 'comfyui-portable-cu128-py312-v0.tar.zst', // todo: make it configurable
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
    const comfyuiPort = instance.ports?.['8188/tcp']?.[0]?.HostPort || 'N/A'
    const rclonePort = instance.ports?.['5572/tcp']?.[0]?.HostPort || 'N/A'
    const instanceApiPort = instance.ports?.['3042/tcp']?.[0]?.HostPort || 'N/A'

    ctx.session.instanceToken = instance.jupyter_token || 'N/A'
    ctx.session.instanceIp = ipAddress
    ctx.session.instanceComfyuiPort = comfyuiPort
    ctx.session.instanceRclonePort = rclonePort
    ctx.session.instanceApiPort = instanceApiPort

    if (instance.actual_status === 'running') {
      ctx.session.step = 'running'
    }

    const comfyuiLink =`http://${ipAddress}:${comfyuiPort}?token=${token}`
    const appsMenuLink =`http://${ipAddress}:${instance.ports?.['1111/tcp']?.[0]?.HostPort || 'N/A'}` +
      `?token=${token}`

    const startDate = new Date(Math.round(((instance.start_date || 0) * 1000))).toLocaleString()

    const message = `🖥️ *Instance #${instance.id}*\n\n` +
      `📊 *Status:* ${instance.actual_status || 'unknown'}\n` +
      `📊 *State:* ${instance.cur_state || 'unknown'}\n` +
      `🏷️ *Label:* ${instance.label || 'No label'}\n` +
      `💾 *Image:* ${instance.image_uuid || 'N/A'}\n` +
      `🌐 *Host:* ${instance.public_ipaddr || 'N/A'}\n` +
      `🖥️ *GPU:* ${instance.gpu_name || 'N/A'}\n` +
      `💰 *Price:* $${(instance.dph_total?.toFixed(2)) || '0'}/hour\n` +
      `⏰ *Start at:* ${startDate}\n (duration: ${instance.duration})` +
      // `💸 *Total Cost:* $${((instance.duration || 0) / 3600 * (instance.dph_total || 0)).toFixed(2)}` + `\n` +
      `🔗 *Apps Menu Link:* [-->>](${appsMenuLink})\n` +
      `🔗 *ComfyUI Link:* [${comfyuiLink}](${comfyuiLink})\n`

    this.tgbotlib.safeAnswerCallback(ctx)
    const keyboard = this.tgbotlib.generateInlineKeyboard([
      [[`⬅️ Back`, 'act:own-i:manage'], [`🔄 Refresh`, 'act:own-i:status']],
    ])

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  async actionInstanceDestroy (ctx: OwnInstanceContext) {
    const instanceId = ctx.session.instanceId

    const result = await this.vastlib.destroyInstance({ instanceId })
    delete ctx.session.instanceId
    ctx.session.step = 'start'

    this.tgbotlib.safeAnswerCallback(ctx)

    this.view.showInstanceSearchParamsMenu(ctx)
  }

  async actionWorkflowRun (ctx: OwnInstanceContext) {
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

  actionWorkflowParamSelect (ctx: OwnInstanceMatchContext) {
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

  async actionWorkflowSelect (ctx: OwnInstanceMatchContext) {
    const step = ctx.session.step

    if (!['running', 'loading'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const [,workflowId] = ctx.match

    if (workflowId === ctx.session.workflowId) {
      this.view.showWorkflowRunMenu(ctx)
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

    this.view.showWorkflowRunMenu(ctx)
  }
}