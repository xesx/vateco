import { Injectable } from '@nestjs/common'

import { RcloneLibService } from '@libs/rclone'

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly rclonesrv: RcloneLibService,
  ) {}

  register(program) {
    program
      .command('install-comfyui-v0')
      .description('Сказать привет')
      .action(() => {
        console.log('in install comfyui v0 cli')
      })
  }
}
