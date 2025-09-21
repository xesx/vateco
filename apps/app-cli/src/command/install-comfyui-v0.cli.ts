// import { setTimeout } from 'timers/promises'

import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly herror: lib.ErrorHelperLibService,
    private readonly htar: lib.TarHelperLibService,
    private readonly rclonelib: lib.RcloneLibService,
    private readonly hflib: lib.HuggingfaceLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly comfyuilib: lib.ComfyUiLibService,
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

          // await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('Downloading ComfyUI...') })
          await this.hflib.downloadHFWithProgress(
            'alalarty/models2',
            process.env.COMFY_UI_ARCHIVE_FILE,
            workspacePath
          )

          return
          // unpack comfyui
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('Unpacking ComfyUI...') })
          await this.htar.extractTarZst({
            filePath: comfyuiArchivePath,
            destPath: workspacePath,
          })

          // start comfyui
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('ComfyUI starting') })
          await this.comfyuilib.startComfyUI()

          const keyboardDescription = [
            [[`Check instance status`, 'act:own-i:status']],
            [[`Destroy instance`, 'act:own-i:destroy']],
            [[`Select workflow`, 'act:own-i:workflow']]
          ] as [string, string][][]

          await this.tgbotlib.sendInlineKeyboard({
            chatId,
            text: 'Manage instance:',
            keyboard: this.tgbotlib.generateInlineKeyboard(keyboardDescription),
          })
        } catch (error) {
          console.error('Error during install-comfyui-v0:', this.herror.parseAxiosError(error))
          console.log(error.stack)
        }
      })
  }
}
