import { Module } from '@nestjs/common'
import { HelperLibService } from './helper.lib.service'
import { ErrorHelperLibService } from './error.helper.lib.service'
import { TarHelperLibService } from './tar.helper.lib.service'

@Module({
  providers: [
    HelperLibService,
    ErrorHelperLibService,
    TarHelperLibService,
  ],
  exports: [
    HelperLibService,
    ErrorHelperLibService,
    TarHelperLibService,
  ],
})
export class HelperLibModule {}
