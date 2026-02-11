import { Module } from '@nestjs/common'
import { InstanceSynthService } from './instance.synth.service'
import { InstanceViewSynthService } from './instance-view.synth.service'

import * as lib from '@lib'
// import * as repo from '@repo'

@Module({
  imports: [
    lib.TgBotLibModule,
    lib.VastLibModule,
    lib.MessagesLibModule,
  ],
  providers: [
    InstanceSynthService,
    InstanceViewSynthService,
  ],
  exports: [InstanceSynthService],
})

export class InstanceSynthModule {}
