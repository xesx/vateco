import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

@Injectable()
export class TextEditSynthService {
  private readonly l = new Logger(TextEditSynthService.name)

  constructor (
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,

    private readonly texteditrepo: repo.UserTextEditsRepository,
  ) {}

  formatTextForEdit (text: string) {
    return text
      .replaceAll('\n', ',')
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .join(',')
  }

  async genTextEditShowMessage (userTextEditId: number) {
    const userTextEdit = await this.texteditrepo.findById({ id: Number(userTextEditId) })
    const { text } = userTextEdit

    const textTags = text.split(',')

    const keyboard = this.tgbotlib.generateDefaultKeyboardMenu({
      enumArr: textTags.map(tag => ({ label: tag, value: tag })),
      prefixAction: `txt:edit:${userTextEditId}:`,
      extraActions: [
        ['🔧Use it', 'txt-use:wfv-list'],
        ['🗑️Delete', 'message:delete'],
      ],
      useIndexAsValue: true,
    })

    const message = this.msglib.genMessageForCopy(text)

    return { keyboard, message }
  }
}
