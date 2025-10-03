import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

@Injectable()
export class StartComfyuiCli {
  constructor(
    private readonly comfyuilib: lib.ComfyUiLibService,
  ) {}

  register(program) {
    program
      .command('start-comfyui')
      .description('start comfyui')
      .action(async () => {
        await this.comfyuilib.startComfyUI()
      })
  }
}
