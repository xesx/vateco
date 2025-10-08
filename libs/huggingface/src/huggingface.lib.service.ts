import { spawn } from 'child_process'

import { Injectable } from '@nestjs/common'

// import axios from 'axios'

@Injectable()
export class HuggingfaceLibService {
  constructor(
    // private readonly configService: ConfigService
  ) {
  }

  async download ({ repo = 'alalarty/models2', filename, dir }) {
    const env = { ...process.env, HF_HUB_ENABLE_HF_TRANSFER: '1' }

    await new Promise((resolve, reject) => {
      const child = spawn('hf', ['download', repo, filename, '--local-dir', dir], { env })

      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')

      child.on('close', (code) => {
        if (code === 0) {
          resolve(true)
        } else {
          const error = new Error(`huggingfaceLib_download_87 hf download exited with code ${code}`)
          reject(error)
        }
      })
    })
  }
}
