import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastService } from '@libs/vast'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class ShowInstanceVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('show', (ctx) => this.handleShowVastAiInstance(ctx))
    this.bot.action('action:instance:show', (ctx) => this.handleShowVastAiInstance(ctx))
  }

  @Step('loading', 'running')
  private async handleShowVastAiInstance(ctx: TelegramContext) {
    const instanceId = ctx.session.instanceId

    const instance = await this.vastService.showInstance({ instanceId })
    console.log('\x1b[36m', 'result', JSON.stringify(instance, null, 2), '\x1b[0m')

    const token = instance.jupyter_token || 'N/A'
    const ipAddress = instance.public_ipaddr || 'N/A'
    const comfyuiPort = instance.ports?.['8188/tcp']?.[0]?.HostPort || 'N/A'
    const rclonePort = instance.ports?.['5572/tcp']?.[0]?.HostPort || 'N/A'

    ctx.session.instanceToken = instance.jupyter_token || 'N/A'
    ctx.session.instanceIp = ipAddress
    ctx.session.instanceComfyuiPort = comfyuiPort
    ctx.session.instanceRclonePort = rclonePort

    if (instance.actual_status === 'running') {
      ctx.session.step = 'running'
    }

    const comfyuiLink =`http://${ipAddress}:${comfyuiPort}?token=${token}`
    const appsMenuLink =`http://${ipAddress}:${instance.ports?.['1111/tcp']?.[0]?.HostPort || 'N/A'}` +
      `?token=${token}`

    const startDate = new Date(Math.round(((instance.start_date || 0) * 1000))).toLocaleString()

    const message = `🖥️ *Instance #${instance.id}*\n\n` +
      `📊 *Status:* ${instance.actual_status || 'unknown'}\n` +
      `🏷️ *Label:* ${instance.label || 'No label'}\n` +
      `💾 *Image:* ${instance.image_uuid || 'N/A'}\n` +
      `🌐 *Host:* ${instance.public_ipaddr || 'N/A'}\n` +
      `🖥️ *GPU:* ${instance.gpu_name || 'N/A'}\n` +
      `💰 *Price:* $${(instance.dph_total?.toFixed(2)) || '0'}/hour\n` +
      `⏰ *Start at:* ${startDate}\n (duration: ${instance.duration})` +
      // `💸 *Total Cost:* $${((instance.duration || 0) / 3600 * (instance.dph_total || 0)).toFixed(2)}` + `\n` +
      `🔗 *Apps Menu Link:* [-->>](${appsMenuLink})\n` +
      `🔗 *ComfyUI Link:* [${comfyuiLink}](${comfyuiLink})\n`

    this.tgbotsrv.safeAnswerCallback(ctx)
    ctx.reply(message, { parse_mode: 'Markdown' })
  }
}
