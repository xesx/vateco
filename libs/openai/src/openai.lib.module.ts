import { Module } from '@nestjs/common'
import { OpenaiLibService } from './openai.lib.service'

@Module({
  providers: [OpenaiLibService],
  exports: [OpenaiLibService],
})
export class OpenaiLibModule {}
