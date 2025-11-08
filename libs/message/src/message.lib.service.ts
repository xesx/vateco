import * as fs from 'fs'

import { Injectable } from '@nestjs/common'

import Handlebars from 'handlebars'
import { packageDirectorySync } from 'pkg-dir'

const rootDir = packageDirectorySync()
const templateDir = `${rootDir}/message-template`

@Injectable()
export class MessageLibService {
  generateMessage({ type, data }: { type: string, data: any }) {
    const templatePath = `${templateDir}/${type}.hbs`

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const template = Handlebars.compile(templateContent)

    return template(data)
  }

  genCodeMessage(message: string) {
    return this.generateMessage({
      type: 'code',
      data: { message },
    })
  }

  genMessageForCopy (message: string) {
    return this.generateMessage({
      type: 'for-copy',
      data: { message },
    })
  }

  genDownloadMessage({ name, totalBytes = 0, transferredBytes= 0, speedInBytes = 0, transferTimeInSec = 0, etaInSec = 0 }) {
    return this.generateMessage({
      type: 'download',
      data: { name, totalBytes, transferredBytes, speedInBytes, transferTimeInSec, etaInSec },
    })
  }

  genProgressMessage ({ message = '', total = 0, done = 0 }) {
    return this.generateMessage({
      type: 'progress',
      data: { message, total, done },
    })
  }

  genMultiProgressMessage (rows: { message?: string, total: number, done: number }[]) {
    return this.generateMessage({
      type: 'progress-multi',
      data: { rows },
    })
  }
}
