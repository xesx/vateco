import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'

import * as lib from '@lib'

@Controller()
export class AppAdminController {
  constructor(
    private readonly vastlib: lib.VastLibService,
    private readonly tgBotLibService: lib.TgBotLibService,
    private readonly runpod: lib.RunpodLibService,
    private readonly wf: lib.WorkflowLibService,
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

  @Get('runpod/run-sync')
  async runpodRunSync (@Res() res: Response): Promise<any> {
    const workflow = this.wf.getWorkflow('base.flux.runpod').template

    const data = await this.runpod.runSync({ workflow })

    const base64Data = data.output.images?.[0].data
    const imgBuffer = Buffer.from(base64Data, 'base64')

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Length', imgBuffer.length)
    res.end(imgBuffer)
  }
}
