import { Module } from '@nestjs/common'
import { UserWorkflowVariantRunsRepository } from './user-workflow-variant-runs.repository'

@Module({
  providers: [UserWorkflowVariantRunsRepository],
  exports: [UserWorkflowVariantRunsRepository],
})
export class UserWorkflowVariantRunsRepositoryModule {}

