import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as synth from '@synth'

import { HelperAppCloudCronService } from '../helper.app-cloud-cron.service'

type TWorkflowTask = {
  chatId: string
  workflowVariantId: string
  count?: number
  workflowVariantParams: Record<string, any>
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
    private readonly h: lib.HelperLibService,
    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  async handle () {
    const { l } = this
    const { GENERATE_PROGRESS_TASKS_DIR, GENERATE_TASKS_DIR, WORKFLOW_DIR, MODEL_INFO_DIR } = this.appcloudsynth
    const { wfParamSchema } = this.wflib
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

      const { chatId, workflowVariantId, count = 1, workflowVariantParams } = taskData
      fs.unlinkSync(taskFilePath)

      l.log(`🕐 Run workflow cron job executed, found "${workflowVariantId}" workflow to run ${count} times`)

      // const workflow = this.wflib.getWorkflow(workflowId)
      const workflow = JSON.parse(fs.readFileSync(join(WORKFLOW_DIR, `${workflowVariantId}.json`), 'utf8'))

      if (!workflow) {
        l.warn(`❌ Workflow ${workflowVariantId} not found`)
        continue
      }

      const modelsForDownload: string[] = []
      const imagesForDownload: string[] = []

      Object.entries(workflowVariantParams || {}).forEach(([key, value]) => {
        if (typeof value === 'object') {
          value = value.value
        }

        if (['❓', 'N/A'].includes(value)) {
          return
        }

        if (wfParamSchema[key].isComfyUiModel) {
          // workflow.params[key].default = value
          modelsForDownload.push(value)

          const modelInfoFilePath = join(MODEL_INFO_DIR, `${value}.json`)

          if (!fs.existsSync(modelInfoFilePath)) {
            l.warn(`handleRunWorkflowJob_64 Model info file not found: ${modelInfoFilePath}`)
            return
          }

          const model: any = JSON.parse(fs.readFileSync(modelInfoFilePath, 'utf8'))
          workflowVariantParams[key] = model.comfyUiFileName
          return
        }

        if (key.startsWith('image') && typeof value === 'string') {
          imagesForDownload.push(value) // value is fileId from tg bot chat
          workflowVariantParams[key] = `${value}.jpg`
        }
      })

      for (const modelName of modelsForDownload) {
        const modelInfoFilePath = join(MODEL_INFO_DIR, `${modelName}.json`)

        if (!fs.existsSync(modelInfoFilePath)) {
          l.warn(`handleRunWorkflowJob_73 Model info file not found: ${modelInfoFilePath}`)
          continue
        }

        const model: any = JSON.parse(fs.readFileSync(modelInfoFilePath, 'utf8'))

        const [{ repo, file }] = model.huggingfaceLinks
        const srcFilename = file
        const dstFilename = model.comfyUiFileName
        const dstDir = `ComfyUI/models/${model.comfyUiDirectory}`

        await this.appcloudsynth.loadFileFromHF({ chatId: TG_CHAT_ID, repo, srcFilename, dstFilename, dstDir })
      }

      for (const fileId of imagesForDownload) {
        const uploadPath = `/${this.appcloudsynth.COMFY_UI_DIR}/input`
        const imagePath = join(uploadPath, `${fileId}.jpg`)

        if (fs.existsSync(imagePath)) {
          // fileBuffer = fs.readFileSync(join(this.appcloudsynth.CACHE_DIR, fileId))
          // fs.writeFileSync(imagePath, fileBuffer)
          l.log(`handleRunWorkflowJob_150 Image loaded from cache and saved to ${imagePath}`)
          // continue
        } else {
          const imageBuffer = await this.tgbotlib.importImageBufferByFileId({ fileId })
          // fs.writeFileSync(join(this.appcloudsynth.CACHE_DIR, fileId), fileBuffer)
          l.log(`handleRunWorkflowJob_156 Image downloaded from Telegram and saved to cache`)
          fs.writeFileSync(imagePath, imageBuffer)
        }

        // fs.writeFileSync(imagePath, fileBuffer)
      }

      // const message = this.msglib.genCodeMessage('Generation in progress...')
      // this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })

      for (let i = 0; i < count; i++) {
        l.log(`handleRunWorkflowJob_55 Running workflow ${workflowVariantId}, iteration ${i + 1} of ${count}`)
        l.log(`handleRunWorkflowJob_60 Workflow params: ${JSON.stringify(workflowVariantParams)}`)

        const { workflow: compiledWorkflowSchema, params: compiledParams } = this.wflib.compileWorkflowV2({ workflow, params: workflowVariantParams })

        try {
          const response = await this.comfyuilib.prompt(compiledWorkflowSchema)
          l.log(`handleRunWorkflowJob_80 Workflow ${workflowVariantId} run completed, response: ${JSON.stringify(response)}`)

          const promptId = response.prompt_id
          const progressFilename = `${promptId}.json`

          const content = {
            chatId,
            promptId,
            workflowVariantId,
            workflowVariantParams,
            filenamePrefix: compiledParams.filenamePrefix || '',
            workflow: compiledWorkflowSchema,
          }

          fs.writeFileSync(join(GENERATE_PROGRESS_TASKS_DIR, progressFilename), JSON.stringify(content, null, 2), "utf8")
        } catch (error) {
          l.error('handleRunWorkflowJob_85 Error', this.h.herr.parseAxiosError(error))
          const message = this.msglib.genCodeMessage(`Error during workflow "${workflowVariantId}" execution: ${error.message}`)
          await this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })
        }
      }
    }
  }
}