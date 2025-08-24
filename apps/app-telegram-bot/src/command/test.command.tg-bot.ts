import { Injectable } from '@nestjs/common'
import { Context, Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { Markup } from 'telegraf'

import { VastService } from '@libs/vast'

@Injectable()
export class TestCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly vastService: VastService,
  ) {
    this.bot.command('test', (ctx) => {

      // Пример: кнопка "Меню" под полем ввода текста
      ctx.reply(
        'Выберите действие:',
        Markup.keyboard([['📋 Меню']])
          .resize()   // подгоняет под экран
          .oneTime()  // спрячется после выбора
      )
    })
  }
}