import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'
import { message } from 'telegraf/filters'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext } from './types'

import { ViewOwnITgBot } from './view.own-i.tg-bot'
import { CommonHandlerOwnITgBot } from './common-handler.own-i.tg-bot'
import { ActionOwnITgBot } from './action.own-i.tg-bot'
import { TextMessageHandlerOwnITgBot } from './text-message-handler.own-i.tg-bot'


export class WayOwnITgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<OwnInstanceContext>,
    private readonly view: ViewOwnITgBot,
    private readonly act: ActionOwnITgBot,
    private readonly text: TextMessageHandlerOwnITgBot,
    private readonly common: CommonHandlerOwnITgBot,

    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wfrepo: repo.WorkflowRepository,
  ) {
    this.bot.action(/^act:own-i(.*)$/, (ctx, next) => this.initSession(ctx, next))

    this.bot.command('start', (ctx, next) => this.commandStart(ctx, next))

    // this.bot.on(message('voice'), (ctx) => {
    //   ctx.reply('Голосовое сообщение получено! 🎙')
    // })

    this.bot.hears('🎛 Params', (ctx) => this.text.textParams(ctx))
    this.bot.hears('📝 Show prompt', (ctx) => this.text.textShowPrompt(ctx))
    this.bot.hears('🚀 Generate', (ctx) => this.text.textGenerate(ctx))
    this.bot.on(message('text'), (ctx, next) => this.text.textAnyOther(ctx, next))

    this.bot.on(message('photo'), (ctx, next) => this.photo(ctx, next))

    this.bot.action('act:own-i:offer', (ctx) => this.act.actionOffer(ctx))
    this.bot.action(/act:own-i:offer:params:(.+)$/, (ctx) => this.act.actionSetSearchOfferParams(ctx))
    this.bot.action('act:own-i:offer:search', (ctx) => this.act.actionSearchOffers(ctx))
    this.bot.action(/act:own-i:offer:select:(.+)$/, (ctx) => this.act.actionOfferSelect(ctx))

    this.bot.action('act:own-i:instance:create', (ctx) => this.act.actionInstanceCreate(ctx))
    this.bot.action('act:own-i:instance:manage', (ctx) => this.act.actionInstanceManage(ctx))
    this.bot.action('act:own-i:instance:status', (ctx) => this.act.actionInstanceStatus(ctx))
    this.bot.action('act:own-i:instance:destroy', (ctx) => this.act.actionInstanceDestroy(ctx))

    this.bot.action('act:own-i:wfv:list', (ctx) => this.act.actionWfvList(ctx))
    this.bot.action(/act:own-i:wfv:([0-9]+)$/, (ctx) => this.act.actionWfvSelect(ctx))
    this.bot.action(/act:own-i:wfv:run$/, (ctx) => this.act.actionWfvRun(ctx))

    this.bot.action(/act:own-i:wfvp:([0-9]+)$/, (ctx) => this.act.actionWfvParamSelect(ctx))
    this.bot.action(/act:own-i:wfvp:([0-9]+):set:(.+)$/, (ctx) => this.act.actionWfvParamSet(ctx))

    this.bot.action('act:own-i:use-img-as-input', (ctx) => this.act.actionUseImageAsInput(ctx))
  }

  private async initSession (ctx: OwnInstanceContext, next: () => Promise<void>) {
    console.log('\x1b[36m', 'ctx', ctx, '\x1b[0m')
    ctx.session.way = 'own-instance'
    ctx.session.offer ??= {}

    ctx.session.offer.gpu ??= 'any'
    ctx.session.offer.geolocation ??= 'any'
    ctx.session.offer.inDataCenterOnly ??= 'false'
    ctx.session.inputWaiting = undefined

    return await next()
  }

  async commandStart (ctx: OwnInstanceContext, next: () => Promise<void>) {
    if (ctx.session.way !== 'own-instance') {
      return next()
    }

    const step = ctx.session.step

    if (step === 'start') {
      await this.view.showOfferParamsMenu(ctx)
    } else if (['loading', 'running'].includes(step)) {
      if (ctx.session.workflowVariantId) {
        await this.view.showWfvRunMenu(ctx)
      } else {
        await this.view.showInstanceManageMenu(ctx)
      }
    } else {
      await this.view.showOfferParamsMenu(ctx)
    }
  }

  async photo (ctx, next) {
    const { way, userId, workflowVariantId } = ctx.session
    let paramName = ctx.session.inputWaiting

    if (way !== 'own-instance') {
      return next()
    }

    if (!paramName) {
      const imageWorkflowVariantParams = await this.wfrepo.findWorkflowVariantParamsByNameStartsWith({
        workflowVariantId,
        startsWith: 'image',
      })

      paramName = imageWorkflowVariantParams[0]?.paramName
    }

    if (paramName) {
      const fileId = this.tgbotlib.getImageFileIdFromMessage({ message: ctx.message })
      console.log('HandleOwnITgBot_photo_23 fileId', fileId)

      if (fileId) {
        // TODO more than one image param?
        await this.wfrepo.setWorkflowVariantUserParam({
          userId,
          workflowVariantId,
          paramName,
          value: fileId,
        })
      }

      delete ctx.session.inputWaiting
    }

    await this.tgbotlib.safeAnswerCallback(ctx)
  }
}