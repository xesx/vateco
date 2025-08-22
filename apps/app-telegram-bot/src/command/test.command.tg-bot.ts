import { Injectable } from '@nestjs/common'
import { Context, Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

@Injectable()
export class TestCommandTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {
    this.bot.command('test', (ctx) => {
      ctx.reply(
        '🚀 test reply',
        {
          parse_mode: 'Markdown',
        },
      )
    })
  }
}