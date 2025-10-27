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

  readonly CACHE_DIR: string

  readonly COMFY_UI_DIR: string
  readonly COMFY_UI_URL: string
  readonly COMFY_UI_WS_URL: string

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
    this.CACHE_DIR = `${this.WORKSPACE}/cache`

    fs.mkdirSync(this.GENERATE_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.GENERATE_PROGRESS_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.DOWNLOAD_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.CACHE_DIR, { recursive: true })

    this.COMFY_UI_DIR = `${this.WORKSPACE}/ComfyUI`
    this.COMFY_UI_URL = 'http://localhost:18188'
    this.COMFY_UI_WS_URL = 'ws://localhost:18188/ws'
  }

  async loadFileFromHF ({ chatId, repo, srcFilename, dstFilename, dstDir }: {
    chatId: string,
    repo: string,
    srcFilename: string,
    dstFilename: string,
    dstDir: string,
  }) {
    const { l, WORKSPACE, HF_HOME } = this

    dstDir = `${WORKSPACE}/${dstDir}`
    const fullDstFilename = `${dstDir}/${dstFilename}`

    if (fs.existsSync(fullDstFilename)) {
      l.log(`CloudAppSynthService_loadFileFromHF_30 File ${fullDstFilename} already exists, skipping download`)
      return
    }

    const hfSize = await this.hflib.getFileSize({ repo, filename: srcFilename })
    if (!hfSize) {
      l.error(`CloudAppSynthService_loadFileFromHF_47 Unable to get file size for ${repo}/${srcFilename}, skipping download`)
      return
    }

    const hfSizeHuman = filesize(hfSize).human('si')

    fs.readdirSync(dstDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory()) // оставляем только папки
      .map(entry => entry.name)
      .filter(name => name.startsWith('.cache'))
      .forEach(dirName => {
        const cacheDirPath = join(dstDir, dirName)
        fs.rmSync(cacheDirPath, { recursive: true, force: true })
      })

    let startCacheDirSize = await getFolderSize.loose(HF_HOME)
    const startDstDirSize = await getFolderSize.loose(dstDir)

    let timer

    try {
      while (this.lockDownloadHFFiles) {
        l.log(`CloudAppSynthService_loadFileFromHF_60 Waiting for other download to finish...`)
        await setTimeout(3000)
      }

      this.lockDownloadHFFiles = true

      let message = this.msglib.genCodeMessage(`Downloading "${srcFilename}" (${hfSizeHuman}) ...`)
      const messageId = await this.tgbotlib.sendMessage({ chatId, text: message })

      let downloadedInCacheDir = 0
      let step = 1

      timer = setInterval(() => {
        // Запускаем асинхронную операцию "в фоне"
        (async (): Promise<void> => {
          try {
            const currentCacheDirSize = await getFolderSize.loose(HF_HOME)
            const currentDstDirSize = await getFolderSize.loose(dstDir)

            const cacheDirDelta = currentCacheDirSize - startCacheDirSize

            if (cacheDirDelta > 0) {
              downloadedInCacheDir += cacheDirDelta
            } else {
              startCacheDirSize = currentCacheDirSize
            }

            const downloadedInDstDirSize = currentDstDirSize - startDstDirSize

            const cacheDirProgressMessage = this.msglib.genProgressMessage({
              message: `Downloading "${srcFilename}" (${hfSizeHuman}), step ${step}\nCache dir:`,
              total: hfSize,
              done: downloadedInCacheDir,
            })

            const dstDirProgressMessage = this.msglib.genProgressMessage({
              message: `Dst dir:`,
              total: hfSize,
              done: downloadedInDstDirSize,
            })

            message = cacheDirProgressMessage + dstDirProgressMessage
            await this.tgbotlib.editMessage({ chatId, messageId, text: message })
            step++
          } catch (error) {
            console.error('Error in download progress update:', error)
            // Можно также отправить сообщение об ошибке в Telegram, если нужно
          }
        })()
      }, 2000)

      await this.hflib.downloadWithRetry({
        repo,
        filename: srcFilename,
        dir: dstDir,
        retries: 5,
        delayMs: 10000,
      })

      clearInterval(timer)

      // если файл в репозитории лежит в папке, то hf cli скачает его вместе с папкой
      fs.renameSync(`${dstDir}/${srcFilename}`, fullDstFilename)

      message = this.msglib.genCodeMessage(`Download "${srcFilename}" complete!`)
      await this.tgbotlib.editMessage({ chatId, messageId, text: message })
    } catch (error) {
      l.error(`CloudAppSynthService_loadFileFromHF_97 Error downloading file ${repo}/${srcFilename}`, error.message)
    } finally {
      this.lockDownloadHFFiles = false

      if (timer) {
        clearInterval(timer)
      }
    }

  }
}
