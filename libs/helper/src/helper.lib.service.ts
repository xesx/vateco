// import * as assert from 'node:assert/strict'
import { setTimeout } from 'timers/promises'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'

import { ErrorHelperLibService } from './error.helper.lib.service'
import { TarHelperLibService } from './tar.helper.lib.service'
import { FormatHelperLibService } from './format.helper.lib.service'

@Injectable()
export class HelperLibService {
  constructor(
    readonly herr: ErrorHelperLibService,
    readonly htar: TarHelperLibService,
    readonly format: FormatHelperLibService,
  ) {}

  async sleep (ms: number): Promise<void> {
    await setTimeout(ms)
  }
}
