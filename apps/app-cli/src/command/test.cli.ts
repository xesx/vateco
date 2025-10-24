import { Injectable } from '@nestjs/common'

import axios from 'axios'
import * as fs from 'fs'
import { setTimeout } from 'timers/promises'

import * as sharp from 'sharp'
import * as filesize from 'file-size'

import * as kb from '@kb'
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
      .description('Сказать привет')
      .action(async (name) => {
        console.log(`Привет, ${name}!`)

        // const imagePath = './workspace/test.png'
        // const all = await sharp(imagePath).metadata()
        // console.log('\x1b[36m', 'all', all, '\x1b[0m')
        // console.log('\x1b[36m', 'all', all?.comments?.find?.(i => i.keyword === 'prompt')?.text, '\x1b[0m')

        // await this.appcloudsynth.loadFileFromHF({ chatId: '', repo: 'alalarty/models2', filename: 'comfyui-cu128-py312-v2.tar.zst', dir: '' })

        // const size = await this.hflib.getFileSize({
        //   repo: 'alalarty/models2',
        //   filename: 'clip_l.safetensors',
        // })
        //
        // console.log('\x1b[36m', 'size', filesize(size).human('si'), '\x1b[0m') // ok!

        // console.log('\x1b[36m', 'size', filesize(size).human('jedec'), '\x1b[0m')
        // console.log('\x1b[36m', 'size', filesize(size).human(), '\x1b[0m')
        // const compiledWorkflowSchema = this.wflib.compileWorkflow({ id: '300' })
        // console.log('----->>>>>>>>>> compiledWorkflowSchema', JSON.stringify(compiledWorkflowSchema))
        //
        // let response: any = null
        //
        // try {
        //   response = await this.comfyuilib.prompt(compiledWorkflowSchema)
        //   console.log('\x1b[36m', 'response', response, '\x1b[0m')
        // } catch (error) {
        //   console.log('\x1b[31m', 'error', this.h.herr.parseAxiosError(error), '\x1b[0m')
        //   process.exit(1)
        // }
        //
        // const { 'prompt_id': promptId } = response
        // console.log('\x1b[36m', 'promptId', promptId, '\x1b[0m')

        // const wsClient = await this.comfyuilib.wsConnect()
        //
        // wsClient.on('message', (data) => {
        //   const message = JSON.parse(data.toString())
        //   if (message.type === 'crystools.monitor') {
        //     return
        //   }
        //
        //   if (message.type === 'status') {
        //     console.log('\x1b[36m', 'ws status', JSON.stringify(message, null, 2), '\x1b[0m')
        //     if (message.data.status.exec_info.queue_remaining <= 0) {
        //       wsClient.close()
        //     }
        //     return
        //   }
        //
        //   // progress_state
        //
        //   console.log('\x1b[36m', 'ws message', JSON.stringify(message, null, 2), '\x1b[0m')
        // })

        // const instance = await this.vastlib.showInstance({ instanceId: 26522082 })
        // console.log('----->>>>>>>>>> instance', JSON.stringify(instance))

        // const data = {
        //   transferredBytes: 120000000,
        //   totalBytes: 1200000000,
        //   // percentage: 24,
        //   speedInBytes: 1230000,
        //   transferTimeInSec: 143,
        // }

        // const message = this.msglib.generateMessage({
        //   type: 'download-comfyui-v0',
        //   data,
        // })

        // const keyboard = this.tgbotlib.generateInlineKeyboard([
        //   [[`use it as input`, 'act:own-i:use-img-as-input']],
        // ])
        //
        // console.log('\x1b[36m', 'keyboard', keyboard, '\x1b[0m')
        // const res = await this.tgbotlib.sendPhoto({
        //   chatId: '185857068:185857068',
        //   photo: 'https://imgv3.fotor.com/images/blog-richtext-image/a-shadow-of-a-boy-carrying-the-camera-with-red-sky-behind.jpg',
        //   inlineKeyboard: keyboard.reply_markup,
        // })
        //
        // console.log('\x1b[36m', 'res', res, '\x1b[0m')

        const fileUrl = `https://api.telegram.org/file/bot8330568246:AAGrtHQHbRoaZKE0UZ3Itf1tw8mYotBfAIQ/photos/file_2.jpg`
        const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' })
        const imageBuffer = imageResponse.data // Buffer с изображением
        console.log(imageBuffer)


        // await this.tgbotlib.sendMessage({
        //   chatId: '185857068',
        //   text: `<blockquote expandable><pre>Expandable block quotation started\\nExpandable block quotation continued\\nExpandable block quotation continued\\nHidden by default part of the block quotation started\\nExpandable block quotation continued\\nThe last line of the block quotation</pre></blockquote>`,
        //   parseMode: 'HTML'
        // })

        //
        // console.log('\x1b[36m', 'message', message, '\x1b[0m')
      })
  }
}
