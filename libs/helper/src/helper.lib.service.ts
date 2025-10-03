// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'

import { ErrorHelperLibService } from './error.helper.lib.service'
import { TarHelperLibService } from './tar.helper.lib.service'

@Injectable()
export class HelperLibService {
  constructor(
    readonly herr: ErrorHelperLibService,
    readonly htar: TarHelperLibService,
  ) {}
}
