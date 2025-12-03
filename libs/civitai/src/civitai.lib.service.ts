// import { spawn } from 'child_process'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import axios from 'axios'

@Injectable()
export class CivitaiLibService {
  private readonly CIVITAI_BASE_URL = 'https://civitai.com/api'
  readonly CIVITAI_TOKEN

  constructor(
    private readonly configService: ConfigService
  ) {
    this.CIVITAI_TOKEN = this.configService.get<string>('CIVITAI_TOKEN') || process.env.CIVITAI_TOKEN
  }

  async importModelVersionData ({ modelVersionId, token }: { modelVersionId: string, token?: string }) {
    const url = `${this.CIVITAI_BASE_URL}/v1/model-versions/${modelVersionId}`
    token = token || this.CIVITAI_TOKEN

    if (!token) {
      throw new Error('CivitaiLibService_importModelVersionData_13 Civitai token is not provided')
    }

    try {
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })

      return response.data
    } catch (error) {
      console.log('CivitaiLibService_importModelVersionData_34 Error import model version data', error, error.message)
      throw new Error('CivitaiLibService_importModelVersionData_35 Error importing model version data from Civitai')
    }
  }

  async importModelData ({ modelId, token }: { modelId: number, token?: string }) {
    const url = `${this.CIVITAI_BASE_URL}/v1/models/${modelId}`
    token = token || this.CIVITAI_TOKEN

    if (!token) {
      throw new Error('CivitaiLibService_importModelData_49 Civitai token is not provided')
    }

    try {
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })

      return response.data
    } catch (error) {
      console.log('CivitaiLibService_importModelData_70 Error import model data', error, error.message)
      throw new Error('CivitaiLibService_importModelData_71 Error importing model data from Civitai')
    }
  }
}
