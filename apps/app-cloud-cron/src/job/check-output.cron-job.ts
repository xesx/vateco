import * as fs from 'fs'
import { join } from 'path'

import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

@Injectable()
export class CheckOutputCronJob {
  private readonly l = new Logger(CheckOutputCronJob.name)

  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
  ) {}

  async handle({ OUTPUT_DIR, TG_CHAT_ID }) {
    const { l } = this

    if (!fs.existsSync(OUTPUT_DIR)) {
      l.log(`handleCheckOutputJob_17 Output directory does not exist: ${OUTPUT_DIR}`)
      return
    }

    const images = fs.readdirSync(OUTPUT_DIR)
      .filter(file => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file))

    for (const image of images) {
      const imagePath = join(OUTPUT_DIR, image)
      const stats = fs.statSync(imagePath)
      const fileSizeInBytes = stats.size

      l.log(`handleCheckOutputJob_30 Found image: ${image}, size: ${fileSizeInBytes} bytes`)

      if (fileSizeInBytes === 0) {
        fs.unlinkSync(imagePath)
        l.warn(`handleCheckOutputJob_37 Deleted zero-size image: ${image}`)
        continue
      }

      const buffer = fs.readFileSync(imagePath)

      // const maxSize = 5 * 1024 * 1024 // 5MB
      // if (buffer.length > maxSize) {
      //   log.log(`handleCheckOutputJob_131 Image ${image} is too large (${buffer.length} bytes), skipping upload.`)
      //   continue
      // }

      l.log(`handleCheckOutputJob_45 Sending image ${image} to Telegram chat ${TG_CHAT_ID}`)
      await this.tgbotlib.sendPhoto({ chatId: TG_CHAT_ID, photo: buffer })

      fs.unlinkSync(imagePath)
      l.log(`handleCheckOutputJob_99 Deleted image after reading: ${image}`)
    }

    const replyKeyboard = this.tgbotlib.generateReplyOneTimeKeyboard ([['🚀 Generate']])
    await this.tgbotlib.sendReplyOneTimeKeyboard({
      chatId: TG_CHAT_ID,
      keyboard: replyKeyboard,
      text: 'Generation completed! What would you like more? ⤵',
    })
  }
}