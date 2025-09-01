// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class RcloneLibService {
  private readonly client: AxiosInstance

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

  // async getRcloneVersion() {
  //   try {
  //     const res = await axios.post(`${BASE_URL}/core/version`, null, {
  //       headers: {
  //         // Передаем cookie с токеном
  //         Cookie: `C.${vastAiInstanceId}_auth_token=${TOKEN}`,
  //       },
  //       // Следовать редиректам (аналог -L в curl)
  //       maxRedirects: 5,
  //     })
  //     console.log(res.data)
  //   } catch (err) {
  //     console.error("Error:", err)
  //   }
  // }

  async operationCopyFile ({ baseUrl, headers, srcFs, srcRemote, dstFs, dstRemote }): Promise<void> {
    const url = baseUrl + '/operations/copyfile'

    const res = await axios.post(
      url,
      { srcFs, srcRemote, dstFs, dstRemote },
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
