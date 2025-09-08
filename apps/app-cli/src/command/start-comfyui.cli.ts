import { Injectable } from '@nestjs/common'

import { ErrorHelperLibService, TarHelperLibService } from '@libs/h'
import { RcloneLibService } from '@libs/rclone'
import { MessageLibService } from '@libs/message'
import { ComfyUiLibService } from '@libs/comfy-ui'

@Injectable()
export class StartComfyuiCli {
  constructor(
    private readonly herror: ErrorHelperLibService,
    private readonly htar: TarHelperLibService,
    private readonly rclonesrv: RcloneLibService,
    private readonly msgsrv: MessageLibService,
    private readonly comfyuisrv: ComfyUiLibService,
  ) {}

  register(program) {
    program
      .command('start-comfyui')
      .description('start comfyui')
      .action(async () => {
        await this.comfyuisrv.startComfyUI()
      })
  }
}
