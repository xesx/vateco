import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

// import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'
import * as lib from '@lib'

import { TAppBaseTgBotContext } from './types'
import { AppBaseTgBotService } from './app-base-tg-bot.service'

@Injectable()
export class HandlerTextTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly wfsynth: synth.WorkflowSynthService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly h: lib.HelperLibService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly lockrepo: repo.LockRepository,
  ) {
    this.bot.hears('🎛 Params', (ctx) => this.textParams(ctx))
    this.bot.hears('📝 Show prompt', (ctx) => this.textShowPrompt(ctx))
    this.bot.hears('🚀 Generate', (ctx) => this.textGenerate(ctx))
    this.bot.hears('❌ Cancel', (ctx) => this.cancelGenerate(ctx))

    this.bot.hears(/^https:\/\/huggingface\.co\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByHuggingfaceLink(ctx, next))
    this.bot.hears(/^https:\/\/civitai\.com\/models\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByCivitaiLink(ctx, next))

    this.bot.hears(/^wfv-create/, (ctx) => this.tgbotsrv.createWorkflowVariant(ctx))
    this.bot.hears(/^wfv-delete/, (ctx) => this.tgbotsrv.deleteWorkflowVariant(ctx))
    this.bot.hears(/^wfv-export/, (ctx) => this.tgbotsrv.exportWorkflowVariant(ctx))

    // for test
    this.bot.hears(/^test$/, async () => {
      console.log('\x1b[36m', 'test!!!!', '\x1b[0m');
      await this.lockrepo.tryGetLock({
        key: 'test-lock',
        value: { some: 'value' },
        expiredAt: new Date(Date.now() + 60 * 1000), // истекает через 1 минуту
      })
    })

    this.bot.on(message('text'), (ctx, next) => this.textAnyOther(ctx, next))
  }

  async textGenerate (ctx) {
    await this.tgbotsrv.runWfv(ctx)
  }

  async cancelGenerate (ctx) {
    const { instance } = ctx.session

    if (!instance) {
      console.log('HandlerTextTgBotService_cancelGenerate_13 No instance in session')
      throw new Error('WFV_CANCEL_ERROR No instance available. Please create and start an instance first.')
    }

    const { id: instanceId, apiUrl: baseUrl, token } = instance

    await this.cloudapilib.vastAiCancelAll({ baseUrl, instanceId, token })
  }

  async textShowPrompt (ctx) {
    const { userId, workflowVariantId } = ctx.session

    await this.wfsynth.view.showCurrentPositivePrompt({ ctx, userId, workflowVariantId })
  }

  async textParams (ctx) {
    const { userId, workflowVariantId } = ctx.session
    await this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, backAction: 'wfv:list' })
  }

  async textAnyOther (ctx, next) {
    const { userId, workflowVariantId } = ctx.session

    const message = this.h.format.sanitizeJsonString(ctx.message.text)
    console.log('\x1b[36m', 'message', message, '\x1b[0m')

    if (ctx.session.inputWaiting) {
      const { inputWaiting: paramName } = ctx.session

      const value = message

      await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })

      delete ctx.session.inputWaiting

      return this.wfsynth.view.showWfvRunMenu({ ctx, userId, workflowVariantId, backAction: 'wfv:list' })
    }

    if (workflowVariantId) {
      const positivePromptParam = await this.wfrepo.getWorkflowVariantParamByLabel({ workflowVariantId, label: 'prompt' })

      if (positivePromptParam) {
        await this.wfrepo.setWorkflowVariantUserParam({
          userId,
          workflowVariantId,
          paramName: positivePromptParam.paramName,
          value: message,
        })

        return await this.tgbotsrv.runWfv(ctx)
      }
    }

    return next()
  }
}
