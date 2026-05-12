import { Injectable, Logger } from '@nestjs/common'
import { Prisma, UserWorkflowVariantRunStatus } from '@prisma/client'

import * as lib from '@lib'

import type { UserWorkflowVariantRuns } from '@prisma/client'

@Injectable()
export class UserWorkflowVariantRunsRepository {
  private readonly l = new Logger(UserWorkflowVariantRunsRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async createRun ({
    userId,
    workflowVariantId,
    userParams,
    meta,
    trx = this.prisma,
  }: {
    userId: number
    workflowVariantId: number
    userParams?: Prisma.InputJsonObject
    meta?: Prisma.InputJsonObject
    trx?: lib.PrismaLibService
  }): Promise<number> {
    const run = await trx.userWorkflowVariantRuns.create({
      data: {
        userId,
        workflowVariantId,
        status: UserWorkflowVariantRunStatus.new,
        userParams: userParams ?? Prisma.JsonNull,
        meta: meta ?? Prisma.JsonNull,
      },
    })

    this.l.log(`createRun: created run #${run.id} for user ${userId}, variant ${workflowVariantId}`)

    return run.id
  }

  async getRun (id: number): Promise<UserWorkflowVariantRuns> {
    const run = await this.prisma.userWorkflowVariantRuns.findUnique({
      where: { id },
    })

    if (!run) {
      throw new Error(`getRun: run with ID ${id} not found`)
    }

    return run
  }

  async findRuns ({
    userId,
    workflowVariantId,
    status,
    limit = 20,
    offset = 0,
  }: {
    userId?: number
    workflowVariantId?: number
    status?: UserWorkflowVariantRunStatus
    limit?: number
    offset?: number
  }): Promise<UserWorkflowVariantRuns[]> {
    return this.prisma.userWorkflowVariantRuns.findMany({
      where: {
        ...(userId !== undefined ? { userId } : {}),
        ...(workflowVariantId !== undefined ? { workflowVariantId } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  async deleteRun ({
    id,
    trx = this.prisma,
  }: {
    id: number
    trx?: lib.PrismaLibService
  }): Promise<void> {
    await trx.userWorkflowVariantRuns.delete({
      where: { id },
    })

    this.l.log(`deleteRun: deleted run #${id}`)
  }

  async deleteRunsByUser ({
    userId,
    trx = this.prisma,
  }: {
    userId: number
    trx?: lib.PrismaLibService
  }): Promise<void> {
    await trx.userWorkflowVariantRuns.deleteMany({
      where: { userId },
    })

    this.l.log(`deleteRunsByUser: deleted all runs for user ${userId}`)
  }

  async setStatus ({
    id,
    status,
    trx = this.prisma,
  }: {
    id: number
    status: UserWorkflowVariantRunStatus
    trx?: lib.PrismaLibService
  }): Promise<void> {
    await trx.userWorkflowVariantRuns.update({
      where: { id },
      data: { status },
    })

    this.l.log(`setStatus: run #${id} status set to "${status}"`)
  }
}

