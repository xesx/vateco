import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

// import { Prisma } from '@prisma/client'

@Injectable()
export class LockRepository {
  private readonly l = new Logger(LockRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async tryGetLock ({ key, value, ttlInSec, trx = this.prisma }: {
    key: string
    value: string | number
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

    return Boolean(isUpdated)
  }

  async tryReleaseLock ({ key, value, trx = this.prisma }: { key: string, value: string | number, trx?: lib.PrismaLibService }): Promise<boolean> {
    const isDeleted = await trx.$executeRaw`
      DELETE
        FROM locks
       WHERE key = ${key}
         AND value = ${JSON.stringify(value)}::jsonb
    `

    return Boolean(isDeleted)
  }

  async tryExtendLock ({ key, value, ttlInSec, trx = this.prisma }: { key: string, value: string | number, ttlInSec: number, trx?: lib.PrismaLibService }): Promise<boolean> {
    const isUpdated = await trx.$executeRaw`
      UPDATE locks
         set expired_at = CURRENT_TIMESTAMP + (${ttlInSec} * interval '1 second')
           , updated_at = CURRENT_TIMESTAMP
       WHERE TRUE
         AND key = ${key}
         AND value = ${JSON.stringify(value)}::jsonb
         AND expired_at > CURRENT_TIMESTAMP
    `

    if (isUpdated) {
      return true
    }

    return await this.tryGetLock({ key, value, ttlInSec, trx })
  }

  async cleanExpiredLocks ({ trx = this.prisma }: { trx?: lib.PrismaLibService } = {}): Promise<number> {
    const deletedCount = await trx.$executeRaw`
      DELETE FROM locks
       WHERE expired_at < CURRENT_TIMESTAMP
    `

    this.l.log(`cleanExpiredLocks: удалено ${deletedCount} устаревших блокировок`)

    return deletedCount
  }
}

