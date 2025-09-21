import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import * as lib from '@lib'

import { AppCliService } from './app-cli.service'

import {
  TestCli,
  InstallComfyuiV0Cli,
  StartComfyuiCli,
} from './command'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    lib.HelperLibModule,
    lib.MessagesLibModule,
    lib.RcloneLibModule,
    lib.TgBotLibModule,
    lib.ComfyUiLibModule,
    lib.HuggingfaceLibModule,
  ],
  providers: [
    AppCliService,
    TestCli,
    InstallComfyuiV0Cli,
    StartComfyuiCli,
  ],
})
export class AppCliModule {}