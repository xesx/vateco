import { Injectable } from '@nestjs/common'
import type { AsyncSessionStore } from 'telegraf/session'

import * as lib from '@lib'

@Injectable()
export class TgBotSessionStoreRepository implements AsyncSessionStore<any> {
  constructor(
    private prisma: lib.PrismaLibService
  ) {}

  async get (key: string): Promise<any> {
    const record = await this.prisma.tgBotSession.findUnique({
      where: { key },
    })
    return record?.value
  }

  async set (key: string, value: any): Promise<void> {
    await this.prisma.tgBotSession.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  async delete (key: string): Promise<void> {
    await this.prisma.tgBotSession.delete({
      where: { key },
    }).catch(() => {})
  }
}
