import { setTimeout } from 'timers/promises'
import { Injectable } from '@nestjs/common'

import { ErrorHelperLibService, TarHelperLibService } from '@libs/h'
import { RcloneLibService } from '@libs/rclone'
import { TgBotLibService } from '@libs/tg-bot'

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly herror: ErrorHelperLibService,
    private readonly htar: TarHelperLibService,
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
          const comfyuiArchivePath = `${workspacePath}/comfyui-portable-cu128-py312-v0.tar.zst`

          console.log('\x1b[36m', 'workspacePath', workspacePath, '\x1b[0m');

          console.log('in install comfyui v0 cli')
          // const version = await this.rclonesrv.getRcloneVersion()
          // console.log('\x1b[36m', 'res', version, '\x1b[0m')

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
            dstRemote: comfyuiArchivePath,
          })

          console.log(new Date(), 'copyResponse', copyResponse)

          while (true) {
            // const commonstats = await this.rclonesrv.coreStats()
            // console.log(new Date(), 'commonstats', commonstats)

            const stats = await this.rclonesrv.coreStatsByJob({ jobId: copyResponse.jobid })

            const totalMb = (stats.totalBytes / (1024 * 1024)).toFixed(2)
            const transferredMb = (stats.bytes / (1024 * 1024)).toFixed(2)
            const speedMb = (stats.speed / (1024 * 1024)).toFixed(2)
            const transferTime = stats.transferTime.toFixed(0)

            console.log(new Date(), 'stats', `${transferredMb} / ${totalMb} MB, speed ${speedMb} MB/s, time ${transferTime} sec`)

            const jobStatus = await this.rclonesrv.getJobStatus({ jobId: copyResponse.jobid })
            // console.log('\x1b[36m', new Date(), 'jobStatus', jobStatus, '\x1b[0m');
            // jobStatus {
            //   duration: 0.366459875,
            //     endTime: '2025-09-07T20:04:08.008949+03:00',
            //     error: '',
            //     finished: true,
            //     group: 'job/785',
            //     id: 785,
            //     output: {},
            //   startTime: '2025-09-07T20:04:07.64249+03:00',
            //     success: true
            // }

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

            await this.tgbotsrv.editMessage({
              chatId,
              messageId: comfyuiInstallMessageId,
              text: `<pre>
Downloading ComfyUI...

[${'+'.repeat(Math.floor((stats.bytes / stats.totalBytes) * 30)).padEnd(30, '·')}]
${transferredMb} / ${totalMb} MB (${((stats.bytes / stats.totalBytes) * 100).toFixed(1)}%)

Speed: ${speedMb} MB/s
Time:  ${transferTime} sec
</pre>`,
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

          // console.log('\x1b[36m', new Date(), 'message_id', comfyuiInstallMessageId, '\x1b[0m')
        } catch (error) {
          console.error('Error during install-comfyui-v0:', this.herror.parseAxiosError(error))
        }



      })
  }
}
