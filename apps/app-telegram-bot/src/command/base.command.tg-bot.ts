import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { TelegramContext } from '../types'

import { AppTelegramBotService } from '../app-telegram-bot.service'
// import { Step } from '../step.decorator'


@Injectable()
export class BaseCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppTelegramBotService,
  ) {
    this.bot.command('start', (ctx) => this.handleStart(ctx))
    this.bot.command('help', (ctx) => this.handleHelp(ctx))
  }

  // @Step('__undefined__', '_test')
  private handleStart(ctx: TelegramContext) {
    if (ctx.session.step === 'start') {
      this.tgbotsrv.showSearchParamsMenu(ctx)
    } else if (ctx.session.step === 'rent') {
      this.tgbotsrv.showInstanceMenu(ctx)
    }
  }

  private handleHelp(ctx: TelegramContext) {
    ctx.reply(
      '*Доступные команды:*\n' +
      '/start — начать диалог\n' +
      '/help — это сообщение\n' +
      '/searchparams\n' +
      '/search\n' +
      '/create\n' +
      '/show\n' +
      '/destroy\n' +
      '/test — показать меню',
      {
        parse_mode: 'Markdown',
        ...Markup.removeKeyboard(),
      },
    )
  }

  // @Step('started', 'processing')
  // private handleNext(ctx: TelegramContext) {
  //   ctx.session.step = 'completed'
  //   ctx.reply('✅ Следующий шаг выполнен.')
  // }
}
