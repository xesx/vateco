import { Module } from '@nestjs/common'
import { TgBotSessionStorePrismaSynthService } from './tg-bot-session-store-prisma.synth.service'

import * as lib from '@lib'

@Module({
  imports: [
    lib.PrismaLibModule,
  ],
  providers: [TgBotSessionStorePrismaSynthService],
  exports: [TgBotSessionStorePrismaSynthService],
})

export class TgBotSessionStoreSynthModule {}
