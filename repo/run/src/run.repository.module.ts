import { Module } from '@nestjs/common'

import * as lib from '@lib'

import { RunRepository } from './run.repository'

@Module({
  imports: [
    lib.WorkflowLibModule,
  ],
  providers: [RunRepository],
  exports: [RunRepository],
})
export class RunRepositoryModule {}

