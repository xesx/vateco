import * as fs from 'fs'
import { setTimeout } from 'timers/promises'
import { join } from 'path'

import * as sharp from 'sharp'
import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

@Injectable()
export class CheckOutputCronJob {
  private readonly l = new Logger(CheckOutputCronJob.name)

  constructor(
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,
  ) {}

  async handle({ OUTPUT_DIR, TG_CHAT_ID }) {
    const { l } = this

    if (!fs.existsSync(OUTPUT_DIR)) {
      l.log(`CheckOutputCronJob_handleCheckOutputJob_17 Output directory does not exist: ${OUTPUT_DIR}`)
      return
    }

    const archivePath = join(OUTPUT_DIR, 'archive')
    if (!fs.existsSync(archivePath)) {
      fs.mkdirSync(archivePath)
      l.log(`CheckOutputCronJob_handleCheckOutputJob_24 Created archive directory: ${archivePath}`)
    }

    const images = fs.readdirSync(OUTPUT_DIR)
      .filter(file => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file))

    const txts = fs.readdirSync(OUTPUT_DIR)
      .filter(file => /\.txt$/i.test(file))

    if (images.length === 0 && txts.length === 0) {
      return
    }

    for (const txt of txts) {
      const txtPath = join(OUTPUT_DIR, 'txt', txt)

      const isStable = await this.waitForFileStable(txtPath, 500, 10)

      if (!isStable) {
        l.log(`CheckOutputCronJob_handleCheckOutputJob_29 File is not stable, skipping: ${txt}`)
        continue
      }

      const stats = fs.statSync(txtPath)
      const fileSizeInBytes = stats.size

      l.log(`CheckOutputCronJob_handleCheckOutputJob_30 Found text file: ${txt}, size: ${fileSizeInBytes} bytes`)

      if (fileSizeInBytes === 0) {
        fs.unlinkSync(txtPath)
        l.warn(`CheckOutputCronJob_handleCheckOutputJob_37 Deleted zero-size text file: ${txt}`)
        continue
      }

      const buffer = fs.readFileSync(txtPath)
      l.log(`CheckOutputCronJob_handleCheckOutputJob_45 Sending text file ${txt} to Telegram chat ${TG_CHAT_ID}`)

      try {
        const keyboard = this.tgbotlib.generateInlineKeyboard([[
          ['Use it', 'text:use-as-input'],
          ['Delete', 'message:delete']
        ]])

        const message = this.msglib.genCodeMessage(buffer.toString('utf-8'))
        await this.tgbotlib.sendMessageV2({
          chatId: TG_CHAT_ID,
          message,
          extra: { parse_mode: 'HTML', ...keyboard }
        })
      } catch (error) {
        l.error(`CheckOutputCronJob_handleCheckOutputJob_49 Error sending text file ${txt} to Telegram:`, this.h.herr.parseAxiosError(error))
      }

      const archivedImagePath = join(archivePath, txt)
      fs.renameSync(txtPath, archivedImagePath)
    }

    for (const image of images) {
      const imagePath = join(OUTPUT_DIR, image)

      const isStable = await this.waitForFileStable(imagePath, 500, 10)

      if (!isStable) {
        l.log(`CheckOutputCronJob_handleCheckOutputJob_29 File is not stable, skipping: ${image}`)
        continue
      }

      const stats = fs.statSync(imagePath)
      const fileSizeInBytes = stats.size

      l.log(`CheckOutputCronJob_handleCheckOutputJob_30 Found image: ${image}, size: ${fileSizeInBytes} bytes`)

      if (fileSizeInBytes === 0) {
        fs.unlinkSync(imagePath)
        l.warn(`CheckOutputCronJob_handleCheckOutputJob_37 Deleted zero-size image: ${image}`)
        continue
      }

      // const all = await sharp(imagePath).metadata()
      // console.log('\x1b[36m', 'all', all, '\x1b[0m')
      // console.log('\x1b[36m', 'prompt', all?.comments?.find?.(i => i.keyword === 'prompt')?.text, '\x1b[0m')

      const buffer = fs.readFileSync(imagePath)

      // const maxSize = 5 * 1024 * 1024 // 5MB
      // if (buffer.length > maxSize) {
      //   log.log(`CheckOutputCronJob_handleCheckOutputJob_131 Image ${image} is too large (${buffer.length} bytes), skipping upload.`)
      //   continue
      // }

      l.log(`CheckOutputCronJob_handleCheckOutputJob_45 Sending image ${image} to Telegram chat ${TG_CHAT_ID}`)
      try {
        const keyboard = this.tgbotlib.generateInlineKeyboard([[
          [`Use it`, 'image:use-as-input'],
          ['Delete', 'message:delete']
        ]])

        await this.tgbotlib.sendPhoto({ chatId: TG_CHAT_ID, photo: buffer, inlineKeyboard: keyboard.reply_markup })
      } catch (error) {
        l.error(`CheckOutputCronJob_handleCheckOutputJob_49 Error sending image ${image} to Telegram:`, this.h.herr.parseAxiosError(error))
        continue
      }


      const archivedImagePath = join(archivePath, image)
      fs.renameSync(imagePath, archivedImagePath)

      l.log(`CheckOutputCronJob_handleCheckOutputJob_99 archive image after sending: ${image}`)
    }
  }

  private async waitForFileStable (path, intervalInMs = 500, attemptsNumber = 10) {
    const { l } = this

    let lastSize = -1

    for (let i = 0; i < attemptsNumber; i++) {
      try {
        const { size } = fs.statSync(path)

        if (size === lastSize) {
          l.log(`CheckOutputCronJob_waitForFileStable_50 file is ready ${path}`)
          return true
        }

        lastSize = size
      } catch (error) {
        l.log(`CheckOutputCronJob_waitForFileStable_91 read file error ${path}`, error)
      }

      await setTimeout(intervalInMs)
    }

    l.log(`CheckOutputCronJob_waitForFileStable_90 file not stable ${path}`)
    return false
  }
}