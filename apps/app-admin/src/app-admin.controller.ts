import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppAdminController {
  constructor() {}

  @Get()
  getHello(): string {
    return 'asdasdsad'
  }
}
