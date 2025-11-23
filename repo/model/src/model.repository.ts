import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

@Injectable()
export class ModelRepository {
  private readonly l = new Logger(ModelRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

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
