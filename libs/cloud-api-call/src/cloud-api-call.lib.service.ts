// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class CloudApiCallLibService {
  private readonly client: AxiosInstance

  async ping ({ baseUrl, headers }): Promise<any> {
    const url = baseUrl + '/ping'

    const res = await axios.post(url, {}, { headers, maxRedirects: 5 })

    return res.data
  }
}
