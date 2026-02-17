// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class CloudApiCallLibService {
  private readonly client: AxiosInstance
  async vastAiRequest ({ url, data = {}, instanceId, token, headers = {} }): Promise<any> {
    try {
      const res = await axios.post(
        url,
        data,
        {
          headers: { ...headers, Cookie: `C.${instanceId}_auth_token=${token}` },
          maxRedirects: 5
        })

      console.log('vastAiRequest_90 response:', url, { status: res.status, data: res.data })
      return res.data
    } catch (error) {
      console.log('vastAiRequest_91 Error:', url, error)
      throw error
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

  async vastAiWorkflowTemplateLoad ({ baseUrl, instanceId, token, workflowTemplate }): Promise<any> {
    const url = baseUrl + '/workflow-template/load'
    return await this.vastAiRequest({ url, instanceId, token, data: { workflowTemplate } })
  }

  async vastAiModelInfoLoad ({ baseUrl, instanceId, token, modelName, modelData }): Promise<any> {
    const url = baseUrl + '/model-data/load'
    return await this.vastAiRequest({ url, instanceId, token, data: { name: modelName, data: modelData } })
  }

  async vastAiWorkflowRun ({ baseUrl, instanceId, token, workflowTemplateId, count, workflowVariantParams, models, chatId }): Promise<any> {
    const url = baseUrl + '/workflow/run'
    return await this.vastAiRequest({ url, instanceId, token, data: { id: workflowTemplateId, params: workflowVariantParams, models, count, chatId } })
  }

  async vastAiUploadInputImage ({ baseUrl, instanceId, token, form }): Promise<any> {
    const url = baseUrl + '/file/upload'
    return await this.vastAiRequest({ url, instanceId, token, data: form, headers: form.getHeaders() })
  }

  async vastAiCancelAll ({ baseUrl, instanceId, token }): Promise<any> {
    const url = baseUrl + '/cancel/all'
    return await this.vastAiRequest({ url, instanceId, token })
  }
}
