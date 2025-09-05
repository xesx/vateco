import { Injectable } from '@nestjs/common'

import { ErrorHelperLibService } from '@libs/h'
import { RcloneLibService } from '@libs/rclone'
import { TgBotLibService } from '@libs/tg-bot'

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly hError: ErrorHelperLibService,
    private readonly rclonesrv: RcloneLibService,
    private readonly tgbotsrv: TgBotLibService,
  ) {}

  register(program) {
    program
      .command('install-comfyui-v0')
      .description('install comfyui v0')
      .action(async () => {
        try {
          console.log('in install comfyui v0 cli')
          const version = await this.rclonesrv.getRcloneVersion()
          console.log('\x1b[36m', 'res', version, '\x1b[0m')

          const list = await this.rclonesrv.operationsList()
          console.log('\x1b[36m', 'list', list, new Date(), '\x1b[0m')

          const res = await this.rclonesrv.operationCopyFile({
            srcFs: 'ydisk:',
            srcRemote: `shared/comfyui-portable-cu128-py312-v0.tar.zst`,
            dstFs: '/',
            dstRemote: `workspace/comfyui-portable-cu128-py312-v0.tar.zst`,
          })
          console.log('res', res, new Date())

          const stats = await this.rclonesrv.coreStats()
          console.log('stats', stats, new Date(), process.env.TG_CHAT_ID)

          await this.tgbotsrv.sendMessage({
            chatId: process.env.TG_CHAT_ID,
            text: 'start install comfyui v0',
          })
        } catch (error) {
          console.error('Error during install-comfyui-v0:', this.hError.parseAxiosError(error))
        }



      })
  }
}
