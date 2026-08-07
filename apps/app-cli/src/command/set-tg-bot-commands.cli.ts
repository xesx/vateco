import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { Telegraf } from 'telegraf'

import * as lib from '@lib'
import * as synth from '@synth'
import * as repo from '@repo'

import { TAppBaseTgBotContext } from '../../../app-base-tg-bot/src/types'

@Injectable()
export class SetTgBotCommandsCli {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,

    private readonly vastlib: lib.VastLibService,
    private readonly comfyuilib: lib.ComfyUiLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,
    private readonly hflib: lib.HuggingfaceLibService,
    private readonly civitailib: lib.CivitaiLibService,
    private readonly openailib: lib.OpenaiLibService,
    private readonly runpodlib: lib.RunpodLibService,
    private readonly rndimg: lib.RandomImageLibService,

    private readonly modelrepo: repo.ModelRepository,
    private readonly lockrepo: repo.LockRepository,

    private readonly wfsynth: synth.WorkflowSynthService,
    private readonly appcloudsynth: synth.CloudAppSynthService,
  ) {}

  register(program) {
    program
      .command('set-tg-bot-commands')
      .description('Set Telegram bot commands')
      .action(async () => {
        console.log('Setting Telegram bot commands...')

        await this.bot.telegram.deleteMyCommands({
          scope: { type: 'all_private_chats' },
        })

        await this.bot.telegram.setMyCommands(
          [
            { command: 'start', description: 'Show main menu' },
            { command: 'img', description: 'Get random image' },
          ],
          { scope: { type: 'default' } }, // (chat, all_private_chats, конкретный chat_id)
        )

        // что видит именно твой чат
        const chatCmds = await this.bot.telegram.getMyCommands({
          scope: { type: 'chat', chat_id: '185857068' },
        })
        const privateCmds = await this.bot.telegram.getMyCommands({
          scope: { type: 'all_private_chats' },
        })
        const defaultCmds = await this.bot.telegram.getMyCommands()
        console.log({ chatCmds, privateCmds, defaultCmds })
      })
  }
}
