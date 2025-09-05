import { Module } from '@nestjs/common'
import { HelperLibService } from './helper.lib.service'
import { ErrorHelperLibService } from './error.helper.lib.service'

@Module({
  providers: [
    HelperLibService,
    ErrorHelperLibService,
  ],
  exports: [
    HelperLibService,
    ErrorHelperLibService,
  ],
})
export class HelperLibModule {}
