import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import { Prisma } from '@prisma/client'
import type { Locks } from '@prisma/client'

@Injectable()
export class LockRepository {
  private readonly l = new Logger(LockRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async getLock ({ key, trx = this.prisma }: { key: string, trx?: lib.PrismaLibService }): Promise<Locks | null> {
    return await trx.locks.findFirst({
      where: { key },
    })
  }

  async tryGetLock ({
    key,
    value,
    expiredAt,
    trx = this.prisma,
  }: {
    key: string
    value: Prisma.InputJsonValue
    expiredAt?: Date
    trx?: lib.PrismaLibService
  }): Promise<Locks | null> {
    // Удалить устаревшую блокировку, если есть
    await trx.locks.deleteMany({
      where: {
        key,
        expiredAt: { lt: new Date() },
      },
    })

    // Попытаться создать новую блокировку
    try {
      return await trx.locks.create({
        data: { key, value, expiredAt },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return null // блокировка уже активна
      }
      throw e
    }
  }

  async acquireLock ({
    key,
    value,
    expiredAt,
    trx = this.prisma,
  }: {
    key: string
    value: Prisma.InputJsonValue,
    expiredAt?: Date
    trx?: lib.PrismaLibService
  }): Promise<Locks> {
    return await trx.locks.upsert({
      where: { key },
      create: { key, value, expiredAt },
      update: { value, expiredAt },
    })
  }

  async releaseLock ({ key, trx = this.prisma }: { key: string, trx?: lib.PrismaLibService }): Promise<void> {
    await trx.locks.delete({
      where: { key },
    })
  }

  async isLocked ({ key, trx = this.prisma }: { key: string, trx?: lib.PrismaLibService }): Promise<boolean> {
    const lock = await trx.locks.findFirst({
      where: {
        key,
        OR: [
          { expiredAt: null },
          { expiredAt: { gt: new Date() } },
        ],
      },
    })

    return lock !== null
  }

  async cleanExpiredLocks ({ trx = this.prisma }: { trx?: lib.PrismaLibService } = {}): Promise<number> {
    const result = await trx.locks.deleteMany({
      where: {
        expiredAt: { lt: new Date() },
      },
    })

    this.l.log(`cleanExpiredLocks: удалено ${result.count} устаревших блокировок`)

    return result.count
  }
}

