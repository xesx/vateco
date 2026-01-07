import { Module } from '@nestjs/common'
import { SetupRepository } from './setup.repository'

// import * as lib from '@lib'

@Module({
  imports: [],
  providers: [SetupRepository],
  exports: [SetupRepository],
})
export class SetupRepositoryModule {}
