import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import { AppAdminController } from './app-admin.controller'
import { WorkflowTemplateController } from './workflow-template.controller'
import { WorkflowVariantController } from './workflow-variant.controller'
import { WorkflowVariantParamsController } from './workflow-variant-params.controller'
import { WorkflowVariantTagsController } from './workflow-variant-tags.controller'
import { TagController } from './tag.controller'
import { ModelController } from './model.controller'

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
    repo.TagRepositoryModule,
    repo.ModelRepositoryModule,

    synth.WorkflowSynthModule,
  ],
  controllers: [
    AppAdminController,
    WorkflowTemplateController,
    WorkflowVariantController,
    WorkflowVariantParamsController,
    WorkflowVariantTagsController,
    TagController,
    ModelController,
  ],
  providers: [],
})
export class AppAdminModule {}
