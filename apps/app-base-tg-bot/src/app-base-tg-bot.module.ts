import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { TelegrafModule } from 'nestjs-telegraf'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LocalSession = require('telegraf-session-local')

import * as lib from '@lib'

import { AppBaseTgBotService } from './app-base-tg-bot.service'
import { BaseCommandTgBot } from './command/base.command.tg-bot'

import * as owni from './act-own-instance'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // чтобы не импортировать в каждом модуле
      envFilePath: ['.env'], // можно указать разные файлы для dev/prod
    }),
    // Настройка Telegraf с использованием ConfigService
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN')

        if (!token) {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env')
        }

        const session = new LocalSession({
          database: 'session.tg-bot.json', // путь к файлу базы данных сессий
        })

        return {
          token,
          middlewares: [session.middleware()],
        }
      },
      inject: [ConfigService],
    }),
    lib.TgBotLibModule,
    lib.MessagesLibModule,
    lib.VastLibModule,
    lib.CloudApiCallLibModule,
    lib.RcloneLibModule,
    lib.WorkflowLibModule
  ],
  controllers: [],
  providers: [
    AppBaseTgBotService,
    // order is important, as handlers are executed in the order they are registered
    BaseCommandTgBot,

    owni.CommonOwnITgBot,
    owni.Act01SetSearchParamsOwnITgBot,
    owni.Act02SearchOffersOwnITgBot,
    owni.Act03CreateOwnITgBot,
    owni.Act04ManageOwnITgBot,
    owni.Act10WorkflowsOwnITgBot

    // CommonHandlerTgBot,
  ],
})

export class AppBaseTgBotModule {}
