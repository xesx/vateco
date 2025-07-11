import * as assert from 'node:assert/strict'

import axios from 'axios'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class VastService {
  private readonly baseUrl = 'https://console.vast.ai/api/v0'
  private readonly apiKey: string

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('VAST_AI_API_KEY')
    assert(apiKey)

    this.apiKey = apiKey
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }

  private generateRequestUrl(path): string {
    return `${this.baseUrl}${path}`
  }

  async importBalance(): Promise<any> {
    const response = await axios.get(this.generateRequestUrl('/users/{user_id}/machine-earnings/'), {
      headers: this.headers,
    })

    return response?.data
  }

  async importOffers(): Promise<any> {
    const response = await axios.put(this.generateRequestUrl('/search/asks/'), {
      headers: this.headers,
      body: {
        q: {
          gpu_name: { 'eq': 'RTX 3090' },
        }
      }
    })

    return response?.data
  }
}
