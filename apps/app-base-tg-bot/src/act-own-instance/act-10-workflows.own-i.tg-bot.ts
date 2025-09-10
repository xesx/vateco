import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'
import { VastLibService } from '@libs/vast'
import { MessageLibService } from '@libs/message'
import { CloudApiCallLibService } from '@libs/cloud-api-call'

import { TelegramContext } from '../types'

import {
  ownInstanceWorkflowsMenu
} from '../inline-keyboard'

@Injectable()
export class Act10WorkflowsOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
    private readonly cloudapilib: CloudApiCallLibService,
    private readonly vastlib: VastLibService,
    private readonly msglib: MessageLibService,
  ) {
    this.bot.action('act:own-instance:workflow', (ctx) => this.handleActOwnInstanceWorkflow(ctx))
    this.bot.action(/^act:own-instance:workflow:(.+)$/, (ctx) => this.handleActOwnInstanceWorkflowSelect(ctx))
  }

  private handleActOwnInstanceWorkflow(ctx: TelegramContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceWorkflowsMenu())

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  private async handleActOwnInstanceWorkflowSelect(ctx: TelegramContext) {
    const step = ctx.session.step || '__undefined__'

    if (!['running'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const workflowId = ctx.match?.[1]
    ctx.session.workflowId = workflowId

    await this.cloudapilib.vastAiWorkflowLoad({
      baseUrl: `http://${ctx.session.instanceIp}:3042`,
      instanceId: ctx.session.instanceId,
      token: ctx.session.instanceToken,
      workflowId
    })

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotsrv.showInstanceManageMenu(ctx, `Workflow ${workflowId} start loading...`)
  }
}