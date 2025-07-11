import { Module } from '@nestjs/common'
import { VastService } from './vast.service'

@Module({
  providers: [VastService]
})
export class VastModule {}
