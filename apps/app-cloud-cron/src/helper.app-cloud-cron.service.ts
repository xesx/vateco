// import * as fs from 'fs'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as lib from '@lib'
// import modelMap from '@model'

// check cron time here https://crontab.cronhub.io/

// TODO mayby remove this service if it's not needed
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
}