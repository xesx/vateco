// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class CloudApiCallLibService {
  private readonly client: AxiosInstance
  async vastAiRequest ({ url, data = {}, instanceId, token }): Promise<any> {
    try {
      const res = await axios.post(
        url,
        data,
        {
          headers: { Cookie: `C.${instanceId}_auth_token=${token}` },
          maxRedirects: 5
        })

      return res.data
    } catch (error) {
      console.error('Error in vastAiRequest:', error)
      // throw error
    }
  }

  async ping ({ baseUrl, headers }): Promise<any> {
    const url = baseUrl + '/ping'

    const res = await axios.post(url, {}, { headers, maxRedirects: 5 })

    return res.data
  }

  async vastAiWorkflowLoad ({ baseUrl, instanceId, token, workflowId }): Promise<any> {
    const url = baseUrl + '/workflow/load'
    return await this.vastAiRequest({ url, instanceId, token, data: { workflowId } })
  }
}
