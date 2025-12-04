import { join } from 'path'
import { spawn } from 'child_process'
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

  private lockDownload = false

  readonly HF_HOME: string
  readonly WORKSPACE: string
  readonly GENERATE_TASKS_DIR: string
  readonly GENERATE_PROGRESS_TASKS_DIR: string
  readonly DOWNLOAD_TASKS_DIR: string
  readonly WORKFLOW_DIR: string
  readonly MODEL_INFO_DIR: string

  readonly CACHE_DIR: string

  readonly COMFY_UI_DIR: string
  readonly COMFY_UI_URL: string
  readonly COMFY_UI_WS_URL: string

  constructor(
    private readonly configService: ConfigService,
    private readonly hflib: lib.HuggingfaceLibService,
    private readonly civitailib: lib.CivitaiLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,
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
    this.WORKFLOW_DIR = `${this.WORKSPACE}/workflows`
    this.MODEL_INFO_DIR = `${this.WORKSPACE}/model_info`

    fs.mkdirSync(this.GENERATE_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.GENERATE_PROGRESS_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.DOWNLOAD_TASKS_DIR, { recursive: true })
    fs.mkdirSync(this.CACHE_DIR, { recursive: true })
    fs.mkdirSync(this.WORKFLOW_DIR, { recursive: true })
    fs.mkdirSync(this.MODEL_INFO_DIR, { recursive: true })

    this.COMFY_UI_DIR = `${this.WORKSPACE}/ComfyUI`
    this.COMFY_UI_URL = 'http://localhost:18188'
    this.COMFY_UI_WS_URL = 'ws://localhost:18188/ws'
  }

  async loadModelFromCivitai ({ chatId, civitaiId, civitaiVersionId, filename, dstDir }: {
    chatId: string,
    civitaiId: string,
    civitaiVersionId: string,
    dstDir: string,
    filename: string,
  }) {
    const { l, COMFY_UI_DIR } = this

    const fullDstDirName = `${COMFY_UI_DIR}/models/${dstDir}`
    const fullDstFilename = `${dstDir}/${filename}`

    l.log(`CloudAppSynthService_loadModelFromCivitai_00 Loading model from Civitai is not implemented yet: civitaiId=${civitaiId}, civitaiVersionId=${civitaiVersionId}, dst=${fullDstFilename}`)

    if (fs.existsSync(fullDstFilename)) {
      l.log(`CloudAppSynthService_loadModelFromCivitai_11 File ${fullDstFilename} already exists, skipping download`)
      return
    }

    const info = await this.civitailib.importModelVersionData({ modelVersionId: civitaiVersionId })
    const file = info.files.find(i => i.primary) || info.files[0]
    const size = Math.ceil(file.sizeKB * 1024)
    const sizeHuman = filesize(size).human('si')

    const startDstDirSize = await getFolderSize.loose(fullDstDirName)

    let timer

    try {
      while (this.lockDownload) {
        l.log(`CloudAppSynthService_loadFileFromHF_60 Waiting for other download to finish...`)
        await setTimeout(3000)
      }

      let message = this.msglib.genCodeMessage(`Downloading "${filename}" (${sizeHuman}) ...`)
      const messageId = await this.tgbotlib.sendMessage({ chatId, text: message })

      const start = Date.now()

      timer = setInterval(() => {
        // Запускаем асинхронную операцию "в фоне"
        (async (): Promise<void> => {
          try {
            const currentDstDirSize = await getFolderSize.loose(fullDstDirName)
            const downloadedSize = currentDstDirSize - startDstDirSize

            const duration = this.h.format.duration((Date.now() - start) / 1000)

            const message = this.msglib.genMultiProgressMessage([
              {
                message: `Downloading "${filename}" (${sizeHuman}) ${duration}`,
                total: size,
                done: downloadedSize,
              },
            ])

            await this.tgbotlib.editMessage({ chatId, messageId, text: message })
          } catch (error) {
            console.log('CloudAppSynthService_loadModelFromCivitai_73 Error in download progress update:', error)
            // Можно также отправить сообщение об ошибке в Telegram, если нужно
            await this.tgbotlib.sendMessage({ chatId, text: `Error while download progress form civitai "${filename}": ${error.message}` })
          }
        })()
      }, 2000)

      await new Promise((resolve, reject) => {
        const command = `${COMFY_UI_DIR}/venv/bin/comfy`
        const args = [
          '--skip-prompt',
          '--workspace', COMFY_UI_DIR,
          'model', 'download',
          '--url', `https://civitai.com/models/${civitaiId}?modelVersionId=${civitaiVersionId}`,
          '--relative-path', './models/' + dstDir,
          '----filename', filename,
          '--set-civitai-api-token', this.civitailib.CIVITAI_TOKEN || '',
        ]

        console.log('start command:')
        console.log(command, args.join(' '))

        const child = spawn(command, args, { env: { ...process.env } })

        child.stdout.setEncoding('utf8')
        child.stderr.setEncoding('utf8')

        child.stdout.setEncoding('utf8')
        child.stderr.setEncoding('utf8')

        child.on('close', (code) => {
          if (code === 0) {
            resolve(true)
          } else {
            const error = new Error(`CloudAppSynthService_loadModelFromCivitai_87 civitai download exited with code ${code}`)
            reject(error)
          }
        })
      })

      clearInterval(timer)

      const duration = this.h.format.duration((Date.now() - start) / 1000)
      message = this.msglib.genCodeMessage(`Download "${filename}" complete! Time taken: ${duration}`)
      await this.tgbotlib.editMessage({ chatId, messageId, text: message })
    } catch (error) {
      l.error(`CloudAppSynthService_loadModelFromCivitai_97 Error downloading model from Civitai ${civitaiId} version ${civitaiVersionId}`, error.message)
      await this.tgbotlib.sendMessage({ chatId, text: `Error while downloading model from civitai "${filename}": ${error.message}` })
    } finally {
      this.lockDownload = false

      if (timer) {
        clearInterval(timer)
      }
    }
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
      while (this.lockDownload) {
        l.log(`CloudAppSynthService_loadFileFromHF_60 Waiting for other download to finish...`)
        await setTimeout(3000)
      }

      this.lockDownload = true

      let message = this.msglib.genCodeMessage(`Downloading "${srcFilename}" (${hfSizeHuman}) ...`)
      const messageId = await this.tgbotlib.sendMessage({ chatId, text: message })

      let downloadedInCacheDir = 0
      const start = Date.now()

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
            const duration = this.h.format.duration((Date.now() - start) / 1000)

            const message = this.msglib.genMultiProgressMessage([
              {
                message: `Downloading "${srcFilename}" (${hfSizeHuman}) ${duration}`,
                total: hfSize,
                done: downloadedInCacheDir,
              },
              { total: hfSize, done: downloadedInDstDirSize },
            ])

            await this.tgbotlib.editMessage({ chatId, messageId, text: message })
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

      const duration = this.h.format.duration((Date.now() - start) / 1000)
      message = this.msglib.genCodeMessage(`Download "${srcFilename}" complete! Time taken: ${duration}`)
      await this.tgbotlib.editMessage({ chatId, messageId, text: message })
    } catch (error) {
      l.error(`CloudAppSynthService_loadFileFromHF_97 Error downloading file ${repo}/${srcFilename}`, error.message)
    } finally {
      this.lockDownload = false

      if (timer) {
        clearInterval(timer)
      }
    }

  }
}
