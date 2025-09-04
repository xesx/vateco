import { Controller, All } from '@nestjs/common'

import { TgBotLibService } from '@libs/tg-bot'

@Controller()
export class AppCloudApiController {
  constructor(
    private readonly tgBotLibService: TgBotLibService,
  ) {}

  @All('ping')
  appCloudApiPing(): any {
    return { message: 'Pong!', timestamp: new Date() }
  }

  // @Post('test')
  // createUser(@Body() data: any) {
  //   // Здесь обрабатывается тело запроса
  //   console.log(data)
  //
  //   return {
  //     message: 'test response message',
  //     data,
  //   }
  // }
}
