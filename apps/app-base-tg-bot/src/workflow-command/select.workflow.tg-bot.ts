import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { RcloneLibService } from '@libs/rclone'
import { TgBotLibService } from '@libs/tg-bot'

import workflow from '@workflow'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SelectWorkflowTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
    private readonly rclonesrv: RcloneLibService,
  ) {
    this.bot.action('act:own-instance:workflow', (ctx) => this.handleSelectWorkflow(ctx))

    this.bot.action('action:workflow:select:back', (ctx) => {
      this.tgbotlib.safeAnswerCallback(ctx)
      this.tgbotsrv.showInstanceManageMenu(ctx)
    })

    // Обработка выбора инстанса
    this.bot.action(/^action:workflow:select:(.+)$/, (ctx) => {
      const workflowId = ctx.match[1] // извлекаем часть после подчеркивания

      ctx.session.workflowId = workflowId

      const rcloneBaseUrl = `http://${ctx.session.instanceIp}:${ctx.session.instanceRclonePort}`
      const token = ctx.session.instanceToken
      const instanceId = ctx.session.instanceId

      const wf = workflow[workflowId]
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

      ctx.reply('workflow start loading... ' + workflowId)
      this.tgbotlib.safeAnswerCallback(ctx)
    })
  }

  @Step('running')
  private handleSelectWorkflow(ctx: TelegramContext) {
    ctx.editMessageText(
      'Выберите рабочий процесс:',
      this.tgbotlib.generateInlineKeyboard([
        [[`Base SD 1.5`, 'act:own-instance:workflow:base-sd15']],
        [[`Base SDXL`, 'act:own-instance:base-sdxl']],
        [[`Base Flux`, 'act:own-instance:base-flux']],
        [[`Back to instance menu`, 'act:own-instance:create']],
      ]),
    )
  }
}
