import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

// import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'
import { AppBaseTgBotService } from './app-base-tg-bot.service'

@Injectable()
export class HandlerTextTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly wfsynth: synth.WorkflowSynthService,

    private readonly wfrepo: repo.WorkflowRepository,
  ) {
    this.bot.hears('🎛 Params', (ctx) => this.textParams(ctx))
    this.bot.hears('📝 Show prompt', (ctx) => this.textShowPrompt(ctx))
    this.bot.hears('🚀 Generate', (ctx) => this.textGenerate(ctx))

    this.bot.hears(/^https:\/\/huggingface\.co\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByHuggingfaceLink(ctx, next))
    this.bot.hears(/^https:\/\/civitai\.com\/models\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByCivitaiLink(ctx, next))

    this.bot.hears(/^_wfv_create/, (ctx) => this.tgbotsrv.createWorkflowVariant(ctx))
    this.bot.hears(/^_wfv_delete/, (ctx) => this.tgbotsrv.deleteWorkflowVariant(ctx))

    // for test
    // this.bot.hears(/^_wfv_test/, (ctx) => this.startWfvTest(ctx))

    this.bot.on(message('text'), (ctx, next) => this.textAnyOther(ctx, next))
  }

  async textGenerate (ctx) {
    await this.tgbotsrv.runWfv(ctx)
  }

  async textShowPrompt (ctx) {
    const { userId, workflowVariantId } = ctx.session

    await this.wfsynth.view.showCurrentPositivePrompt({ ctx, userId, workflowVariantId })
  }

  async textParams (ctx) {
    const { userId, workflowVariantId, instance } = ctx.session
    let backAction = 'main-menu'

    if (instance) {
      backAction = 'instance:manage'
    }

    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, backAction })
  }

  async textAnyOther (ctx, next) {
    const { userId, workflowVariantId } = ctx.session

    const message = ctx.message.text
      .replace(/\r\n/g, '\n')     // Windows → Unix переносы
      .replace(/\n+/g, ' ')       // убираем лишние переводы строк
      .replace(/\s+/g, ' ')       // схлопываем все пробелы/табы
      .trim()

    if (ctx.session.inputWaiting) {
      const { inputWaiting: paramName } = ctx.session

      const value = message

      await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })

      delete ctx.session.inputWaiting

      return this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, backAction: 'instance:manage' })
    }

    if (workflowVariantId) {
      const positivePromptParam = await this.wfrepo.getWorkflowVariantParamByName({ workflowVariantId, paramName: 'positivePrompt' })

      if (positivePromptParam) {
        await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName: 'positivePrompt', value: message })
        return await this.tgbotsrv.runWfv(ctx)
      }
    }

    return next()
  }
}
