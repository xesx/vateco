import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'

import { IllustriousPromptLibService } from './illustrious.prompt.lib.service'

@Injectable()
export class PromptLibService {
  constructor(
    readonly il: IllustriousPromptLibService
  ) {}
}
