import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

// import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class ActionTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    // private readonly tgbotlib: lib.TgBotLibService,
    // private readonly wflib: lib.WorkflowLibService,
    // private readonly msglib: lib.MessageLibService,

    private readonly wfsynth: synth.WorkflowSynthService,

    // private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,
    private readonly tagrepo: repo.TagRepository,
    // private readonly userrepo: repo.UserRepository,
  ) {
    this.bot.action('main-menu', (ctx) => this.actionMainMenu(ctx))

    this.bot.action('wfv:list', (ctx) => this.wfvList(ctx))
    this.bot.action(/wfv:([0-9]+)$/, (ctx) => this.wfvSelect(ctx))
    // this.bot.action(/wfv:run$/, (ctx) => this.act.actionWfvRun(ctx))
    this.bot.action(/wfvp:([0-9]+)$/, (ctx) => this.wfvParamSelect(ctx))
    this.bot.action(/wfvp:([0-9]+):mtag:(.+)$/, (ctx) => this.wfvParamModelTagMenu(ctx)) // select model with tags
    this.bot.action(/wfvp:([0-9]+):set:(.+)$/, (ctx) => this.wfvParamSet(ctx))
    this.bot.action(/wfvp:([0-9]+):fset:(.+)$/, (ctx) => this.wfvParamForceSet(ctx)) // force set
  }

  async actionMainMenu (ctx: TAppBaseTgBotContext) {
    await this.wfsynth.view.showMainMenu({ ctx })
  }

  async wfvList (ctx) {
    await this.wfsynth.view.showWfvList({ ctx, tags: ['own-instance'], prefixAction: '', backAction: 'main-menu' })
  }

  async wfvSelect (ctx) {
    const { userId } = ctx.session
    const [,workflowVariantIdStr] = ctx.match
    const workflowVariantId = parseInt(workflowVariantIdStr, 10)

    ctx.session.workflowVariantId = workflowVariantId
    delete ctx.session.inputWaiting

    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
  }

  async wfvParamSelect (ctx) {
    const [,wfvParamId] = ctx.match
    const { userId } = ctx.session

    const {
      paramName,
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
            backAction: `wfv:${workflowVariantId}`,
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
    await this.wfsynth.view.showSuggestInputWfvParamValue({ ctx, paramName, currentValue, workflowVariantId })
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
      const models = await this.modelrepo.findModels({ comfyUiDirectory, tags: enabledTagsNames })

      if (models.length === 0) {
        throw new Error('No models found with selected tags')
      }

      const enumArr = models
        .map(model => ({
          label: model.label || model.name,
          value: model.id,
        }))

      await this.wfsynth.view.showWfvEnumMenu({
        ctx,
        message: `Select model:`,
        enumArr,
        prefixAction: `wfvp:${wfvParamId}:set`,
        backAction: enabledTags.length > 1
          ? `wfvp:${wfvParamId}:mtag:${originalTagsIds.slice(0, -1).join(':')}`
          : `wfvp:${wfvParamId}`,
        useIndexAsValue: false,
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
      backAction: `wfv:${workflowVariantId}`,
      useIndexAsValue: false,
    })
  }

  async wfvParamForceSet (ctx) {
    const [,wfvParamId, value] = ctx.match
    const { userId, workflowVariantId } = ctx.session

    await this.wfsynth.param.setWfvUserParamValue({ userId, wfvParamId, value })
    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, prefixAction: '', backAction: 'wfv:list' })
  }

  async wfvParamSet (ctx) {
    const [,wfvParamId, rawValue] = ctx.match
    const { userId, workflowVariantId } = ctx.session

    const { wfvParamEnum } = await this.wfsynth.param.getWfvUserParamInfo({ wfvParamId, userId })

    let value: any = rawValue

    if (wfvParamEnum) {
      let enumArr = wfvParamEnum

      if (typeof wfvParamEnum === 'string') {
        if (wfvParamEnum?.startsWith?.('$.enumModelTag')) {
          const model = await this.modelrepo.getModelById(Number(rawValue))
          value = model.name
        }

        if (wfvParamEnum?.startsWith?.('$.enum')) {
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
}
