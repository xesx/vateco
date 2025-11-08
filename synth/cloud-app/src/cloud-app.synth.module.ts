import { Module } from '@nestjs/common'
import { CloudAppSynthService } from './cloud-app.synth.service'

import * as lib from '@lib'

@Module({
  imports: [
    lib.MessagesLibModule,
    lib.TgBotLibModule,
    lib.HuggingfaceLibModule,
    lib.HelperLibModule,
  ],
  providers: [CloudAppSynthService],
  exports: [CloudAppSynthService],
})

export class CloudAppSynthModule {}
