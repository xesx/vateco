import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { MessagesLibModule } from '@libs/message'
import { HelperLibModule } from '@libs/h'
import { RcloneLibModule } from '@libs/rclone'
import { TgBotLibModule } from '@libs/tg-bot'

import { AppCliService } from './app-cli.service'

import {
  TestCli,
  InstallComfyuiV0Cli,
} from './command'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HelperLibModule,
    MessagesLibModule,
    RcloneLibModule,
    TgBotLibModule,
  ],
  providers: [
    AppCliService,
    TestCli,
    InstallComfyuiV0Cli,
  ],
})
export class AppCliModule {}