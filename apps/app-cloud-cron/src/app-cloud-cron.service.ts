import { setTimeout } from 'timers/promises'
import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Mutex } from './mutex.decorator'

import { RcloneLibService } from '@libs/rclone'
import { TgBotLibService } from '@libs/tg-bot'
import { MessageLibService } from '@libs/message'

import workflow from '@workflow'

// check cron time here https://crontab.cronhub.io/

const loadedWorkflows = new Set<string>()

@Injectable()
export class CloudCronService {
  private readonly logger = new Logger(CloudCronService.name)

  constructor(
    private readonly rclonelib: RcloneLibService,
    private readonly tgbotlib: TgBotLibService,
    private readonly msglib: MessageLibService,
  ) {}

  // Every 2 seconds
  @Cron('*/2 * * * * *')
  @Mutex('loadWorkflowJob')
  async handleEverySecond() {
    const chatId = String(process.env.TG_CHAT_ID)
    const workspacePath = String(process.env.WORKSPACE) || '/workspace'
    const filePath = join(workspacePath, 'load.json')

    if (!fs.existsSync(filePath)) {
      return
    }

    const fileContent = fs.readFileSync(filePath, "utf8")
    fs.writeFileSync(filePath, JSON.stringify([]), "utf8")

    const workflowIds = JSON.parse(fileContent) as string[]

    for (const workflowId of workflowIds) {
      if (loadedWorkflows.has(workflowId)) {
        continue
      }

      await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage(`Start ${workflowId} loading...`) })
      // const wf = workflow[workflowId]

      // const models = wf?.models || [
      const models = [
        'loras/SD1.5/add_detail.safetensors',
        'loras/SDXL/add-detail-xl.safetensors',
        'checkpoints/SD1.5/juggernaut_reborn.safetensors',
      ]

      for (const model of models) {
        await this.rclonelib.operationCopyFile({
          srcFs: 'ydisk:',
          srcRemote: `shared/comfyui/models/${model}`,
          dstFs: '/',
          dstRemote: `workspace/ComfyUI/models/${model}`,
        })

        await this.rclonelib.operationCopyFile({
          baseUrl: `http://localhost:5572`,
          srcFs: 'ydisk:',
          srcRemote: `shared/comfyui/models/${model}`,
          dstFs: '/',
          dstRemote: `${workspacePath}/ComfyUI/models/${model}`,
        })

        await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage(`Model ${model} loaded!`) })

        await setTimeout(3000) // ???
      }

      await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage(`Workflow ${workflowId} loaded!`) })
      loadedWorkflows.add(workflowId)
    }
    // this.logger.debug('⚡ Every second cron job executed')
    // await setTimeout(2500) // Симуляция работы
  }

  // Каждую секунду
  // @Cron('* * * * * *')
  // @Mutex('everySecondJob')
  // async handleEverySecond() {
  //   this.logger.debug('⚡ Every second cron job executed')
  //   await setTimeout(2500) // Симуляция работы
  // }

  // Каждую минуту
  @Cron(CronExpression.EVERY_MINUTE)
  @Mutex('everyMinuteJob')
  handleEveryMinute() {
    this.logger.log('🕐 Every minute cron job executed')

    // Пример работы с данными
    const currentTime = new Date().toISOString()
    this.logger.log(`Current time: ${currentTime}`)
  }

  // Каждые 5 минут
  @Cron('0 */5 * * * *')
  handleEveryFiveMinutes() {
    this.logger.log('🕐 Every 5 minutes cron job executed')
    // Здесь можно добавить проверку состояния инстансов
    this.checkInstancesStatus()
  }

  // Каждый час
  @Cron(CronExpression.EVERY_HOUR)
  handleEveryHour() {
    this.logger.log('🕐 Every hour cron job executed')

    // Здесь можно добавить очистку старых данных
    this.cleanupOldData()
  }

  private async checkInstancesStatus() {
    this.logger.log('Checking instances status...')
    // Логика проверки статуса инстансов
  }

  private async cleanupOldData() {
    this.logger.log('Cleaning up old data...')
    // Логика очистки старых данных
  }
}