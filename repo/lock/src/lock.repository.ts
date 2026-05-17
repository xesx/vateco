import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import { Prisma } from '@prisma/client'

@Injectable()
export class LockRepository {
  private readonly l = new Logger(LockRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async tryGetLock ({ key, value, expiredAt, trx = this.prisma }: {
    key: string
    value: Prisma.InputJsonValue
    expiredAt?: Date
    trx?: lib.PrismaLibService
  }): Promise<boolean> {
    console.log('\x1b[36m', 'key', key, '\x1b[0m')
    const isCreated = await trx.$executeRaw`
      INSERT INTO locks (key, value, expired_at)
      VALUES (${key}, ${value}, ${expiredAt})
      ON CONFLICT (key) DO NOTHING
    `

    console.log('\x1b[36m', 'isCreated', isCreated, '\x1b[0m')

    if (isCreated) {
      this.l.log(`tryGetLock: успешно получена блокировка для ключа ${key}`)
      return true
    }

    // const isUpdated = await trx.$executeRaw`
    //   UPDATE locks
    //      set expired_at = ${expiredAt}
    //        , value = '${value}'
    //    WHERE key = ${key}
    //      AND expired_at < CURRENT_TIMESTAMP
    // `

    const updated = await trx.locks.updateMany({
      where: {
        key,
        expiredAt: {
          lt: new Date(),
        },
      },
      data: {
        value,
        expiredAt: expiredAt,
      },
    })

    console.log('\x1b[36m', 'updatedCount', updated.count, '\x1b[0m')

    if (updated.count > 0) {
      this.l.log(`tryGetLock: обновлена протухшая блокировка для ключа ${key}`)
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

