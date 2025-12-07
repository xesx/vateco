import { Injectable, Logger } from '@nestjs/common'
// import { Prisma } from '@prisma/client'

import * as lib from '@lib'

import type { Tags } from '@prisma/client'

@Injectable()
export class TagRepository {
  private readonly l = new Logger(TagRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async getTagsByNames ({ names, trx = this.prisma }: { names: string[], trx?: lib.PrismaLibService }): Promise<Tags[]> {
    return await trx.tags.findMany({
      where: { 'name': { in: names } },
    })
  }

  async getTagsByIds ({ ids, trx = this.prisma }: { ids: number[], trx?: lib.PrismaLibService }): Promise<Tags[]> {
    return await trx.tags.findMany({
      where: { 'id': { in: ids } },
    })
  }

  async getTagById ({ id, trx = this.prisma }: { id: number, trx?: lib.PrismaLibService }): Promise<Tags> {
    const tag =  await trx.tags.findUnique({
      where: { id },
    })

    if (!tag) {
      throw new Error(`Tag with id ${id} not found`)
    }

    return tag
  }
}
