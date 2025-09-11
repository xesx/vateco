import { Module } from '@nestjs/common'

import { WorkflowLibService } from './workflow.lib.service'

@Module({
  providers: [WorkflowLibService],
  exports: [WorkflowLibService],
})
export class WorkflowLibModule {}
