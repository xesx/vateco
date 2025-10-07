import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import * as lib from '@lib'

import { AppCliService } from './app-cli.service'

import * as command from './command'

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
    lib.WorkflowLibModule,
    lib.VastLibModule,
  ],
  providers: [
    AppCliService,
    ...Object.values(command),
  ],
})
export class AppCliModule {}