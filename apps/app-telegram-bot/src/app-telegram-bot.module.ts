import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { TelegrafModule } from 'nestjs-telegraf'
// import { AppTelegramBotService } from './app-telegram-bot.service'

import { CommonHandlerTgBot } from './handler/common.handler.tg-bot'

import { HelpCommandTgBot } from './command/help.command.tg-bot'
import { StartCommandTgBot } from './command/start.command.tg-bot'

import { MenuCallbackTgBot } from './callback/menu.callback.tg-bot'

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
        return { token }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [
    // order is important, as handlers are executed in the order they are registered
    HelpCommandTgBot,
    StartCommandTgBot,
    MenuCallbackTgBot,
    CommonHandlerTgBot,
  ],
})

export class AppTelegramBotModule {}
