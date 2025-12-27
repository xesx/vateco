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
    private readonly msglib: lib.MessageLibService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,
  ) {}

  async showMainMenu ({ ctx, chatId }: { ctx?: any; chatId?: string }) {
    const message = 'Main menu:'
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.MAIN_MENU)

    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: keyboard })
  }

  async showWfvReplyMenu (ctx) {
    const replyKeyboard = this.tgbotlib.generateReplyKeyboard(kb.WORKFLOW_VARIANT_REPLY)
    await ctx.sendMessage('Use for fast work ⤵', replyKeyboard)
  }

  async showWfvList ({ ctx, chatId, tags, prefixAction, backAction }: { ctx?: any; chatId?: string; tags: string[]; prefixAction: string; backAction: string }) {
    const workflows = await this.wfrepo.findWorkflowVariantsBySomeTags(tags)

    const message = '*Select workflow variant*'
    const keyboardSchema = kb.workflowsMenu({ workflows, prefixAction, backAction })
    const keyboard = this.tgbotlib.generateInlineKeyboard(keyboardSchema)

    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: keyboard })
  }

  async showWfvRunMenu ({ ctx, chatId, userId, workflowVariantId, prefixAction = '', backAction }: { ctx?: any; chatId?: string; userId: number; workflowVariantId: number; prefixAction?: string; backAction: string }) {
    const workflowVariant = await this.wfrepo.getWorkflowVariant(workflowVariantId)
    const wfvParams = await this.wfrepo.getWorkflowMergedWorkflowVariantParams({ userId, workflowVariantId })

    const message = `Workflow ${workflowVariant.name}`
    const keyboard = this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({
      wfvParams,
      workflowVariantId,
      prefixAction,
      backAction,
    }))

    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: keyboard })
    await this.tgbotlib.safeAnswerCallback(ctx)
  }

  async showWfvEnumMenu ({ ctx, chatId, message, enumArr, prefixAction, backAction, extraActions, useIndexAsValue = true }
  : {
    ctx?: any;
    chatId?: string;
    message: string;
    enumArr: any[];
    prefixAction: string;
    backAction?: string;
    extraActions?: [string, string][];
    useIndexAsValue?: boolean;
  }) {
    const maxLineLength = 28
    const enumOptions: [string, string][][] = []
    let currentRow: any[] = []
    let currentLength = 0
    let currentItemsInRow = 0

    prefixAction = prefixAction.endsWith(':') ? prefixAction : `${prefixAction}:`

    enumArr
      .map((value: any) => typeof value === 'object' ? value : { value, label: value })
      .forEach(({ value, label }, i) => {
        const button = [label, `${prefixAction}${useIndexAsValue ? i : value}`]
        const buttonLength = label.length + 2 // запас на формат Telegram

        // Если не помещается — перенос
        if (currentLength + buttonLength > maxLineLength || currentItemsInRow >= 8) {
          enumOptions.push(currentRow)
          currentRow = []
          currentLength = 0
          currentItemsInRow = 0
        }

        currentRow.push(button)
        currentLength += buttonLength
        currentItemsInRow += 1
      })

    enumOptions.push(currentRow)
    currentRow = []
    currentLength = 0

    if (extraActions) {
      extraActions.forEach(action => {
        enumOptions.push([action])
      })
    }

    if (backAction) {
      enumOptions.push([['Back', backAction]])
    }

    const keyboard = this.tgbotlib.generateInlineKeyboard(enumOptions)
    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'HTML', ...keyboard } })
  }

  async showSuggestInputWfvParamValue ({ ctx, chatId, paramName, label, wfvParamId, currentValue, workflowVariantId }: { ctx?: any; chatId?: string; paramName: string; label?: string | null, wfvParamId: number | number, currentValue: any; workflowVariantId: number }) {
    await this.tgbotlib.safeAnswerCallback(ctx)

    const currentValueAsCode = this.msglib.genCodeMessage(String(currentValue))
    const message = `Current value: ${currentValueAsCode}\nSend new value for parameter <b>"${label ?? paramName}"</b> (${paramName}):`

    const rawKeyboardOptions: [string, string][][] = [[['Back', `wfv:${workflowVariantId}`]]]

    // todo
    if (paramName.startsWith('LoadImage:image') && currentValue?.length > 13) {
      rawKeyboardOptions[0].push(['Show Image', `wfvp:${wfvParamId}:show`])
    }

    const keyboard = this.tgbotlib.generateInlineKeyboard(rawKeyboardOptions)
    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'HTML', ...keyboard } })
  }

  async showCurrentPositivePrompt ({ ctx, chatId, userId, workflowVariantId }: { ctx?: any; chatId?: string; userId: number; workflowVariantId: number }) {

    if (!workflowVariantId) {
      throw new Error('Workflow variant ID not set in session')
    }

    const positivePromptParam = await this.wfrepo.getWorkflowVariantParamByLabel({ workflowVariantId, label: 'prompt' })
    const positivePromptUserParam = await this.wfrepo.findWorkflowVariantUserParam({ userId, workflowVariantId, paramName: positivePromptParam.paramName })

    if (positivePromptUserParam) {
      const message = this.msglib.genMessageForCopy(positivePromptUserParam.value as string)
      return await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'HTML' } })
    }

    if (positivePromptParam) {
      const message = this.msglib.genMessageForCopy(positivePromptParam.value as string)
      return await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'HTML' } })
    }

    const message = this.msglib.genMessageForCopy('N/A')
    await this.tgbotlib.sendMessageV2({ ctx, chatId, message, extra: { parse_mode: 'HTML' } })
  }

  async showModelsList ({ ctx, chatId, comfyUiDirectory, tags, page, prefixAction, backAction }
  : {
    ctx?: any
    chatId?: string
    comfyUiDirectory: string
    tags: string[]
    page?: number // todo
    prefixAction: string
    backAction: string
  }) {
    let models

    if (tags.length === 0) {
      models = await this.modelrepo.findModelsByComfyUiDir({ comfyUiDirectory })
    } else {
      models = await this.modelrepo.findModels({ comfyUiDirectory, tags })
    }

    if (models.length === 0) {
      throw new Error('No models found with selected tags')
    }

    const enumArr = models
      .map(model => ({
        label: model.label || model.name,
        value: model.id,
      }))

    await this.showWfvEnumMenu({
      ctx,
      chatId,
      message: `Select model:`,
      enumArr,
      prefixAction,
      backAction,
      useIndexAsValue: false,
    })
  }
}
