import { Module } from '@nestjs/common';
import { AppBotController } from './app-bot.controller';
import { AppBotService } from './app-bot.service';

@Module({
  imports: [],
  controllers: [AppBotController],
  providers: [AppBotService],
})
export class AppBotModule {}
