import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'

import { CommonOwnITgBot } from './common.own-i.tg-bot'
import { OwnInstanceContext, OwnInstanceMatchContext } from './types'

import {
  OWN_INSTANCE_GPU_MENU,
  OWN_INSTANCE_GEOLOCATION_MENU,
  OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU,
} from '@kb'

const menuMap = {
  'gpu': OWN_INSTANCE_GPU_MENU,
  'geolocation': OWN_INSTANCE_GEOLOCATION_MENU,
  'inDataCenterOnly': OWN_INSTANCE_IN_DATA_CENTER_ONLY_MENU,
}

@Injectable()
export class Act01SetSearchParamsOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly common: CommonOwnITgBot,
    private readonly tgbotlib: lib.TgBotLibService,
  ) {
    this.bot.action(/act:own-i:search-params:(.+)$/, (ctx) => this.handleActOwnInstanceSearchParamsMatch(ctx))
  }

  private handleActOwnInstanceSearchParamsMatch(ctx: OwnInstanceMatchContext) {
    const [name, value] = ctx.match[1].split(':')

    if (value) {
      ctx.session[name] = value
      this.common.showInstanceSearchParamsMenu(ctx)
    } else {
      ctx.editMessageText(`Select "${name}":`, this.tgbotlib.generateInlineKeyboard(menuMap[name]))
      this.tgbotlib.safeAnswerCallback(ctx)
    }
  }
}