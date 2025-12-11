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

  async createModel ({ name, comfyUiDirectory, comfyUiFileName, baseModel, label, trx = this.prisma }: { name: string, comfyUiDirectory: string, comfyUiFileName: string, baseModel?: string, label: string, trx?: lib.PrismaLibService }) {
    const model = await trx.models.create({
      data: {
        name,
        comfyUiDirectory,
        baseModel,
        comfyUiFileName,
        label,
      },
    })

    return model.id
  }

  async createModelHuggingfaceLink ({ modelId, repo, file, trx = this.prisma }: { modelId: number, repo: string, file: string, trx?: lib.PrismaLibService }) {
    await trx.modelHuggingfaceLinks.create({
      data: {
        modelId,
        repo,
        file,
      },
    })
  }

  async createModelCivitaiLink ({ modelId, civitaiId, civitaiVersionId, trx = this.prisma }: { modelId: number, civitaiId: string, civitaiVersionId: string, trx?: lib.PrismaLibService }) {
    await trx.modelCivitaiLinks.create({
      data: {
        modelId,
        civitaiId,
        civitaiVersionId,
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

  async findModels ({ comfyUiDirectory, tags, limit = 20, page = 0, trx = this.prisma }: { comfyUiDirectory: string, tags: string[], limit?: number, page?: number, trx?: lib.PrismaLibService }): Promise<Models[]> {
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
      HAVING COUNT(*) = ${tags.length}
      ORDER BY m.name ASC
      LIMIT ${limit}
      OFFSET ${page * limit};
    `
  }

  async findUniqueModelTags (comfyUiDirectory: string): Promise<string[]> {
    const result = await this.prisma.$queryRaw<{ tag: string }[]>`
      SELECT DISTINCT mt.tag
        FROM model_tags AS mt
       INNER JOIN models AS m
               ON mt.model_id = m.id
       WHERE 1=1
         AND m.comfy_ui_directory = ${comfyUiDirectory}
       ORDER BY mt.tag ASC;
    `

    return result.map(row => row.tag)
  }

  async findUniqueModelTagIds (comfyUiDirectory: string): Promise<number[]> {
    const result = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT DISTINCT t.id
        FROM model_tags AS mt
       INNER JOIN models AS m
               ON mt.model_id = m.id
       INNER JOIN tags AS t
               ON t.name = mt.tag
       WHERE 1=1
         AND m.comfy_ui_directory = ${comfyUiDirectory}
       ORDER BY t.id ASC;
    `

    return result.map(row => row.id)
  }

  async findUniqueModelTagsRelatedToTags (comfyUiDirectory: string, tags: string[]): Promise<string[]> {
    if (tags.length === 0) {
      return []
    }

    const tagPlaceholders = Prisma.join(tags.map(tag => Prisma.sql`${tag}`), ', ')

    const result = await this.prisma.$queryRaw<{ tag: string }[]>`
      SELECT DISTINCT tag
        FROM model_tags
       WHERE 1=1
         AND NOT tag  IN (${tagPlaceholders})
         AND model_id IN (
            SELECT m.id
              FROM models AS m
             INNER JOIN model_tags AS mt
                     ON mt.model_id = m.id
                    AND mt.tag  IN (${tagPlaceholders})
             WHERE 1=1
               AND m.comfy_ui_directory = ${comfyUiDirectory}
             GROUP BY m.id
            HAVING COUNT(*) = ${tags.length}
         )
    `

    return result.map(row => row.tag)
  }

  async findModelsByComfyUiDir ({ comfyUiDirectory, limit = 20, page = 0 }: { comfyUiDirectory: string, limit?: number, page?: number }) {
    return await this.prisma.models.findMany({
      where: { comfyUiDirectory },
      include: {
        huggingfaceLinks: {
          select: { repo: true, file: true, },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: page * limit,
    })
  }

  async getModelByName (name: string) {
    const model = await this.prisma.models.findUnique({
      where: { name },
      include: {
        huggingfaceLinks: {
          select: { repo: true, file: true, },
        },
        civitaiLinks: {
          select: { civitaiId: true, civitaiVersionId: true, },
        },
      },
    })

    if (!model) {
      throw new Error(`ModelRepository_getModelByName_91 Model with name ${name} not found`)
    }

    return model
  }

  async getModelById (id: number) {
    const model = await this.prisma.models.findUnique({
      where: { id },
    })

    if (!model) {
      throw new Error(`ModelRepository_getModelById_111 Model with ID ${id} not found`)
    }

    return model
  }
}
