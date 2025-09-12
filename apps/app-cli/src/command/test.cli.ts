import { Injectable } from '@nestjs/common'

import { ErrorHelperLibService, TarHelperLibService } from '@libs/h'
import { RcloneLibService } from '@libs/rclone'
import { MessageLibService } from '@libs/message'
import { ComfyUiLibService } from '@libs/comfy-ui'

import { packageDirectorySync } from 'pkg-dir'

const rootDir = packageDirectorySync()
const templateDir = `${rootDir}/message-template`

console.log('\x1b[36m', 'templateDir', templateDir, '\x1b[0m')

@Injectable()
export class TestCli {
  constructor(
    private readonly herror: ErrorHelperLibService,
    private readonly htar: TarHelperLibService,
    private readonly rclonelib: RcloneLibService,
    private readonly msgsrv: MessageLibService,
    private readonly comfyuilib: ComfyUiLibService,
  ) {}

  register(program) {
    program
      .command('test <name>')
      .description('Сказать привет')
      .action((name) => {
        console.log(`Привет, ${name}!`)

        const data = {
          transferredBytes: 120000000,
          totalBytes: 1200000000,
          // percentage: 24,
          speedInBytes: 1230000,
          transferTimeInSec: 143,
        }

        const message = this.msgsrv.generateMessage({
          type: 'download-comfyui-v0',
          data,
        })

        console.log('\x1b[36m', 'message', message, '\x1b[0m')
      })
  }
}
