import { Injectable } from '@nestjs/common'

import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import * as lib from '@lib'

import { OwnInstanceContext } from './types'

import {
  ownInstanceSearchParamsMenu,
  ownInstanceManageMenu,
  ownInstanceCreateMenu,
  workflowRunMenu,
} from '@kb'

@Injectable()
export class CommonOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly tgbotlib: lib.TgBotLibService,
  ) {
    this.bot.action('act:own-instance', (ctx) => this.showInstanceSearchParamsMenu(ctx))
    this.bot.action(/^act:own-instance(.*)$/, (ctx, next) => this.initSessionOwnInstance(ctx, next))
    this.bot.command('start', (ctx, next) => this.handleCommandOwnInstance(ctx, next))
    this.bot.command('menu', (ctx, next) => this.handleCommandOwnInstance(ctx, next))
  }

  private handleCommandOwnInstance(ctx: OwnInstanceContext, next: () => Promise<void>) {
    if (ctx.session.way !== 'own-instance') {
      return next()
    }

    const step = ctx.session.step

    if (step === 'start') {
      this.showInstanceSearchParamsMenu(ctx)
    } else if (['loading', 'running'].includes(step)) {
      this.showInstanceManageMenu(ctx)
    } else {
      this.showInstanceSearchParamsMenu(ctx)
    }
  }

  private async initSessionOwnInstance(ctx: OwnInstanceContext, next: () => Promise<void>) {
    ctx.session.way = 'own-instance'

    ctx.session.gpu ??= 'any'
    ctx.session.geolocation ??= 'any'
    ctx.session.inDataCenterOnly ??= 'false'
    ctx.session.workflowParams ??= {}

    return await next()
  }

  showInstanceSearchParamsMenu(ctx: OwnInstanceContext, extraMessage?: string) {
    const message = extraMessage ? `${extraMessage}\nSearch parameters:`: 'Search parameters:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceSearchParamsMenu(ctx.session))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceCreateMenu(ctx: OwnInstanceContext) {
    const offerId = ctx.session.offerId

    const message = 'Now you can create your own instance ⤵️'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceCreateMenu(offerId))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showInstanceManageMenu(ctx: OwnInstanceContext, extraMessage?: string) {
    const message = extraMessage ? `${extraMessage}\nManage instance:`: 'Manage instance:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(ownInstanceManageMenu(ctx.session.step))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }

  showWorkflowRunMenu(ctx: OwnInstanceContext) {
    const message = `Workflow ${ctx.session.workflowId}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(workflowRunMenu({
      workflowParams: ctx.session.workflowParams,
      prefixAction: `act:own-instance`,
      backAction: 'act:own-instance:workflow'
    }))

    this.tgbotlib.safeAnswerCallback(ctx)
    this.tgbotlib.reply(ctx, message, keyboard)
  }
}