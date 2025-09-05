import * as assert from 'node:assert/strict'

import axios from 'axios'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { TVastAiInstanceStatus } from './type'

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
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
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

  async importOffers({ gpu, geolocation, inDataCenterOnly }: {
    gpu: string
    geolocation?: string[]
    inDataCenterOnly: boolean
  }): Promise<any> {
    const path = '/search/asks/'

    const data = {
      'q': {
        'verified': { 'eq': true },
        'num_gpus': { 'eq': 1 },
        'gpu_name': { 'eq': gpu },
        'datacenter': inDataCenterOnly ? { 'eq': true } : undefined,
        'disk_space': { 'gte': 30 },
        'allocated_storage': 30,
        'rentable': { 'eq': true },
        'reliability2': { 'gte': 0.9 },
        'duration': { 'gte': 1 },
        'cuda_max_good': { 'gte': 12.4 },
        'direct_port_count': { 'gte': 2 },
        'geolocation': geolocation ? { 'in': geolocation } : undefined,
        'static_ip': { 'eq': true },
        'inet_down_cost': { 'lte': 0.01 },
        'inet_up_cost': { 'lte': 0.01 },
        'dph_total': { 'lte': 0.8 },
        'type': 'on-demand',

        'order': [['dph_total', 'asc']],
        'limit': 20,
      }
    }

    const response = await axios.put(
      this.generateRequestUrl(path),
      data,
      {
        headers: this.headers,
      }
    )

    return response?.data
  }

  async createInstance({ offerId, env }: any): Promise<any> {
    const path = `/asks/${offerId}/`

    const data = {
      'template_id': 276088, // comfyui-api-01-cuda128-py312
      'client_id': 'me', // client id
      'env': env,
    }

    const response = await axios.put(
      this.generateRequestUrl(path),
      data,
      {
        headers: this.headers,
      }
    )

    return response?.data
  }

  async showInstance({ instanceId }): Promise<TVastAiInstanceStatus> {
    const path = `/instances/${instanceId}/`

    let instance = { actual_status: 'undefined' }

    try {
      const response = await axios.get(this.generateRequestUrl(path), { headers: this.headers })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      instance = (response?.data?.instances || { actual_status: 'not_found' }) as TVastAiInstanceStatus
    } catch (error) {
      console.log('VastService_showInstance_31', error)
      instance = { actual_status: 'error' }
    }

    return instance
  }

  async destroyInstance({ instanceId }): Promise<any> {
    const path = `/instances/${instanceId}/`

    const response = await axios.delete(
      this.generateRequestUrl(path),
      {
        headers: this.headers,
      }
    )

    return response?.data
  }
}
