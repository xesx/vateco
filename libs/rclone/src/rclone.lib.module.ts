import { Module } from '@nestjs/common'
import { RcloneLibService } from './rclone.lib.service'

@Module({
  providers: [RcloneLibService],
  exports: [RcloneLibService],
})
export class RcloneLibModule {}
