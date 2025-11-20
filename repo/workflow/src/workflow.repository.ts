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

  async getWorkflowMergedWorkflowVariantParams ({ userId, workflowVariantId }) {
    const { wfParamSchema } = this.wflib

    const workflowVariantUserParamsMap = await this.getWorkflowVariantUserParamsMap({ userId, workflowVariantId })
    const workflowVariantParams = await this.getWorkflowVariantParams(workflowVariantId)

    const result: Record<string, any> = workflowVariantParams.reduce((acc, curr) => {
      const { paramName } = curr
      acc[paramName] = workflowVariantUserParamsMap[paramName] ?? curr.value ?? wfParamSchema[paramName].default
      return acc
    }, {})

    return result
  }

  async setWorkflowVariantUserParam ({ userId, workflowVariantId, paramName, value }: { userId: number, workflowVariantId: number | string, paramName: string, value: any }) {
    workflowVariantId = Number(workflowVariantId)

    await this.prisma.workflowVariantUserParams.upsert({
      where: {
        userId_workflowVariantId_paramName: { userId, workflowVariantId, paramName },
      },
      create: { userId, workflowVariantId, paramName, value },
      update: { value },
    })
  }
}
