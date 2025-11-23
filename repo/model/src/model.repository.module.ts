import { Module } from '@nestjs/common'
import { ModelRepository } from './model.repository'

// import * as lib from '@lib'

@Module({
  imports: [],
  providers: [ModelRepository],
  exports: [ModelRepository],
})
export class ModelRepositoryModule {}
