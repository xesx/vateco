import { Module } from '@nestjs/common'
import { UserRepository } from './user.repository'

// import * as lib from '@lib'

@Module({
  imports: [],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UserRepositoryModule {}
