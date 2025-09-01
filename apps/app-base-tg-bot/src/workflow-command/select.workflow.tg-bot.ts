import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { RcloneLibService } from '@libs/rclone'
import workflow from '@workflow'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SelectWorkflowTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly rclonesrv: RcloneLibService,
  ) {
    this.bot.action('action:workflow:select', (ctx) => this.handleSelectWorkflow(ctx))

    this.bot.action('action:workflow:select:back', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx)
      this.tgbotsrv.showInstanceMenu(ctx)
    })

    // Обработка выбора инстанса
    this.bot.action(/^action:workflow:select:(.+)$/, (ctx) => {
      const workflowId = ctx.match[1] // извлекаем часть после подчеркивания

      ctx.session.workflowId = workflowId

      this.tgbotsrv.safeAnswerCallback(ctx)
      ctx.reply('workflow start loading... ' + workflowId)

      const rcloneBaseUrl = `http://${ctx.session.instanceIp}:${ctx.session.instanceRclonePort}`
      const token = ctx.session.instanceToken
      const instanceId = ctx.session.instanceId

      const wf = workflow['base-flux']
      const models = wf.models || []

      // const item = 'vae/flux-vae-fp-16.safetensors'
      for (const model of models) {
        this.rclonesrv.operationCopyFile({
          baseUrl: rcloneBaseUrl,
          headers: { Cookie: `C.${instanceId}_auth_token=${token}` },
          srcFs: 'ydisk:',
          srcRemote: `shared/comfyui/models/${model}`,
          dstFs: '/',
          dstRemote: `workspace/ComfyUI/models/${model}`,
        })
      }

      ctx.session.wf = 'base-flux'
      ctx.session.step = 'loading-workflow'
      ctx.reply('loading start...')
      this.tgbotsrv.safeAnswerCallback(ctx)

      setTimeout(async () => {
        const stats = await this.rclonesrv.coreStats({
          baseUrl: rcloneBaseUrl,
          headers: { Cookie: `C.${instanceId}_auth_token=${token}` },
        })

        ctx.reply('stats ' + JSON.stringify(stats, null, 2))
      }, 1000)
    })
  }

  @Step('running')
  private handleSelectWorkflow(ctx: TelegramContext) {
    ctx.editMessageText(
      'Выберите рабочий процесс:',
      this.tgbotsrv.generateInlineKeyboard([
        [[`WF_1`, 'action:workflow:select:1']],
        [[`WF_2`, 'action:workflow:select:2']],
        [[`WF_3`, 'action:workflow:select:3']],
        [[`Back to instance menu`, 'action:workflow:select:back']],
      ]),
    )
  }
}
