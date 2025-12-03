import { Injectable } from '@nestjs/common'

import { TAppBaseTgBotContext } from './types'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import {
  MAIN_MENU,
} from '@kb'

const COMFYUI_MODEL_DIRS = ['checkpoints', 'clip', 'clip_vision', 'configs', 'controlnet', 'diffusers', 'diffusion_models', 'embeddings', 'gligen', 'hypernetworks', 'LLavacheckpoints', 'loras', 'photomaker', 'style_models', 'text_encoders', 'unet', 'upscale_models', 'vae', 'vae_approx']

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly modelrepo: repo.ModelRepository,
    private readonly wfrepo: repo.WorkflowRepository,
    private readonly wfsynth: synth.WorkflowSynthService,
  ) {
    setTimeout(() => {
      tgbotlib.sendMessage({ chatId: '185857068:185857068', text: '!!! DEPLOY !!!' })
    }, 2000)
  }

  async actionMainMenu (ctx: TAppBaseTgBotContext) {
    await this.tgbotlib.safeAnswerCallback(ctx)
    this.resetSession(ctx)
    await this.showMainMenu(ctx)
  }

  async showMainMenu (ctx: TAppBaseTgBotContext) {
    const message = 'Main menu:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(MAIN_MENU)
    await this.tgbotlib.reply(ctx, message, keyboard)
  }

  async showWorkflowVariantRunMenu (ctx) {
    const [, workflowVariantIdStr] = ctx.message.text.split(' ')
    const workflowVariantId = parseInt(workflowVariantIdStr, 10)
    const userId = ctx.session.userId

    if (isNaN(workflowVariantId)) {
      throw new Error('Invalid workflow variant ID. Usage: #wf-show <workflowVariantId>')
    }

    const workflowVariant = await this.wfrepo.getWorkflowVariant(workflowVariantId)
    const keyboard = await this.wfsynth.generateWorkflowVariantRunMenu({ workflowVariantId, userId, })

    await this.tgbotlib.reply(ctx, `Workflow variant ${workflowVariant.name}`, keyboard)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  resetSession(ctx: TAppBaseTgBotContext) {
    ctx.session = {
      telegramId: ctx.session.telegramId,
      userId: ctx.session.userId,
      step: 'start',
    }
  }

  async createModelByHuggingfaceLink (ctx, next) {
    const { text: message } = ctx.message

    if (!message.startsWith('https://huggingface.co/')) {
      return next()
    }

    const [link, dir] = message
      .split('\n')
      .map(item => item.trim())

    if (!COMFYUI_MODEL_DIRS.includes(dir)) {
      return await ctx.reply(`Invalid ComfyUI directory. Must be one of: ${COMFYUI_MODEL_DIRS.join(', ')}`)
    }

    // https://huggingface.co/alalarty/models2/blob/main/il/cn/ilxl_cn_depth_v20.safetensors
    const [repo, file] = link
      .replace('https://huggingface.co/', '')
      .split('/blob/main/')

    const name = file
      .replace('.safetensors', '')
      .replace(/[^0-9a-z]/, '_')
      .toLowerCase()
      .split('/')
      .at(-1)

    const prisma = this.modelrepo['prisma']

    try {
      const modelId = await prisma.$transaction(async (trx: lib.PrismaLibService) => {
        const modelId = await this.modelrepo.createModel({
          name,
          comfyUiDirectory: dir,
          comfyUiFileName: file.split('/').at(-1),
          label: name,
          trx,
        })

        await this.modelrepo.createMolelHuggingfaceLink({ modelId, repo, file, trx })

        await this.modelrepo.createModelTag({ modelId, tag: 'new', trx })

        return modelId
      })

      return await ctx.reply('Model created with ID: ' + modelId)
    } catch (error) {
      return await ctx.reply('Error creating model: ' + error.message)
    }
  }

  async createModelByCivitaiLink (ctx, next) {
    const { text: message } = ctx.message

    if (!message.startsWith('https://civitai.com/')) {
      return next()
    }

    if (!message.includes('modelVersionId=')) {
      return await ctx.reply('Civitai link must include modelVersionId parameter.')
    }

    // https://civitai.com/models/24350?modelVersionId=2315492
  }

  async createWorkflowTemplateByFile (ctx, next) {
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

    await ctx.reply(`Workflow template created with ID: ${workflowTemplateId}`)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async createWorkflowVariant (ctx) {
    const [, workflowTemplateIdStr] = ctx.message.text.split(/\s+/)
    const workflowTemplateId = parseInt(workflowTemplateIdStr, 10)

    if (isNaN(workflowTemplateId)) {
      throw new Error('Invalid workflow template ID. Usage: #wfv_create <workflowTemplateId>')
    }

    const workflowVariantId = await this.wfsynth.createWorkflowVariant({ workflowTemplateId })

    await ctx.reply(`Workflow variant created with ID: ${workflowVariantId}`)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async deleteWorkflowVariant (ctx) {
    const [, workflowVariantIdStr] = ctx.message.text.split(/\s+/)
    const workflowVariantId = parseInt(workflowVariantIdStr, 10)

    if (isNaN(workflowVariantId)) {
      throw new Error('Invalid workflow variant ID. Usage: #wfv_delete <workflowVariantId>')
    }

    await this.wfsynth.deleteWorkflowVariant(workflowVariantId)

    await ctx.reply(`Workflow variant with ID: ${workflowVariantId} deleted`)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}