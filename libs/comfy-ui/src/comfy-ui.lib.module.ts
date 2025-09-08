import { Module } from '@nestjs/common'
import { ComfyUiLibService } from './comfy-ui.lib.service'

@Module({
  providers: [ComfyUiLibService],
  exports: [ComfyUiLibService],
})
export class ComfyUiLibModule {}
