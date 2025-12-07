import { Module } from '@nestjs/common'
import { TagRepository } from './tag.repository'

// import * as lib from '@lib'

@Module({
  imports: [],
  providers: [TagRepository],
  exports: [TagRepository],
})
export class TagRepositoryModule {}
