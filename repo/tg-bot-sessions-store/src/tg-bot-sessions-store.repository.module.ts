import { Module } from '@nestjs/common'
import { TgBotSessionsStoreRepository } from './tg-bot-sessions-store.repository'

import * as lib from '@lib'

@Module({
  imports: [
    lib.PrismaLibModule,
  ],
  providers: [TgBotSessionsStoreRepository],
  exports: [TgBotSessionsStoreRepository],
})

export class TgBotSessionsStoreRepositoryModule {}
