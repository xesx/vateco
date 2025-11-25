import { Injectable } from '@nestjs/common'

import { TAppBaseTgBotContext } from './types'

import * as lib from '@lib'
import * as repo from '@repo'

import {
  MAIN_MENU,
} from '@kb'

const COMFYUI_MODEL_DIRS = ['checkpoints', 'clip', 'clip_vision', 'configs', 'controlnet', 'diffusers', 'diffusion_models', 'embeddings', 'gligen', 'hypernetworks', 'LLavacheckpoints', 'loras', 'photomaker', 'style_models', 'text_encoders', 'unet', 'upscale_models', 'vae', 'vae_approx']

@Injectable()
export class AppBaseTgBotService {
  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly modelrepo: repo.ModelRepository,
  ) {
    setTimeout(() => {
      tgbotlib.sendMessage({ chatId: '185857068:185857068', text: '!!! DEPLOY !!!' })
    }, 2000)
  }

  actionMainMenu (ctx: TAppBaseTgBotContext) {
    this.tgbotlib.safeAnswerCallback(ctx)
    this.resetSession(ctx)
    this.showMainMenu(ctx)
  }

  showMainMenu (ctx: TAppBaseTgBotContext) {
    const message = 'Main menu:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(MAIN_MENU)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  resetSession(ctx: TAppBaseTgBotContext) {
    ctx.session = {
      telegramId: ctx.session.telegramId,
      userId: ctx.session.userId,
      step: 'start',
    }
  }

  async textMessage (ctx, next) {
    const { text: message } = ctx.message

    if (message.startsWith('https://huggingface.co/')) {
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

    return next()
  }
}