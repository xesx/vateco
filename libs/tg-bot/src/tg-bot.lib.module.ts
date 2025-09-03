import { Module } from '@nestjs/common'
import { TgBotLibService } from './tg-bot.lib.service'

@Module({
  providers: [TgBotLibService],
  exports: [TgBotLibService],
})
export class TgBotLibModule {}
