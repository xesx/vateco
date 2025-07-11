import { Controller, Get } from '@nestjs/common'

import { VastService } from '@libs/vast'

@Controller()
export class AppAdminController {
  constructor(private readonly vastService: VastService) {}

  @Get('version')
  async test(): Promise<any> {
    return await this.vastService.importOffers()
  }
}
