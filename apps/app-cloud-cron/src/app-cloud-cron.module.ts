import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'

import { RcloneLibModule } from '@libs/rclone'
import { TgBotLibModule } from '@libs/tg-bot'
import { MessagesLibModule } from '@libs/message'
import * as lib from '@lib'

import { CloudCronService } from './app-cloud-cron.service'
import * as job from './job'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    RcloneLibModule,
    TgBotLibModule,
    MessagesLibModule,
    lib.HelperLibModule,
    lib.WorkflowLibModule,
    lib.ComfyUiLibModule,
    lib.HuggingfaceLibModule,
  ],
  providers: [
    CloudCronService,
    job.WorkflowLoadCronJob,
    job.WorkflowRunCronJob,
    job.CheckOutputCronJob,
  ],
})
export class AppCloudCronModule {}