import { Module } from '@nestjs/common'
import { HuggingfaceLibService } from './huggingface.lib.service'

@Module({
  providers: [HuggingfaceLibService],
  exports: [HuggingfaceLibService],
})
export class HuggingfaceLibModule {}
