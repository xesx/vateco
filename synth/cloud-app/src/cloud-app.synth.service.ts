import { join } from 'path'
import * as fs from 'fs'
import { setTimeout } from 'timers/promises'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as filesize from 'file-size'
import getFolderSize from 'get-folder-size'

import * as lib from '@lib'

@Injectable()
export class CloudAppSynthService {
  private readonly l = new Logger(CloudAppSynthService.name)

  private lockDownloadHFFiles = false

  private readonly HF_HOME: string
  private readonly WORKSPACE: string
  private readonly GENERATE_TASKS_DIR: string
  private readonly DOWNLOAD_TASKS_DIR: string

  private readonly COMFY_UI_DIR: string
  private readonly COMFY_UI_URL: string
  private readonly COMFY_UI_WS_URL: string

  constructor(
    private readonly configService: ConfigService,
    private readonly hflib: lib.HuggingfaceLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
  ) {
    this.WORKSPACE = this.configService.get<string>('WORKSPACE') || process.env.WORKSPACE || ''

    if (!this.WORKSPACE) {
      throw new Error('CloudAppSynthService_constructor_38 WORKSPACE is not set')
    }

    this.HF_HOME = process.env.HF_HOME || `${this.WORKSPACE}/.hf_home`
    this.GENERATE_TASKS_DIR = `${this.WORKSPACE}/generate_tasks`
    this.DOWNLOAD_TASKS_DIR = join(this.WORKSPACE, 'download_tasks')

    fs.mkdirSync(this.GENERATE_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.DOWNLOAD_TASKS_DIR, { recursive: true })

    this.COMFY_UI_DIR = `${this.WORKSPACE}/ComfyUI`
    this.COMFY_UI_URL = 'http://localhost:18188'
    this.COMFY_UI_WS_URL = 'ws://localhost:18188/ws'
  }

  async loadFileFromHF ({ chatId, repo, filename, dir }: { chatId: string, repo: string, filename: string, dir: string }) {
    const { l, WORKSPACE, HF_HOME } = this

    const dstDir = `${WORKSPACE}/${dir}`
    const fullFileName = `${dstDir}/${filename}`

    if (fs.existsSync(fullFileName)) {
      l.log(`CloudAppSynthService_loadFileFromHF_30 File ${fullFileName} already exists, skipping download`)
      return
    }

    const hfSize = await this.hflib.getFileSize({ repo, filename })
    if (!hfSize) {
      l.error(`CloudAppSynthService_loadFileFromHF_47 Unable to get file size for ${repo}/${filename}, skipping download`)
      return
    }

    const hfSizeHuman = filesize(hfSize).human('si')


    try {
      while (this.lockDownloadHFFiles) {
        l.log(`CloudAppSynthService_loadFileFromHF_60 Waiting for other download to finish...`)
        await setTimeout(3000)
      }

      this.lockDownloadHFFiles = true
      const startCacheHFSize = await getFolderSize.loose(HF_HOME)

      let message = this.msglib.genCodeMessage(`Downloading "${filename}" (${hfSizeHuman}) ...`)
      const messageId = await this.tgbotlib.sendMessage({ chatId, text: message })

      const timer = setInterval(() => {
        // Запускаем асинхронную операцию "в фоне"
        (async (): Promise<void> => {
          if (!fs.existsSync(HF_HOME)) {
            return
          }

          try {
            const currentCacheHFSize = await getFolderSize.loose(HF_HOME)
            const downloadedSize = currentCacheHFSize - startCacheHFSize

            const percent = ((downloadedSize / hfSize) * 100).toFixed(2)
            message = this.msglib.genCodeMessage(
              `Downloading "${filename}" (${hfSizeHuman}) ... ${filesize(downloadedSize).human('si')} (${percent}%)`
            )
            await this.tgbotlib.editMessage({ chatId, messageId, text: message })
          } catch (error) {
            console.log('CloudAppSynthService_loadFileFromHF_93 Error in download progress update:', error)
            // Можно также отправить сообщение об ошибке в Telegram, если нужно
          }
        })()
      }, 3000)

      await this.hflib.downloadWithRetry({
        repo,
        filename,
        dir: dstDir,
        retries: 5,
        delayMs: 10000,
      })

      clearInterval(timer)

      message = this.msglib.genCodeMessage(`Download "${filename}" complete!`)
      await this.tgbotlib.editMessage({ chatId, messageId, text: message })
    } catch (error) {
      l.error(`CloudAppSynthService_loadFileFromHF_97 Error downloading file ${repo}/${filename}`, error.message)
    } finally {
      this.lockDownloadHFFiles = false
    }

  }
}
