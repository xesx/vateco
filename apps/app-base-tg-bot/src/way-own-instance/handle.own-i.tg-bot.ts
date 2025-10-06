import axios from 'axios'
import * as FormData from 'form-data'

import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

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
    if (ctx.session.way === 'own-instance') {
      const message = ctx.message.text
        .replace(/\r\n/g, '\n')     // Windows → Unix переносы
        .replace(/\n+/g, ' ')       // убираем лишние переводы строк
        .replace(/\s+/g, ' ')       // схлопываем все пробелы/табы
        .trim()

      if (message === '🚀 Generate') {
        return this.actionWorkflowRun(ctx)
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

  async photo (ctx, next) {
    if (ctx.session.way === 'own-instance') {
      const photos = ctx.message.photo
      const bestPhoto = photos.at(-1) // самое большое фото
      const fileId = bestPhoto.file_id

      const fileLink = await ctx.telegram.getFileLink(fileId)
      console.log("Ссылка на фото:", fileLink.href)

      // Качаем фото с Telegram
      const tgRes = await axios.get(fileLink.href, { responseType: 'stream' })

      // Оборачиваем в FormData
      const form = new FormData()
      form.append('file', tgRes.data, { filename: `${fileId}.jpg`, contentType: 'image/jpeg' })

      // Отправляем на API NestJS
      const res = await this.cloudapilib.vastAiUploadInputImage({
        baseUrl: ctx.session.instanceApiUrl,
        instanceId: ctx.session.instanceId,
        token: ctx.session.instanceToken,
        form
      })

      console.log("Файл успешно отправлен на API:", res)

      const filename = res.filename || 'N/A'

      if (ctx.session.inputWaiting) {
        const paramName = ctx.session.inputWaiting
        ctx.session.workflowParams[paramName] = filename

        delete ctx.session.inputWaiting

        return this.view.showWorkflowRunMenu(ctx)
      }

      if (ctx.session.workflowParams?.image) {
        ctx.session.workflowParams.image = filename
        // return this.actionWorkflowRun(ctx)
        return this.view.showWorkflowRunMenu(ctx)
      }
    }

    return next()
  }

  actionOffer (ctx: OwnInstanceContext) {
    ctx.session.workflowParams = {}
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
      ctx.session[name] = value
      this.view.showOfferParamsMenu(ctx)
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
      clientId: 'base_' + ctx.session.chatId,
      env: {
        'TG_CHAT_ID': ctx.chat?.id.toString(),
        'COMFY_UI_ARCHIVE_FILE': 'comfyui-cu128-py312-insightface-v2.tar.zst', // todo: make it configurable
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
      if (wfParam.enum) {
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
  }

  async actionWorkflowSelect (ctx: OwnInstanceMatchContext) {
    const step = ctx.session.step

    if (!['running', 'loading'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const [,workflowId] = ctx.match

    const workflow = this.wflib.getWorkflow(workflowId)
    const params = workflow.params

    ctx.session.workflowParams = {}

    Object.entries(params).forEach(([name, props]) => {
      if (props.user !== true) {
        return
      }

      // установим значение по умолчанию, если параметр не задан
      ctx.session.workflowParams[name] = ctx.session.workflowParams[name] || props?.value || props?.default
    })

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
  }
}