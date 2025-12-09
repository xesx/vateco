import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

// import * as lib from '@lib'
// import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class TextTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    // private readonly tgbotlib: lib.TgBotLibService,
    // private readonly wflib: lib.WorkflowLibService,
    // private readonly msglib: lib.MessageLibService,

    private readonly instancesynth: synth.InstanceSynthService,
    private readonly wfsynth: synth.WorkflowSynthService,

    // private readonly wfrepo: repo.WorkflowRepository,
    // private readonly modelrepo: repo.ModelRepository,
    // private readonly tagrepo: repo.TagRepository,
    // private readonly userrepo: repo.UserRepository,
  ) {
    this.bot.hears('🎛 Params', (ctx) => this.text.textParams(ctx))
    this.bot.hears('📝 Show prompt', (ctx) => this.text.textShowPrompt(ctx))
    this.bot.hears('🚀 Generate', (ctx) => this.text.textGenerate(ctx))

    this.bot.hears(/^https:\/\/huggingface\.co\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByHuggingfaceLink(ctx, next))
    this.bot.hears(/^https:\/\/civitai\.com\/models\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByCivitaiLink(ctx, next))

    this.bot.hears(/^_wfv_create/, (ctx) => this.tgbotsrv.createWorkflowVariant(ctx))
    this.bot.hears(/^_wfv_delete/, (ctx) => this.tgbotsrv.deleteWorkflowVariant(ctx))

    // for test
    this.bot.hears(/^_wfv_test/, (ctx) => this.startWfvTest(ctx))

    this.bot.on(message('text'), (ctx, next) => this.text.textAnyOther(ctx, next))
  }

  async image (ctx, next) {
    const { userId, workflowVariantId } = ctx.session
    let paramName = ctx.session.inputWaiting

    if (!paramName) {
      const imageWorkflowVariantParams = await this.wfrepo.findWorkflowVariantParamsByNameStartsWith({
        workflowVariantId,
        startsWith: 'image',
      })

      paramName = imageWorkflowVariantParams[0]?.paramName
    }

    if (paramName) {
      const fileId = this.tgbotlib.getImageFileIdFromMessage({ message: ctx.message })
      console.log('HandleOwnITgBot_photo_23 fileId', fileId)

      if (fileId) {
        // TODO more than one image param?
        await this.wfrepo.setWorkflowVariantUserParam({
          userId,
          workflowVariantId,
          paramName,
          value: fileId,
        })
      }

      delete ctx.session.inputWaiting
    }

    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}
