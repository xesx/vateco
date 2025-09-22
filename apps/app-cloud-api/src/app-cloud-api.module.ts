import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { VastLibModule } from '@libs/vast'
import { TgBotLibModule } from '@libs/tg-bot'

import { MulterModule } from '@nestjs/platform-express'
import { MulterConfigAppCloudApiService } from './multer-config.app-cloud-api.service'

import { AppCloudApiController } from './app-cloud-api.controller'
import { FileAppCloudApiController } from './file.app-cloud-api.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MulterModule.registerAsync({
      useClass: MulterConfigAppCloudApiService,
    }),
    VastLibModule,
    TgBotLibModule,
  ],
  controllers: [
    AppCloudApiController,
    FileAppCloudApiController,
  ],
  providers: [],
})
export class AppCloudApiModule {}