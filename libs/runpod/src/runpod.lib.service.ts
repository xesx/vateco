import * as assert from 'node:assert/strict'

import axios from 'axios'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RunpodLibService {
  private readonly baseUrl = 'https://api.runpod.ai/v2/yjippcmguvsx1n'
  private readonly apiKey: string

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RUNPOD_API_KEY')
    assert(apiKey)

    this.apiKey = apiKey
  }

  private get headers () {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  private generateRequestUrl (path): string {
    return `${this.baseUrl}${path}`
  }

  async runSync ({ workflow }): Promise<any> {
    const path = '/runsync'
    const data = { input: { workflow } }

    const startTime = Date.now()
    const response = await axios.post(
      this.generateRequestUrl(path),
      data,
      { headers: this.headers }
    )
    console.log('RunpodLibService_runSync_99 time:', (Date.now() - startTime) / 1000, 's')

    return response?.data
  }
}
