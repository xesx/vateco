import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as FormData from 'form-data'
import axios from 'axios'

import { Context, Markup, Telegraf } from 'telegraf'

import { TSendInlineKeyboardArgs } from './types'

@Injectable()
export class TgBotLibService {
  private readonly baseUrl: string
  private bot: Telegraf<Context>

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN')

    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env')
    }

    this.baseUrl = `https://api.telegram.org/bot${token}`
    this.bot = new Telegraf(token)
  }

  async reply (ctx: Context, message: string, extra?: any) {
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, extra)
      } else {
        await ctx.reply(message, extra)
      }
    } catch (e: any) {
      if (e.description?.includes("message is not modified")) {
        // ничего не делаем
      } else {
        console.log('TgBotLibService_reply_13 Error:', e.message, e.description)
        throw e
      }
    }
  }

  async removeReplyKeyboard (ctx: Context) {
    if (!ctx.chat?.id) {
      return
    }

    const message = await ctx.telegram.sendMessage(ctx.chat.id, '...', {
      reply_markup: { remove_keyboard: true },
    })

    ctx.deleteMessage(message.message_id)
  }

  async safeAnswerCallback (ctx: Context, text?: string) {
    try {
      if (ctx.callbackQuery) {
        return await ctx.answerCbQuery(text)
      }
    } catch (error) {
      // Игнорируем ошибки timeout для answerCbQuery
      if (!error.message?.includes('query is too old')) {
        console.log('safeAnswerCallback_13 AnswerCbQuery error:', error)
      }
    }
  }

  generateInlineKeyboard (options: [string, string][][]){
    return Markup.inlineKeyboard(
      options.map(row =>
        row.map(([label, action]) =>
          Markup.button.callback(label, action)
        )
      )
    )
  }

  generateReplyKeyboard (options: string[][]){
    return Markup.keyboard(options)
      .resize()   // подгоняет под экран
      // .oneTime()  // спрячется после выбора
  }

  async sendMessage({ chatId, text, parseMode = 'HTML' }) {
    const url = `${this.baseUrl}/sendMessage`

    try {
      const response = await axios.post(url, { 'chat_id': chatId, text, parse_mode: parseMode, })
      return response.data?.result?.message_id
    } catch (error) {
      console.error('tgbotlib_sendMessage_13 Error sending message:', error)
      // throw error
    }
  }

  // Метод для отправки сообщения по chatId
  async sendMessageV2 ({ ctx, chatId, message = 'undefined message', extra = {} }: { ctx?: any, chatId?: string, message?: string, extra: any }): Promise<void> {
    if (ctx) {
      await this.reply(ctx, message, extra)
    } else if (chatId) {
      await this.bot.telegram.sendMessage(chatId, message, extra)
    } else {
      throw new Error('Either ctx or chatId must be provided')
    }
  }

  async sendMediaGroup (chatId, media) {
    return await this.bot.telegram.sendMediaGroup(chatId, media)
  }

  async removeMessage({ chatId, messageId }) {
    const url = `${this.baseUrl}/deleteMessage`

    try {
      const response = await axios.post(url, { 'chat_id': chatId, message_id: messageId })
      return response.data
    } catch (error) {
      console.error('tgbotlib_removeMessage_13 Error removing message:', error.message)
      // throw error;
    }
  }

  async sendKeyboard({ chatId, keyboard,  text = '⤵' }) {
    const url = `${this.baseUrl}/sendMessage`

    try {
      const response = await axios.post(url, { 'chat_id': chatId, text, ...keyboard })
      return response.data.result.message_id
    } catch (error) {
      console.error('tgbotlib_sendKeyboard_13 Error sending message:', error)
      // throw error;
    }
  }

  async sendInlineKeyboard({ chatId, text, keyboard }: TSendInlineKeyboardArgs): Promise<void> {
    const url = `${this.baseUrl}/sendMessage`

    try {
      await axios.post(url, { chat_id: chatId, text,  ...keyboard })
    } catch (error) {
      console.log('tgbotlib_sendInlineKeyboard_13 Error sending message:', error)
      throw error
    }
  }

  async editMessage({ chatId, messageId, text, parseMode = 'HTML' }) {
    const url = `${this.baseUrl}/editMessageText`

    try {
      const response = await axios.post(url, {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: parseMode,
      })
      return response.data
    } catch (error: any) {
      console.error('Error editing message:', error.message)
    }
  }

  async sendPhoto({ chatId, photo, caption, inlineKeyboard }: {
    chatId: string
    photo: string | Buffer // URL, file_id или Buffer с изображением
    caption?: string
    inlineKeyboard?: {
      inline_keyboard: Array<Array<{
        text: string;
        callback_data?: string;
        url?: string;
      }>>;
    }
  }) {
    const url = `${this.baseUrl}/sendPhoto`

    const formData = new FormData()
    formData.append('chat_id', chatId.toString())

    if (typeof photo === 'string') {
      // Это может быть URL или file_id
      formData.append('photo', photo)
    } else {
      // Если вы передаёте файл как Buffer (например, из загрузки)
      formData.append('photo', photo, 'image.jpg') // можно указать имя
    }

    if (caption) {
      formData.append('caption', caption)
    }

    if (inlineKeyboard) {
      formData.append('reply_markup', JSON.stringify(inlineKeyboard))
    }

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          // 'Content-Type': 'multipart/form-data',
          // axios и formData сами установят правильный Content-Type с boundary
        },
      })

      return response.data
    } catch (error) {
      console.log('TgBotLibService_sendPhoto_91 Error sending photo:', error.message)
      throw error
    }
  }

  getImageFileIdFromMessage ({ message, preferedSizeInBytes = 1_000_000 }): string | undefined {
    if (!message.photo || message.photo.length === 0) {
      return
    }

    let [closestPhoto] = message.photo
    let minDifference = Infinity

    for (const photo of message.photo) {
      const pixels = photo.width * photo.height
      const difference = Math.abs(pixels - preferedSizeInBytes) // nearest to megapixel

      if (difference < minDifference) {
        minDifference = difference
        closestPhoto = photo
      }
    }

    const fileId = closestPhoto?.file_id

    return fileId
  }

  async importImageBufferByFileId ({ fileId }: { fileId: string }): Promise<Buffer> {
    const fileLink = await this.bot.telegram.getFileLink(fileId)

    // Качаем  с Telegram
    const tgRes = await axios.get(fileLink.href, { responseType: 'arraybuffer' })

    return Buffer.from(tgRes.data)
  }

  async importFileBufferByFileId ({ fileId }: { fileId: string }): Promise<Buffer> {
    const fileLink = await this.bot.telegram.getFileLink(fileId)

    // Качаем  с Telegram
    const tgRes = await axios.get(fileLink.href, { responseType: 'arraybuffer' })

    return Buffer.from(tgRes.data)
  }
}
