// import * as fs from 'fs'
// import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import { HelperAppCloudCronService } from '../helper.app-cloud-cron.service'

type TWorkflowNode = {
  value: number
  max: number
  state: string
  node_id: string
  prompt_id: string
  display_node_id: string
  parent_node_id: string | null
  real_node_id: string
}

type TWsMessage = {
  type: string
  data: {
    prompt_id: string
    status: any
    nodes: Record<string, TWorkflowNode>
  }
}

@Injectable()
export class WorkflowProgressCronJob {
  private readonly l = new Logger(WorkflowProgressCronJob.name)

  constructor(
    private readonly helper: HelperAppCloudCronService,

    private readonly comfyuilib: lib.ComfyUiLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly tgbotlib: lib.TgBotLibService,
  ) {}

  async handle({ TG_CHAT_ID }) {
    const { tgbotlib } = this

    let wsClient

    try {
      wsClient = await this.comfyuilib.wsConnect()
    } catch (error) {
      this.l.error('WorkflowProgressCronJob_handle_31 WebSocket connection error', error)
    }

    if (!wsClient) {
      return
    }

    let tgMessageId: string | null = null
    let lastProgressMessageTimestamp = 0

    wsClient.on('message', async (data) => {
      const message: TWsMessage = JSON.parse(data.toString())

      if (message.type === 'status') {
        // console.log('\x1b[36m', 'ws status', JSON.stringify(message, null, 2), '\x1b[0m')

        if (message.data?.status?.exec_info?.queue_remaining <= 0) {
          if (lastProgressMessageTimestamp > 0 && tgMessageId) {
            const tgMessage = this.msglib.genCodeMessage(`✅ Generations completed.`)
            await tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: tgMessage })
          }

          wsClient.close()
        }
        return
      } else if (message.type === 'progress_state') {
        const now = Date.now()

        if (now - lastProgressMessageTimestamp < 2000) {
          // Throttle to send/edit message every 2 seconds
          return
        }

        const runningNode = Object.values(message.data.nodes).find((node => node.state === 'running'))

        if (runningNode && runningNode.max > 1 && runningNode.value / runningNode.max < 0.9) {
          lastProgressMessageTimestamp = now
          const tgMessage = this.msglib.genCodeMessage(`⏳ Workflow is in progress...\nNode: ${runningNode.node_id}\nProgress: ${Math.floor((runningNode.value / runningNode.max) * 100)}%`)

          if (tgMessageId) {
            await tgbotlib.editMessage({
              chatId: TG_CHAT_ID,
              messageId: tgMessageId,
              text: tgMessage
            })
          } else {
            tgMessageId = await tgbotlib.sendMessage({ chatId: TG_CHAT_ID, text: tgMessage })
          }
        }
      }
    })
  }
}