import { setTimeout } from 'timers/promises'

import { Injectable } from '@nestjs/common'

import { ErrorHelperLibService, TarHelperLibService } from '@libs/h'
import { RcloneLibService } from '@libs/rclone'
import { TgBotLibService } from '@libs/tg-bot'
import { MessageLibService } from '@libs/message'
import { ComfyUiLibService } from '@libs/comfy-ui'

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly herror: ErrorHelperLibService,
    private readonly htar: TarHelperLibService,
    private readonly rclonelib: RcloneLibService,
    private readonly tgbotlib: TgBotLibService,
    private readonly msglib: MessageLibService,
    private readonly comfyuilib: ComfyUiLibService,
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

          //  check rclone connection
          await this.rclonelib.getRcloneVersion()

          // check rclone remote disk availability
          const list = await this.rclonelib.operationsList()

          // start copy file from ydisk to local disk in async mode
          let message = this.msglib.genDownloadMessage({ name: 'ComfyUI archive' })
          const downloadingMessageId = await this.tgbotlib.sendMessage({ chatId, text: message })

          const srcFs = 'ydisk:'
          const srcRemote = `shared/${process.env.COMFY_UI_ARCHIVE_FILE}`
          const dstFs = '/'
          const dstRemote = comfyuiArchivePath
          const startTime = Date.now()


          for await (const jobStats of this.rclonelib.loadFileGenerator({ srcFs, srcRemote, dstFs, dstRemote })) {
            message = this.msglib.genDownloadMessage({
              name: process.env.COMFY_UI_ARCHIVE_FILE,
              totalBytes: jobStats?.size,
              transferredBytes: jobStats?.bytes,
              speedInBytes: jobStats?.speed,
              transferTimeInSec: (Date.now() - startTime) / 1000,
              etaInSec: jobStats?.eta,
            })

            await this.tgbotlib.editMessage({ chatId, messageId: downloadingMessageId, text: message })
            await setTimeout(3000)
          }

          // unpack comfyui
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('Unpacking ComfyUI...') })
          await this.htar.extractTarZst({
            filePath: comfyuiArchivePath,
            destPath: workspacePath,
          })
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('ComfyUI installed!') })

          // start comfyui
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('ComfyUI starting') })
          await this.comfyuilib.startComfyUI()
          await this.tgbotlib.sendMessage({ chatId, text: this.msglib.genCodeMessage('ComfyUI started!') })

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
