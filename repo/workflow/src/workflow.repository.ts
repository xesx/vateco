import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import type { WorkflowVariants, WorkflowVariantParams } from '@prisma/client'

@Injectable()
export class WorkflowRepository {
  private readonly l = new Logger(WorkflowRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {}

  async createWorkflowTemplate ({ name, description, schema, trx = this.prisma }: { name?: string, description?: string, schema?: Record<string, any>, workflow?: Record<string, any>, trx?: lib.PrismaLibService }): Promise<number> {
    if (!schema) {
      throw new Error('createWorkflowTemplate_39 Schema is required')
    }

    name = name?.trim().replace(/\s+/g, '').toLowerCase()

    if (!name || name.length > 100) {
      throw new Error('createWorkflowTemplate_43 Name is too long, max 100 characters')
    }

    description = description?.trim() || ''

    const result = await trx.workflowTemplates.create({
      data: {
        name,
        description,
        schema,
      },
    })

    return result.id
  }

  async createWorkflowVariant ({ workflowTemplateId, name, description, trx = this.prisma }: { workflowTemplateId: number, name: string, description?: string, trx?: lib.PrismaLibService  }): Promise<number> {
    name = name?.trim() || ''

    if (name.length > 100) {
      throw new Error('createWorkflowVariant_66 Name is too long, max 100 characters')
    }

    description = description?.trim() || ''

    const result = await trx.workflowVariants.create({
      data: {
        workflowTemplateId,
        name,
        description,
      },
    })

    return result.id
  }

  async createWorkflowVariantTag ({ workflowVariantId, tag, trx = this.prisma }: { workflowVariantId: number, tag: string, trx?: lib.PrismaLibService }) {
    tag = tag?.trim().toLowerCase()

    if (!tag || tag.length > 50) {
      throw new Error('createWorkflowVariantTag_84 Tag is too long, max 50 characters')
    }

    await trx.workflowVariantTags.create({
      data: {
        workflowVariantId,
        tag,
      },
    })
  }

  async createWorkflowVariantParam ({ workflowVariantId, paramName, label, value, positionX, positionY, user, enumValues, trx = this.prisma }: { workflowVariantId: number, paramName: string, label?: string, value?: any, positionX?: number, positionY?: number, user?: boolean, enumValues?: any[], trx?: lib.PrismaLibService }) {
    const { wfParamSchema } = this.wflib

    paramName = paramName?.trim() || ''

    if (!paramName || paramName.length > 100) {
      throw new Error('createWorkflowVariantParam_13 Param name is too long, max 100 characters')
    }

    if (!wfParamSchema[paramName]) {
      throw new Error(`createWorkflowVariantParam_19 Unknown workflow parameter name: ${paramName}`)
    }

    label = label?.trim() || ''

    if (label.length > 200) {
      throw new Error('createWorkflowVariantParam_111 Label is too long, max 200 characters')
    }

    await trx.workflowVariantParams.create({
      data: {
        workflowVariantId,
        paramName,
        label,
        user: user ?? false,
        'enum': enumValues,
        value,
        positionX,
        positionY,
      },
    })
  }

  async deleteWorkflowVariant ({ workflowVariantId, trx = this.prisma }: { workflowVariantId: number, trx?: lib.PrismaLibService }) {
    await trx.workflowVariants.delete({
      where: { id: workflowVariantId },
    })
  }

  async deleteWorkflowVariantParams ({ workflowVariantId, trx = this.prisma }: { workflowVariantId: number, trx?: lib.PrismaLibService }) {
    await trx.workflowVariantParams.deleteMany({
      where: { workflowVariantId },
    })
  }

  async deleteWorkflowVariantTags ({ workflowVariantId, trx = this.prisma }: { workflowVariantId: number, trx?: lib.PrismaLibService }) {
    await trx.workflowVariantTags.deleteMany({
      where: { workflowVariantId },
    })
  }

  async findWorkflowVariantsByTags (tags: string[]) {
    const workflows = await this.prisma.$queryRaw<WorkflowVariants[]>`
      SELECT wv.*
        FROM workflow_variant_tags AS wvt
       INNER JOIN workflow_variants AS wv
               ON wv.id = wvt.workflow_variant_id
       WHERE 1=1
         AND wvt.tag in (${tags.join(',')})
       GROUP BY wv.id
      HAVING COUNT(*) = ${tags.length}
    `

    return workflows
  }

  async getWorkflowTemplate (id: number) {
    const result = await this.prisma.workflowTemplates.findUnique({
      where: { id },
    })

    if (!result) {
      throw new Error(`Workflow template with ID ${id} not found`)
    }

    return result
  }

  async getWorkflowVariantParams (workflowVariantId: number | string) {
    workflowVariantId = Number(workflowVariantId)

    return await this.prisma.workflowVariantParams.findMany({
      where: { workflowVariantId },
    })
  }

  async getWorkflowVariantParamByName ({ workflowVariantId, paramName }: { workflowVariantId: number | string, paramName: string }): Promise<WorkflowVariantParams> {
    workflowVariantId = Number(workflowVariantId)

    const result = await this.prisma.workflowVariantParams.findFirst({
      where: {
        workflowVariantId,
        paramName,
      },
    })

    if (!result) {
      throw new Error(`getWorkflowVariantParamByName_91 Workflow variant param with name ${paramName} not found for workflow variant ID ${workflowVariantId}`)
    }

    return result
  }

  async getWorkflowVariantParamById (id: number) {
    const result = await this.prisma.workflowVariantParams.findUnique({
      where: { id },
    })

    if (!result) {
      throw new Error(`getWorkflowVariantParamById_103 Workflow variant param with ID ${id} not found`)
    }

    return result
  }

  async findWorkflowVariantParamsByNameStartsWith ({ workflowVariantId, startsWith }: { workflowVariantId: number | string, startsWith: string }) {
    workflowVariantId = Number(workflowVariantId)

    return await this.prisma.workflowVariantParams.findMany({
      where: {
        workflowVariantId,
        paramName: {
          startsWith,
        },
      },
    })
  }

  async findWorkflowVariantUserParam ({ userId, workflowVariantId, paramName }: { userId: number, workflowVariantId: number | string, paramName: string }) {
    workflowVariantId = Number(workflowVariantId)

    return await this.prisma.workflowVariantUserParams.findFirst({
      where: {
        userId,
        workflowVariantId,
        paramName,
      },
    })
  }

  async getWorkflowVariantUserParams ({ userId, workflowVariantId }: { userId: number, workflowVariantId: number | string }) {
    workflowVariantId = Number(workflowVariantId)

    return await this.prisma.workflowVariantUserParams.findMany({
      where: {
        userId,
        workflowVariantId,
      },
    })
  }

  async getWorkflowVariantUserParamsMap ({ userId, workflowVariantId }: { userId: number, workflowVariantId: number | string }): Promise<Record<string, any>> {
    const workflowVariantUserParams = await this.getWorkflowVariantUserParams({ userId, workflowVariantId })

    const result = {}

    workflowVariantUserParams.forEach(param => {
      result[param.paramName] = param.value
    })

    return result
  }

  async getWorkflowVariantParamsMap (workflowVariantId: number | string) {
    const workflowVariantParams = await this.getWorkflowVariantParams(workflowVariantId)

    const result = {}

    workflowVariantParams.forEach(param => {
      result[param.paramName] = param
      result[param.paramName].position = [param.positionX, param.positionY]
    })

    return result
  }

  async getWorkflowVariant (workflowVariantId: number | string) {
    workflowVariantId = Number(workflowVariantId)

    const workflowVariant = await this.prisma.workflowVariants.findUnique({
      where: { id: workflowVariantId },
    })

    if (!workflowVariant) {
      throw new Error(`Workflow variant with ID ${workflowVariantId} not found`)
    }

    return workflowVariant
  }

  async getMergedWorkflowVariantParamsValueMap ({ userId, workflowVariantId }) {
    const { wfParamSchema } = this.wflib

    const workflowVariantUserParamsMap = await this.getWorkflowVariantUserParamsMap({ userId, workflowVariantId })
    const workflowVariantParams = await this.getWorkflowVariantParams(workflowVariantId)

    const result: Record<string, any> = workflowVariantParams.reduce((acc, curr) => {
      const { paramName } = curr

      let value: any
      value = workflowVariantUserParamsMap[paramName]?.value
      value ??= workflowVariantUserParamsMap[paramName]
      value ??= curr.value
      value ??= wfParamSchema[paramName].default

      acc[paramName] = value
      return acc
    }, {})

    return result
  }

  async getWorkflowMergedWorkflowVariantParams ({ userId, workflowVariantId }) {
    const { wfParamSchema } = this.wflib

    const workflowVariantUserParamsMap = await this.getWorkflowVariantUserParamsMap({ userId, workflowVariantId })
    const workflowVariantParams = await this.getWorkflowVariantParams(workflowVariantId)

    const mergedParams = workflowVariantParams.map(param => {
      const { paramName } = param

      return {
        ...param,
        value: workflowVariantUserParamsMap[paramName] ?? param.value ?? wfParamSchema[paramName].default,
        label: param.label ?? wfParamSchema[paramName].label,
        enum: param.enum ?? wfParamSchema[paramName].enum ?? null,
        isComfyUiModel: wfParamSchema[paramName].isComfyUiModel || false,
      }
    })

    return mergedParams
  }

  async setWorkflowVariantUserParam ({ userId, workflowVariantId, paramName, value }: { userId: number, workflowVariantId: number | string, paramName: string, value: any }) {
    workflowVariantId = Number(workflowVariantId)
    const { wfParamSchema } = this.wflib

    if (wfParamSchema[paramName].type === 'number') {
      value = parseFloat(value)
    }

    if (wfParamSchema[paramName].type === 'integer') {
      value = parseInt(value, 10)
    }

    if (wfParamSchema[paramName].type === 'boolean') {
      value = value === true || String(value).toLowerCase() === 'true'
    }

    await this.prisma.workflowVariantUserParams.upsert({
      where: {
        userId_workflowVariantId_paramName: { userId, workflowVariantId, paramName },
      },
      create: { userId, workflowVariantId, paramName, value },
      update: { value },
    })
  }
}
