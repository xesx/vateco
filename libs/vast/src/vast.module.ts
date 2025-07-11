// libs/vast/src/vast.module.ts
import { Module } from '@nestjs/common'
// import { HttpModule } from '@nestjs/axios'
import { VastService } from './vast.service'

@Module({
  // imports: [HttpModule],
  providers: [VastService],
  exports: [VastService],
})
export class VastModule {}
