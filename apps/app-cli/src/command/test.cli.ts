import { Injectable } from '@nestjs/common'

import * as fs from 'fs'
import * as sharp from 'sharp'

import * as lib from '@lib'
// import { packageDirectorySync } from 'pkg-dir'

// const rootDir = packageDirectorySync()
// const templateDir = `${rootDir}/message-template`

@Injectable()
export class TestCli {
  constructor(
    private readonly vastlib: lib.VastLibService,
    private readonly comfyuilib: lib.ComfyUiLibService,
  ) {}

  register(program) {
    program
      .command('test <name>')
      .description('Сказать привет')
      .action(async (name) => {
        console.log(`Привет, ${name}!`)

        const imagePath = './workspace/ComfyUI_00018_.png'
        const all = await sharp(imagePath).metadata()
        console.log('\x1b[36m', 'all', all?.comments?.find?.(i => i.keyword === 'prompt')?.text, '\x1b[0m')


        // const instance = await this.vastlib.showInstance({ instanceId: 26522082 })
        // console.log('----->>>>>>>>>> instance', JSON.stringify(instance))

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
