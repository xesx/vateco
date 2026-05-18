import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import { Prisma } from '@prisma/client'

@Injectable()
export class LockRepository {
  private readonly l = new Logger(LockRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async tryGetLock ({ key, value, ttlInSec, trx = this.prisma }: {
    key: string
    value: Prisma.InputJsonValue
    ttlInSec: number
    trx?: lib.PrismaLibService
  }): Promise<boolean> {
    const isCreated = await trx.$executeRaw`
      INSERT INTO locks (key, value, expired_at)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb, CURRENT_TIMESTAMP + (${ttlInSec} * interval '1 second'))
      ON CONFLICT (key) DO NOTHING
    `

    if (isCreated) {
      this.l.log(`LockRepository_tryGetLock_30 success get lock`, { key, value, ttlInSec })
      return true
    }

    const isUpdated = await trx.$executeRaw`
      UPDATE locks
         set expired_at = CURRENT_TIMESTAMP + (${ttlInSec} * interval '1 second')
           , updated_at = CURRENT_TIMESTAMP
           , value = ${JSON.stringify(value)}::jsonb
       WHERE TRUE
         AND key = ${key}
         AND expired_at < CURRENT_TIMESTAMP
    `

    if (isUpdated) {
      this.l.log(`LockRepository_tryGetLock_50 success get lock`, { key, value, ttlInSec })
      return true
    }

    return false
  }

  async releaseLock ({ key, trx = this.prisma }: { key: string, trx?: lib.PrismaLibService }): Promise<void> {
    await trx.locks.delete({
      where: { key },
    })
  }

  async cleanExpiredLocks ({ trx = this.prisma }: { trx?: lib.PrismaLibService } = {}): Promise<number> {
    const deletedCount = await trx.$executeRaw`
      DELETE
        FROM locks
       WHERE expired_at < CURRENT_TIMESTAMP
    `

    this.l.log(`cleanExpiredLocks: удалено ${deletedCount} устаревших блокировок`)

    return deletedCount
  }
}

