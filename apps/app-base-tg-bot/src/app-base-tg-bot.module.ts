import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { TelegrafModule } from 'nestjs-telegraf'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import { AppBaseTgBotService } from './app-base-tg-bot.service'
import { BaseCommandTgBot } from './command/base.command.tg-bot'

import * as owni from './way-own-instance'
import * as rpwf from './way-runpod-workflow'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // чтобы не импортировать в каждом модуле
      envFilePath: ['.env'], // можно указать разные файлы для dev/prod
    }),
    lib.PrismaLibModule,
    // Настройка Telegraf с использованием ConfigService
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
    lib.TgBotLibModule,
    lib.MessagesLibModule,
    lib.VastLibModule,
    lib.CloudApiCallLibModule,
    lib.RcloneLibModule,
    lib.WorkflowLibModule,
    lib.RunpodLibModule,

    repo.TgBotSessionsStoreRepositoryModule,
    repo.WorkflowRepositoryModule,
    repo.UserRepositoryModule,
    repo.ModelRepositoryModule,

    synth.WorkflowSynthModule,

    lib.HelperLibModule,
  ],
  controllers: [],
  providers: [
    AppBaseTgBotService,
    // order is important, as handlers are executed in the order they are registered
    BaseCommandTgBot,

    owni.WayOwnITgBot,
    owni.HandleOwnITgBot,
    owni.ActionOwnITgBot,
    owni.ViewOwnITgBot,

    rpwf.WayOwnITgBot,
    rpwf.HandleRunpodWfTgBot,
    rpwf.ViewRunpodWfTgBot,

    // CommonHandlerTgBot,
  ],
})

export class AppBaseTgBotModule {}
