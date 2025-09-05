// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class RcloneLibService {
  private readonly client: AxiosInstance
  private readonly BASE_URL = 'http://127.0.0.1:5572'

  constructor(
    // private readonly configService: ConfigService
  ) {
    // const apiKey = this.configService.get<string>('VAST_AI_API_KEY')
    // assert(apiKey)
    //
    // const RCLONE_HOST = process.env.RCLONE_HOST || 'http://server-ip:5572'
    // const RCLONE_USER = process.env.RCLONE_USER || 'myuser'
    // const RCLONE_PASS = process.env.RCLONE_PASS || 'mypass'

    // this.client = axios.create({
    //   baseURL: `${RCLONE_HOST}/rc`,
    //   auth: { username: RCLONE_USER, password: RCLONE_PASS },
    // })
  }

  async getRcloneVersion({ baseUrl = this.BASE_URL, headers = {} } = {}): Promise<any> {
    const url = baseUrl + '/core/version'

    try {
      const res = await axios.post(url, null, { headers, maxRedirects: 5 })
      return res.data
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  async operationsList ({ baseUrl = this.BASE_URL, headers = {} } = {}): Promise<any> {
    const url = baseUrl + '/operations/list'

    const res = await axios.post(
      url,
      { remote: 'shared', fs: 'ydisk:', opt: { recurse: false } },
      {
        headers,
        maxRedirects: 5,
      }
    )

    return res.data
  }

  async operationCopyFile ({ baseUrl = this.BASE_URL, headers = {}, srcFs, srcRemote, dstFs, dstRemote }): Promise<void> {
    const url = baseUrl + '/operations/copyfile'

    const res = await axios.post(
      url,
      { srcFs, srcRemote, dstFs, dstRemote, _async: true },
      {
        headers,
        maxRedirects: 5,
      }
    )
  }

  async coreStats ({ baseUrl, headers }): Promise<any> {
    const url = baseUrl + '/core/stats'

    const res = await axios.post(
      url,
      null,
      {
        headers,
        maxRedirects: 5,
      }
    )

    return res.data
  }

  async getAllJobsStats({ baseUrl }): Promise<any> {
    const url = baseUrl + '/core/stats'

    const res = await axios.post(url)

    return res.data
  }

  /**
   * Пример: ждем завершения задачи с прогрессом
   */
  // async waitForCompletion(jobid: number, intervalMs = 5000): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     const timer = setInterval(async () => {
  //       try {
  //         const status = await this.getJobStatus(jobid)
  //         const stats = await this.getAllJobsStats()
  //
  //         if (status.finished) {
  //           clearInterval(timer)
  //           this.logger.log(`✅ Job ${jobid} finished`)
  //           resolve(status)
  //         } else {
  //           const { bytes, speed, eta } = stats
  //           this.logger.log(
  //             `⏳ Job ${jobid}: ${bytes} bytes copied, ${Math.round(
  //               speed / 1024 / 1024,
  //             )} MB/s, ETA: ${eta}s`,
  //           )
  //         }
  //       } catch (err) {
  //         clearInterval(timer)
  //         reject(err)
  //       }
  //     }, intervalMs)
  //   })
  // }
}
