import { Injectable } from '@nestjs/common'
import { Telegraf } from 'telegraf'
import { InjectBot } from 'nestjs-telegraf'

import { VastService } from '@libs/vast'

import { AppBaseTgBotService } from '../app-base-tg-bot.service'

import { Step } from '../step.decorator'

import { TelegramContext } from '../types'

@Injectable()
export class SelectWorkflowTgBot {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegramContext>,
    private readonly tgbotsrv: AppBaseTgBotService,
  ) {
    this.bot.action('action:workflow:select', (ctx) => this.handleSelectWorkflow(ctx))

    this.bot.action('action:workflow:select:back', (ctx) => {
      this.tgbotsrv.safeAnswerCallback(ctx)
      this.tgbotsrv.showInstanceMenu(ctx)
    })

    // Обработка выбора инстанса
    this.bot.action(/^action:workflow:select:(.+)$/, (ctx) => {
      const workflowId = ctx.match[1] // извлекаем часть после подчеркивания

      console.log('\x1b[36m', 'workflowId', workflowId, '\x1b[0m');

      ctx.session.workflowId = workflowId

      this.tgbotsrv.safeAnswerCallback(ctx)
      ctx.reply('workflow start loading... ' + workflowId)
      // tgbotsrv.showSearchParamsMenu(ctx)
      // todo start load workflow and models
    })
  }

  @Step('running')
  private async handleSelectWorkflow(ctx: TelegramContext) {
    ctx.editMessageText(
      'Выберите рабочий процесс:',
      this.tgbotsrv.generateInlineKeyboard([
        [[`WF_1`, 'action:workflow:select:1']],
        [[`WF_2`, 'action:workflow:select:2']],
        [[`WF_3`, 'action:workflow:select:3']],
        [[`Back to instance menu`, 'action:workflow:select:back']],
      ]),
    )
  }
}
