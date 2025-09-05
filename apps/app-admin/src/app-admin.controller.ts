import { Controller, Get } from '@nestjs/common'

import { VastService } from '@libs/vast'
import { TgBotLibService } from '@libs/tg-bot'

@Controller()
export class AppAdminController {
  constructor(
    private readonly vastService: VastService,
    private readonly tgBotLibService: TgBotLibService,
  ) {}

  @Get('vast/search/offers')
  async test(): Promise<any> {
    // return await this.vastService.importOffers()
  }

  @Get('tg-bot/send-message')
  async tgBotSendMessage (): Promise<any> {
    return await this.tgBotLibService.sendMessage({ chatId: '185857068', text: 'Test message from TgBotLibService' })
  }

  @Get('tg-bot/send-photo')
  async tgBotSendPhoto (): Promise<any> {
    return await this.tgBotLibService.sendPhoto({
      chatId: '185857068',
      photo: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
      caption: 'Test photo from TgBotLibService',
    })
  }
}
