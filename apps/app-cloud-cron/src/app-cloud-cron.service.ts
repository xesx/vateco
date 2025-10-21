import * as fs from 'fs'

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'

import { Mutex } from './mutex.decorator'

import * as lib from '@lib'
import * as job from './job'

// check cron time here https://crontab.cronhub.io/

@Injectable()
export class CloudCronService {
  private readonly WORKSPACE: string
  private readonly GENERATE_TASKS_DIR: string
  private readonly OUTPUT_DIR: string
  private readonly TG_CHAT_ID: string

  private readonly log = new Logger(CloudCronService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly tgbotlib: lib.TgBotLibService,

    private readonly workflowLoadCronJob: job.WorkflowLoadCronJob,
    private readonly workflowRunCronJob: job.WorkflowRunCronJob,
    private readonly workflowProgressCronJob: job.WorkflowProgressCronJob,
    private readonly checkOutputCronJob: job.CheckOutputCronJob,
    private readonly downloadCronJob: job.DownloadCronJob,
  ) {
    this.WORKSPACE = this.configService.get<string>('WORKSPACE') || '/workspace'
    this.GENERATE_TASKS_DIR = `${this.WORKSPACE}/generate_tasks`
    this.OUTPUT_DIR = `${this.WORKSPACE}/ComfyUI/output`
    this.TG_CHAT_ID = String(process.env.TG_CHAT_ID)

    fs.mkdirSync(this.GENERATE_TASKS_DIR, { recursive: true })
  }

  // Every 1 seconds
  @Cron('*/1 * * * * *')
  @Mutex('checkOutputCronJob')
  async _checkOutputCronJob () {
    const { OUTPUT_DIR, TG_CHAT_ID } = this
    await this.checkOutputCronJob.handle({ OUTPUT_DIR, TG_CHAT_ID })
  }

  // Every 2 seconds
  @Cron('*/2 * * * * *')
  @Mutex('handleRunWorkflowJob')
  async _workflowRunCronJob () {
    await this.workflowRunCronJob.handle()
  }

  // Every 3 seconds
  @Cron('*/3 * * * * *')
  @Mutex('handleProgressWorkflowJob')
  async _workflowProgressCronJob () {
    const { TG_CHAT_ID } = this
    await this.workflowProgressCronJob.handle({ TG_CHAT_ID })
  }

  // Every 2 seconds
  @Cron('*/2 * * * * *')
  @Mutex('workflowLoadCronJob')
  async _workflowLoadCronJob () {
    const { WORKSPACE, TG_CHAT_ID } = this
    await this.workflowLoadCronJob.handle({ WORKSPACE, TG_CHAT_ID })
  }

  // Every 2 seconds
  @Cron('*/2 * * * * *')
  @Mutex('downloadCronJob')
  async _downloadCronJob () {
    await this.downloadCronJob.handle()
  }
}