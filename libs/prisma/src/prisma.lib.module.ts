import { Global, Module } from '@nestjs/common'
import { PrismaLibService } from './prisma.lib.service'
import { TgBotSessionStorePrismaLibService } from './tg-bot-session-store.prisma.lib.service'

@Global()
@Module({
  providers: [
    PrismaLibService,
    TgBotSessionStorePrismaLibService,
  ],
  exports: [
    PrismaLibService,
    TgBotSessionStorePrismaLibService,
  ],
})
export class PrismaLibModule {
  constructor() {
  }
}
