import { spawn } from 'child_process'

import { Injectable } from '@nestjs/common'

import axios from 'axios'

@Injectable()
export class HuggingfaceLibService {
  private readonly HF_BASE_URL = 'https://huggingface.co'

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
          const error = new Error(`HuggingfaceLibService_download_87 hf download exited with code ${code}`)
          reject(error)
        }
      })
    })
  }

  async downloadWithRetry ({ repo = 'alalarty/models2', filename, dir, retries = 3, delayMs = 5000 }) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // await this.download({ repo, filename, dir })
        await this.download({ repo, filename, dir })
        return // Success, exit the function
      } catch (error) {
        if (attempt >= retries) {
          throw error // Rethrow the error if it's the last attempt
        }
        // Wait before retrying
        console.log('HuggingfaceLibService_downloadWithRetry_91 Error downloading file, retrying...', error)
        await new Promise(res => setTimeout(res, delayMs))
      }
    }
  }

  async getFileSize ({ repo, filename, token = process.env.HF_TOKEN }) {
    const url = `${this.HF_BASE_URL}/${repo}/resolve/main/${filename}`

    if (!token) {
      throw new Error('HuggingfaceLibService_getFileSize_13 Huggingface token is not provided')
    }

    try {
      const response = await axios.head(url, { headers: { Authorization: `Bearer ${token}` } })

      return Number(response.headers['content-length'])
    } catch (error) {
      console.log('HuggingfaceLibService_getFileSize_91 Error get file size', error, error.message)
      // throw error
      return 0
    }
  }
}
