import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { session } from 'telegraf'
import { message } from 'telegraf/filters'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from '../types'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

@Injectable()
export class BaseCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,

    private readonly wfsynth: synth.WorkflowSynthService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,
    private readonly tagrepo: repo.TagRepository,
    private readonly userrepo: repo.UserRepository,
    store: repo.TgBotSessionsStoreRepository,
  ) {
    bot.use(session({ store }))

    bot.use(async (ctx, next) => {
      // @ts-expect-error todo
      const { username } = ctx.chat ?? {}

      // @ts-expect-error for debug
      console.log('----->>>>>>>action:', ctx.update?.callback_query?.data)

      // todo: remove this in production
      if (!['alexxxalart', 'alexxxiy'].includes(username)) {
        return ctx.reply('Access denied. You are not authorized to use this bot.')
      }

      if (!ctx.session?.userId) {
        await this.initSession(ctx)
      }


      return await next()
    })

    bot.use(async (ctx, next) => {
      try {
        return await next()
      } catch (err) {
        console.error('BaseCommandTgBot_bot_use_57 Error processing update:', err)

        await this.tgbotlib.safeAnswerCallback(ctx)
        return await ctx.reply(`An error occurred: ${err.message}`)
      }
    })

    this.bot.action('empty', (ctx) => this.tgbotlib.safeAnswerCallback(ctx))

    this.bot.command('start', (ctx, next) => this.handleStart(ctx, next))
    this.bot.action('act:main-menu', (ctx) => this.tgbotsrv.actionMainMenu(ctx))

    this.bot.hears(/^https:\/\/huggingface\.co\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByHuggingfaceLink(ctx, next))
    this.bot.hears(/^https:\/\/civitai\.com\/models\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByCivitaiLink(ctx, next))

    this.bot.on(message('document'), (ctx, next) => this.tgbotsrv.createWorkflowTemplateByFile(ctx, next)) // _wft_create

    this.bot.hears(/^_wfv_create/, (ctx) => this.tgbotsrv.createWorkflowVariant(ctx))
    this.bot.hears(/^_wfv_delete/, (ctx) => this.tgbotsrv.deleteWorkflowVariant(ctx))

    // for test
    this.bot.hears(/^_wfv_test/, (ctx) => this.startWfvTest(ctx))
    // this.bot.hears(/^_wfv_menu/, (ctx) => this.tgbotsrv.showWorkflowVariantRunMenu(ctx))
    this.bot.action('wfv:list', (ctx) => this.wfvList(ctx))
    this.bot.action(/wfv:([0-9]+)$/, (ctx) => this.wfvSelect(ctx))
    // this.bot.action(/wfv:run$/, (ctx) => this.act.actionWfvRun(ctx))
    this.bot.action(/wfvp:([0-9]+)$/, (ctx) => this.wfvParamSelect(ctx))
    this.bot.action(/wfvp:([0-9]+):set:(.+)$/, (ctx) => this.wfvParamSet(ctx))
    this.bot.action(/wfvp:([0-9]+):fset:(.+)$/, (ctx) => this.wfvParamForceSet(ctx)) // force set

    this.bot.action(/wfvp:([0-9]+):mtag:(.+)$/, (ctx) => this.wfvParamModelTagMenu(ctx)) // select model with tags
  }

  private async initSession(ctx) {
    const { username, 'first_name': firstName, 'last_name': lastName, id: telegramId } = ctx.chat ?? {}

    const userId = await this.userrepo.createUser({ telegramId, username, firstName, lastName })

    ctx.session ??= {}

    ctx.session.userId = userId
    ctx.session.telegramId = telegramId
    ctx.session.step ??= 'start'
  }

  private async handleStart (ctx: TAppBaseTgBotContext, next) {
    const step = ctx.session.step || '__undefined__'

    if (step === 'start') {
      await this.tgbotsrv.showMainMenu(ctx)
    } else {
      return next()
    }
  }


  async wfvParamModelTagMenu (ctx) {
    const { wfParamSchema } = this.wflib
    const [,workflowVariantParamId, tail] = ctx.match

    const originalTagsIds = tail.split(':').map(id => Number(id))

    let enabledTagsIds = originalTagsIds
    const lastTagId = originalTagsIds.at(-1) || 0

    if (originalTagsIds.slice(0, -1).includes(lastTagId)) {
      enabledTagsIds = originalTagsIds.filter(id => id !== lastTagId)
    }

    const enabledTags = await this.tagrepo.getTagsByIds({ ids: enabledTagsIds })
    const enabledTagsNames = enabledTags.map(tag => tag.name)

    const wfvParam = await this.wfrepo.getWorkflowVariantParamById(Number(workflowVariantParamId))
    const paramName = wfvParam.paramName
    const workflowVariantId = wfvParam.workflowVariantId

    let wfvParamEnum = wfvParam?.enum ?? wfParamSchema[paramName].enum

    if (typeof wfvParamEnum !== 'string' || !wfvParamEnum?.startsWith?.('$.model')) {
      throw new Error(`wfvParamModelTagMenu_198 Unsupported enum type for workflowVariantParamId: ${workflowVariantParamId}`)
    }

    const [,comfyUiDirectory] = wfvParamEnum.replace('$.', '').split(':')

    let modelTagsNames: string[]

    if (enabledTags.length) {
      modelTagsNames = await this.modelrepo.findUniqueModelTagsRelatedToTags(comfyUiDirectory, enabledTagsNames)
    } else {
      modelTagsNames = await this.modelrepo.findUniqueModelTags(comfyUiDirectory)
    }

    // no more tags to select, show models list
    if (modelTagsNames.length === 0) {
      const models = await this.modelrepo.findModels({ comfyUiDirectory, tags: enabledTagsNames })

      if (models.length === 0) {
        await this.tgbotlib.safeAnswerCallback(ctx, 'No models found with selected tags')
        return
      }

      wfvParamEnum = models
        .map(model => ({
          label: model.label || model.name,
          value: model.id,
        }))

      // console.log('\x1b[36m', 'models', models, '\x1b[0m')

      await this.wfsynth.view.showWfvEnumMenu({
        ctx,
        message: `Select model:`,
        enumArr: wfvParamEnum,
        prefixAction: `wfvp:${workflowVariantParamId}:set`,
        backAction: enabledTags.length > 1
          ? `wfvp:${workflowVariantParamId}:mtag:${originalTagsIds.slice(0, -1).join(':')}`
          : `wfvp:${workflowVariantParamId}`,
        useIndexAsValue: false,
      })

      return
    }

    const modelTags = await this.tagrepo.getTagsByNames({ names: modelTagsNames })
    const newModelTags = modelTags.concat(enabledTags)

    wfvParamEnum = newModelTags
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(tag => ({
        label: (enabledTagsNames.includes(tag.name) ? '✅' :'❌') + tag.name,
        value: newModelTags.find(t => t.name === tag.name)?.id || 0,
      }))

    await this.wfsynth.view.showWfvEnumMenu({
      ctx,
      message: `Select model tags:`,
      enumArr: wfvParamEnum,
      prefixAction: `wfvp:${workflowVariantParamId}:mtag:${enabledTagsIds.join(':')}`,
      backAction: `wfv:${workflowVariantId}`,
      useIndexAsValue: false,
    })
  }

  async wfvParamForceSet (ctx) {
    const [,workflowVariantParamId, value] = ctx.match
    const { userId } = ctx.session

    const wfvParam = await this.wfrepo.getWorkflowVariantParamById(Number(workflowVariantParamId))
    const paramName = wfvParam.paramName
    const workflowVariantId = wfvParam.workflowVariantId

    await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })

    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async wfvParamSet (ctx) {
    const [,workflowVariantParamId, rawValue] = ctx.match
    const { userId } = ctx.session

    const wfvParam = await this.wfrepo.getWorkflowVariantParamById(Number(workflowVariantParamId))
    const paramName = wfvParam.paramName
    const workflowVariantId = wfvParam.workflowVariantId
    let wfvParamEnum = wfvParam.enum

    let value: any = rawValue

    if (typeof wfvParamEnum === 'string' && wfvParamEnum?.startsWith?.('$.model')) {
      const model = await this.modelrepo.getModelById(Number(rawValue))
      value = model.name
    }

    if (typeof wfvParamEnum === 'string' && wfvParamEnum?.startsWith?.('$.enum')) {
      const enumCompilerName = wfvParamEnum.replace('$.', '')
      wfvParamEnum = await this.wfsynth.compileEnum(enumCompilerName)
    }

    // value is enum index
    if (wfvParamEnum && Array.isArray(wfvParamEnum)) {
      value = wfvParamEnum[Number(rawValue)]
      value = value.value ?? value
    }

    await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })

    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async wfvParamSelect (ctx) {
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

    if (typeof wfvParamEnum === 'string' && wfvParamEnum?.startsWith?.('$.model')) {
      const [,comfyUiDirectory] = wfvParamEnum.replace('$.', '').split(':')
      const modelTags = await this.modelrepo.findUniqueModelTags(comfyUiDirectory)
      const modelTagsIds = await this.tagrepo.getTagsByNames({ names: modelTags })

      const enumArr = modelTagsIds
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(tag => ({ label: '❌' + tag.name, value: tag.id }))

      await this.wfsynth.view.showWfvEnumMenu({
        ctx,
        message: `Select model tags:`,
        enumArr,
        prefixAction: `wfvp:${workflowVariantParamId}:mtag`,
        backAction: `wfv:${workflowVariantId}`,
        useIndexAsValue: false,
      })

      return
    }

    if (typeof wfvParamEnum === 'string' && wfvParamEnum?.startsWith?.('$.enum')) {
      const enumCompilerName = wfvParamEnum.replace('$.', '')
      wfvParamEnum = await this.wfsynth.compileEnum(enumCompilerName)
    }

    if (wfvParamEnum && Array.isArray(wfvParamEnum)) {
      await this.wfsynth.view.showWfvEnumMenu({
        ctx,
        message: `Current value: **${String(currentValue)}** \nSelect new value:`,
        enumArr: wfvParamEnum,
        prefixAction: `wfvp:${workflowVariantParamId}:set`,
        backAction: `wfv:${workflowVariantId}`,
      })
      return
    }

    // suggest boolean value (true/false)
    if (wfvParamType === 'boolean') {
      await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value: !currentValue })
      await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
      return
    }

    // suggest value form text input
    ctx.session.inputWaiting = paramName
    await this.tgbotlib.safeAnswerCallback(ctx)

    const currentValueAsCode = this.msglib.genCodeMessage(String(currentValue))
    const message = `Current value: ${currentValueAsCode}\nSend new value for parameter <b>"${paramName}"</b>`

    const keyboard = this.tgbotlib.generateInlineKeyboard([[['Back', `wfv:${workflowVariantId}`]]])

    await this.tgbotlib.sendMessageV2({ ctx, message, extra: { parse_mode: 'HTML', ...keyboard } })
  }

  async wfvSelect (ctx) {
    const { userId } = ctx.session
    const [,workflowVariantIdStr] = ctx.match
    const workflowVariantId = parseInt(workflowVariantIdStr, 10)

    ctx.session.workflowVariantId = workflowVariantId
    delete ctx.session.inputWaiting

    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
  }

  async wfvList (ctx) {
    await this.wfsynth.view.showWfvList({ ctx, tags: ['own-instance'], prefixAction: '', backAction: 'act:main-menu' })
  }

  async startWfvTest (ctx) {
    const keyboard = this.tgbotlib.generateInlineKeyboard([[['Start Test', 'wfv:list']]])

    await this.tgbotlib.sendMessageV2({ ctx, message: 'press to start', extra: { parse_mode: 'Markdown', ...keyboard } })
  }
}
