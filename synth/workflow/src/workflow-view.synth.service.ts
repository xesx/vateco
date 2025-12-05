import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as kb from '@kb'

@Injectable()
export class WorkflowViewSynthService {
  private readonly l = new Logger(WorkflowViewSynthService.name)

  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  async showWfvList ({ ctx, chatId, tags, prefixAction, backAction }: { ctx?: any; chatId?: string; tags: string[]; prefixAction: string; backAction: string }) {
    const workflows = await this.wfrepo.findWorkflowVariantsByTags(tags)

    const message = '*Select workflow variant*'
    const keyboardSchema = kb.workflowsMenu({ workflows, prefixAction, backAction })
    const keyboard = this.tgbotlib.generateInlineKeyboard(keyboardSchema)

    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'Markdown', ...keyboard } })
  }

  async showWfvRunMenu ({ ctx, chatId, userId, workflowVariantId, prefixAction, backAction }: { ctx?: any; chatId?: string; userId: number; workflowVariantId: number; prefixAction: string; backAction: string }) {
    const workflowVariant = await this.wfrepo.getWorkflowVariant(workflowVariantId)
    const wfvParams = await this.wfrepo.getWorkflowMergedWorkflowVariantParams({ userId, workflowVariantId })

    const message = `Workflow ${workflowVariant.name}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      wfvParams,
      prefixAction,
      backAction,
    }))

    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'Markdown', ...keyboard } })
  }
  //
  // async showWfvParamSelect () {
  //
  // }

  async showWfvEnumMenu ({ ctx, chatId, message, enumArr, prefixAction, backAction, useIndexAsValue = true }
  : {
    ctx?: any;
    chatId?: string;
    message: string;
    enumArr: any[];
    prefixAction: string;
    backAction: string;
    useIndexAsValue?: boolean;
  }) {
    const maxLineLength = 30
    const enumOptions: [string, string][][] = []
    let currentRow: any[] = []
    let currentLength = 0

    prefixAction = prefixAction.endsWith(':') ? prefixAction : `${prefixAction}:`

    enumArr
      .map((value: any) => typeof value === 'object' ? value : { value, label: value })
      .forEach(({ value, label }, i) => {
        const button = [label, `${prefixAction}${useIndexAsValue ? i : value}`]
        const buttonLength = value.length + 2 // запас на формат Telegram

        // Если не помещается — перенос
        if (currentLength + buttonLength > maxLineLength) {
          enumOptions.push(currentRow)
          currentRow = []
          currentLength = 0
        }

        currentRow.push(button)
        currentLength += buttonLength
      })

    enumOptions.push(currentRow)
    currentRow = []
    currentLength = 0

    enumOptions.push([['Back', backAction]])

    const keyboard = this.tgbotlib.generateInlineKeyboard(enumOptions)
    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'Markdown', ...keyboard } })
  }
}
