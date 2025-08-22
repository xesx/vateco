import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'

import { Context, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'


@Injectable()
export class CommonHandlerTgBot {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {
    this.bot.on(message('text'), (ctx) => {
      const message = ctx.message.text

      if (message.startsWith('/')) return // пропускаем команды

      ctx.reply(`Вы написали_: "${message}"`)
    })

    this.bot.on(message('photo'), (ctx) => {
      ctx.reply('Спасибо за фото! 🖼')
    })

    this.bot.on(message('voice'), (ctx) => {
      ctx.reply('Голосовое сообщение получено! 🎙')
    })
  }
}