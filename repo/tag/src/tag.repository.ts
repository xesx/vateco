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

  async getAllTags({ trx = this.prisma }: { trx?: lib.PrismaLibService } = {}): Promise<string[]> {
    const tags = await trx.tags.findMany({ select: { name: true } })
    return tags.map(tag => tag.name)
  }

  async createTag({ name, trx = this.prisma }: { name: string, trx?: lib.PrismaLibService }): Promise<Tags> {
    return await trx.tags.create({ data: { name } })
  }

  async deleteTag({ name, trx = this.prisma }: { name: string, trx?: lib.PrismaLibService }): Promise<Tags> {
    return await trx.tags.delete({ where: { name } })
  }
}
