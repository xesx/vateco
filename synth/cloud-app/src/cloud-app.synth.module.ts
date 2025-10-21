import { Module } from '@nestjs/common'
import { CloudAppSynthService } from './cloud-app.synth.service'

import * as lib from '@lib'

@Module({
  imports: [
    lib.HuggingfaceLibModule,
    lib.TgBotLibModule,
    lib.HuggingfaceLibModule,
  ],
  providers: [CloudAppSynthService],
  exports: [CloudAppSynthService],
})

export class CloudAppSynthModule {}
