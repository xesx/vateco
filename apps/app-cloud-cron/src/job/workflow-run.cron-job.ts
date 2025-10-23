import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as synth from '@synth'

import modelMap from '@model'

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
    const TG_CHAT_ID = String(process.env.TG_CHAT_ID) // todo

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
        if (typeof value === 'object') {
          value = value.value
        }

        if (['❓', 'N/A'].includes(value)) {
          return
        }

        if (workflow.params[key].isComfyUiModel) {
          workflow.params[key].default = value
          modelsForDownload.push(value)
        }
      })

      console.log('\x1b[36m', 'modelsForDownload', modelsForDownload, '\x1b[0m')
      for (const modelName of modelsForDownload) {
        console.log('\x1b[36m', 'modelName', modelName, '\x1b[0m')
        const model = modelMap[modelName]
        const [repo] = Object.keys(model.huggingfaceLink)
        const srcFilename = model.huggingfaceLink[repo]
        const dstFilename = model.comfyUiFileName
        const dstDir = `ComfyUI/models/${model.comfyUiDir}`

        await this.appcloudsynth.loadFileFromHF({ chatId: TG_CHAT_ID, repo, srcFilename, dstFilename, dstDir })
      }

      // const message = this.msglib.genCodeMessage('Generation in progress...')
      // this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })

      for (let i = 0; i < count; i++) {
        l.log(`handleRunWorkflowJob_55 Running workflow ${workflowId}, iteration ${i + 1} of ${count}`)
        l.log(`handleRunWorkflowJob_60 Workflow params: ${JSON.stringify(workflowParams)}`)

        const { workflow: compiledWorkflowSchema, params: compiledParams } = this.wflib.compileWorkflowV2({ id: workflowId, params: workflowParams })

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
            filenamePrefix: compiledParams.filenamePrefix || '',
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