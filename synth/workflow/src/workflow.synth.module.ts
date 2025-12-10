import { Module } from '@nestjs/common'
import { WorkflowSynthService } from './workflow.synth.service'
import { WorkflowCompilerSynthService } from './workflow-compiler.synth.service'
import { WorkflowCookSynthService } from './workflow-cook.synth.service'
import { WorkflowViewSynthService } from './workflow-view.synth.service'
import { WorkflowParamSynthService } from './workflow-param.synth.service'

import * as lib from '@lib'
import * as repo from '@repo'

@Module({
  imports: [
    lib.WorkflowLibModule,
    lib.TgBotLibModule,
    lib.MessagesLibModule,
    lib.CloudApiCallLibModule,
    repo.ModelRepositoryModule,
    repo.WorkflowRepositoryModule,
    repo.TagRepositoryModule,
  ],
  providers: [
    WorkflowSynthService,
    WorkflowCompilerSynthService,
    WorkflowCookSynthService,
    WorkflowViewSynthService,
    WorkflowParamSynthService,
  ],
  exports: [WorkflowSynthService],
})

export class WorkflowSynthModule {}
