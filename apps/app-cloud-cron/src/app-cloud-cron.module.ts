import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'

import { RcloneLibModule } from '@libs/rclone'
import { TgBotLibModule } from '@libs/tg-bot'
import { MessagesLibModule } from '@libs/message'

import { CloudCronService } from './app-cloud-cron.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    RcloneLibModule,
    TgBotLibModule,
    MessagesLibModule,
  ],
  providers: [CloudCronService],
})
export class AppCloudCronModule {}