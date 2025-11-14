import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import type { WorkflowVariants } from '@prisma/client'

@Injectable()
export class WorkflowRepository {
  private readonly l = new Logger(WorkflowRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {}

  async getWorkflowTemplateById (id: number) {
    return await this.prisma.workflowTemplates.findUnique({
      where: { id },
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

  async getWorkflowVariantParams (workflowVariantId: number | string) {
    workflowVariantId = Number(workflowVariantId)

    return await this.prisma.workflowVariantParams.findMany({
      where: { workflowVariantId },
    })
  }

  async getWorkflowVariantUserParams (workflowVariantId: number | string) {
    const { wfParam } = this.wflib

    const workflowVariantParams = await this.getWorkflowVariantParams(workflowVariantId)

    const result = {}

    workflowVariantParams
      .filter(({ user }) => user)
      .forEach(({ paramName, value }) => {
        result[paramName] = value ?? wfParam[paramName].default
      })

    return result
  }
}
