import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'
import { UserWorkflowVariantRunStatus } from '@prisma/client'

const COMFYUI_MODEL_DIRS = [
  'audio_encoders',
  'checkpoints',
  'clip',
  'clip_vision',
  'configs',
  'controlnet',
  'diffusers',
  'diffusion_models',
  'embeddings',
  'facedetection',
  'facerestore_models',
  'gligen',
  'hypernetworks',
  'insightface',
  'instantid',
  'ipadapter',
  'latent_upscale_models',
  'loras',
  'model_patches',
  'photomaker',
  'pulid',
  'reactor',
  'style_models',
  'text_encoders',
  'unet',
  'upscale_models',
  'vae',
  'vae_approx',
  'LLavacheckpoints',

  'unknown',
]

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly civitailib: lib.CivitaiLibService,
    private readonly runpodLib: lib.RunpodLibService,
    private readonly h: lib.HelperLibService,

    private readonly modelrepo: repo.ModelRepository,
    private readonly wfrepo: repo.WorkflowRepository,
    private readonly runrepo: repo.RunRepository,

    private readonly wfsynth: synth.WorkflowSynthService,
  ) {
    setTimeout(() => {
      tgbotlib.sendMessage({ chatId: '185857068:185857068',
        text: '!!! DEPLOY !!!' })
    }, 2000)
  }

  async selectWfv ({ ctx, workflowVariantId }) {
    const { instance } = ctx.session

    ctx.session.workflowVariantId = Number(workflowVariantId)
    delete ctx.session.inputWaiting

    if (instance) {
      const { workflowTemplateId } = await this.wfrepo.getWorkflowVariant(workflowVariantId)
      const workflowTemplate = await this.wfrepo.getWorkflowTemplate(workflowTemplateId)

      await this.cloudapilib.vastAiWorkflowTemplateLoad({
        baseUrl: ctx.session.instance?.apiUrl,
        instanceId: ctx.session.instance?.id,
        token: ctx.session.instance?.token,
        workflowTemplate,
      })
    }
  }

  async runWfv (ctx) {
    const { workflowVariantId, instance } = ctx.session

    if (!workflowVariantId) {
      console.log('ActionOwnITgBot_actionWfvRun_21 No workflowId in session')
      return await this.tgbotlib.safeAnswerCallback(ctx)
    }

    if (instance) {
      return await this.runWfvOnVastAiInstance(ctx)
    }

    const { runpodEndpoint } = await this.wfrepo.getWorkflowVariant(workflowVariantId)

    if (runpodEndpoint) {
      return await this.runWfvOnRunpodEndpoint(ctx)
    }

    console.log('AppBaseTgBotService_runWfv_31 No instance in session or endpoint', ctx.session)
    throw new Error('WFV_RUN_ERROR No instance or endpoint available')
  }

  async runWfvOnVastAiInstance (ctx) {
    const { workflowVariantId, userId, instance, telegramId } = ctx.session
    const modelInfoLoaded = instance?.modelInfoLoaded || []

    const { workflowTemplateId } = await this.wfrepo.getWorkflowVariant(workflowVariantId)

    const wfvParams = await this.wfrepo.getMergedWorkflowVariantParamsValueMap({ userId, workflowVariantId })

    const { id: instanceId, apiUrl: baseUrl, token } = instance
    const models: string[] = []

    for (const paramName in wfvParams) {
      const value = wfvParams[paramName]

      if (!value) {
        continue
      }

      const [classType] = paramName.split(':')
      const wfvParamSchema = this.wflib.getWfvParamSchema(paramName)
      const classTypeSchema = this.wflib.getWfNodeClassTypeSchema(classType)

      const categories = classTypeSchema?.category?.split('/') || []
      const isLoaderNode = categories.includes('loaders')

      if (isLoaderNode || wfvParamSchema.isComfyUiModel) {
        if (paramName.startsWith('Power Lora Loader (rgthree):lora')) {
          const isLoraEnabled = wfvParams[paramName.replace('lora', 'loraEnabled')]

          if (!isLoraEnabled) {
            continue
          }
        }
        const modelName = value
        const modelData = await this.modelrepo.findModelByName(value)

        if (!modelData) {
          continue
        }

        models.push(modelName)
        wfvParams[paramName] = modelData?.comfyUiFileName || null

        if (modelInfoLoaded?.includes(modelName)) {
          continue
        }

        await this.cloudapilib.vastAiModelInfoLoad({ baseUrl, instanceId, token, modelName, modelData })

        if (ctx.session.instance) {
          ctx.session.instance.modelInfoLoaded = ctx.session.instance.modelInfoLoaded || []
          ctx.session.instance?.modelInfoLoaded.push(modelName)
        }
      }
    }

    const chatId = telegramId

    const count = wfvParams.generationNumber || 1

    for (let i = 0; i < count; i++) {
      for (const paramName in wfvParams) {
        const value = wfvParams[paramName]

        if (!value) {
          continue
        }

        const [, name] = paramName.split(':')

        if (['seed', 'noise_seed'].includes(name) && wfvParams.seedType === 'random') {
          wfvParams[paramName] = this.wflib.generateSeed()
        }
      }

      await this.cloudapilib.vastAiWorkflowRun({
        baseUrl,
        instanceId,
        token,
        workflowTemplateId,
        wfvParams,
        models,
        chatId,
      })
    }

    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async runWfvOnRunpodEndpoint (ctx) {
    const { workflowVariantId, userId, telegramId } = ctx.session

    const { workflowTemplateId, runpodEndpoint } = await this.wfrepo.getWorkflowVariant(workflowVariantId)
    const wft = await this.wfrepo.getWorkflowTemplate(workflowTemplateId)
    const wfvParams = await this.wfrepo.getMergedWorkflowVariantParamsValueMap({ userId, workflowVariantId })

    for (const paramName in wfvParams) {
      const value = wfvParams[paramName]

      if (!value) {
        continue
      }

      const [classType] = paramName.split(':')
      const wfvParamSchema = this.wflib.getWfvParamSchema(paramName)
      const classTypeSchema = this.wflib.getWfNodeClassTypeSchema(classType)

      const categories = classTypeSchema?.category?.split('/') || []
      const isLoaderNode = categories.includes('loaders')

      if (isLoaderNode || wfvParamSchema.isComfyUiModel) {
        const modelData = await this.modelrepo.findModelByName(value)

        if (!modelData) {
          continue
        }

        wfvParams[paramName] = modelData.comfyUiFileName
      }
    }

    await this.tgbotlib.safeAnswerCallback(ctx)

    const count = wfvParams.generationNumber || 1

    const userParams = await this.wfrepo.getWorkflowVariantUserParamsMap({ userId, workflowVariantId })
    const wfvRunParamsId = await this.runrepo.createWorkflowVariantRunParams({ params: userParams })

    for (let i = 0; i < count; i++) {
      const meta = { runpodEndpoint, chatId: telegramId }

      for (const paramName in wfvParams) {
        const value = wfvParams[paramName]

        if (!value) {
          continue
        }

        const [, name] = paramName.split(':')

        if (['seed', 'noise_seed'].includes(name) && wfvParams.seedType === 'random') {
          wfvParams[paramName] = this.wflib.generateSeed()
          meta[paramName] = wfvParams[paramName]
        }
      }

      const imageFileIds: string[] = []
      const images: any[] = []

      Object.entries(wfvParams || {}).forEach(([key, value]) => {
        if (key.startsWith('LoadImage:image')) {
          imageFileIds.push(value) // value is fileId from tg bot chat
        }
      })

      for (const fileId of imageFileIds) {
        const imageBuffer = await this.tgbotlib.importImageBufferByFileId({ fileId })

        images.push({
          name: fileId,
          image: imageBuffer.toString('base64'),
        })
      }

      const compiledWorkflowSchema = this.wflib.compileWorkflowSchema({
        workflow: wft.schema,
        params: wfvParams,
      })


      const data = await this.runpodLib.runServerlessEndpoint({
        workflow: compiledWorkflowSchema,
        images,
        runpodEndpoint,
      })

      meta['runPodJobId'] = data.id

      await this.runrepo.createUserWorkflowVariantRun({
        userId,
        workflowVariantId,
        wfvRunParamsId,
        meta,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      // const userWfvRunIds = await this.runrepo.findActiveUserWorkflowVariantRunIds({ userId })

      let userWfvRun = await this.runrepo.findOldestActiveUserWorkflowVariantRun({ userId })
      console.log('\x1b[36m', 'userWfvRun', userWfvRun, '\x1b[0m')

      if (!userWfvRun) {
        return
      }

      // for (const id of userWfvRunIds) {
      while (userWfvRun) {
        // const userWfvRun = await this.runrepo.findOldestActiveUserWorkflowVariantRun({ userId })
        const now = Date.now()
        let status = 'IN_QUEUE'

        // const userWfvRun = await this.runrepo.getUserWorkflowVariantRun({ id })
        const { id, createdAt, updatedAt } = userWfvRun
        const { runpodEndpoint, runPodJobId, chatId } = userWfvRun.meta

        if (createdAt.getTime() !== updatedAt.getTime() && Date.now() - updatedAt.getTime() < 5000) {
          return
        }

        await this.runrepo.upgradeUserWorkflowVariantRunUpdatedAt({ id })

        console.log('\x1b[36m', 'userWfvRun', userWfvRun, '\x1b[0m')
        console.log('\x1b[36m', 'createdAt === updatedAt', createdAt === updatedAt, '\x1b[0m')
        console.log('\x1b[36m', 'now - updatedAt.getTime()', now - updatedAt.getTime(), '\x1b[0m')

        const messageId = await this.tgbotlib.sendMessage({ chatId, text: 'Job status: IN_QUEUE' })

        while (true) {
          let data: any

          try {
            data = await this.runpodLib.checkTaskStatusServerlessEndpoint({ id: runPodJobId, runpodEndpoint })
          } catch (error) {
            console.log('AppBaseTgBotService_runWfvOnRunpodEndpoint_51 Error while check status', this.h.herr.parseAxiosError(error))

            await this.runrepo.setUserWorkflowVariantRunStatus({ id, status: 'failed' })
            await this.tgbotlib.editMessageV2({ chatId, messageId, text: `Job status: FAILED` })

            break
          }

          // console.log('\x1b[36m', 'data', data, '\x1b[0m')

          if (!['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED'].includes(data.status)) {
            console.log('Unexpected task status: ', data)

            await this.runrepo.setUserWorkflowVariantRunStatus({ id, status: 'failed' })
            await this.tgbotlib.editMessageV2({ chatId, messageId, text: `Unexpected job status: ${data.status}` })

            break
          }

          if (data.status === 'COMPLETED') {
            const base64Data = data.output.images?.[0].data
            const imgBuffer = Buffer.from(base64Data, 'base64')

            const keyboard = this.tgbotlib.generateInlineKeyboard([[
              [`Use it`, 'img-use:wfv-list'],
              ['Delete', 'message:delete']
            ]])

            await this.tgbotlib.editMessageV2({ chatId, messageId, text: `Job status: COMPLETED` })
            await this.tgbotlib.sendPhoto({ chatId, photo: imgBuffer, inlineKeyboard: keyboard.reply_markup })
            await this.runrepo.setUserWorkflowVariantRunStatus({ id, status: 'completed' })

            break
          }

          if (status !== data.status && data.status === 'IN_PROGRESS') {
            await this.runrepo.setUserWorkflowVariantRunStatus({ id, status: 'in_progress' })
            await this.tgbotlib.editMessageV2({ chatId, messageId, text: `Job status: IN_PROGRESS` })
          }

          status = data.status
          await this.h.sleep(1000)
        }
        userWfvRun = await this.runrepo.findOldestActiveUserWorkflowVariantRun({ userId })
      }
    }, 0)
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

  async exportWorkflowVariant (ctx) {
    const { workflowVariantId, userId } = ctx.session

    const { workflowTemplateId, name } = await this.wfrepo.getWorkflowVariant(workflowVariantId)
    const wft = await this.wfrepo.getWorkflowTemplate(workflowTemplateId)

    const params = await this.wfrepo.getMergedWorkflowVariantParamsValueMap({ userId, workflowVariantId })


    const compiledWorkflowSchema = this.wflib.compileWorkflowSchema({ workflow: wft.schema, params })

    Object.entries(compiledWorkflowSchema).forEach(([nodeId, node]: any[]) => {
      if (node['class_type'] !== 'Power Lora Loader (rgthree)') {
        return
      }

      Object.entries(node.inputs).forEach(([inputName, inputValue]: any[]) => {
        if (!inputName.startsWith('lora_')) {
          return
        }

        if (inputValue.on || !inputValue.lora || inputValue.lora === '❓') {
          delete compiledWorkflowSchema[nodeId].inputs[inputName]
        }
      })
    })

    // Create JSON file and send to Telegram bot chat
    const filename = `wfv-${name}.json`
    const fileBuffer = Buffer.from(JSON.stringify(compiledWorkflowSchema, null, 2), 'utf-8')

    await ctx.sendDocument({
      source: fileBuffer,
      filename,
    })

    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}