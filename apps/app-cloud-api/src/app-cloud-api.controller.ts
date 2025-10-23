import { join } from 'path'
import * as fs from 'fs'

import { Controller, All, Post, Body } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as lib from '@lib'
import * as synth from '@synth'

@Controller()
export class AppCloudApiController {
  private readonly WORKSPACE: string
  private readonly GENERATE_TASKS_DIR: string

  constructor(
    private readonly tgBotLibService: lib.TgBotLibService,
    private readonly configService: ConfigService,
    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {
    this.WORKSPACE = this.configService.get<string>('WORKSPACE') || '/workspace'
    this.GENERATE_TASKS_DIR = `${this.WORKSPACE}/generate_tasks`

    fs.mkdirSync(this.GENERATE_TASKS_DIR, { recursive: true })
  }

  @All('ping')
  appCloudApiPing(): any {
    return { message: 'Pong!', timestamp: new Date() }
  }

  @Post('hf/download')
  appCloudApiDownloadTask (@Body() body: { chatId: string, repo: string, srcFilename: string, dstFilename: string, dstDir: string }): any {
    const { DOWNLOAD_TASKS_DIR } = this.appcloudsynth

    if (!fs.existsSync(DOWNLOAD_TASKS_DIR)) {
      fs.mkdirSync(DOWNLOAD_TASKS_DIR)
    }

    const filename = `hf_download_${Date.now()}.json`
    const filePath = join(DOWNLOAD_TASKS_DIR, filename)

    const content = JSON.stringify(body)
    fs.writeFileSync(filePath, content, "utf8")

    console.log(`appCloudApiDownloadTask_99 Download task content: ${content}`)
  }

  @Post('workflow/load')
  appCloudApiWorkflowLoad(@Body() body: { workflowId: string }): any {
    const filePath = join(this.WORKSPACE, 'load.json')

    let data: string[] = []

    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf8")
        data = JSON.parse(fileContent) as string[]

        if (!Array.isArray(data)) {
          console.log('appCloudApiWorkflowLoad_11 File content is not array')
          data = []
        }
      } catch (error) {
        console.log('appCloudApiWorkflowLoad_13 Error', error)
        data = []
      }
    }

    data.push(body.workflowId)

    fs.writeFileSync(filePath, JSON.stringify(data), "utf8")
    console.log(`appCloudApiWorkflowLoad_99 Workflow "${body.workflowId}" added in ${filePath}`)
  }

  @Post('workflow/run')
  appCloudApiWorkflowRun(@Body() body: { chatId: string, id: string, count?: number, params: Record<string, any> }): any {
    const now = Date.now()
    const filePath = join(this.GENERATE_TASKS_DIR, `${now}_${body.id}.json`)

    const content = {
      chatId: body.chatId,
      count: body.count || 1,
      workflowId: body.id,
      workflowParams: body.params,
    }

    fs.writeFileSync(filePath, JSON.stringify(content), "utf8")

    console.log(`appCloudApiWorkflowRun_99 Workflow run task for "${body.id}" added in ${filePath}`)
  }
}
