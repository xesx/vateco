import { Injectable } from '@nestjs/common'

// import axios from 'axios'
// import * as fs from 'fs'
// import { setTimeout } from 'timers/promises'

// import * as sharp from 'sharp'
// import * as filesize from 'file-size'

// import * as kb from '@kb'
import * as lib from '@lib'
import * as synth from '@synth'
// import { packageDirectorySync } from 'pkg-dir'

// const rootDir = packageDirectorySync()
// const templateDir = `${rootDir}/message-template`

@Injectable()
export class TestCli {
  constructor(
    private readonly vastlib: lib.VastLibService,
    private readonly comfyuilib: lib.ComfyUiLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,
    private readonly hflib: lib.HuggingfaceLibService,

    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  register(program) {
    program
      .command('test <name>')
      .description('test cli')
      .action(async name => {
        console.log(`Hello from cloud cli, ${name}!`)

        await this.appcloudsynth.loadModelFromCivitai({
          chatId: '185857068',
          civitaiId: '1318945',
          civitaiVersionId: '2319122',
          filename: 'oneObsession_v18.safetensors',
          dstDir: 'checkpoints',
        })
      })
  }
}
