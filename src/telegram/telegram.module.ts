import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TelegrafModule } from 'nestjs-telegraf'; // или вручную через Telegraf

import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
        middlewares: [],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {
  //
}
