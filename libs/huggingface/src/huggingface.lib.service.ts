// import * as assert from 'node:assert/strict'
import { spawn } from 'child_process'
import { EventEmitter } from 'events'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'
// import axios from 'axios'

@Injectable()
export class HuggingfaceLibService {
  // private readonly BASE_URL = 'http://127.0.0.1:5572'

  constructor(
    // private readonly configService: ConfigService
  ) {
  }

  async download ({ repo = 'alalarty/models2', filename, dir }) {
    const emitter = new EventEmitter()

    const env = { ...process.env, HF_HUB_ENABLE_HF_TRANSFER: '1' }

    await new Promise((resolve, reject) => {
      const child = spawn('hf', ['download', repo, filename, '--local-dir', dir], { env })

      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')

      child.stdout.on('data', (data) => {
        const str = data.toString()
        console.log('huggingfaceLib_download_20 hf download:', str)
        emitter.emit('progress', str)
      })

      child.stderr.on('data', (data) => {
        const str = data.toString()
        console.log('huggingfaceLib_download_30 hf error:', str)
        emitter.emit('errorLog', str)
      })

      child.on('close', (code) => {
        if (code === 0) {
          emitter.emit('done')
          resolve(true)
        } else {
          const error = new Error(`huggingfaceLib_download_87 hf download exited with code ${code}`)
          emitter.emit('error', error)
          reject(error)
        }
      })
    })
  }
}
