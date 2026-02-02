import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import * as lib from '@lib'
import * as repo from '@repo'

import { AppAdminController } from './app-admin.controller'
import { WorkflowTemplateController } from './workflow-template.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // чтобы не импортировать в каждом модуле
      envFilePath: ['.env'], // можно указать разные файлы для dev/prod
    }),
    lib.RunpodLibModule,
    lib.VastLibModule,
    lib.TgBotLibModule,
    lib.WorkflowLibModule,
    lib.PrismaLibModule,
    repo.WorkflowRepositoryModule,
  ],
  controllers: [AppAdminController, WorkflowTemplateController],
  providers: [],
})
export class AppAdminModule {}
