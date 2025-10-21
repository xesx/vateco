import { Module } from '@nestjs/common'
import { CloudAppSynthService } from './cloud-app.synth.service'

@Module({
  providers: [CloudAppSynthService],
  exports: [CloudAppSynthService],
})
export class CloudAppSynthModule {}
