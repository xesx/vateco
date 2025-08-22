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
    const path = '/users/{user_id}/machine-earnings/'
    const response = await axios.get(this.generateRequestUrl(path), {
      headers: this.headers,
    })

    return response?.data
  }

  async importOffers(): Promise<any> {
    const path = '/search/asks/'
    const response = await axios.put(this.generateRequestUrl(path), {
      headers: this.headers,
      body: {
        q: {
          'gpu_name': { 'eq': 'RTX 3090' },
          'disk_space': { 'gte': 100 },
          'allocated_storage': 100,
          'rentable': { 'eq': true },
          "static_ip": { "eq": true },
          'limit': 100,
          'inet_down_cost': { 'lte': 0.005 },
          'inet_up_cost': { 'lte': 0.005 },
          'dph_total': { 'lte': 0.80 },
        }
      }
    })

    return response?.data
  }
}


