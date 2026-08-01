import { Injectable, Logger } from '@nestjs/common'
import type { AsyncSessionStore } from 'telegraf/session'

import * as lib from '@lib'

@Injectable()
export class TgBotSessionsStoreRepository implements AsyncSessionStore<any> {
  private readonly l = new Logger(TgBotSessionsStoreRepository.name)

  constructor(
    private prisma: lib.PrismaLibService
  ) {}

  async get (key: string): Promise<any> {
    const MAX_ATTEMPTS = 3

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const record = await this.prisma.tgBotSessions.findUnique({
          where: { key },
        })

        return record?.value
      } catch (err) {
        this.l.error(`TgBotSessionsStoreRepository_get_71 findUnique failed, attempt ${attempt}/${MAX_ATTEMPTS}`, { key }, err)

        if (attempt >= MAX_ATTEMPTS) {
          throw err
        }
      }
    }
  }

  async set (key: string, value: any): Promise<void> {
    await this.prisma.tgBotSessions.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  async delete (key: string): Promise<void> {
    await this.prisma.tgBotSessions.delete({
      where: { key },
    }).catch(() => {})
  }
}
