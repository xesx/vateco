import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { RcloneLibService } from '@libs/rclone'
import workflow from '@workflow'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class CheckStatusWorkflowTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly rclonelib: RcloneLibService,
  ) {
    this.bot.action('action:workflow:status', (ctx) => this.handleCheckStatusWorkflow(ctx))

    // this.bot.action('action:workflow:select:back', (ctx) => {
    //   this.tgbotsrv.safeAnswerCallback(ctx)
    //   this.tgbotsrv.showInstanceManageMenu(ctx)
    // })
  }

  // @Step('running', 'loading-workflow')
  private async handleCheckStatusWorkflow(ctx: TelegramContext) {
    const rcloneBaseUrl = `http://${ctx.session.instanceIp}:${ctx.session.instanceRclonePort}`
    const token = ctx.session.instanceToken
    const instanceId = ctx.session.instanceId

    const stats = await this.rclonelib.coreStats({
      baseUrl: rcloneBaseUrl,
      headers: { Cookie: `C.${instanceId}_auth_token=${token}` },
    })

    ctx.reply('stats ' + JSON.stringify(stats, null, 2))
  }
}
