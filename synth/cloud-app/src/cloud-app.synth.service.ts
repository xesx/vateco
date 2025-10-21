import { join } from 'path'
import * as fs from 'fs'

// import * as assert from 'node:assert/strict'
// import * as pm2 from 'pm2'
// import axios from 'axios'
// import * as WebSocket from 'ws'
//
// console.log('\x1b[36m', 'WebSocket', WebSocket, '\x1b[0m')

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as filesize from 'file-size'
// import axios, { AxiosInstance } from 'axios'

import * as lib from '@lib'

@Injectable()
export class CloudAppSynthService {
  private readonly l = new Logger(CloudAppSynthService.name)

  private readonly HF_HOME: string
  private readonly WORKSPACE: string
  private readonly GENERATE_TASKS_DIR: string
  private readonly DOWNLOAD_TASKS_DIR: string

  private readonly COMFY_UI_DIR: string
  private readonly COMFY_UI_URL: string
  private readonly COMFY_UI_WS_URL: string

  private readonly hflib: lib.HuggingfaceLibService
  private readonly tgbotlib: lib.TgBotLibService
  private readonly msglib: lib.MessageLibService

  constructor(private readonly configService: ConfigService) {
    this.WORKSPACE = this.configService.get<string>('WORKSPACE') || '/workspace'
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
    const { l, WORKSPACE } = this

    const dstDir = `${WORKSPACE}/${dir}`
    const fullFileName = `${dstDir}/${filename}`

    if (fs.existsSync(fullFileName)) {
      l.log(`File ${fullFileName} already exists, skipping download`)
      return
    }

    const size = await this.hflib.getFileSize({ repo, filename })
    if (!size) {
      l.error(`CloudAppSynthService_loadFileFromHF_94 Unable to get file size for ${repo}/${filename}, skipping download`)
      return
    }

    let message = this.msglib.genCodeMessage(`Downloading "${filename}" (${filesize(size).human('si')}) ...`)
    const messageId = await this.tgbotlib.sendMessage({ chatId, text: message })

    await this.hflib.downloadWithRetry({
      repo,
      filename,
      dir: dstDir,
      retries: 5,
      delayMs: 10000,
    })

    message = this.msglib.genCodeMessage(`Download "${filename}" complete!`)
    await this.tgbotlib.editMessage({ chatId, messageId, text: message })
  }
}
