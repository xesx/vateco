import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { MulterModule } from '@nestjs/platform-express'

import * as lib from '@lib'

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
    lib.VastLibModule,
    lib.TgBotLibModule,
  ],
  controllers: [
    AppCloudApiController,
    FileAppCloudApiController,
  ],
  providers: [],
})
export class AppCloudApiModule {}