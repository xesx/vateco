// import { setTimeout } from 'timers/promises'
import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as synth from '@synth'

import { HelperAppCloudCronService } from '../helper.app-cloud-cron.service'

@Injectable()
export class DownloadCronJob {
  private readonly l = new Logger(DownloadCronJob.name)

  constructor(
    private readonly helper: HelperAppCloudCronService,

    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly hflib: lib.HuggingfaceLibService,

    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  async handle () {
    const { l } = this

    const { DOWNLOAD_TASKS_DIR } = this.appcloudsynth

    if (!fs.existsSync(DOWNLOAD_TASKS_DIR)) {
      return
    }

    const tasks = fs.readdirSync(DOWNLOAD_TASKS_DIR)
      .filter(file => file.endsWith('.json'))
      .sort()

    for (const taskFile of tasks) {
      const taskFilePath = join(DOWNLOAD_TASKS_DIR, taskFile)
      const fileContent = fs.readFileSync(taskFilePath, "utf8")

      if (taskFile.startsWith('hf_download_')) {
        const { chatId, repo, filename, dir } = JSON.parse(fileContent)
        await this.appcloudsynth.loadFileFromHF({ chatId, repo, filename, dir })

        l.log(`DownloadCronJob_95 Huggingface file "${repo}/${filename}" downloaded to "${dir}" for chatId ${chatId}`)
      }

      fs.unlinkSync(taskFilePath)
    }
  }
}