import { Module } from '@nestjs/common'

import { UserTextEditsRepository } from './user-text-edits.repository'

@Module({
  providers: [UserTextEditsRepository],
  exports: [UserTextEditsRepository],
})
export class UserTextEditsRepositoryModule {}

