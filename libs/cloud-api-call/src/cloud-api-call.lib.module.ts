import { Module } from '@nestjs/common'
import { CloudApiCallLibService } from './cloud-api-call.lib.service'

@Module({
  providers: [CloudApiCallLibService],
  exports: [CloudApiCallLibService],
})
export class CloudApiCallLibModule {}
