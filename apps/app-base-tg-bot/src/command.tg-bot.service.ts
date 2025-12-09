import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

// import * as lib from '@lib'
// import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from './types'

@Injectable()
export class CommandTgBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    // private readonly tgbotlib: lib.TgBotLibService,
    // private readonly wflib: lib.WorkflowLibService,
    // private readonly msglib: lib.MessageLibService,

    private readonly wfsynth: synth.WorkflowSynthService,

    // private readonly wfrepo: repo.WorkflowRepository,
    // private readonly modelrepo: repo.ModelRepository,
    // private readonly tagrepo: repo.TagRepository,
    // private readonly userrepo: repo.UserRepository,
  ) {
    this.bot.command('start', (ctx) => this.commandStart(ctx))
  }

  async commandStart (ctx) {
    const step = ctx.session.step || 'start'

    if (step === 'start') {
      await this.wfsynth.view.showMainMenu({ ctx })
    } else if (['loading', 'running'].includes(step)) {
      await this.wfsynth.view.showInstanceManageMenu({ ctx })
    }
  }
}
