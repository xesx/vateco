import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

import * as lib from '@lib'
// import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class HandlerDocumentTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotlib: lib.TgBotLibService,
    // private readonly wflib: lib.WorkflowLibService,
    // private readonly msglib: lib.MessageLibService,

    // private readonly instancesynth: synth.InstanceSynthService,
    private readonly wfsynth: synth.WorkflowSynthService,

    // private readonly wfrepo: repo.WorkflowRepository,
    // private readonly modelrepo: repo.ModelRepository,
    // private readonly tagrepo: repo.TagRepository,
    // private readonly userrepo: repo.UserRepository,
  ) {
    this.bot.on(message('document'), (ctx, next) => this.workflowTemplateCreate(ctx, next)) // _wft_create
    this.bot.on(message('document'), (ctx, next) => this.workflowTemplateUpdate(ctx, next)) // _wft_update [id]
  }

  async workflowTemplateCreate (ctx, next) {
    const caption = ctx.message.caption

    if (!caption?.startsWith('_wft_create')) {
      return next()
    }

    const [,rawName, description] = caption.split('\n')

    const fileId = ctx.message.document.file_id
    const fileName = ctx.message.document.file_name

    const fileBuffer = await this.tgbotlib.importFileBufferByFileId({ fileId })
    const rawWorkflow = JSON.parse(fileBuffer.toString('utf-8'))

    const name = rawName || fileName

    const workflowTemplateId = await this.wfsynth.cookAndCreateWorkflowTemplate({
      name: name || fileName || `unnamed-workflow-${Date.now()}`,
      description,
      rawWorkflow,
    })

    const workflowVariantId = await this.wfsynth.createWorkflowVariant({ workflowTemplateId })
    await ctx.reply(`Workflow template created with ID: ${workflowTemplateId}\nWorkflow variant created with ID: ${workflowVariantId}`)

    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async workflowTemplateUpdate (ctx, next) {
    const caption = ctx.message.caption

    if (!caption?.startsWith('_wft_update')) {
      return next()
    }

    const [,workflowTemplateIdStr] = caption.split('\n')
    const workflowTemplateId = parseInt(workflowTemplateIdStr, 10)

    if (isNaN(workflowTemplateId)) {
      throw new Error('Invalid workflow template ID. Usage: _wft_update <workflowTemplateId>')
    }

    const fileId = ctx.message.document.file_id

    const fileBuffer = await this.tgbotlib.importFileBufferByFileId({ fileId })
    const rawWorkflow = JSON.parse(fileBuffer.toString('utf-8'))

    await this.wfsynth.cookAndUpdateWorkflowTemplate({ workflowTemplateId, rawWorkflow })

    await ctx.reply(`Workflow template ${workflowTemplateId} updated`)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}
