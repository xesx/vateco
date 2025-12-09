import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'

import { TAppBaseTgBotContext } from '../types'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

@Injectable()
export class BaseCommandTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TAppBaseTgBotContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,

    private readonly wfsynth: synth.WorkflowSynthService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,
    private readonly tagrepo: repo.TagRepository,
    private readonly userrepo: repo.UserRepository,
  ) {

    // this.bot.action('act:main-menu', (ctx) => this.tgbotsrv.actionMainMenu(ctx))

    this.bot.hears(/^https:\/\/huggingface\.co\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByHuggingfaceLink(ctx, next))
    this.bot.hears(/^https:\/\/civitai\.com\/models\/\S+/i, (ctx, next) => this.tgbotsrv.createModelByCivitaiLink(ctx, next))

    this.bot.on(message('document'), (ctx, next) => this.tgbotsrv.createWorkflowTemplateByFile(ctx, next)) // _wft_create

    this.bot.hears(/^_wfv_create/, (ctx) => this.tgbotsrv.createWorkflowVariant(ctx))
    this.bot.hears(/^_wfv_delete/, (ctx) => this.tgbotsrv.deleteWorkflowVariant(ctx))

    // for test
    this.bot.hears(/^_wfv_test/, (ctx) => this.startWfvTest(ctx))
  }

  async startWfvTest (ctx) {
    const keyboard = this.tgbotlib.generateInlineKeyboard([[['Start Test', 'wfv:list']]])

    await this.tgbotlib.sendMessageV2({ ctx, message: 'press to start', extra: { parse_mode: 'Markdown', ...keyboard } })
  }
}
