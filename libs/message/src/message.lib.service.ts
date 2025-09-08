import * as fs from 'fs'

import { Injectable } from '@nestjs/common'

import Handlebars from 'handlebars'

@Injectable()
export class MessageLibService {
  generateMessage({ type, data }: { type: string, data: any }) {
    const templatePath = `${__dirname}/template/${type}.hbs`

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const template = Handlebars.compile(templateContent)

    return template(data)
  }

}
