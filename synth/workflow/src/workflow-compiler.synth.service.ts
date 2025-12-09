import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

@Injectable()
export class WorkflowCompilerSynthService {
  private readonly l = new Logger(WorkflowCompilerSynthService.name)

  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly modelrepo: repo.ModelRepository,
    private readonly tagrepo: repo.TagRepository,
  ) {}

  async enumModelTag (comfyUiDirectory: string) {
    const allModelTagsNames = await this.modelrepo.findUniqueModelTags(comfyUiDirectory)
    const allModelTags = await this.tagrepo.getTagsByNames({ names: allModelTagsNames })

    return allModelTags
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(tag => ({ label: '❌' + tag.name, value: tag.id }))
  }

  // $.enumModel:checkpoints:["illustrious","sd"]:
  async enumModel (comfyUiDirectory: string, tagsJsonArray: string, i: number) {
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

  async enumCheckpoint (i) {
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

  async enumLora (i) {
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
