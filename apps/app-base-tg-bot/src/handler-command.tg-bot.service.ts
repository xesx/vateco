import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'
// import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class HandlerCommandTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly rndimg: lib.RandomImageLibService,
    // private readonly wflib: lib.WorkflowLibService,
    // private readonly msglib: lib.MessageLibService,

    private readonly instancesynth: synth.InstanceSynthService,
    private readonly wfsynth: synth.WorkflowSynthService,

    // private readonly wfrepo: repo.WorkflowRepository,
    // private readonly modelrepo: repo.ModelRepository,
    // private readonly tagrepo: repo.TagRepository,
    // private readonly userrepo: repo.UserRepository,
  ) {
    this.bot.command('start', (ctx) => this.commandStart(ctx))
    this.bot.command('img', (ctx) => this.commandImg(ctx))
  }

  async commandStart (ctx) {
    if (ctx.session.instance) {
      await this.instancesynth.view.showInstanceManageMenu({ ctx })
    } else {
      await this.wfsynth.view.showMainMenu({ ctx })
    }
  }

  async commandImg (ctx) {
    const res = await this.rndimg.getRandomImage()

    const keyboard = this.tgbotlib.generateInlineKeyboard([[
      [`Use it`, 'img-use:wfv-list'],
      ['Delete', 'message:delete']
    ]])

    await this.tgbotlib.sendPhotoV2({ ctx, photo: res.content, extra: keyboard })
  }
}
