import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'

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

    TelegrafModule.forRootAsync({
      imports: [ConfigModule, lib.PrismaLibModule],
      useFactory: (
        configService: ConfigService,
      ) => {
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN')

        if (!token) {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env')
        }

        return { token }
      },
      inject: [ConfigService],
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
    lib.RandomImageLibModule,

    repo.ModelRepositoryModule,
    repo.WorkflowRepositoryModule,
    repo.LockRepositoryModule,

    synth.CloudAppSynthModule,
    synth.WorkflowSynthModule,
  ],
  providers: [
    AppCliService,
    ...Object.values(command),
  ],
})
export class AppCliModule {}