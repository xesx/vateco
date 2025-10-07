import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
// import { packageDirectorySync } from 'pkg-dir'

// const rootDir = packageDirectorySync()
// const templateDir = `${rootDir}/message-template`

@Injectable()
export class TestCli {
  constructor(
    private readonly vastlib: lib.VastLibService,
  ) {}

  register(program) {
    program
      .command('test <name>')
      .description('Сказать привет')
      .action(async (name) => {
        console.log(`Привет, ${name}!`)

        const instance = await this.vastlib.showInstance({ instanceId: 26522082 })
        console.log('----->>>>>>>>>> instance', JSON.stringify(instance))

        // const data = {
        //   transferredBytes: 120000000,
        //   totalBytes: 1200000000,
        //   // percentage: 24,
        //   speedInBytes: 1230000,
        //   transferTimeInSec: 143,
        // }
        //
        // const message = this.msgsrv.generateMessage({
        //   type: 'download-comfyui-v0',
        //   data,
        // })
        //
        // console.log('\x1b[36m', 'message', message, '\x1b[0m')
      })
  }
}
