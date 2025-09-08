import { setTimeout } from 'timers/promises'
import { Injectable } from '@nestjs/common'

import { ErrorHelperLibService, TarHelperLibService } from '@libs/h'
import { RcloneLibService } from '@libs/rclone'
import { TgBotLibService } from '@libs/tg-bot'
import { MessageLibService } from '@libs/message'

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly herror: ErrorHelperLibService,
    private readonly htar: TarHelperLibService,
    private readonly rclonesrv: RcloneLibService,
    private readonly tgbotsrv: TgBotLibService,
    private readonly msgsrv: MessageLibService,
  ) {}

  register(program) {
    program
      .command('install-comfyui-v0')
      .description('install comfyui v0')
      .action(async () => {
        try {
          const chatId = String(process.env.TG_CHAT_ID)
          const workspacePath = String(process.env.WORKSPACE)
          const comfyuiArchivePath = `${workspacePath}/comfyui-portable-cu128-py312-v0.tar.zst`

          //  check rclone connection
          await this.rclonesrv.getRcloneVersion()

          // check rclone remote disk availability
          const list = await this.rclonesrv.operationsList()

          const comfyuiInstallMessageId = await this.tgbotsrv.sendMessage({
            chatId,
            text: 'start install comfyui v0....',
          })

          // start copy file from ydisk to local disk in async mode
          const copyResponse = await this.rclonesrv.operationCopyFile({
            srcFs: 'ydisk:',
            srcRemote: `shared/comfyui-portable-cu128-py312-v0.tar.zst`,
            dstFs: '/',
            dstRemote: comfyuiArchivePath,
          })

          console.log(new Date(), 'copyResponse', copyResponse)

          const startTime = Date.now()

          while (true) {
            const stats = await this.rclonesrv.coreStatsByJob({ jobId: copyResponse.jobid })
            // console.log('\x1b[36m', 'stats', stats, '\x1b[0m')

            // check job status
            const jobStatus = await this.rclonesrv.getJobStatus({ jobId: copyResponse.jobid })

            if (jobStatus.error.length > 0) {
              await this.tgbotsrv.editMessage({
                chatId,
                messageId: comfyuiInstallMessageId,
                text: `Error during downloading comfyui: ${jobStatus.error}`,
              })
              break
            }

            if (jobStatus.finished) {
              break
            }

            const [jobStats] = stats.transferring || []

            await this.tgbotsrv.editMessage({
              chatId,
              messageId: comfyuiInstallMessageId,
              text: this.msgsrv.generateMessage({
                type: 'download-comfyui-v0',
                data: {
                  transferredBytes: jobStats?.bytes,
                  totalBytes: jobStats?.size,
                  speedInBytes: jobStats?.speed,
                  transferTimeInSec: (Date.now() - startTime) / 1000,
                  etaInSec: jobStats?.eta,
                },
              })
            })

            await setTimeout(1500)
          }

          // start unpapack
          await this.tgbotsrv.editMessage({
            chatId,
            messageId: comfyuiInstallMessageId,
            text: `start unpack comfyui...`,
          })

          await this.htar.extractTarZst({
            filePath: comfyuiArchivePath,
            destPath: workspacePath,
          })

          await this.tgbotsrv.editMessage({
            chatId,
            messageId: comfyuiInstallMessageId,
            text: 'comfyui v0 installed',
          })
        } catch (error) {
          console.error('Error during install-comfyui-v0:', this.herror.parseAxiosError(error))
          console.log(error.stack)
        }



      })
  }
}
