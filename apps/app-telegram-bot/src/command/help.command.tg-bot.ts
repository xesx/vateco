import { Injectable } from '@nestjs/common'
import { Context, Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

@Injectable()
export class HelpCommandTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {
    this.bot.command('help', (ctx) => {
      ctx.reply(
        '*Доступные команды:*\n' +
        '/start — начать диалог\n' +
        '/help — это сообщение\n' +
        '/searchparams — это сообщение\n' +
        '/menu — показать меню',
        {
          parse_mode: 'Markdown',
          ...Markup.removeKeyboard(),
        },
      )
    })
  }
}