import { Module } from '@nestjs/common'
import { WorkflowRepository } from './workflow.repository'

import * as lib from '@lib'

@Module({
  imports: [
    lib.WorkflowLibModule,
  ],
  providers: [WorkflowRepository],
  exports: [WorkflowRepository],
})
export class WorkflowRepositoryModule {}
