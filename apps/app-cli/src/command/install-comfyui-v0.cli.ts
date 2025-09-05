import { Injectable } from '@nestjs/common'

import { RcloneLibService } from '@libs/rclone'

function printAxiosError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error response data:', error.response.data)
    console.error('Error response status:', error.response.status)
    console.error('Error response headers:', error.response.headers)
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.error('Error request:', error.request)
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error message:', error.message)
  }
  console.error('Error config:', error.config)
}

@Injectable()
export class InstallComfyuiV0Cli {
  constructor(
    private readonly rclonesrv: RcloneLibService,
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
          console.log('\x1b[36m', 'list', list, '\x1b[0m')
        } catch (error) {
          console.error('Error during install-comfyui-v0:')
          printAxiosError(error)
        }

      })
  }
}
