import * as assert from 'node:assert/strict'

import axios from 'axios'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RunpodLibService {
  private readonly baseUrl = 'https://rest.runpod.io/v1'
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

  async createPod (): Promise<any> {
    const body = {
      allowedCudaVersions: ['12.8', '12.9'],
      cloudType: 'COMMUNITY', // 'SECURE',
      computeType: 'GPU', // CPU
      containerDiskInGb: 150,
      containerRegistryAuthId: 'clzdaifot0001l90809257ynb', // todo ???
      // countryCodes: ['<string>'],
      cpuFlavorIds: ['cpu3c'],
      cpuFlavorPriority: 'availability',
      dataCenterIds: [
        'EU-RO-1',
        'CA-MTL-1',
        'EU-SE-1',
        'US-IL-1',
        'EUR-IS-1',
        'EU-CZ-1',
        'US-TX-3',
        'EUR-IS-2',
        'US-KS-2',
        'US-GA-2',
        'US-WA-1',
        'US-TX-1',
        'CA-MTL-3',
        'EU-NL-1',
        'US-TX-4',
        'US-CA-2',
        'US-NC-1',
        'OC-AU-1',
        'US-DE-1',
        'EUR-IS-3',
        'CA-MTL-2',
        'AP-JP-1',
        'EUR-NO-1',
        'EU-FR-1',
        'US-KS-3',
        'US-GA-1'
      ],
      dataCenterPriority: 'availability',
      dockerEntrypoint: [],
      dockerStartCmd: [],
      env: {ENV_VAR: 'value'},
      globalNetworking: false,
      gpuCount: 1,
      gpuTypeIds: ['NVIDIA GeForce RTX 3090'],
      gpuTypePriority: 'custom',
      // imageName: 'runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04',
      interruptible: false,
      locked: false,
      minDiskBandwidthMBps: 123,
      minDownloadMbps: 200,
      minRAMPerGPU: 8,
      minUploadMbps: 200,
      minVCPUPerGPU: 1,
      name: 'vateco_base',
      // networkVolumeId: '<string>',
      ports: [ '8188/http', '8080/http', '8888/http', '3042/http', '22/tcp', '22/udp' ],
      supportPublicIp: true,
      templateId: 'runpod-ubuntu-2404',
      vcpuCount: 2,
      volumeInGb: 50,
      volumeMountPath: '/workspace'
    }

    const response = await axios.post(
      this.generateRequestUrl('/pods'),
      body,
      { headers: this.headers }
    )

    return response?.data
  }

  async listPods (): Promise<any> {
    const path = '/pods'

    const response = await axios.get(
      this.generateRequestUrl(path),
      { headers: this.headers }
    )

    return response?.data
  }

  async listTemplates (): Promise<any> {
    const path = '/templates'

    const response = await axios.get(
      this.generateRequestUrl(path),
      {
        headers: this.headers,
        params: {
          includeRunpodTemplates: true,
        }
      }
    )

    return response?.data
  }

  async getPod (podId: string): Promise<any> {
    const path = `/pods/${podId}`

    const response = await axios.get(
      this.generateRequestUrl(path),
      {
        headers: this.headers,
        params: {
          includeMachine: true,
        }
      }
    )

    return response?.data
  }

  // async runSync ({ workflow }): Promise<any> {
  // private readonly baseUrl = 'https://api.runpod.ai/v2/yjippcmguvsx1n'

  //   const path = '/runsync'
  //   const data = { input: { workflow } }
  //
  //   const startTime = Date.now()
  //   const response = await axios.post(
  //     this.generateRequestUrl(path),
  //     data,
  //     { headers: this.headers }
  //   )
  //   console.log('RunpodLibService_runSync_99 time:', (Date.now() - startTime) / 1000, 's')
  //
  //   return response?.data
  // }
}
