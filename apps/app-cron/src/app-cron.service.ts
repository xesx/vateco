import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'

import { Mutex } from './mutex.decorator'

import * as lib from '@lib'
import * as job from './job'

// check cron time here https://crontab.cronhub.io/

@Injectable()
export class CloudCronService {
  private readonly log = new Logger(CloudCronService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly tgbotlib: lib.TgBotLibService,

    private readonly checkOutputCronJob: job.CheckGeneratingQueueCronJob,
  ) {
    // todo
  }

  // Every 1 seconds
  @Cron('*/2 * * * * *')
  @Mutex('checkGenerationQueueCronJob')
  async _checkGenerationQueueCronJob() {
    // await this.checkOutputCronJob.handle({ OUTPUT_DIR, TG_CHAT_ID })
    console.log('\x1b[36m', 'test', '\x1b[0m')
  }
}