import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'
import { AppBaseTgBotService } from './app-base-tg-bot.service'

@Injectable()
export class HandlerActionTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotsrv: AppBaseTgBotService,

    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly vastlib: lib.VastLibService,
    private readonly msglib: lib.MessageLibService,

    private readonly wfsynth: synth.WorkflowSynthService,
    private readonly offersynth: synth.OfferSynthService,
    private readonly instancesynth: synth.InstanceSynthService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,
    private readonly tagrepo: repo.TagRepository,
    private readonly setuprepo: repo.SetupRepository,
    // private readonly userrepo: repo.UserRepository,
  ) {
    this.bot.action('main-menu', (ctx) => this.mainMenu(ctx))

    this.bot.action('offer:menu', (ctx) => this.offerMenu(ctx))
    this.bot.action(/^offer:param:([a-z]+)$/i, (ctx) => this.offerParamSelect(ctx))
    this.bot.action(/^offer:param:([a-z]+):set:(.+)$/i, (ctx) => this.offerParamSet(ctx))
    this.bot.action('offer:search', (ctx) => this.offerSearch(ctx))
    this.bot.action(/^offer:select:(.+)$/, (ctx) => this.offerSelect(ctx))

    // instance:create:
    this.bot.action(/^instance:create:(.+)$/, (ctx) => this.instanceCreate(ctx))
    this.bot.action('instance:manage', (ctx) => this.instanceManage(ctx))
    this.bot.action('instance:status', (ctx) => this.instanceStatus(ctx))
    this.bot.action('instance:destroy', (ctx) => this.instanceDestroy(ctx))

    this.bot.action('wfv:list', (ctx) => this.wfvList(ctx))
    this.bot.action(/^wfv:([0-9]+)$/, (ctx) => this.wfvSelect(ctx))
    this.bot.action(/^wfv:([0-9]+):run$/, (ctx) => this.wfvRun(ctx))
    this.bot.action(/^wfv:([0-9]+):info$/, (ctx) => this.wfvInfo(ctx))
    this.bot.action(/^wfvp:([0-9]+)$/, (ctx) => this.wfvParamSelect(ctx))
    this.bot.action(/^wfvp:([0-9]+):mtag:(.+):search:([0-9]+)$/, (ctx) => this.wfvParamModelsSearch(ctx)) // select model with tags
    this.bot.action(/^wfvp:([0-9]+):mtag:(.+)$/, (ctx) => this.wfvParamModelTagMenu(ctx)) // select model with tags
    this.bot.action(/^wfvp:([0-9]+):set:(.+)$/, (ctx) => this.wfvParamSet(ctx))
    this.bot.action(/^wfvp:([0-9]+):fset:(.+)$/, (ctx) => this.wfvParamForceSet(ctx)) // force set
    this.bot.action(/^wfvp:([0-9]+):show$/, (ctx) => this.wfvParamShow(ctx)) // force set

    this.bot.action('img-use:wfv-list', (ctx) => this.imageUseWfvList(ctx))
    this.bot.action('img-use:start', (ctx) => this.imageUseStart(ctx))
    this.bot.action(/^img-use:wfv:([0-9]+)$/, (ctx) => this.imageUseInWfv(ctx))
    this.bot.action(/^img-use:wfvp:([0-9]+)$/, (ctx) => this.imageUseInWfvParam(ctx))

    this.bot.action('txt-use:wfv-list', (ctx) => this.textUseWfvList(ctx))
    this.bot.action('txt-use:start', (ctx) => this.textUseStart(ctx))
    this.bot.action(/^txt-use:wfv:([0-9]+)$/, (ctx) => this.textUseInWfv(ctx))

    this.bot.action('message:delete', (ctx) => this.messageDelete(ctx))
  }

  async mainMenu (ctx: TAppBaseTgBotContext) {
    await this.wfsynth.view.showMainMenu({ ctx })
  }

  async offerMenu (ctx) {
    ctx.session.offer = ctx.session.offer || {}
    await this.offersynth.view.showOfferMenu(ctx)
  }

  async offerParamSelect (ctx) {
    const [,offerParamName] = ctx.match
    await this.offersynth.view.showOfferParamMenu({ ctx, offerParamName })
  }

  async offerParamSet (ctx) {
    const [,offerParamName, value] = ctx.match

    Object.assign(ctx.session.offer || {}, { [offerParamName]: value })
    await this.offersynth.view.showOfferMenu(ctx)
  }

  async offerSearch (ctx) {
    const gpu = ctx.session.offer?.gpu ?? 'any'
    const geo = ctx.session.offer?.geolocation ?? 'any'
    const inDataCenterOnly = ctx.session.offer?.inDataCenterOnly === 'true'

    const offers = await this.offersynth.searchOffers({ geo, gpu, inDataCenterOnly })
    await this.offersynth.view.showOffersList({ ctx, offers })
  }

  async offerSelect (ctx) {
    const [,offerId] = ctx.match
    Object.assign(ctx.session.offer || {}, { id: offerId })

    await this.instancesynth.view.showInstanceCreateMenu({ ctx, offerId })
  }

  async instanceCreate (ctx) {
    const [,offerId] = ctx.match
    const { telegramId } = ctx.session

    const comfyuiPortableVersion = await this.setuprepo.getSetting({ name: 'comfyui_portable_version' })

    const result = await this.vastlib.createInstance({
      offerId,
      clientId: 'base_' + telegramId,
      env: {
        'TG_CHAT_ID': telegramId?.toString(),
        // 'COMFY_UI_ARCHIVE_FILE': 'comfyui-cu128-py312-iface-v8.tar.zst',
        'COMFY_UI_ARCHIVE_FILE': comfyuiPortableVersion,
      },
    })

    ctx.session.instance = { id: result.new_contract }

    await this.instancesynth.view.showInstanceManageMenu({ ctx })
  }

  async instanceManage (ctx) {
    const { instance } = ctx.session

    if (instance) {
      await this.instancesynth.view.showInstanceManageMenu({ ctx })
    } else {
      await this.wfsynth.view.showMainMenu({ ctx })
    }
  }

  async instanceStatus (ctx) {
    const instanceId = ctx.session.instance?.id

    if (!instanceId) {
      console.log('WayOwnInstance_actionInstanceStatus_24 No instanceId in session')
      await this.tgbotlib.reply(ctx, 'Error getting instance status: no instance ID in session')
      return
    }

    const {
      token,
      ipAddress,
      instanceApiPort,
      apiUrl,
      appsMenuLink,
      startDate,
      durationInHrs,
      status,
      state,
      gpu,
    } = await this.instancesynth.importInstanceInfo({ instanceId })

    ctx.session.instance.token = token
    ctx.session.instance.ip = ipAddress
    ctx.session.instance.apiPort = instanceApiPort
    ctx.session.instance.apiUrl = apiUrl

    await this.instancesynth.view.showInsatanceStatus({
      ctx,
      instanceId,
      status,
      state,
      gpu,
      startDate,
      durationInHrs,
      appsMenuLink,
    })
  }

  async instanceDestroy (ctx) {
    const instanceId = ctx.session.instance?.id
    delete ctx.session.instance

    try {
      const result = await this.vastlib.destroyInstance({ instanceId })
      console.log('HandleOwnITgBot_actionInstanceDestroy_10', result)
    } catch (error) {
      // console.log('HandleOwnITgBot_actionInstanceDestroy_13', this.h.herr.parseAxiosError(error))

      if (error.response?.data?.error === 'no_such_instance') {
        console.log('HandleOwnITgBot_actionInstanceDestroy_31 Instance already destroyed')
      } else {
        console.log('HandleOwnITgBot_actionInstanceDestroy_37 Unexpected error on destroy instance')
        return
      }
    }

    await this.tgbotlib.safeAnswerCallback(ctx)
    await ctx.sendMessage('Instance destroyed')

    await this.offersynth.view.showOfferMenu(ctx)
  }

  async wfvList (ctx) {
    const { instance } = ctx.session

    if (instance) {
      await this.wfsynth.view.showWfvList({ ctx, tags: ['enable', 'new'], prefixAction: '', backAction: 'instance:manage' })
      return
    }

    await this.wfsynth.view.showWfvList({ ctx, tags: ['own-instance', 'new'], prefixAction: '', backAction: 'main-menu' })
  }

  async wfvSelect (ctx) {
    const [,workflowVariantIdStr] = ctx.match
    const workflowVariantId = parseInt(workflowVariantIdStr, 10)
    const { userId } = ctx.session

    await this.tgbotsrv.selectWfv({ ctx, workflowVariantId })

    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
    await this.wfsynth.view.showWfvReplyMenu(ctx)
  }

  async wfvParamSelect (ctx) {
    const [,wfvParamId] = ctx.match
    const { userId } = ctx.session

    const {
      paramName,
      wfvParam: { label },
      workflowVariantId,
      wfvParamType,
      currentValue,
      wfvParamEnum
    } = await this.wfsynth.param.getWfvUserParamInfo({ wfvParamId, userId })

    if (wfvParamEnum) {
      let enumArr = wfvParamEnum

      if (typeof wfvParamEnum === 'string') {
        if (wfvParamEnum.startsWith('$.enumModelTag')) {
          enumArr = await this.wfsynth.compileEnum(wfvParamEnum) as any[]

          await this.wfsynth.view.showWfvEnumMenu({
            ctx,
            message: `Select model tags:`,
            enumArr,
            prefixAction: `wfvp:${wfvParamId}:mtag`,
            // backAction: `wfv:${workflowVariantId}`,
            extraActions: [
              ['Search', `wfvp:${wfvParamId}:mtag:all:search:0`],
              ['Back', `wfv:${workflowVariantId}`]
            ],
            useIndexAsValue: false,
          })

          return
        } else if (wfvParamEnum.startsWith('$.enum')) {
          enumArr = await this.wfsynth.compileEnum(wfvParamEnum)
        }
      }

      if (Array.isArray(enumArr)) {
        await this.wfsynth.view.showWfvEnumMenu({
          ctx,
          message: `Current value: **${String(currentValue)}** \nSelect new value:`,
          enumArr,
          prefixAction: `wfvp:${wfvParamId}:set`,
          backAction: `wfv:${workflowVariantId}`,
        })
        return
      }
    }

    // suggest boolean value (true/false)
    if (wfvParamType === 'boolean') {
      await this.wfsynth.param.toggleWfvUserParamBoolean({ userId, wfvParamId })
      await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
      return
    }

    // suggest value form text input
    ctx.session.inputWaiting = paramName
    await this.wfsynth.view.showSuggestInputWfvParamValue({ ctx, paramName, label, wfvParamId, currentValue, workflowVariantId })
  }

  async wfvInfo (ctx) {
    const { userId } = ctx.session
    const [,workflowVariantIdStr] = ctx.match

    const workflowVariantId = parseInt(workflowVariantIdStr, 10)
    const workflowVariant = await this.wfrepo.getWorkflowVariant(workflowVariantId)

    let message = `<i>${workflowVariant.description || 'No description available.'}</i>`

    message += `\n\nWorkflow Variant Name: <b>${workflowVariant.name}</b>`
    message += `\nWorkflow Variant ID: <code>${workflowVariant.id}</code>`

    const wfvParams = await this.wfrepo.getWorkflowMergedWorkflowVariantParams({ userId, workflowVariantId })

    for (const param of wfvParams) {
      if (!param.isComfyUiModel) {
        continue
      }

      const value = param.value?.value || param.value

      if (!value || value.length < 3) { // todo
        continue
      }
      const model = await this.modelrepo.getModelByName(value as string)
      const modelCivitaiLink = model.civitaiLinks?.[0]
      const civitaiLinkText = modelCivitaiLink ? `https://civitai.com/models/${modelCivitaiLink.civitaiId}?modelVersionId=${modelCivitaiLink.civitaiVersionId}` : 'N/A'

      message += `\n\nModel Parameter: <b>${param.paramName}</b>`
      message += `\nModel Name: <b>${model.label}</b> (<i>${model.name}</i>, ID: <code>${model.id}</code>)`
      message += `\nComfyUI Directory: <code>${model.comfyUiDirectory}</code>`
      message += `\nBase Model: <code>${model.baseModel}</code>`
      message += `\nCivitAI Link: <a href="${civitaiLinkText}">CivitAi Link</a>`
    }

    await this.tgbotlib.sendMessageV2({ ctx, message, extra: { parse_mode: 'HTML' } })
  }

  async wfvParamModelTagMenu (ctx) {
    const [,wfvParamId, tail] = ctx.match

    const originalTagsIds = tail.split(':').map(id => Number(id))

    let enabledTagsIds = originalTagsIds
    const lastTagId = originalTagsIds.at(-1) || 0

    if (originalTagsIds.slice(0, -1).includes(lastTagId)) {
      enabledTagsIds = originalTagsIds.filter(id => id !== lastTagId)
    }

    const enabledTags = await this.tagrepo.getTagsByIds({ ids: enabledTagsIds })
    const enabledTagsNames = enabledTags.map(tag => tag.name)

    const {
      workflowVariantId,
      wfvParamEnum
    } = await this.wfsynth.param.getWfvParamInfo({ wfvParamId })

    if (typeof wfvParamEnum !== 'string' || !wfvParamEnum?.startsWith?.('$.enumModelTag')) {
      throw new Error(`wfvParamModelTagMenu_198 Unsupported enum type for workflowVariantParamId: ${wfvParamId}`)
    }

    const [,comfyUiDirectory] = wfvParamEnum.split(':')

    let modelTagsNames: string[]

    if (enabledTags.length) {
      modelTagsNames = await this.modelrepo.findUniqueModelTagsRelatedToTags(comfyUiDirectory, enabledTagsNames)
    } else {
      modelTagsNames = await this.modelrepo.findUniqueModelTags(comfyUiDirectory)
    }

    // no more tags to select, show models list
    if (modelTagsNames.length === 0) {
      await this.wfsynth.view.showModelsList({
        ctx,
        comfyUiDirectory,
        tags: enabledTagsNames,
        prefixAction: `wfvp:${wfvParamId}:set`,
        backAction: enabledTags.length > 1
          ? `wfvp:${wfvParamId}:mtag:${originalTagsIds.slice(0, -1).join(':')}`
          : `wfvp:${wfvParamId}`,
      })

      return
    }

    const modelTags = await this.tagrepo.getTagsByNames({ names: modelTagsNames })
    const newModelTags = modelTags.concat(enabledTags)

    const enumArr = newModelTags
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(tag => ({
        label: (enabledTagsNames.includes(tag.name) ? '✅' :'❌') + tag.name,
        value: newModelTags.find(t => t.name === tag.name)?.id || 0,
      }))

    await this.wfsynth.view.showWfvEnumMenu({
      ctx,
      message: `Select model tags:`,
      enumArr,
      prefixAction: `wfvp:${wfvParamId}:mtag:${enabledTagsIds.join(':')}`,
      // backAction: `wfv:${workflowVariantId}`,
      extraActions: [
        ['Search', `wfvp:${wfvParamId}:mtag:${enabledTagsIds.join(':')}:search:0`],
        ['Back', `wfv:${workflowVariantId}`]
      ],
      useIndexAsValue: false,
    })
  }

  async wfvParamModelsSearch (ctx) {
    let [,wfvParamId, tagsIds, page] = ctx.match

    wfvParamId = Number(wfvParamId)
    page = Number(page)

    if (tagsIds === 'all') {
      tagsIds = []
    } else {
      tagsIds = tagsIds.split(':').map(id => Number(id))
    }

    const {
      // workflowVariantId,
      wfvParamEnum
    } = await this.wfsynth.param.getWfvParamInfo({ wfvParamId })

    if (!wfvParamEnum || typeof wfvParamEnum !== 'string' || !wfvParamEnum?.startsWith?.('$.enumModelTag')) {
      throw new Error(`wfvParamModelsSearch_261 No enum for workflowVariantParamId: ${wfvParamId}`)
    }

    const [,comfyUiDirectory] = wfvParamEnum.split(':')

    const tags = await this.tagrepo.getTagsByIds({ ids: tagsIds })
    const tagsNames = tags.map(tag => tag.name)

    await this.wfsynth.view.showModelsList({
      ctx,
      comfyUiDirectory,
      tags: tagsNames,
      page,
      prefixAction: `wfvp:${wfvParamId}:set`,
      backAction: tagsIds.length > 0
        ? `wfvp:${wfvParamId}:mtag:${tagsIds.join(':')}`
        : `wfvp:${wfvParamId}`,
    })
  }

  async wfvParamForceSet (ctx) {
    const [,wfvParamId, value] = ctx.match
    const { userId } = ctx.session

    const { workflowVariantId } = await this.wfsynth.param.getWfvParamInfo({ wfvParamId })

    await this.wfsynth.param.setWfvUserParamValue({ userId, wfvParamId, value })
    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
  }

  async wfvParamSet (ctx) {
    const [,wfvParamId, rawValue] = ctx.match
    const { userId } = ctx.session

    const { wfvParamEnum, workflowVariantId } = await this.wfsynth.param.getWfvParamInfo({ wfvParamId })

    let value: any = rawValue

    if (wfvParamEnum) {
      let enumArr = wfvParamEnum

      if (typeof wfvParamEnum === 'string') {
        if (wfvParamEnum?.startsWith?.('$.enumModelTag')) {
          const model = await this.modelrepo.getModelById(Number(rawValue))
          value = model.name
        } else if (wfvParamEnum?.startsWith?.('$.enum')) {
          enumArr = await this.wfsynth.compileEnum(wfvParamEnum)
        }
      }

      // value is enum index
      if (Array.isArray(enumArr)) {
        value = enumArr[Number(rawValue)]
        value = value.value ?? value
      }
    }

    await this.wfsynth.param.setWfvUserParamValue({ userId, wfvParamId, value })
    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
  }

  async wfvParamShow (ctx) {
    const [,wfvParamId] = ctx.match
    const { userId } = ctx.session

    const { paramName, currentValue } = await this.wfsynth.param.getWfvUserParamInfo({ userId, wfvParamId })

    if (paramName.startsWith('LoadImage:image')) {
      const keyboard = this.tgbotlib.generateInlineKeyboard([[
        [`Use it`, 'img-use:wfv-list'],
        ['Delete', 'message:delete']
      ]])

      await this.tgbotlib.sendPhotoV2({ ctx, photo: currentValue as string, extra: keyboard })
      return
    }

    await this.tgbotlib.sendMessageV2({ ctx, message: currentValue.toString() })
  }

  async wfvRun (ctx) {
    await this.tgbotsrv.runWfv(ctx)
  }

  async textUseStart (ctx) {
    const originalMessageText = ctx.update.callback_query.message.text.replace(/^\\n/, '')
    const message = this.msglib.genMessageForCopy(originalMessageText)

    const keyboard = this.tgbotlib.generateInlineKeyboard([[
      [`Use it`, 'txt-use:wfv-list'],
      ['Delete', 'message:delete']
    ]])

    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard })
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async textUseWfvList (ctx) {
    const { workflowVariantId } = ctx.session

    const originalMessageText = ctx.update.callback_query.message.text.replace(/^\\n/, '')
    const workflowVariants = await this.wfrepo.findWorkflowVariantsByLabel({ label: 'prompt' })

    if (workflowVariants.length === 0) {
      await this.tgbotlib.safeAnswerCallback(ctx)
      return
    }

    const currentWorkflowVariant = workflowVariants.find(wfv => wfv.id === Number(workflowVariantId))
    const otherWorkflowVariants = workflowVariants.filter(wfv => wfv.id !== Number(workflowVariantId))

    const kbRaw: [string, string][][] = []

    if (currentWorkflowVariant) {
      kbRaw.push([['-->Current workflow<--', `txt-use:wfv:${workflowVariantId}`]] as [string, string][])
    }

    for (const wfv of otherWorkflowVariants) {
      kbRaw.push([[wfv.name, `txt-use:wfv:${wfv.id}`]])
    }

    kbRaw.push([['Back', 'txt-use:start'], ['Delete', 'message:delete']])

    const keyboard = this.tgbotlib.generateInlineKeyboard(kbRaw)

    const message = this.msglib.genMessageForCopy(originalMessageText)
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard })
  }

  async textUseInWfv (ctx) {
    const [,workflowVariantId] = ctx.match
    const { telegramId, userId } = ctx.session

    const promptParam = await this.wfrepo.getWorkflowVariantParamByLabel({
      workflowVariantId,
      label: 'prompt',
    })

    const originalMessageText = ctx.update.callback_query.message.text.replace(/^\\n/, '')

    await this.wfsynth.param.setWfvUserParamValue({ userId, wfvParamId: promptParam.id, value: originalMessageText })

    const message = this.msglib.genMessageForCopy(originalMessageText)

    const keyboard = this.tgbotlib.generateInlineKeyboard([[
      [`Use it`, 'txt-use:wfv-list'],
      ['Delete', 'message:delete']
    ]])

    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard })

    await this.tgbotsrv.selectWfv({ ctx, workflowVariantId })
    await this.wfsynth.view.showWfvRunMenu({ chatId: telegramId, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
  }

  async imageUseStart (ctx) {
    const keyboard = this.tgbotlib.generateInlineKeyboard([[
      [`Use it`, 'img-use:wfv-list'],
      ['Delete', 'message:delete']
    ]])

    await ctx.editMessageCaption('', keyboard)

    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async imageUseWfvList (ctx) {
    const { workflowVariantId } = ctx.session

    const workflowVariants = await this.wfrepo.findWorkflowVariantsByParamName({ paramName: 'LoadImage:image:' })

    if (workflowVariants.length === 0) {
      await this.tgbotlib.safeAnswerCallback(ctx)
      return
    }

    const currentWorkflowVariant = workflowVariants.find(wfv => wfv.id === Number(workflowVariantId))
    const otherWorkflowVariants = workflowVariants.filter(wfv => wfv.id !== Number(workflowVariantId))

    const kbRaw: [string, string][][] = []

    if (currentWorkflowVariant) {
      kbRaw.push([['-->Current workflow<--', `img-use:wfv:${workflowVariantId}`]] as [string, string][])
    }

    for (const wfv of otherWorkflowVariants) {
      kbRaw.push([[wfv.name, `img-use:wfv:${wfv.id}`]])
    }

    kbRaw.push([['Back', 'img-use:start'], ['Delete', 'message:delete']])

    const keyboard = this.tgbotlib.generateInlineKeyboard(kbRaw)

    const caption = `select wfv for image use, current wfv: "${currentWorkflowVariant?.name ?? 'none'}"`
    await ctx.editMessageCaption(caption, keyboard)
  }

  async imageUseInWfv (ctx) {
    const [,workflowVariantId] = ctx.match
    const { telegramId, userId } = ctx.session

    const imageWfvParams = await this.wfrepo.findWorkflowVariantParamsByNameStartsWith({
      workflowVariantId,
      startsWith: 'LoadImage:image:',
    })

    if (imageWfvParams.length === 1) {
      const wfvParam = imageWfvParams[0]
      const fileId = this.tgbotlib.getImageFileIdFromMessage({ message: ctx.update?.callback_query?.message })

      if (!fileId) {
        console.log('HandlerActionTgBotService_imageUseInWfv_12 No fileId found in message')
        await ctx.reply('No image found in message')
        await this.tgbotlib.safeAnswerCallback(ctx)
        return
      }

      await this.wfsynth.param.setWfvUserParamValue({ userId, wfvParamId: wfvParam.id, value: fileId })

      const keyboard = this.tgbotlib.generateInlineKeyboard([[
        [`Use it`, 'img-use:wfv-list'],
        ['Delete', 'message:delete']
      ]])

      await ctx.editMessageCaption('', keyboard)

      await this.tgbotsrv.selectWfv({ ctx, workflowVariantId })
      await this.wfsynth.view.showWfvRunMenu({ chatId: telegramId, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
      return
    }

    const keyboard = this.tgbotlib.generateInlineKeyboard([
      ...imageWfvParams.map(wfvp => ([[wfvp.label, `img-use:wfvp:${wfvp.id}`]] as [string, string][])),
      [['Back', 'img-use:wfv-list'], ['Delete', 'message:delete']]
    ])

    const caption = 'select wfv param for image'
    await ctx.editMessageCaption(caption, keyboard)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async imageUseInWfvParam (ctx) {
    const [,wfvParamId] = ctx.match
    const { telegramId, userId } = ctx.session

    const { workflowVariantId } = await this.wfsynth.param.getWfvParamInfo({ wfvParamId })
    const fileId = this.tgbotlib.getImageFileIdFromMessage({ message: ctx.update?.callback_query?.message })

    if (!fileId) {
      console.log('HandlerActionTgBotService_imageUseInWfvParam_13 No fileId found in message')
      await ctx.reply('No image found in message')
      await this.tgbotlib.safeAnswerCallback(ctx)
      return
    }

    await this.wfsynth.param.setWfvUserParamValue({ userId, wfvParamId, value: fileId })

    const keyboard = this.tgbotlib.generateInlineKeyboard([[
      [`Use it`, 'img-use:wfv-list'],
      ['Delete', 'message:delete']
    ]])

    await ctx.editMessageCaption('', keyboard)


    await this.tgbotsrv.selectWfv({ ctx, workflowVariantId })
    await this.wfsynth.view.showWfvRunMenu({ chatId: telegramId, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
  }

  async messageDelete (ctx) {
    const messageId = ctx.update?.callback_query?.message?.message_id
    await ctx.deleteMessage(messageId)
  }
}
