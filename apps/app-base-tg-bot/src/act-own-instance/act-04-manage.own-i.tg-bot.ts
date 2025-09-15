import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'

import {
  ownInstanceWorkflowSelectMenu
} from '@kb'

import { CommonOwnITgBot } from './common.own-i.tg-bot'
import { OwnInstanceContext } from './types'

@Injectable()
export class Act04ManageOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly common: CommonOwnITgBot,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
  ) {
    this.bot.action('act:own-i:manage', (ctx) => this.common.showInstanceManageMenu(ctx))
    this.bot.action('act:own-i:status', (ctx) => this.handleActOwnInstanceStatus(ctx))
    this.bot.action('act:own-i:destroy', (ctx) => this.handleActOwnInstanceDestroy(ctx))
    this.bot.action('act:own-i:workflow', (ctx) => this.handleActOwnInstanceWorkflow(ctx))
  }

  private async handleActOwnInstanceStatus(ctx: OwnInstanceContext) {
    const step = ctx.session.step || '__undefined__'
    const instanceId = ctx.session.instanceId

    if (!['loading', 'running'].includes(step)) {
      ctx.deleteMessage()
      return
    }

    const instance = await this.vastlib.showInstance({ instanceId })

    const token = instance.jupyter_token || 'N/A'
    const ipAddress = instance.public_ipaddr || 'N/A'
    const comfyuiPort = instance.ports?.['8188/tcp']?.[0]?.HostPort || 'N/A'
    const rclonePort = instance.ports?.['5572/tcp']?.[0]?.HostPort || 'N/A'
    const instanceApiPort = instance.ports?.['3042/tcp']?.[0]?.HostPort || 'N/A'

    ctx.session.instanceToken = instance.jupyter_token || 'N/A'
    ctx.session.instanceIp = ipAddress
    ctx.session.instanceComfyuiPort = comfyuiPort
    ctx.session.instanceRclonePort = rclonePort
    ctx.session.instanceApiPort = instanceApiPort

    if (instance.actual_status === 'running') {
      ctx.session.step = 'running'
    }

    const comfyuiLink =`http://${ipAddress}:${comfyuiPort}?token=${token}`
    const appsMenuLink =`http://${ipAddress}:${instance.ports?.['1111/tcp']?.[0]?.HostPort || 'N/A'}` +
      `?token=${token}`

    const startDate = new Date(Math.round(((instance.start_date || 0) * 1000))).toLocaleString()

    const message = `🖥️ *Instance #${instance.id}*\n\n` +
      `📊 *Status:* ${instance.actual_status || 'unknown'}\n` +
      `📊 *State:* ${instance.cur_state || 'unknown'}\n` +
      `🏷️ *Label:* ${instance.label || 'No label'}\n` +
      `💾 *Image:* ${instance.image_uuid || 'N/A'}\n` +
      `🌐 *Host:* ${instance.public_ipaddr || 'N/A'}\n` +
      `🖥️ *GPU:* ${instance.gpu_name || 'N/A'}\n` +
      `💰 *Price:* $${(instance.dph_total?.toFixed(2)) || '0'}/hour\n` +
      `⏰ *Start at:* ${startDate}\n (duration: ${instance.duration})` +
      // `💸 *Total Cost:* $${((instance.duration || 0) / 3600 * (instance.dph_total || 0)).toFixed(2)}` + `\n` +
      `🔗 *Apps Menu Link:* [-->>](${appsMenuLink})\n` +
      `🔗 *ComfyUI Link:* [${comfyuiLink}](${comfyuiLink})\n`

    this.tgbotlib.safeAnswerCallback(ctx)
    const keyboard = this.tgbotlib.generateInlineKeyboard([
      [[`⬅️ Back`, 'act:own-i:manage'], [`🔄 Refresh`, 'act:own-i:status']],
    ])

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }

  private async handleActOwnInstanceDestroy(ctx: OwnInstanceContext) {
    const instanceId = ctx.session.instanceId

    const result = await this.vastlib.destroyInstance({ instanceId })
    delete ctx.session.instanceId
    ctx.session.step = 'start'

    this.tgbotlib.safeAnswerCallback(ctx)

    const extraMessage = 'Instance destroyed:\n' + JSON.stringify(result)
    this.common.showInstanceSearchParamsMenu(ctx, extraMessage)
  }

  private handleActOwnInstanceWorkflow (ctx: OwnInstanceContext) {
    this.tgbotlib.safeAnswerCallback(ctx)

    const message = '*Select workflow*'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceWorkflowSelectMenu())

    this.tgbotlib.reply(ctx, message, { parse_mode: 'Markdown', ...keyboard })
  }
}