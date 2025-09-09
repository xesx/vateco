import { Module } from '@nestjs/common'

import { VastLibService } from './vast.service'

@Module({
  providers: [VastLibService],
  exports: [VastLibService],
})
export class VastLibModule {}
