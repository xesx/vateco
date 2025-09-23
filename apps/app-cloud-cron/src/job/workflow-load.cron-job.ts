import { setTimeout } from 'timers/promises'
import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import modelMap from '@model'

@Injectable()
export class WorkflowLoadCronJob {
  private readonly l = new Logger(WorkflowLoadCronJob.name)

  constructor(
    private readonly hflib: lib.HuggingfaceLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {}

  async handle({ TG_CHAT_ID, WORKSPACE }) {
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
        const dstDir = `${WORKSPACE}/ComfyUI/models/${model.comfyUiDir}`
        const fullFileName = `${dstDir}/${modelName}`

        if (fs.existsSync(fullFileName)) {
          l.log(`Model ${model} already exists, skipping download`)
          continue
        }

        let message = this.msglib.genCodeMessage(`Downloading "${modelName}"...`)
        const messageId = await this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })

        const [repo] = Object.keys(model.huggingfaceLink)

        await this.hflib.download({
          repo,
          filename: model.huggingfaceLink[repo],
          dir: dstDir,
        })
        fs.renameSync(`${dstDir}/${model.huggingfaceLink[repo]}`, fullFileName)

        message = this.msglib.genCodeMessage(`Download "${modelName}" complete`)
        await this.tgbotlib.editMessage({ chatId: TG_CHAT_ID, messageId, text: message })

        await setTimeout(1000) // ???
      }

      await this.tgbotlib.sendMessage({
        chatId: TG_CHAT_ID,
        text: this.msglib.genCodeMessage(`Workflow ${workflowId} loaded!`),
      })
    }
  }
}