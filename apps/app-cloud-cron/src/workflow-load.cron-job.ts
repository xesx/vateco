import { setTimeout } from 'timers/promises'
import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as lib from '@lib'

import { workflowRunMenu } from '@kb'

const loadedWorkflows = new Set<string>()

@Injectable()
export class CloudCronService {
  private readonly WORKSPACE: string

  private readonly log = new Logger(CloudCronService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly rclonelib: lib.RcloneLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {
    this.WORKSPACE = this.configService.get<string>('WORKSPACE') || '/workspace'
  }

  async handleLoadWorkflowJob() {
    const { log } = this
    const chatId = String(process.env.TG_CHAT_ID)
    const workspacePath = String(this.WORKSPACE) || '/workspace'
    const filePath = join(workspacePath, 'load.json')

    if (!fs.existsSync(filePath)) {
      return
    }

    const fileContent = fs.readFileSync(filePath, "utf8")
    fs.writeFileSync(filePath, JSON.stringify([]), "utf8")

    const workflowIds = JSON.parse(fileContent) as string[]

    if (workflowIds?.length === 0) {
      return
    }

    log.log(`🕐 Load workflow cron job executed, found "${workflowIds.join(',')}" workflows to load`)

    for (const workflowId of workflowIds) {
      if (loadedWorkflows.has(workflowId)) {
        continue
      }

      await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage(`Start ${workflowId} loading...`) })

      const wf = this.wflib.getWorkflow(workflowId)
      const models = wf?.models

      for (const model of models) {
        const srcFs = 'ydisk:'
        const srcRemote = `shared/comfyui/models/${model}`
        const dstFs = '/'
        const dstRemote = `${workspacePath}/ComfyUI/models/${model}`

        const startTime = Date.now()
        let message = this.msglib.genDownloadMessage({ name: `Model ${model}` })
        const downloadingMessageId = await this.tgbotlib.sendMessage({ chatId, text: message })

        for await (const jobStats of this.rclonelib.loadFileGenerator({ srcFs, srcRemote, dstFs, dstRemote })) {
          message = this.msglib.genDownloadMessage({
            name: `Model ${model}`,
            totalBytes: jobStats?.size,
            transferredBytes: jobStats?.bytes,
            speedInBytes: jobStats?.speed,
            transferTimeInSec: (Date.now() - startTime) / 1000,
            etaInSec: jobStats?.eta,
          })

          await this.tgbotlib.editMessage({ chatId, messageId: downloadingMessageId, text: message })
          await setTimeout(3000)
        }
      }

      await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage(`Workflow ${workflowId} loaded!`) })

      const workflowParams = Object.entries(wf.params).reduce((acc, [key, val]) => {
        acc[key] = val.default
        return acc
      }, {} as { [key: string]: string | number | boolean })

      loadedWorkflows.add(workflowId)

      await this.tgbotlib.sendInlineKeyboard({
        chatId,
        text: `Workflow ${workflowId}`,
        keyboard: this.tgbotlib.generateInlineKeyboard(workflowRunMenu({
          workflowParams,
          prefixAction: `act:own-instance`,
          backAction: 'act:own-instance:workflow'
        })),
      })
    }
  }
}