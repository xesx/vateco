import * as assert from 'node:assert'

import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

const COMFYUI_MODEL_DIRS = ['checkpoints', 'clip', 'clip_vision', 'configs', 'controlnet', 'diffusers', 'diffusion_models', 'embeddings', 'gligen', 'hypernetworks', 'LLavacheckpoints', 'loras', 'photomaker', 'style_models', 'text_encoders', 'unet', 'upscale_models', 'vae', 'vae_approx']

@Injectable()
export class ModelCreateCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly modelrepo: repo.ModelRepository,
  ) {}

  register(program) {
    program
      .command('create-model')
      .option('-l, --link <string>', 'Model link')
      .option('-d, --dir <string>', 'ComfyUI directory')
      .description('Create model from link')
      .action(async (options) => {
        const { link, dir } = options

        assert(COMFYUI_MODEL_DIRS.includes(dir), `Invalid ComfyUI directory. Must be one of: ${COMFYUI_MODEL_DIRS.join(', ')}`)
        assert(link, 'Model link is required')

        console.log(`Model link received: "${link}"`)

        const prisma = this.modelrepo['prisma']

        // https://huggingface.co/alalarty/models2/blob/main/il/cn/ilxl_cn_depth_v20.safetensors
        if (link.startsWith('https://huggingface.co')) {
          const [repo, file] = link
            .replace('https://huggingface.co/', '')
            .split('/blob/main/')

          const name = file
            .replace('.safetensors', '')
            .replace(/[^0-9a-z]/, '_')
            .toLowerCase()
            .split('/')
            .at(-1)

          await prisma.$transaction(async (trx: lib.PrismaLibService) => {
            const modelId = await this.modelrepo.createModel({
              name,
              comfyUiDirectory: dir,
              comfyUiFileName: file.split('/').at(-1),
              label: name,
              trx,
            })

            await this.modelrepo.createModelHuggingfaceLink({ modelId, repo, file, trx })

            await this.modelrepo.createModelTag({ modelId, tag: 'new', trx })

            console.log('\x1b[36m', 'modelId', modelId, '\x1b[0m')
          })
        }
      })
  }
}
