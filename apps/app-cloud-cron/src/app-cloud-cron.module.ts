import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'

import * as lib from '@lib'
import * as synth from '@synth'

import { CloudCronService } from './app-cloud-cron.service'
import { HelperAppCloudCronService } from './helper.app-cloud-cron.service'
import * as job from './job'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    lib.RcloneLibModule,
    lib.TgBotLibModule,
    lib.MessagesLibModule,
    lib.HelperLibModule,
    lib.WorkflowLibModule,
    lib.ComfyUiLibModule,
    lib.HuggingfaceLibModule,

    synth.CloudAppSynthModule
  ],
  providers: [
    CloudCronService,
    HelperAppCloudCronService,
    ...Object.values(job),
  ],
})
export class AppCloudCronModule {}