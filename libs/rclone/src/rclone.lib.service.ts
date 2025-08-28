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

  async startCopy({ baseUrl, srcFs, dstFs }): Promise<number> {
    const url = baseUrl + '/jobs/start'

    const res = await axios.post(
      url,
      {
        command: 'operations/copy',
        params: { srcFs, dstFs }
      }
    )

    const jobid = res.data.jobid

    return jobid
  }

  async getJobStatus({ baseUrl, jobId }): Promise<any> {
    const url = baseUrl + '/jobs/status'

    const res = await axios.get(
      url,
      {
        params: { jobid: jobId },
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
