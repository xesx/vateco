import { Injectable } from '@nestjs/common'

import axios from 'axios'
import * as fs from 'fs'
import { createClient } from 'webdav'
import { setTimeout } from 'timers/promises'

import * as sharp from 'sharp'
import * as filesize from 'file-size'

import * as kb from '@kb'
import * as lib from '@lib'
import * as synth from '@synth'
import * as repo from '@repo'
import { InjectBot } from 'nestjs-telegraf'
import { Telegraf } from 'telegraf'
import { TAppBaseTgBotContext } from '../../../app-base-tg-bot/src/types'
// import { packageDirectorySync } from 'pkg-dir'

// const rootDir = packageDirectorySync()
// const templateDir = `${rootDir}/message-template`

@Injectable()
export class TestCli {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,

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
    private readonly rndimg: lib.RandomImageLibService,

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

        // что видит именно твой чат
        const chatCmds = await this.bot.telegram.getMyCommands({
          scope: { type: 'chat', chat_id: '185857068' },
        })
        const privateCmds = await this.bot.telegram.getMyCommands({
          scope: { type: 'all_private_chats' },
        })
        const defaultCmds = await this.bot.telegram.getMyCommands()
        console.log({ chatCmds, privateCmds, defaultCmds })

        // const wfvJsonRaw = fs.readFileSync('/Users/a.alekhin/Downloads/wfv-QwenVL-i2i-v5-with-two-control-nets.json')
        // const wfv = JSON.parse(wfvJsonRaw)
        //
        // const nodeIds = [573, 574, 576, 577, 578, 579]
        // const wfvNewJson = this.wflib.bypassWfvNodes({ wfv, nodeIds })
        // const wfvNewStr = JSON.stringify(wfvNewJson)
        // console.log('\x1b[36m', 'wfvNewStr', wfvNewStr, '\x1b[0m')
        // Get directory contents
        // const res = await this.rndimg.getRandomImage()
        // console.log('\x1b[36m', 'res', res, '\x1b[0m')

        // const pathToImage = '/Users/alex/dev/ComfyUI/output/ComfyUI_00059_.png'
        // const imageStats = await fs.promises.stat(pathToImage)
        // const metadata = await sharp(pathToImage).metadata()
        //
        // console.log('\x1b[36m', 'imagePath', pathToImage, '\x1b[0m')
        // console.log('\x1b[36m', 'fileSize', filesize(imageStats.size).human('si'), '\x1b[0m')
        // console.log('\x1b[36m', 'metadata', metadata, '\x1b[0m')

        // const response = await this.lockrepo.tryGetLock({
        //   key: 'test-key',
        //   value: 'test',
        //   ttlInSec: 60,
        // })
        //
        // console.log('\x1b[36m', 'response', response, '\x1b[0m')

        // console.log('\x1b[36m', 'message', message, '\x1b[0m')
      })
  }
}
