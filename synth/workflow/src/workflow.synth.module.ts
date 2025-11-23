import { Module } from '@nestjs/common'
import { WorkflowSynthService } from './workflow.synth.service'
import { WorkflowCompilerSynthService } from './workflow-compiler.synth.service'

import * as lib from '@lib'
import * as repo from '@repo'

@Module({
  imports: [
    lib.WorkflowLibModule,
    repo.ModelRepositoryModule,
  ],
  providers: [
    WorkflowSynthService,
    WorkflowCompilerSynthService,
  ],
  exports: [WorkflowSynthService],
})

export class WorkflowSynthModule {}
