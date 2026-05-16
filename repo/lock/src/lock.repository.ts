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
    // await trx.$executeRaw`
    //   DELETE
    //     FROM "locks"
    //    WHERE "key" = ${key}
    //      AND "expired_at" < CURRENT_TIMESTAMP
    // `
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
    const [result] = await trx.$queryRaw<Array<{ isLocked: boolean }>>`
      SELECT EXISTS (
        SELECT 1
          FROM "locks"
         WHERE "key" = ${key}
           AND (
             "expired_at" IS NULL
             OR "expired_at" > CURRENT_TIMESTAMP
           )
      ) AS "isLocked"
    `

    return result?.isLocked ?? false
  }

  async cleanExpiredLocks ({ trx = this.prisma }: { trx?: lib.PrismaLibService } = {}): Promise<number> {
    const deletedCount = await trx.$executeRaw`
      DELETE
        FROM "locks"
       WHERE "expired_at" < CURRENT_TIMESTAMP
    `

    this.l.log(`cleanExpiredLocks: удалено ${deletedCount} устаревших блокировок`)

    return deletedCount
  }
}

