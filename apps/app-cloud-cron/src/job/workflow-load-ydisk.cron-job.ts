import { setTimeout } from 'timers/promises'
import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

const loadedWorkflows = new Set<string>()

@Injectable()
export class WorkflowLoadYdiskCronJob {
  private readonly l = new Logger(WorkflowLoadYdiskCronJob.name)

  constructor(
    private readonly rclonelib: lib.RcloneLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly wflib: lib.WorkflowLibService,
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
      if (loadedWorkflows.has(workflowId)) {
        continue
      }

      // const workflow = this.wflib.getWorkflow(workflowId)
      // const models = workflow?.models
      //
      // for (const model of models) {
      //   const srcFs = 'ydisk:'
      //   const srcRemote = `shared/comfyui/models/${model}`
      //   const dstFs = '/'
      //   const dstRemote = `${WORKSPACE}/ComfyUI/models/${model}`
      //
      //   if (fs.existsSync(dstRemote)) {
      //     l.log(`Model ${model} already exists, skipping download`)
      //     continue
      //   }
      //
      //   const startTime = Date.now()
      //
      //   let message = this.msglib.genDownloadMessage({ name: `Model ${model}` })
      //   const downloadingMessageId = await this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })
      //
      //   for await (const jobStats of this.rclonelib.loadFileGenerator({ srcFs, srcRemote, dstFs, dstRemote })) {
      //     message = this.msglib.genDownloadMessage({
      //       name: `Model ${model}`,
      //       totalBytes: jobStats?.size,
      //       transferredBytes: jobStats?.bytes,
      //       speedInBytes: jobStats?.speed,
      //       transferTimeInSec: (Date.now() - startTime) / 1000,
      //       etaInSec: jobStats?.eta,
      //     })
      //
      //     await this.tgbotlib.editMessage({ chatId: TG_CHAT_ID, messageId: downloadingMessageId, text: message })
      //     await setTimeout(3000)
      //   }
      // }
      //
      // await this.tgbotlib.sendMessage({
      //   chatId: TG_CHAT_ID,
      //   text: this.msglib.genCodeMessage(`Workflow ${workflowId} loaded!`),
      // })
      //
      // loadedWorkflows.add(workflowId)
    }
  }
}