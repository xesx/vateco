// import { setTimeout } from 'timers/promises'
import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as synth from '@synth'
import modelMap from '@model'

import { HelperAppCloudCronService } from '../helper.app-cloud-cron.service'

@Injectable()
export class WorkflowLoadCronJob {
  private readonly l = new Logger(WorkflowLoadCronJob.name)

  constructor(
    private readonly helper: HelperAppCloudCronService,

    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly wflib: lib.WorkflowLibService,

    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  async handle ({ TG_CHAT_ID, WORKSPACE }) {
    const { l } = this

    const filePath = join(WORKSPACE, 'load.json')

    if (!fs.existsSync(filePath)) {
      return
    }

    const fileContent = fs.readFileSync(filePath, "utf8")
    fs.writeFileSync(filePath, JSON.stringify([]), "utf8")

    const workflowIds = JSON.parse(fileContent) as string[]

    if (workflowIds?.length === 0) {
      return
    }

    l.log(`🕐 Load workflow cron job executed, found "${workflowIds.join(',')}" workflows to load`)

    for (const workflowId of workflowIds) {
      const workflow = this.wflib.getWorkflow(workflowId)
      const models = workflow?.models

      for (const modelName of models) {
        const model = modelMap[modelName]
        const [repo] = Object.keys(model.huggingfaceLink)
        const filename = model.huggingfaceLink[repo]
        const dir = `ComfyUI/models/${model.comfyUiDir}`

        // await this.helper.loadModel(modelName)
        await this.appcloudsynth.loadFileFromHF({ chatId: TG_CHAT_ID, repo, filename, dir })
      }

      await this.tgbotlib.sendMessage({
        chatId: TG_CHAT_ID,
        text: this.msglib.genCodeMessage(`Workflow ${workflowId} loaded!`),
      })
    }
  }
}