// import { setTimeout } from 'timers/promises'

import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as synth from '@synth'

import * as kb from '@kb'

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly h: lib.HelperLibService,
    private readonly hflib: lib.HuggingfaceLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly comfyuilib: lib.ComfyUiLibService,
    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  register(program) {
    program
      .command('install-comfyui-v0')
      .description('install comfyui v0')
      .action(async () => {
        try {
          const chatId = String(process.env.TG_CHAT_ID)
          const workspacePath = String(process.env.WORKSPACE)
          const comfyuiArchivePath = `${workspacePath}/${process.env.COMFY_UI_ARCHIVE_FILE}`

          const filename = process.env.COMFY_UI_ARCHIVE_FILE

          if (!filename) {
            throw new Error('InstallComfyuiV0Cli_register_48 COMFY_UI_ARCHIVE_FILE is not set')
          }

          await this.appcloudsynth.loadFileFromHF({ chatId, repo: 'alalarty/models2', filename, dir: '' })
          // await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('Downloading ComfyUI...') })
          // await this.hflib.download({
          //   filename: process.env.COMFY_UI_ARCHIVE_FILE,
          //   dir: workspacePath
          // })

          // unpack comfyui
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('Unpacking ComfyUI...') })
          await this.h.htar.extractTarZst({
            filePath: comfyuiArchivePath,
            destPath: workspacePath,
          })

          // start comfyui
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('ComfyUI starting...') })
          await this.comfyuilib.startComfyUI()

          const keyboard = this.tgbotlib.generateInlineKeyboard(kb.ownInstanceManageMenu('running'))
          const text = 'Manage your ComfyUI instance:'
          await this.tgbotlib.sendInlineKeyboard({ chatId, text, keyboard })
        } catch (error) {
          console.error('Error during install-comfyui-v0:', this.h.herr.parseAxiosError(error))
          console.log(error.stack)
        }
      })
  }
}
