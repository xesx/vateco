import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

@Injectable()
export class UserRepository {
  private readonly l = new Logger(UserRepository.name)

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  async createUser ({ telegramId, username, firstName, lastName }): Promise<number> {
    const user = await this.prisma.users.upsert({
      where: { telegramId },
      update: { username, firstName, lastName },
      create: { telegramId, username, firstName, lastName },
    })

    return user.id
  }
}
