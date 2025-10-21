import { setTimeout } from 'timers/promises'

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
    const { l, tgbotlib } = this

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
    let promptId: string | null = null

    await new Promise((resolve) => {
      wsClient.on('error', async (error) => {
        l.error('WorkflowProgressCronJob_handle_42 WebSocket error', error)
        await setTimeout(5000)
        resolve(null)
      })

      wsClient.on('message', async (data) => {
        const message: TWsMessage = JSON.parse(data.toString())

        if (message.type === 'status') {
          if (message.data?.status?.exec_info?.queue_remaining <= 0) {
            if (lastProgressMessageTimestamp > 0 && tgMessageId) {
              const tgMessage = this.msglib.genCodeMessage(`✅ Generations completed.`)
              await tgbotlib.editMessage({
                chatId: TG_CHAT_ID,
                messageId: tgMessageId,
                text: tgMessage
              })

              tgMessageId = null
            }

            wsClient.close()
            return resolve(null)
          }

          return
        } else if (message.type === 'progress_state') {
          const now = Date.now()

          if (now - lastProgressMessageTimestamp < 2000) {
            // Throttle to send/edit message every 2 seconds
            return
          }

          const runningNode = Object.values(message.data.nodes).find((node => node.state === 'running'))

          if (runningNode && runningNode.max > 1 && runningNode.value / runningNode.max < 0.97) {
            lastProgressMessageTimestamp = now

            if (message.data.prompt_id !== promptId) {
              tgMessageId = null
              promptId = message.data.prompt_id
            }

            // const tgMessage = this.msglib.genCodeMessage(`⏳ WF is in progress...\nid: ${promptId}\nNode: ${runningNode.node_id}\nProgress: ${Math.floor((runningNode.value / runningNode.max) * 100)}%`)
            const tgMessage = this.msglib.genProgressMessage({
              message: 'generation',
              total: runningNode.max,
              done: runningNode.value,
            })

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
    })
  }
}