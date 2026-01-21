import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import * as lib from '@lib'
import * as synth from '@synth'
import * as repo from '@repo'

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
    lib.PrismaLibModule,
    lib.CivitaiLibModule,
    lib.OpenaiLibModule,
    lib.RunpodLibModule,

    repo.ModelRepositoryModule,
    repo.WorkflowRepositoryModule,

    synth.CloudAppSynthModule,
    synth.WorkflowSynthModule,
  ],
  providers: [
    AppCliService,
    ...Object.values(command),
  ],
})
export class AppCliModule {}