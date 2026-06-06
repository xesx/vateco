import { Module } from '@nestjs/common'
import { PromptSynthService } from './prompt.synth.service'
import { TextEditSynthService } from './text-edit.synth.service'

import * as lib from '@lib'
import * as repo from '@repo'

@Module({
  imports: [
    lib.TgBotLibModule,
    lib.MessagesLibModule,
    repo.UserTextEditsRepositoryModule,
  ],
  providers: [
    PromptSynthService,
    TextEditSynthService,
  ],
  exports: [PromptSynthService],
})

export class PromptSynthModule {}
