import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastService } from '@libs/vast'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class ShowInstanceVastAiTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppTelegramBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('show', (ctx) => this.handleShowVastAiInstance(ctx))
    this.bot.action('action:instance:show', (ctx) => this.handleShowVastAiInstance(ctx))
  }

  @Step('rent')
  private async handleShowVastAiInstance(ctx: TelegramContext) {
    const instanceId = ctx.session.instanceId

    const instance = await this.vastService.showInstance({ instanceId })
    console.log('\x1b[36m', 'result', JSON.stringify(instance, null, 2), '\x1b[0m');

    const comfyuiLink =`http://${instance.public_ipaddr || 'N/A'}:${instance.ports?.['8188/tcp']?.[0]?.HostPort || 'N/A'}` +
      `?token=${instance.jupyter_token || 'N/A'}`

    const appsMenuLink =`http://${instance.public_ipaddr || 'N/A'}:${instance.ports?.['1111/tcp']?.[0]?.HostPort || 'N/A'}` +
      `?token=${instance.jupyter_token || 'N/A'}`

    const startDate = new Date(Math.round((instance.start_date * 1000))).toLocaleString()

    const message = `🖥️ *Instance #${instance.id}*\n\n` +
      `📊 *Status:* ${instance.actual_status || 'unknown'}\n` +
      `🏷️ *Label:* ${instance.label || 'No label'}\n` +
      `💾 *Image:* ${instance.image_uuid || 'N/A'}\n` +
      `🌐 *Host:* ${instance.public_ipaddr || 'N/A'}\n` +
      `🖥️ *GPU:* ${instance.gpu_name || 'N/A'}\n` +
      // `🧑‍💻 *SSH User:* ${instance.ssh_username || 'N/A'}\n` +
      // `🔑 *SSH Password:* ${instance.ssh_password || 'N/A'}\n` +
      // `🔌 *SSH Port:* ${instance.ssh_port || 'N/A'}\n` +
      `💰 *Price:* $${(instance.dph_total?.toFixed(2)) || '0'}/hour\n` +
      `⏰ *Start at:* ${startDate}\n` +
      // `💸 *Total Cost:* $${((instance.duration || 0) / 3600 * (instance.dph_total || 0)).toFixed(2)}` + `\n` +
      `🔗 *Apps Menu Link:* [-->>](${appsMenuLink})\n` +
      `🔗 *ComfyUI Link:* [${comfyuiLink}](${comfyuiLink})\n`

    ctx.reply(message, { parse_mode: 'Markdown' })
  }
}
