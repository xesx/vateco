import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as kb from '@kb'

import { WorkflowCompilerSynthService } from './workflow-compiler.synth.service'
import { WorkflowCookSynthService } from './workflow-cook.synth.service'
import { WorkflowViewSynthService } from './workflow-view.synth.service'
import { WorkflowParamSynthService } from './workflow-param.synth.service'

import * as cookNodeMap from './cook-node-map.json'

@Injectable()
export class WorkflowSynthService {
  private readonly l = new Logger(WorkflowSynthService.name)
  readonly cookNodeMap = cookNodeMap

  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly tgbotlib: lib.TgBotLibService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly compiler: WorkflowCompilerSynthService,
    private readonly cook: WorkflowCookSynthService,
    readonly view: WorkflowViewSynthService,
    readonly param: WorkflowParamSynthService,
  ) {}

  async compileEnum (name: string) {
    name = name.replace('$.', '')
    const [enumFuncName, ...args] = name.split(':')

    if (typeof this.compiler[enumFuncName] !== 'function') {
      throw new Error(`WorkflowSynthService_compileEnum_39 Enum function not found: ${enumFuncName}, ${name}`)
    }

    return await this.compiler[enumFuncName](...args)
  }

  async cookAndCreateWorkflowTemplate ({ rawWorkflow, name, description }: { rawWorkflow: any, name: string, description?: string }) {
    const { l } = this

    const cookedWorkflow = this.cookWorkflowTemplate(rawWorkflow)
    const workflowTemplateId = await this.wfrepo.createWorkflowTemplate({ name, description, schema: cookedWorkflow })

    l.log(`WorkflowSynthService_cookAndCreateWorkflowTemplate_105 Created workflow template with ID: ${workflowTemplateId}`)
    return workflowTemplateId
  }

  async cookAndUpdateWorkflowTemplate ({ workflowTemplateId, rawWorkflow }: { workflowTemplateId: number, rawWorkflow: any }) {
    const { l } = this

    const schema = this.cookWorkflowTemplate(rawWorkflow)
    await this.wfrepo.setWorkflowTemplateSchema({ id: workflowTemplateId, schema })

    l.log(`WorkflowSynthService_cookAndUpdateWorkflowTemplate_105 Update workflow template with ID: ${workflowTemplateId}`)
  }

  cookWorkflowTemplate (rawWorkflow: any) {
    const cookedWorkflow = {}

    for (const key in rawWorkflow) {
      const node = rawWorkflow[key]
      const classType = node.class_type
      const title = node._meta?.title || ''

      const cookFunctionName = cookNodeMap[classType]

      if (cookFunctionName) {
        if (typeof this.cook[cookFunctionName] !== 'function') {
          throw new Error(`WorkflowSynthService_cookWorkflow_45 Cook function not found: ${cookFunctionName} for node title: ${title}`)
        }
        cookedWorkflow[key] = this.cook[cookFunctionName](node)
      } else {
        console.log(`WorkflowSynthService_cookWorkflow_52 Skipping cook for node with class_type: ${classType}, title: ${title}`)
        cookedWorkflow[key] = node
      }
    }

    this.validateWorkflowTemplate(cookedWorkflow)

    return cookedWorkflow
  }

  validateWorkflowTemplate (workflowTemplate: any) {
    const { wfParamSchema } = this.wflib

    const paramKeys = this.wflib.getWorkflowTemplateParamKeys(workflowTemplate)

    for (const key of paramKeys) {
      if (!wfParamSchema[key]) {
        throw new Error(`WorkflowSynthService_validateWorkflowTemplate_62 Unknown workflow parameter key: ${key}`)
      }
    }

    return true
  }

  async generateWorkflowVariantRunMenu ({ workflowVariantId, userId, prefixAction = 'empty', backAction = 'empty' }: { workflowVariantId: number, userId: number, prefixAction?: string, backAction?: string }) {
    const wfvParams = await this.wfrepo.getWorkflowMergedWorkflowVariantParams({ userId, workflowVariantId })

    return this.tgbotlib.generateInlineKeyboard(kb.workflowRunMenu({ wfvParams, workflowVariantId, prefixAction, backAction }))
  }

  async createWorkflowVariant ({ workflowTemplateId, name, description }: { workflowTemplateId: number, name?: string, description?: string }) {
    const { l } = this
    const { wfParamSchema } = this.wflib
    const prisma = this.wfrepo['prisma']

    const workflowTemplate = await this.wfrepo.getWorkflowTemplate(Number(workflowTemplateId))
    const paramKeys = this.wflib.getWorkflowTemplateParamKeys(workflowTemplate)
    const metaParamKeys = Object.entries(wfParamSchema)
      .filter(([, value]) => value.isMetaParam)
      .map(([key]) => key)

    const workflowVariantId = await prisma.$transaction(async (trx: lib.PrismaLibService) => {
      const workflowVariantId = await this.wfrepo.createWorkflowVariant({
        workflowTemplateId: Number(workflowTemplateId),
        name: name ?? workflowTemplate.name,
        description: description ?? workflowTemplate.description ?? '',
        trx,
      })

      await this.wfrepo.createWorkflowVariantTag({ workflowVariantId, tag: 'new', trx })

      let defaultPositionX = 7000

      for (const paramKey of [...metaParamKeys, ...paramKeys]) {
        const paramSchema = wfParamSchema[paramKey]

        if (!paramSchema) {
          throw new Error(`No schema found for workflow parameter: ${paramKey}`)
        }

        const endDigitMatch = paramKey.match(/\d+$/)
        const index = endDigitMatch ? parseInt(endDigitMatch[0], 10) : 0

        const positionX = (paramSchema.positionX ?? defaultPositionX) + index

        await this.wfrepo.createWorkflowVariantParam({
          workflowVariantId,
          paramName: paramKey,
          label: paramSchema.label || paramKey,
          value: paramSchema.default,
          user: true,
          enumValues: paramSchema.enum,
          positionX,
          positionY: paramSchema.positionY || 0,
          trx,
        })

        defaultPositionX += 10
      }

      return workflowVariantId
    })

    l.log(`WorkflowSynthService_createWorkflowVariant_99 Created workflow variant with ID: ${workflowVariantId}`)

    return workflowVariantId
  }

  async deleteWorkflowVariant (workflowVariantId: number) {
    const { l } = this

    const prisma = this.wfrepo['prisma']

    await this.wfrepo.getWorkflowVariant(workflowVariantId)

    await prisma.$transaction(async (trx: lib.PrismaLibService) => {
      await this.wfrepo.deleteWorkflowVariantTags({ workflowVariantId, trx })
      await this.wfrepo.deleteWorkflowVariantParams({ workflowVariantId, trx })
      await this.wfrepo.deleteWorkflowVariant({ workflowVariantId, trx })
    })

    l.log(`WorkflowSynthService_deleteWorkflowVariant_113 Deleted workflow variant with ID: ${workflowVariantId}`)
  }
}
