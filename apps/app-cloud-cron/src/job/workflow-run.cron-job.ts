import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as synth from '@synth'

import { HelperAppCloudCronService } from '../helper.app-cloud-cron.service'

type TWorkflowTask = {
  chatId: string
  workflowTemplateId: string
  count?: number
  workflowVariantParams: Record<string, any>
  models: string[]
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

      const { chatId, workflowTemplateId, count = 1, workflowVariantParams, models } = taskData
      fs.unlinkSync(taskFilePath)

      l.log(`🕐 Run workflow cron job executed, found "${workflowTemplateId}" workflow to run ${count} times`)

      const workflow = JSON.parse(fs.readFileSync(join(WORKFLOW_DIR, `${workflowTemplateId}.json`), 'utf8'))

      if (!workflow) {
        l.warn(`❌ Workflow ${workflowTemplateId} not found`)
        continue
      }

      for (const modelName of models) {
        const modelInfoFilePath = join(MODEL_INFO_DIR, `${modelName}.json`)

        if (!fs.existsSync(modelInfoFilePath)) {
          l.warn(`handleRunWorkflowJob_73 Model info file not found: ${modelInfoFilePath}`)
          continue
        }

        const model: any = JSON.parse(fs.readFileSync(modelInfoFilePath, 'utf8'))

        const [hfLink] = model.huggingfaceLinks || []
        const [civitaiLink] = model.civitaiLinks || []

        if (hfLink) {
          const { repo, file } = hfLink
          const srcFilename = file
          const dstFilename = model.comfyUiFileName
          const dstDir = `ComfyUI/models/${model.comfyUiDirectory}`

          await this.appcloudsynth.loadFileFromHF({ chatId: TG_CHAT_ID, repo, srcFilename, dstFilename, dstDir })
        } else if (civitaiLink) {
          const { civitaiId, civitaiVersionId } = civitaiLink
          const filename = model.comfyUiFileName
          const dstDir = model.comfyUiDirectory

          await this.appcloudsynth.loadModelFromCivitai({ chatId: TG_CHAT_ID, civitaiId, civitaiVersionId, filename, dstDir })
        } else {
          l.warn(`handleRunWorkflowJob_100 No download link found for model ${modelName}`)
        }

      }

      const imagesForDownload: string[] = []

      Object.entries(workflowVariantParams || {}).forEach(([key, value]) => {
        if (key.startsWith('LoadImage:image')) {
          imagesForDownload.push(value) // value is fileId from tg bot chat
        }
      })

      for (const fileId of imagesForDownload) {
        const uploadPath = `/${this.appcloudsynth.COMFY_UI_DIR}/input`
        const imagePath = join(uploadPath, fileId)

        if (fs.existsSync(imagePath)) {
          l.log(`handleRunWorkflowJob_150 Image ${imagePath} already exists`)
        } else {
          const imageBuffer = await this.tgbotlib.importImageBufferByFileId({ fileId })

          l.log(`handleRunWorkflowJob_156 Image downloaded from Telegram and saved to cache`)
          fs.writeFileSync(imagePath, imageBuffer)
        }
      }

      // const message = this.msglib.genCodeMessage('Generation in progress...')
      // this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })

      for (let i = 0; i < count; i++) {
        l.log(`handleRunWorkflowJob_55 Running workflow ${workflowTemplateId}, iteration ${i + 1} of ${count}`)
        l.log(`handleRunWorkflowJob_60 Workflow params: ${JSON.stringify(workflowVariantParams)}`)

        const compiledWorkflowSchema = this.wflib.compileWorkflowSchema({ workflow, params: workflowVariantParams })

        try {
          const response = await this.comfyuilib.prompt(compiledWorkflowSchema)
          l.log(`handleRunWorkflowJob_80 Workflow ${workflowTemplateId} run completed, response: ${JSON.stringify(response)}`)

          const promptId = response.prompt_id
          const progressFilename = `${promptId}.json`

          const content = {
            chatId,
            promptId,
            workflowTemplateId,
            workflowVariantParams,
            // filenamePrefix: compiledParams.filenamePrefix || '',
            workflow: compiledWorkflowSchema,
          }

          fs.writeFileSync(join(GENERATE_PROGRESS_TASKS_DIR, progressFilename), JSON.stringify(content, null, 2), "utf8")
        } catch (error) {
          l.error('handleRunWorkflowJob_85 Error', this.h.herr.parseAxiosError(error))
          const message = this.msglib.genCodeMessage(`Error during workflow "${workflowTemplateId}" execution: ${error.message}`)
          await this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })
        }
      }
    }
  }
}