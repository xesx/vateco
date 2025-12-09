import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

// import * as lib from '@lib'
// import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class PhotoTgBotService {
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
    this.bot.on(message('photo'), (ctx, next) => this.photo(ctx, next))
  }

  async photo (ctx, next) {
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
