import { Module } from '@nestjs/common'
import { CivitaiLibService } from './civitai.lib.service'

@Module({
  providers: [CivitaiLibService],
  exports: [CivitaiLibService],
})
export class CivitaiLibModule {}
