import { Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import { Prisma, UserWorkflowVariantRunStatus } from '@prisma/client'

import * as lib from '@lib'

function sortKeys (value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys)
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return value
}

@Injectable()
export class RunRepository {
  constructor(
    private readonly prisma: lib.PrismaLibService,
    private readonly wflib: lib.WorkflowLibService,
  ) {}

  /**
   * Создать или найти существующие параметры запуска.
   * Hash вычисляется автоматически из params (SHA-256 от JSON).
   * Возвращает id записи.
   */
  async createWorkflowVariantRunParams ({
    params,
    trx = this.prisma,
  }: {
    params: Record<string, any>
    trx?: lib.PrismaLibService
  }): Promise<number> {
    params = JSON.parse(JSON.stringify(params))

    for (const param in params) {
      const paramSchema = this.wflib.getWfvParamSchema(param)

      if (paramSchema?.isMetaParam) {
        delete params[param]
      }
    }

    const hash = createHash('sha256')
      .update(JSON.stringify(sortKeys(params)))
      .digest('hex')

    const existing = await trx.workflowVariantRunParams.findUnique({
      where: { hash },
      select: { id: true },
    })

    if (existing) {
      return existing.id
    }

    const created = await trx.workflowVariantRunParams.create({
      data: { hash, params },
      select: { id: true },
    })

    return created.id
  }

  /**
   * Получить параметры запуска по id или hash.
   * Бросает ошибку, если запись не найдена.
   */
  async getWorkflowVariantRunParams ({
    id,
    hash,
    trx = this.prisma,
  }: {
    id?: number
    hash?: string
    trx?: lib.PrismaLibService
  }) {
    if (id === undefined && hash === undefined) {
      throw new Error('getWorkflowVariantRunParams: необходимо передать id или hash')
    }

    const result = await trx.workflowVariantRunParams.findFirst({
      where: {
        ...(id !== undefined ? { id } : {}),
        ...(hash !== undefined ? { hash } : {}),
      },
    })

    if (!result) {
      throw new Error(`RunRepository_getWorkflowVariantRunParams_73 запись не найдена (id=${id}, hash=${hash})`)
    }

    return result
  }

  /**
   * Создать новый запуск варианта workflow для пользователя.
   * Возвращает id созданной записи.
   */
  async createUserWorkflowVariantRun ({
    userId,
    workflowVariantId,
    wfvRunParamsId,
    status = UserWorkflowVariantRunStatus.new,
    meta,
    trx = this.prisma,
  }: {
    userId: number
    workflowVariantId: number
    wfvRunParamsId?: number
    status?: UserWorkflowVariantRunStatus
    meta?: Prisma.InputJsonValue
    trx?: lib.PrismaLibService
  }): Promise<number> {
    const created = await trx.userWorkflowVariantRuns.create({
      data: {
        userId,
        workflowVariantId,
        workflowVariantRunParamsId: wfvRunParamsId,
        status,
        ...(meta !== undefined ? { meta } : {}),
      },
      select: { id: true },
    })

    return created.id
  }

  /**
   * Обновить статус запуска варианта workflow.
   */
  async setUserWorkflowVariantRunStatus ({
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
  }

  /**
   * Обновить meta запуска варианта workflow.
   * Существующие ключи сохраняются, переданные — добавляются/перезаписываются.
   */
  async setUserWorkflowVariantRunMeta ({
    id,
    meta,
    trx = this.prisma,
  }: {
    id: number
    meta: Record<string, unknown>
    trx?: lib.PrismaLibService
  }): Promise<void> {
    const current = await trx.userWorkflowVariantRuns.findUniqueOrThrow({
      where: { id },
      select: { meta: true },
    })

    const merged = {
      ...(typeof current.meta === 'object' && current.meta !== null && !Array.isArray(current.meta)
        ? (current.meta as Record<string, unknown>)
        : {}),
      ...meta,
    }

    await trx.userWorkflowVariantRuns.update({
      where: { id },
      data: { meta: merged as Prisma.InputJsonValue },
    })
  }

  /**
   * Получить запуск варианта workflow по id.
   * Бросает ошибку, если запись не найдена.
   */
  async getUserWorkflowVariantRun ({
    id,
    trx = this.prisma,
  }: {
    id: number
    trx?: lib.PrismaLibService
  }) {
    const result = await trx.userWorkflowVariantRuns.findUnique({
      where: { id },
    })

    if (!result) {
      throw new Error(`RunRepository_getUserWorkflowVariantRun запись с id=${id} не найдена`)
    }

    return result
  }

  async findActiveUserWorkflowVariantRunIds ({
    userId,
  }: {
    userId: number
  }) {
    const result = await this.prisma.userWorkflowVariantRuns.findMany({
      where: {
        userId,
        status: { in: [UserWorkflowVariantRunStatus.new, UserWorkflowVariantRunStatus.in_progress] },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    return result.map(({ id }) => id)
  }
}

