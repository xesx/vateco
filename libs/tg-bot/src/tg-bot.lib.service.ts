import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import * as FormData from 'form-data'
import axios from 'axios'

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

  async sendMessage({ chatId, text }: { chatId: number; text: string }) {
    const url = `${this.baseUrl}/sendMessage`

    try {
      const response = await axios.post(url, { chat_id: chatId, text })
      return response.data
    } catch (error) {
      console.error('Error sending message:', error.message)
      // throw error;
    }
  }

  async sendPhoto({ chatId, photo, caption }: {
    chatId: number;
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
