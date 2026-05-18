import { Injectable } from '@nestjs/common'

import axios from 'axios'
import * as fs from 'fs'
import { setTimeout } from 'timers/promises'

import * as sharp from 'sharp'
import * as filesize from 'file-size'

import * as kb from '@kb'
import * as lib from '@lib'
import * as synth from '@synth'
import * as repo from '@repo'
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
    private readonly civitailib: lib.CivitaiLibService,
    private readonly openailib: lib.OpenaiLibService,
    private readonly runpodlib: lib.RunpodLibService,

    private readonly modelrepo: repo.ModelRepository,
    private readonly lockrepo: repo.LockRepository,

    private readonly wfsynth: synth.WorkflowSynthService,
    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  register(program) {
    program
      .command('test <name>')
      .description('test clishka')
      .action(async (name) => {
        console.log(`hello, ${name}!`)

        const response = await this.lockrepo.tryGetLock({
          key: 'test-key',
          value: 'test',
          ttlInSec: 60,
        })

        console.log('\x1b[36m', 'response', response, '\x1b[0m')

        // console.log('\x1b[36m', 'message', message, '\x1b[0m')
      })
  }
}
