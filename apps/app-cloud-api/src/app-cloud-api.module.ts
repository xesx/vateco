import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { VastLibModule } from '@libs/vast'
import { TgBotLibModule } from '@libs/tg-bot'

import { AppCloudApiController } from './app-cloud-api.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    VastLibModule,
    TgBotLibModule,
  ],
  controllers: [AppCloudApiController],
  providers: [],
})
export class AppCloudApiModule {}
