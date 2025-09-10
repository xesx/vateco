import { LocalSessionConstructor } from './types/session.types'

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { TelegrafModule } from 'nestjs-telegraf'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LocalSession = require('telegraf-session-local') as LocalSessionConstructor

import { AppBaseTgBotService } from './app-base-tg-bot.service'

import { TgBotLibModule } from '@libs/tg-bot'
import { MessagesLibModule } from '@libs/message'
import { VastLibModule } from '@libs/vast'
import { RcloneLibModule } from '@libs/rclone'
import { CloudApiCallLibModule } from '@libs/cloud-api-call'

import { CommonHandlerTgBot } from './handler/common.handler.tg-bot'

import { BaseCommandTgBot } from './command/base.command.tg-bot'
import { TestCommandTgBot } from './command/test.command.tg-bot'

import {
  Act00MwareOwnITgBot,
  Act01SetSearchParamsOwnITgBot,
  Act02SearchOffersOwnITgBot,
  Act03CreateOwnITgBot,
  Act04ManageOwnITgBot,
} from './act-own-instance'

import {
  SelectWorkflowTgBot,
  CheckStatusWorkflowTgBot,
} from './workflow-command'

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
          middlewares: [
            session.middleware(),
            (ctx, next) => {
              ctx.session.lastTimestamp = Date.now()
              ctx.session.chatId ??= ctx.chat?.id || -1
              ctx.session.step ??= 'start'
              ctx.session.gpuName ??= 'any'
              ctx.session.geolocation ??= 'any'
              ctx.session.inDataCenterOnly ??= false

              return next()
            },
          ],
        }
      },
      inject: [ConfigService],
    }),
    TgBotLibModule,
    MessagesLibModule,
    VastLibModule,
    CloudApiCallLibModule,
    RcloneLibModule,
  ],
  controllers: [],
  providers: [
    AppBaseTgBotService,
    // order is important, as handlers are executed in the order they are registered
    // HelpCommandTgBot,
    BaseCommandTgBot,
    TestCommandTgBot,

    Act00MwareOwnITgBot,
    Act01SetSearchParamsOwnITgBot,
    Act02SearchOffersOwnITgBot,
    Act03CreateOwnITgBot,
    Act04ManageOwnITgBot,

    SelectWorkflowTgBot,
    CheckStatusWorkflowTgBot,

    // CommonHandlerTgBot,
  ],
})

export class AppBaseTgBotModule {}
