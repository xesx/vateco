import { setTimeout } from 'timers/promises'
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
          const chatId = String(process.env.TG_CHAT_ID)
          const workspacePath = String(process.env.WORKSPACE)

          console.log('in install comfyui v0 cli')
          const version = await this.rclonesrv.getRcloneVersion()
          console.log('\x1b[36m', 'res', version, '\x1b[0m')

          const list = await this.rclonesrv.operationsList()
          console.log('\x1b[36m', new Date(), 'list', list, '\x1b[0m')

          const comfyuiInstallMessageId = await this.tgbotsrv.sendMessage({
            chatId,
            text: 'start install comfyui v0....',
          })

          const copyResponse = await this.rclonesrv.operationCopyFile({
            srcFs: 'ydisk:',
            srcRemote: `shared/comfyui-portable-cu128-py312-v0.tar.zst`,
            dstFs: '/',
            dstRemote: `${workspacePath}/`,
          })

          console.log(new Date(), 'copyResponse', copyResponse)

          for (let i = 0; i <= 50; i++) {
            const stats = await this.rclonesrv.coreStats()
            console.log(new Date(), 'stats', stats)

            const jobStatus = await this.rclonesrv.getJobStatus({ jobId: copyResponse.jobid })
            console.log('\x1b[36m', new Date(), 'jobStatus', jobStatus, '\x1b[0m');

            await this.tgbotsrv.editMessage({
              chatId,
              messageId: comfyuiInstallMessageId,
              text: `installing comfyui v0...\n ${'#'.repeat(i)}`,
            })
            await setTimeout(1500)
          }

          await this.tgbotsrv.editMessage({
            chatId,
            messageId: comfyuiInstallMessageId,
            text: 'comfyui v0 installed',
          })

          console.log('\x1b[36m', new Date(), 'message_id', comfyuiInstallMessageId, '\x1b[0m')
        } catch (error) {
          console.error('Error during install-comfyui-v0:', this.hError.parseAxiosError(error))
        }



      })
  }
}
