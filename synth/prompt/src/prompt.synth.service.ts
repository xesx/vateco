import { Injectable, Logger } from '@nestjs/common'

// import * as lib from '@lib'
// import * as repo from '@repo'

import { TextEditSynthService } from './text-edit.synth.service'

@Injectable()
export class PromptSynthService {
  private readonly l = new Logger(PromptSynthService.name)

  constructor(
    readonly textedit: TextEditSynthService,
  ) {}
}
