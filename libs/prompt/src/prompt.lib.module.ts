import { Module } from '@nestjs/common'
import { PromptLibService } from './prompt.lib.service'
import { IllustriousPromptLibService } from './illustrious.prompt.lib.service'

@Module({
  providers: [
    PromptLibService,
    IllustriousPromptLibService,
  ],
  exports: [
    PromptLibService,
    IllustriousPromptLibService,
  ],
})
export class PromptLibModule {}
