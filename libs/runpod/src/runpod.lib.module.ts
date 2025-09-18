import { Module } from '@nestjs/common'

import { RunpodLibService } from './runpod.lib.service'

@Module({
  providers: [RunpodLibService],
  exports: [RunpodLibService],
})
export class RunpodLibModule {}
