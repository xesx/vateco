import { Module } from '@nestjs/common'
import { RandomImageLibService } from './random-image.lib.service'

@Module({
  providers: [RandomImageLibService],
  exports: [RandomImageLibService],
})
export class RandomImageLibModule {}
