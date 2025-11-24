import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

@Injectable()
export class ModelCreateCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly modelrepo: repo.ModelRepository,
  ) {}

  register(program) {
    program
      .command('create-model <link>')
      .description('Create model from link')
      .action(async (link) => {
        console.log(`Model link received: "${link}"`)

        // https://huggingface.co/alalarty/models2/blob/main/il/cn/ilxl_cn_depth_v20.safetensors
        if (link.startsWith('https://huggingface.co')) {
          const [repo, file] = link.replace('https://huggingface.co/', '').split('/blob/main/')
          console.log('\x1b[36m', 'repo', repo, '\x1b[0m')
          console.log('\x1b[36m', 'file', file, '\x1b[0m')

          const name = file
            .replace('.safetensors', '')
            .split('/')
            .at(-1)

          console.log('\x1b[36m', 'name', name, '\x1b[0m')

          // const modelId = await this.modelrepo.createModel({
          //   name: 'test-model',
          //   comfyUiDirectory: 'models/Stable-diffusion',
          //   comfyUiFileName: 'test-model.safetensors',
          //   label: 'stable-diffusion',
          // })

          // console.log('\x1b[36m', 'modelId', modelId, '\x1b[0m')
        }
      })
  }
}
