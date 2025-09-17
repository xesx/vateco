import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
// import { Postgres } from "@telegraf/session/pg"

import { TelegrafModule } from 'nestjs-telegraf'
// import { session } from 'telegraf'

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
    lib.PrismaLibModule,
    // Настройка Telegraf с использованием ConfigService
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, lib.PrismaLibModule],
      useFactory: (
        configService: ConfigService,
        // prismaStore: lib.TgBotSessionStorePrismaLibService,
      ) => {
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN')

        if (!token) {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env')
        }

        // const store = Postgres({
        //   host: configService.get<string>('PG_HOST'),
        //   port: configService.get<number>('PG_PORT'),
        //   database: configService.get<string>('PG_DATABASE'),
        //   user: configService.get<string>('PG_USER'),
        //   password: configService.get<string>('PG_PASSWORD'),
        // })
        // const pool: Pool = (prisma as any)._engine?.pool

        return {
          token,
          // middlewares: [session({ store: prismaStore })],
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
