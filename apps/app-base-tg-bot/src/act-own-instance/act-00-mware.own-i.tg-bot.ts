import { Injectable } from '@nestjs/common'

import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
// import { message } from 'telegraf/filters'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'
import { TgBotLibService } from '@libs/tg-bot'

import { TelegramContext } from '../types'

@Injectable()
export class Act00MwareOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: TgBotLibService,
  ) {
    this.bot.action(/^act:own-instance(.*)$/, (ctx, next) => this.handleCommonAction(ctx, next))
    this.bot.hears('⬅️ Back', (ctx) => this.handleActOwnInstanceBack(ctx))
    // this.bot.on(message('text'), (ctx) => {
    //   const message = ctx.message.text
    //
    //   console.log('\x1b[36m', 'ctx', ctx.update, '\x1b[0m')
    //   if (message.startsWith('/')) return // пропускаем команды
    //
    //   ctx.reply(`Вы написали_: "${message}"`)
    // })
  }

  // private async handleTextMessage(ctx: TelegramContext, next) {
  //   const message = ctx.message.text
  //
  //   if (ctx.session.inputWaiting) {
  //     const fakeUpdate = {
  //       update_id: ctx.update.update_id,
  //       callback_query: {
  //         id: 'fake-id',
  //         from: ctx.from,
  //         chat_instance: String(ctx.chat?.id),
  //         data: 'my_custom_action',
  //         message: ctx.message,
  //       },
  //     }
  //
  //     // отправляем внутрь Telegraf
  //     await this.bot.handleUpdate(fakeUpdate)
  //     return
  //   }
  //
  //   return next()
  // }

  private handleActOwnInstanceBack(ctx: TelegramContext) {
    this.tgbotsrv.showInstanceSearchParamsMenu(ctx)
  }

  private async handleCommonAction(ctx: TelegramContext, next: () => Promise<void>) {
    console.log('\x1b[36m', ' handleCommonAction ctx', ctx.update, '\x1b[0m')

    // if (ctx.callbackQuery) {
    //   const messageId = ctx.callbackQuery.message?.message_id
    //   const chatId = ctx.callbackQuery.message?.chat.id
    //
    //   if (messageId && chatId) {
    //     try {
    //       await this.tgbotlib.removeMessage({ chatId, messageId })
    //     } catch (error) {
    //       console.error('Failed to delete message:', error)
    //     }
    //   }
    // }

    return await next()
  }
}