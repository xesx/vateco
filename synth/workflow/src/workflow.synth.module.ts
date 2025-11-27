import { Module } from '@nestjs/common'
import { WorkflowSynthService } from './workflow.synth.service'
import { WorkflowCompilerSynthService } from './workflow-compiler.synth.service'
import { WorkflowCookSynthService } from './workflow-cook.synth.service'

import * as lib from '@lib'
import * as repo from '@repo'

@Module({
  imports: [
    lib.WorkflowLibModule,
    lib.TgBotLibModule,
    repo.ModelRepositoryModule,
    repo.WorkflowRepositoryModule,
  ],
  providers: [
    WorkflowSynthService,
    WorkflowCompilerSynthService,
    WorkflowCookSynthService,
  ],
  exports: [WorkflowSynthService],
})

export class WorkflowSynthModule {}
