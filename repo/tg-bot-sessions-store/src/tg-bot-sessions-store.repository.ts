import { Injectable } from '@nestjs/common'
import type { AsyncSessionStore } from 'telegraf/session'

import * as lib from '@lib'

@Injectable()
export class TgBotSessionsStoreRepository implements AsyncSessionStore<any> {
  constructor(
    private prisma: lib.PrismaLibService
  ) {}

  async get (key: string): Promise<any> {
    const record = await this.prisma.tgBotSessions.findUnique({
      where: { key },
    })
    return record?.value
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
