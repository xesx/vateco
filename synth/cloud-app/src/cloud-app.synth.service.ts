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

  readonly HF_HOME: string
  readonly WORKSPACE: string
  readonly GENERATE_TASKS_DIR: string
  readonly GENERATE_PROGRESS_TASKS_DIR: string
  readonly DOWNLOAD_TASKS_DIR: string

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
    this.GENERATE_PROGRESS_TASKS_DIR = join(this.WORKSPACE, 'generate_progress_tasks')
    this.DOWNLOAD_TASKS_DIR = join(this.WORKSPACE, 'download_tasks')

    fs.mkdirSync(this.GENERATE_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.GENERATE_PROGRESS_TASKS_DIR, { recursive: true })
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

    let startCacheDirSize = await getFolderSize.loose(HF_HOME)

    fs.readdirSync(dstDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory()) // оставляем только папки
      .map(entry => entry.name)
      .filter(name => name.startsWith('.') && name.includes('cache'))
      .forEach(dirName => {
        const cacheDirPath = join(dstDir, dirName)
        fs.rmSync(cacheDirPath, { recursive: true, force: true })
      })

    const startDstDirSize = await getFolderSize.loose(dstDir)

    let timer

    try {
      while (this.lockDownloadHFFiles) {
        l.log(`CloudAppSynthService_loadFileFromHF_60 Waiting for other download to finish...`)
        await setTimeout(3000)
      }

      this.lockDownloadHFFiles = true

      let message = this.msglib.genCodeMessage(`Downloading "${filename}" (${hfSizeHuman}) ...`)
      const messageId = await this.tgbotlib.sendMessage({ chatId, text: message })

      let downloadedSize = 0

      timer = setInterval(() => {
        // Запускаем асинхронную операцию "в фоне"
        (async (): Promise<void> => {
          try {
            const currentCacheDirSize = await getFolderSize.loose(HF_HOME)
            const currentDstDirSize = await getFolderSize.loose(dstDir)

            let deltaSize = (currentDstDirSize + currentCacheDirSize) - (startDstDirSize + startCacheDirSize)
            downloadedSize = downloadedSize + deltaSize

            if (currentCacheDirSize < startCacheDirSize) {
              startCacheDirSize = currentCacheDirSize

              deltaSize = 0
              downloadedSize = currentDstDirSize - startDstDirSize
            }

            if (deltaSize < 0 || downloadedSize + deltaSize > hfSize) {
              downloadedSize = currentDstDirSize - startDstDirSize
            }

            message = this.msglib.genProgressMessage({
              message: `Downloading "${filename}" (${hfSizeHuman})`,
              total: hfSize,
              done: downloadedSize,
            })

            await this.tgbotlib.editMessage({ chatId, messageId, text: message })
          } catch (error) {
            console.error('Error in download progress update:', error)
            // Можно также отправить сообщение об ошибке в Telegram, если нужно
          }
        })()
      }, 2000)

      await this.hflib.downloadWithRetry({
        repo,
        filename,
        dir: dstDir,
        retries: 5,
        delayMs: 10000,
      })

      clearInterval(timer)

      // если файл в репозитории лежит в папке, то hf cli скачает его вместе с папкой
      fs.renameSync(`${dstDir}/${filename}`, fullFileName)

      message = this.msglib.genCodeMessage(`Download "${filename}" complete!`)
      await this.tgbotlib.editMessage({ chatId, messageId, text: message })
    } catch (error) {
      l.error(`CloudAppSynthService_loadFileFromHF_97 Error downloading file ${repo}/${filename}`, error.message)
    } finally {
      this.lockDownloadHFFiles = false

      if (timer) {
        clearInterval(timer)
      }
    }

  }
}
