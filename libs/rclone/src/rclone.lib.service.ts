// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'
import axios from 'axios'

@Injectable()
export class RcloneLibService {
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

  async operationCopyFile ({ baseUrl = this.BASE_URL, headers = {}, srcFs, srcRemote, dstFs, dstRemote }): Promise<{ jobid: number }> {
    const url = baseUrl + '/operations/copyfile'

    const res = await axios.post(
      url,
      { srcFs, srcRemote, dstFs, dstRemote, _async: true },
      {
        headers,
        maxRedirects: 5,
      }
    )

    return res.data
  }

  async coreStats ({ baseUrl = this.BASE_URL, headers = {} } = {}): Promise<any> {
    const url = baseUrl + '/core/stats'

    const res = await axios.post(url, null, { headers, maxRedirects: 5 })

    return res.data
  }

  async coreStatsByJob ({ baseUrl = this.BASE_URL, headers = {}, jobId }): Promise<any> {
    const url = baseUrl + '/core/stats'

    const res = await axios.post(url, { group: `job/${jobId}` }, { headers, maxRedirects: 5 })

    return res.data
  }

  async getJobStatus({ jobId,  baseUrl = this.BASE_URL, headers = {} }): Promise<any> {
    const url = baseUrl + '/job/status'

    const res = await axios.post(url, { 'jobid': jobId }, { headers, maxRedirects: 5 })

    return res.data
  }

  async *loadFileGenerator ({ srcFs, srcRemote, dstFs, dstRemote, baseUrl = this.BASE_URL, headers = {} }) {
    const copyResponse = await this.operationCopyFile({ srcFs, srcRemote, dstFs, dstRemote })

    while (true) {
      const stats = await this.coreStatsByJob({ jobId: copyResponse.jobid })
      const jobStatus = await this.getJobStatus({ jobId: copyResponse.jobid })

      if (jobStatus.error.length > 0) {
        throw new Error(jobStatus.error.join(', '))
      }

      const [jobStats] = stats.transferring || []
      yield jobStats

      if (jobStatus.finished) {
        return true
      }
    }
  }
}
