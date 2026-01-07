import { Injectable, Logger } from '@nestjs/common'
// import { Prisma } from '@prisma/client'

import * as lib from '@lib'

import type { Settings } from '@prisma/client'

type TSettingsName = 'comfyui_portable_version' | 'test'

@Injectable()
export class SetupRepository {
  private readonly l = new Logger(SetupRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async getSetting ({ name, trx = this.prisma }: { name: TSettingsName, trx?: lib.PrismaLibService }): Promise<Settings['value']> {
    const row = await trx.settings.findFirst({
      where: { 'name': name },
    })

    if (!row) {
      throw new Error(`SetupRepository_getSetting_24 Setting not found: ${name}`)
    }

    return row.value
  }
}
