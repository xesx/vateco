import { Controller, Get } from '@nestjs/common'

import { VastService } from '@libs/vast'
import { TgBotLibService } from '@libs/tg-bot'

@Controller()
export class AppCloudApiController {
  constructor(
    private readonly vastService: VastService,
    private readonly tgBotLibService: TgBotLibService,
  ) {}

  @Get('ping')
  appCloudPing(): any {
    return { 'pong': true }
  }
}
