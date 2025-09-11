import * as fs from 'fs'
import { join } from 'path'

import { Controller, All, Post, Body } from '@nestjs/common'

import { TgBotLibService } from '@libs/tg-bot'

@Controller()
export class AppCloudApiController {
  constructor(
    private readonly tgBotLibService: TgBotLibService,
  ) {}

  @All('ping')
  appCloudApiPing(): any {
    return { message: 'Pong!', timestamp: new Date() }
  }

  @Post('workflow/load')
  appCloudApiWorkflowLoad(@Body() body: { workflowId: string }): any {
    const dir = process.env.WORKSPACE || '/workspace'
    const filePath = join(dir, 'load.json')

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
  appCloudApiWorkflowRun(@Body() body: { workflowId: string, workflowParams: Record<string, any> }): any {
    // generate image with workflowId and workflowParams as text
  }

  // @Post('test')
  // createUser(@Body() data: any) {
  //   // Здесь обрабатывается тело запроса
  //   console.log(data)
  //
  //   return {
  //     message: 'test response message',
  //     data,
  //   }
  // }
}
