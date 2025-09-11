import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as FormData from 'form-data'
import axios from 'axios'

import { Markup } from 'telegraf'
import { Context } from 'telegraf'

@Injectable()
export class TgBotLibService {
  private readonly baseUrl: string

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN')

    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env')
    }

    this.baseUrl = `https://api.telegram.org/bot${token}`
  }

  reply (ctx: Context, message: string, extra?: any) {
    if (ctx.callbackQuery) {
      ctx.editMessageText(message, extra)
    } else {
      ctx.reply(message, extra)
    }
  }

  safeAnswerCallback(ctx: Context, text?: string) {
    try {
      ctx.answerCbQuery(text)
    } catch (error) {
      // Игнорируем ошибки timeout для answerCbQuery
      if (!error.message?.includes('query is too old')) {
        console.error('AnswerCbQuery error:', error)
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

  generateReplyOneTimeKeyboard (options: string[][]){
    return Markup.keyboard(options)
      .resize()   // подгоняет под экран
      .oneTime()  // спрячется после выбора
  }

  async sendMessage({ chatId, text, parseMode = 'HTML' }) {
    const url = `${this.baseUrl}/sendMessage`

    try {
      const response = await axios.post(url, { 'chat_id': chatId, text, parse_mode: parseMode, })
      return response.data?.result?.message_id
    } catch (error) {
      console.error('tgbotlib_sendMessage_13 Error sending message:', error.message)
      // throw error
    }
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

  async sendReplyOneTimeKeyboard({ chatId, keyboard,  text = '⤵' }) {
    const url = `${this.baseUrl}/sendMessage`

    try {
      const response = await axios.post(url, { 'chat_id': chatId, text, ...keyboard })
      return response.data.result.message_id
    } catch (error) {
      console.error('tgbotlib_sendReplyOneTimeKeyboard_13 Error sending message:', error)
      // throw error;
    }
  }

  async sendInlineKeyboard({ chatId, text, keyboard }) {
    const url = `${this.baseUrl}/sendMessage`

    try {
      const response = await axios.post(url, { chat_id: chatId, text,  ...keyboard })
      return response.data.result.message_id
    } catch (error) {
      console.error('tgbotlib_sendInlineKeyboard_13 Error sending message:', error.message)
      // throw error;
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

  async sendPhoto({ chatId, photo, caption }: {
    chatId: string;
    photo: string | Buffer; // URL, file_id или Buffer с изображением
    caption?: string;
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

    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // axios и formData сами установят правильный Content-Type с boundary
        },
      })

      return response.data
    } catch (error) {
      console.error('Error sending photo:', error.response?.data || error.message)
      throw error
    }
  }
}
