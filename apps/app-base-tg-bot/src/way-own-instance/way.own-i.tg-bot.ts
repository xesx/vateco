import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

import { OwnInstanceContext } from './types'
import { ViewOwnITgBot } from './view.own-i.tg-bot'
import { HandleOwnITgBot } from './handle.own-i.tg-bot'


export class WayOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly view: ViewOwnITgBot,
    private readonly handle: HandleOwnITgBot,
  ) {
    this.bot.action(/^act:own-i(.*)$/, (ctx, next) => this.initSession(ctx, next))

    this.bot.command('start', (ctx, next) => this.handle.commandStart(ctx, next))

    this.bot.on(message('text'), (ctx, next) => this.handle.textMessage(ctx, next))
    this.bot.on(message('photo'), (ctx, next) => this.handle.photo(ctx, next))

    this.bot.action('act:own-i:offer', (ctx) => this.handle.actionOffer(ctx))
    this.bot.action(/act:own-i:offer:params:(.+)$/, (ctx) => this.handle.actionSetSearchOfferParams(ctx))
    this.bot.action('act:own-i:offer:search', (ctx) => this.handle.actionSearchOffers(ctx))
    this.bot.action(/act:own-i:offer:select:(.+)$/, (ctx) => this.handle.actionOfferSelect(ctx))

    this.bot.action('act:own-i:instance:create', (ctx) => this.handle.actionInstanceCreate(ctx))
    this.bot.action('act:own-i:instance:manage', (ctx) => this.view.showInstanceManageMenu(ctx))
    this.bot.action('act:own-i:instance:status', (ctx) => this.handle.actionInstanceStatus(ctx))
    this.bot.action('act:own-i:instance:destroy', (ctx) => this.handle.actionInstanceDestroy(ctx))

    this.bot.action('act:own-i:use-img-as-input', (ctx) => this.handle.actionUseImageAsInput(ctx))

    this.bot.action('act:own-i:wf:variants', (ctx) => this.view.showWorkflowVariants(ctx))
    this.bot.action(/act:own-i:wf:([^:]+)$/, (ctx) => this.handle.actionWorkflowSelect(ctx))
    this.bot.action(/act:own-i:wf:([^:]+):param:(.+)$/, (ctx) => this.handle.actionWorkflowParamSelect(ctx))
    this.bot.action(/act:own-i:wf:([^:]+):run$/, (ctx) => this.handle.actionWorkflowRun(ctx))
  }

  private async initSession (ctx: OwnInstanceContext, next: () => Promise<void>) {
    ctx.session.way = 'own-instance'

    ctx.session.gpu ??= 'any'
    ctx.session.geolocation ??= 'any'
    ctx.session.inDataCenterOnly ??= 'false'
    ctx.session.workflowParams ??= {}

    return await next()
  }
}