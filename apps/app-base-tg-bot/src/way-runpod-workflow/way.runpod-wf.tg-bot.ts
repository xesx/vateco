import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

import { RunpodWfContext } from './types'
import { ViewRunpodWfTgBot } from './view.runpod-wf.tg-bot'
import { HandleRunpodWfTgBot } from './handle.runpod-wf.tg-bot'


export class WayOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<RunpodWfContext>,
    private readonly view: ViewRunpodWfTgBot,
    private readonly handle: HandleRunpodWfTgBot,
  ) {
    this.bot.command('start', (ctx, next) => this.handle.commandStart(ctx, next))

    this.bot.on(message('text'), (ctx, next) => this.handle.textMessage(ctx, next))

    this.bot.action('act:rp-wf', (ctx) => this.view.showWorkflowMenu(ctx))
    this.bot.action(/^act:rp-wf(.*)$/, (ctx, next) => this.initSession(ctx, next))

    this.bot.action('act:rp-wf:workflow', (ctx) => this.view.showWorkflowMenu(ctx))
    this.bot.action(/^act:rp-wf:workflow:([^:]+)$/, (ctx) => this.handle.actionWorkflowSelect(ctx))
    this.bot.action(/^act:rp-wf:workflow:([^:]+):param:(.+)$/, (ctx) => this.handle.actionWorkflowParamSelect(ctx))
    this.bot.action(/^act:rp-wf:workflow:([^:]+):run$/, (ctx) => this.handle.actionWorkflowRun(ctx))
  }

  private async initSession(ctx: RunpodWfContext, next: () => Promise<void>) {
    ctx.session.way = 'runpod-wf'
    ctx.session.workflowParams ??= {}

    return await next()
  }
}