import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppAdminController } from './app-admin.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // чтобы не импортировать в каждом модуле
      envFilePath: ['.env'], // можно указать разные файлы для dev/prod
    }),
  ],
  controllers: [AppAdminController],
  providers: [],
})
export class AppAdminModule {}
