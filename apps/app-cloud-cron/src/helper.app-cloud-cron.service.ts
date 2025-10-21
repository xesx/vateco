import * as fs from 'fs'

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'

import * as filesize from 'file-size'

import { Mutex } from './mutex.decorator'

import * as lib from '@lib'
import modelMap from '@model'

// check cron time here https://crontab.cronhub.io/

@Injectable()
export class HelperAppCloudCronService {
  private readonly WORKSPACE: string
  private readonly GENERATE_TASKS_DIR: string
  private readonly OUTPUT_DIR: string
  private readonly TG_CHAT_ID: string

  private readonly l = new Logger(HelperAppCloudCronService.name)

  constructor(
    private readonly configService: ConfigService,

    private readonly hflib: lib.HuggingfaceLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {
    this.WORKSPACE = this.configService.get<string>('WORKSPACE') || '/workspace'
    this.GENERATE_TASKS_DIR = `${this.WORKSPACE}/generate_tasks`
    this.OUTPUT_DIR = `${this.WORKSPACE}/ComfyUI/output`
    this.TG_CHAT_ID = String(process.env.TG_CHAT_ID)
  }

  async loadModel (modelName) {
    const { l, WORKSPACE, TG_CHAT_ID } = this

    const model = modelMap[modelName]
    const dstDir = `${WORKSPACE}/ComfyUI/models/${model.comfyUiDir}`
    const fullFileName = `${dstDir}/${modelName}`

    if (fs.existsSync(fullFileName)) {
      l.log(`Model ${model} already exists, skipping download`)
      return
    }

    const [repo] = Object.keys(model.huggingfaceLink)

    const size = await this.hflib.getFileSize({ repo, filename: model.huggingfaceLink[repo] })

    let message = this.msglib.genCodeMessage(`Downloading "${modelName}" (${filesize(size).human('si')}) ...`)
    const messageId = await this.tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: message })

    await this.hflib.downloadWithRetry({
      repo,
      filename: model.huggingfaceLink[repo],
      dir: dstDir,
      retries: 5,
      delayMs: 10000,
    })

    fs.renameSync(`${dstDir}/${model.huggingfaceLink[repo]}`, fullFileName)

    message = this.msglib.genCodeMessage(`Download "${modelName}" complete`)
    await this.tgbotlib.editMessage({ chatId: TG_CHAT_ID, messageId, text: message })
  }
}