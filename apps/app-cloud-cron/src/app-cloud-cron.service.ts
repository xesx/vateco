import { setTimeout } from 'timers/promises'
import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'

import { Mutex } from './mutex.decorator'

import { RcloneLibService } from '@libs/rclone'
import { TgBotLibService } from '@libs/tg-bot'
import { MessageLibService } from '@libs/message'
import * as lib from '@lib'

import { workflowRunMenu } from '@kb'

// check cron time here https://crontab.cronhub.io/

const loadedWorkflows = new Set<string>()

@Injectable()
export class CloudCronService {
  private readonly WORKSPACE: string
  private readonly GENERATE_TASKS_DIR: string

  private readonly log = new Logger(CloudCronService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly herror: lib.ErrorHelperLibService,
    private readonly rclonelib: RcloneLibService,
    private readonly tgbotlib: TgBotLibService,
    private readonly msglib: MessageLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly comfyuilib: lib.ComfyUiLibService,
  ) {
    this.WORKSPACE = this.configService.get<string>('WORKSPACE') || '/workspace'
    this.GENERATE_TASKS_DIR = `${this.WORKSPACE}/generate_tasks`

    fs.mkdirSync(this.GENERATE_TASKS_DIR, { recursive: true })
  }

  // Every 2 seconds
  @Cron('*/2 * * * * *')
  @Mutex('runWorkflowJob')
  async handleRunWorkflowJob() {
    const { log } = this
    const chatId = String(process.env.TG_CHAT_ID)

    const tasks = fs.readdirSync(this.GENERATE_TASKS_DIR)
      .filter(file => file.endsWith('.json'))
      .sort()
    console.log('\x1b[36m', 'workspacePath', tasks, '\x1b[0m')

    for (const taskFile of tasks) {
      const taskFilePath = join(this.GENERATE_TASKS_DIR, taskFile)
      let taskData: { workflowId: string, count?: number, workflowParams: Record<string, any> } | null = null

      try {
        const fileContent = fs.readFileSync(taskFilePath, "utf8")
        taskData = JSON.parse(fileContent) as { workflowId: string, count?: number, workflowParams: Record<string, any> }
      } catch (error) {
        console.log('handleRunWorkflowJob_55 Error', error)
        taskData = null
      }

      if (!taskData) {
        fs.unlinkSync(taskFilePath)
        continue
      }

      const { workflowId, count = 1, workflowParams } = taskData
      fs.unlinkSync(taskFilePath)

      log.log(`🕐 Run workflow cron job executed, found "${workflowId}" workflow to run ${count} times`)

      const wf = this.wflib.getWorkflow(workflowId)

      if (!wf) {
        log.log(`❌ Workflow ${workflowId} not found`)
        continue
      }

      for (let i = 0; i < count; i++) {
        log.log(`🔄 Running workflow ${workflowId}, iteration ${i + 1} of ${count}`)

        const compiledWorkflowSchema = this.wflib.compileWorkflow({ workflowId, workflowParams })

        try {
          const response = await this.comfyuilib.prompt(compiledWorkflowSchema)
          log.log(`handleRunWorkflowJob_80 Workflow ${workflowId} run completed, response: ${JSON.stringify(response)}`)
        } catch (error) {
          console.log('handleRunWorkflowJob_85 Error', this.herror.parseAxiosError(error))
        }

        // await setTimeout(2000)
      }

      // await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage(`Workflow ${workflowId} runs completed!`) })
    }
  }

  // Every 2 seconds
  @Cron('*/2 * * * * *')
  @Mutex('loadWorkflowJob')
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