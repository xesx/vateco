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

  // $.modelEnum:checkpoints:["illustrious","sd"]:
  async modelEnum (comfyUiDirectory: string, tagsJsonArray: string, i: number) {
    const tags: string[] = JSON.parse(tagsJsonArray)
    const models = await this.modelrepo.findModels({ comfyUiDirectory, tags })

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
