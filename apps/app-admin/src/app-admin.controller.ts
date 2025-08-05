import { Controller, Get } from '@nestjs/common'

import { VastService } from '@libs/vast'

@Controller()
export class AppAdminController {
  constructor(private readonly vastService: VastService) {}

  @Get('vast/search/offers')
  async test(): Promise<any> {
    return await this.vastService.importOffers()
  }
}
