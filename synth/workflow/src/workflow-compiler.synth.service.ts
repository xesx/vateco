import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

@Injectable()
export class WorkflowCompilerSynthService {
  private readonly l = new Logger(WorkflowCompilerSynthService.name)

  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly modelrepo: repo.ModelRepository,
  ) {}

  async checkpointEnum (i) {
    const models = await this.modelrepo.findModelsByComfyUiDir('checkpoints')

    const arr = models
      .map(model => ({
        label: model.label || model.name,
        value: model.name,
      }))

    if (i) {
      return arr[i]
    }

    return arr
  }

  async loraEnum (i) {
    const models = await this.modelrepo.findModelsByComfyUiDir('loras')

    const arr = models
      .map(model => ({
        label: model.label || model.name,
        value: model.name,
      }))

    if (i) {
      return arr[i]
    }

    return arr
  }
}
