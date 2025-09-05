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
      .description('install comfyui v0')
      .action(async () => {
        try {
          console.log('in install comfyui v0 cli')
          const version = await this.rclonesrv.getRcloneVersion()
          console.log('\x1b[36m', 'res', version, '\x1b[0m')

          const list = await this.rclonesrv.operationsList()
          console.log('\x1b[36m', 'list', list, '\x1b[0m')
        } catch (error) {
          console.error('Error during install-comfyui-v0:', error)
        }

      })
  }
}
