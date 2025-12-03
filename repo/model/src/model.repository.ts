import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import * as lib from '@lib'

import type { Models } from '@prisma/client'

@Injectable()
export class ModelRepository {
  private readonly l = new Logger(ModelRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async createModel ({ name, comfyUiDirectory, comfyUiFileName, label, trx = this.prisma }: { name: string, comfyUiDirectory: string, comfyUiFileName: string, label: string, trx?: lib.PrismaLibService }) {
    const model = await trx.models.create({
      data: {
        name,
        comfyUiDirectory,
        comfyUiFileName,
        label,
      },
    })

    return model.id
  }

  async createMolelHuggingfaceLink ({ modelId, repo, file, trx = this.prisma }: { modelId: number, repo: string, file: string, trx?: lib.PrismaLibService }) {
    await trx.modelHuggingfaceLinks.create({
      data: {
        modelId,
        repo,
        file,
      },
    })
  }

  async createModelTag ({ modelId, tag, trx = this.prisma }: { modelId: number, tag: string, trx?: lib.PrismaLibService }) {
    await trx.modelTags.create({
      data: {
        modelId,
        tag,
      },
    })
  }

  async findModels ({ comfyUiDirectory, tags, trx = this.prisma }: { comfyUiDirectory: string, tags: string[], trx?: lib.PrismaLibService }) {
    // Проверка, что tags не пустой — иначе запрос сломается
    if (tags.length === 0) {
      return []
    }

    const tagPlaceholders = Prisma.join(tags.map(tag => Prisma.sql`${tag}`), ', ')

    return await trx.$queryRaw<Models[]>`
      SELECT m.*
        FROM models AS m
       INNER JOIN model_tags AS mt
               ON mt.model_id = m.id
              AND mt.tag IN (${tagPlaceholders})
       WHERE 1=1
         AND m.comfy_ui_directory = ${comfyUiDirectory}
       GROUP BY m.id
      HAVING COUNT(*) = ${tags.length};
    `
  }

  async findModelsByComfyUiDir (comfyUiDirectory: string) {
    return await this.prisma.models.findMany({
      where: { comfyUiDirectory },
      include: {
        huggingfaceLinks: {
          select: { repo: true, file: true, },
        },
      },
      orderBy: { name: 'asc' }
    })
  }

  async getModelByName (name: string) {
    const model = await this.prisma.models.findUnique({
      where: { name },
      include: {
        huggingfaceLinks: {
          select: { repo: true, file: true, },
        },
      },
    })

    if (!model) {
      throw new Error(`ModelRepository_getModelByName_91 Model with name ${name} not found`)
    }

    return model
  }
}
