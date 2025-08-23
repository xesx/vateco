import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { VastService } from '@libs/vast'

import { AppTelegramBotService } from '../app-telegram-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class ShowVastAiInstanceCallbackTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppTelegramBotService,
    private readonly vastService: VastService,
  ) {
    this.bot.command('show', (ctx) => this.handleShowVastAiInstance(ctx))
  }

  @Step('rent')
  private async handleShowVastAiInstance(ctx: TelegramContext) {
    const instanceId = ctx.session.vastAi.instance.id
    console.log('\x1b[36m', 'instanceId', instanceId, '\x1b[0m');

    const result = await this.vastService.showInstance({ instanceId })
    console.log('\x1b[36m', 'result', result, '\x1b[0m');

    const instance = result.instances

    const message = `🖥️ *Instance #${instance.id}*\n\n` +
      `📊 *Status:* ${instance.actual_status || 'unknown'}\n` +
      `🏷️ *Label:* ${instance.label || 'No label'}\n` +
      `💾 *Image:* ${instance.image || 'N/A'}\n` +
      `🌐 *Host:* ${instance.public_ipaddr || 'N/A'}\n` +
      `🔌 *SSH Port:* ${instance.ssh_port || 'N/A'}\n` +
      `💰 *Price:* $${instance.dph_total || '0'}/hour\n` +
      `⏰ *Runtime:* ${Math.round((instance.duration || 0) / 3600)}h\n` +
      `💸 *Total Cost:* $${((instance.duration || 0) / 3600 * (instance.dph_total || 0)).toFixed(4)}`

    ctx.reply(message, { parse_mode: 'Markdown' })
  }
}
