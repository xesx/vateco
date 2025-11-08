import { Module } from '@nestjs/common'
import { HelperLibService } from './helper.lib.service'
import { ErrorHelperLibService } from './error.helper.lib.service'
import { TarHelperLibService } from './tar.helper.lib.service'
import { FormatHelperLibService } from './format.helper.lib.service'

@Module({
  providers: [
    HelperLibService,
    ErrorHelperLibService,
    TarHelperLibService,
    FormatHelperLibService,
  ],
  exports: [
    HelperLibService,
    ErrorHelperLibService,
    TarHelperLibService,
    FormatHelperLibService,
  ],
})
export class HelperLibModule {}
