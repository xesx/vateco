import { Controller, Get } from '@nestjs/common';
import { AppBotService } from './app-bot.service';

@Controller()
export class AppBotController {
  constructor(private readonly appBotService: AppBotService) {}

  @Get()
  getHello(): string {
    return this.appBotService.getHello();
  }
}
