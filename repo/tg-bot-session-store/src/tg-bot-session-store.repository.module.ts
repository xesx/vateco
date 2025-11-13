import { Module } from '@nestjs/common'
import { TgBotSessionStoreRepository } from './tg-bot-session-store.repository'

import * as lib from '@lib'

@Module({
  imports: [
    lib.PrismaLibModule,
  ],
  providers: [TgBotSessionStoreRepository],
  exports: [TgBotSessionStoreRepository],
})

export class TgBotSessionStoreRepositoryModule {}
