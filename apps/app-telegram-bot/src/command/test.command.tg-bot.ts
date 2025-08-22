import { Injectable } from '@nestjs/common'
import { Context, Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastService } from '@libs/vast'

@Injectable()
export class TestCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly vastService: VastService,
  ) {
    this.bot.command('test', async (ctx) => {

      const offers = await this.vastService.importOffers()
      console.log('\x1b[36m', 'offers', offers, '\x1b[0m')

      ctx.reply(
        '🚀 test reply',
        {
          parse_mode: 'Markdown',
        },
      )
    })
  }
}