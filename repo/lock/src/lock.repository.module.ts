import { Module } from '@nestjs/common'
import { LockRepository } from './lock.repository'

@Module({
  imports: [],
  providers: [LockRepository],
  exports: [LockRepository],
})
export class LockRepositoryModule {}

