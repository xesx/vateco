import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as synth from '@synth'

import { HelperAppCloudCronService } from '../helper.app-cloud-cron.service'

type TWorkflowTask = {
  chatId: string
  workflowId: string
  count?: number
  workflowParams: Record<string, any>
}

@Injectable()
export class WorkflowRunCronJob {
  private readonly l = new Logger(WorkflowRunCronJob.name)

  constructor(
    private readonly helper: HelperAppCloudCronService,

    private readonly comfyuilib: lib.ComfyUiLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  async handle () {
    const { l } = this
    const { GENERATE_PROGRESS_TASKS_DIR, GENERATE_TASKS_DIR } = this.appcloudsynth

    if (!fs.existsSync(GENERATE_TASKS_DIR)) {
      l.log(`handleRunWorkflowJob_11 Generate tasks directory does not exist: ${GENERATE_TASKS_DIR}`)
      return
    }

    const tasks = fs.readdirSync(GENERATE_TASKS_DIR)
      .filter(file => file.endsWith('.json'))
      .sort()

    for (const taskFile of tasks) {
      const taskFilePath = join(GENERATE_TASKS_DIR, taskFile)
      let taskData: TWorkflowTask | null = null

      try {
        const fileContent = fs.readFileSync(taskFilePath, "utf8")
        taskData = JSON.parse(fileContent) as TWorkflowTask
      } catch (error) {
        l.error('handleRunWorkflowJob_55 Error', error)
        fs.unlinkSync(taskFilePath)
        continue
      }

      const { chatId, workflowId, count = 1, workflowParams } = taskData
      fs.unlinkSync(taskFilePath)

      l.log(`🕐 Run workflow cron job executed, found "${workflowId}" workflow to run ${count} times`)

      const workflow = this.wflib.getWorkflow(workflowId)

      if (!workflow) {
        l.warn(`❌ Workflow ${workflowId} not found`)
        continue
      }

      const modelsForDownload: string[] = []

      Object.entries(workflowParams || {}).forEach(([key, value]) => {
        if (workflow.params[key].isComfyUiModel) {
          workflow.params[key].default = value
          modelsForDownload.push(value)
        }
      })

      for (const modelName of modelsForDownload) {
        await this.helper.loadModel(modelName)
      }

      // const message = this.msglib.genCodeMessage('Generation in progress...')
      // this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })

      for (let i = 0; i < count; i++) {
        l.log(`🔄 Running workflow ${workflowId}, iteration ${i + 1} of ${count}`)

        l.log(`handleRunWorkflowJob_60 Workflow params: ${JSON.stringify(workflowParams)}`)
        const compiledWorkflowSchema = this.wflib.compileWorkflow({ id: workflowId, params: workflowParams })

        try {
          const response = await this.comfyuilib.prompt(compiledWorkflowSchema)
          l.log(`handleRunWorkflowJob_80 Workflow ${workflowId} run completed, response: ${JSON.stringify(response)}`)

          const promptId = response.prompt_id
          const progressFilename = `${promptId}.json`

          const content = {
            chatId,
            promptId,
            workflowId,
            workflowParams,
            workflow: compiledWorkflowSchema,
          }

          fs.writeFileSync(join(GENERATE_PROGRESS_TASKS_DIR, progressFilename), JSON.stringify(content, null, 2), "utf8")
        } catch (error) {
          l.error('handleRunWorkflowJob_85 Error', error)
        }
      }
    }
  }
}