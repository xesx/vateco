import { Injectable } from '@nestjs/common'
import { PrismaLibService } from './prisma.lib.service'
import type { AsyncSessionStore } from 'telegraf/session'

@Injectable()
export class TgBotSessionStorePrismaLibService implements AsyncSessionStore<any> {
  constructor(private prisma: PrismaLibService) {}

  async get(key: string): Promise<any> {
    const record = await this.prisma.tgBotSession.findUnique({
      where: { key },
    })
    return record?.value
  }

  async set(key: string, value: any): Promise<void> {
    await this.prisma.tgBotSession.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  async delete(key: string): Promise<void> {
    await this.prisma.tgBotSession.delete({
      where: { key },
    }).catch(() => {})
  }
}
