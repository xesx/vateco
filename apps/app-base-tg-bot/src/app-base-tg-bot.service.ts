import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

const COMFYUI_MODEL_DIRS = [
  'LLavacheckpoints',
  'checkpoints',
  'clip',
  'clip_vision',
  'configs',
  'controlnet',
  'diffusers',
  'diffusion_models',
  'embeddings',
  'gligen',
  'hypernetworks',
  'instantid',
  'loras',
  'photomaker',
  'pulid',
  'style_models',
  'text_encoders',
  'unet',
  'upscale_models',
  'vae',
  'vae_approx',
]

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,

    private readonly modelrepo: repo.ModelRepository,
    private readonly wfrepo: repo.WorkflowRepository,
    private readonly wfsynth: synth.WorkflowSynthService,
    private readonly civitailib: lib.CivitaiLibService,
  ) {
    setTimeout(() => {
      tgbotlib.sendMessage({ chatId: '185857068:185857068',
        text: '!!! DEPLOY !!!' })
    }, 2000)
  }

  async runWfv (ctx) {
    const { workflowVariantId, userId, instance, telegramId } = ctx.session
    const modelInfoLoaded = instance?.modelInfoLoaded || []

    if (!workflowVariantId) {
      console.log('ActionOwnITgBot_actionWfvRun_21 No workflowId in session')
      return this.tgbotlib.safeAnswerCallback(ctx)
    }

    if (!instance) {
      console.log('AppBaseTgBotService_runWfv No instance in session')
      throw new Error('WFV_RUN_ERROR No instance available. Please create and start an instance first.')
    }

    const { id: instanceId, apiUrl: baseUrl, token } = instance
    const workflowVariantParams = await this.wfrepo.getMergedWorkflowVariantParamsValueMap({ userId, workflowVariantId })

    const models: string[] = []

    for (const paramName in workflowVariantParams) {
      const value = workflowVariantParams[paramName]

      if (!value) {
        continue
      }

      const [classType, name] = paramName.split(':')
      // const wfvParamSchema = this.wflib.getWfvParamSchema(paramName)
      const classTypeSchema = this.wflib.getWfNodeClassTypeSchema(classType)

      const categories = classTypeSchema?.category?.split('/') || []
      const isLoaderNode = categories.includes('loaders')

      if (isLoaderNode) {
        const modelName = value
        const modelData = await this.modelrepo.findModelByName(value)

        if (!modelData) {
          continue
        }

        models.push(modelName)
        workflowVariantParams[paramName] = modelData?.comfyUiFileName || null

        if (modelInfoLoaded?.includes(modelName)) {
          continue
        }

        await this.cloudapilib.vastAiModelInfoLoad({ baseUrl, instanceId, token, modelName, modelData })

        if (ctx.session.instance) {
          ctx.session.instance.modelInfoLoaded = ctx.session.instance.modelInfoLoaded || []
          ctx.session.instance?.modelInfoLoaded.push(modelName)
        }
      }

      if (name === 'seed' && workflowVariantParams.seedType === 'random') {
        workflowVariantParams[paramName] = this.wflib.generateSeed()
      }
    }

    const { workflowTemplateId } = await this.wfrepo.getWorkflowVariant(workflowVariantId)

    const count = workflowVariantParams.generationNumber || 1
    const chatId = telegramId

    await this.cloudapilib.vastAiWorkflowRun({ baseUrl, instanceId, token, count, workflowTemplateId, workflowVariantParams, models, chatId })

    await this.tgbotlib.safeAnswerCallback(ctx)
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
          baseModel: 'undefined',
          label: name,
          trx,
        })

        await this.modelrepo.createModelHuggingfaceLink({ modelId, repo, file, trx })

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

    if (!message.startsWith('https://civitai.com')) {
      return next()
    }

    // https://civitai.com/models/24350?modelVersionId=2315492
    // or
    // https://civitai.com/models/1627367
    // or
    // https://civitai.com/models/1627367/style-messy-sketch
    const [link, comfyUiDirectory] = message
      .split('\n')
      .map(item => item.trim())

    const civitaiId = link.replace('https://civitai.com/models/', '').split('?')[0]
    let civitaiVersionId = new URL(link).searchParams.get('modelVersionId')

    if (!civitaiVersionId) {
      const modelInfo = await this.civitailib.importModelData({ modelId: civitaiId })
      civitaiVersionId = modelInfo.modelVersions[0]?.id?.toString?.() // last version (left on civitai page)
    }

    if (!COMFYUI_MODEL_DIRS.includes(comfyUiDirectory)) {
      return await ctx.reply(`Invalid ComfyUI directory. Must be one of: ${COMFYUI_MODEL_DIRS.join(', ')}`)
    }

    if (!civitaiId || !civitaiVersionId) {
      return await ctx.reply('Invalid Civitai link.')
    }

    console.log('civitaiId', civitaiId)
    console.log('civitaiVersionId', civitaiVersionId)

    const info = await this.civitailib.importModelVersionData({ modelVersionId: civitaiVersionId })
    const file = info.files.find(i => i.primary) || info.files[0]

    let name = info.model?.name?.toLowerCase?.().replace(/[^0-9a-z]+/g, '_') || ''
    name += `${info.name}`.toLowerCase().replace(/[^0-9a-z]+/g, '_')

    const baseModel = info.baseModel.replace(/\s+/, '_').toLowerCase() || 'undefined'
    const comfyUiFileName = file.name.replace(/\s+/, '_').toLowerCase()
    const label = name

    const prisma = this.modelrepo['prisma']

    try {
      const modelId = await prisma.$transaction(async (trx: lib.PrismaLibService) => {
        const modelId = await this.modelrepo.createModel({ name, comfyUiDirectory, baseModel, comfyUiFileName, label, trx })
        await this.modelrepo.createModelCivitaiLink({ modelId, civitaiId, civitaiVersionId, trx })

        await this.modelrepo.createModelTag({ modelId, tag: 'new', trx })

        return modelId
      })

      return await ctx.reply(`Model created with ID: ${modelId}\nname: ${name}\nbase model:${baseModel}\ndir: ${comfyUiDirectory}\nfile: ${comfyUiFileName}`)
    } catch (error) {
      return await ctx.reply('Error creating model: ' + error.message)
    }
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
      throw new Error('Invalid workflow template ID. Usage: _wfv_create <workflowTemplateId>')
    }

    const workflowVariantId = await this.wfsynth.createWorkflowVariant({ workflowTemplateId })

    await ctx.reply(`Workflow variant created with ID: ${workflowVariantId}`)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async deleteWorkflowVariant (ctx) {
    const [, workflowVariantIdStr] = ctx.message.text.split(/\s+/)
    const workflowVariantId = parseInt(workflowVariantIdStr, 10)

    if (isNaN(workflowVariantId)) {
      throw new Error('Invalid workflow variant ID. Usage: _wfv_delete <workflowVariantId>')
    }

    await this.wfsynth.deleteWorkflowVariant(workflowVariantId)

    await ctx.reply(`Workflow variant with ID: ${workflowVariantId} deleted`)
    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}