import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'

import { Context, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

@Injectable()
export class AppBotService implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>
  ) {}

  onModuleInit() {
    this.bot.start((ctx) => ctx.reply('🚀 Бот запущен! Используй /search для поиска.'))

    this.bot.command('search', async (ctx) => {
      try {
        // const result = await this.vastService.searchOffer({ query: 'gpu' });
        const result = [{a: 1, b: 2}, {c: 3, d: 4}] // Заглушка для примера
        await ctx.reply(`Результат поиска: ${JSON.stringify(result, null, 2)}`)
      } catch (error) {
        await ctx.reply(`Ошибка: ${error.message}`)
      }
    })

    this.bot.on(message('text'), (ctx) => {
      ctx.reply(`Вы написали: "${ctx.message.text}"`)
    })

    console.log('✅ Telegram bot is running (polling mode)')
  }
}