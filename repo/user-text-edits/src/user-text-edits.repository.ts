import { Injectable } from '@nestjs/common'
import { UserTextEdits } from '@prisma/client'

import * as lib from '@lib'

@Injectable()
export class UserTextEditsRepository {

  constructor(
    private readonly prisma: lib.PrismaLibService,
  ) {}

  /**
   * Сохранить текст, введённый пользователем.
   */
  async create ({
    userId,
    text,
  }: {
    userId: number
    text: string
  }): Promise<number> {
    const res = await this.prisma.userTextEdits.create({
      data: { userId, text },
    })

    return res.id
  }

  /**
   * Получить все записи пользователя, отсортированные по убыванию даты.
   */
  async findAllByUserId ({
    userId,
  }: {
    userId: number
  }): Promise<UserTextEdits[]> {
    return await this.prisma.userTextEdits.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Получить последнюю запись пользователя или null.
   */
  async findLatestByUserId ({
    userId,
  }: {
    userId: number
  }): Promise<UserTextEdits | null> {
    return await this.prisma.userTextEdits.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Получить запись по id. Бросает ошибку, если не найдена.
   */
  async findById ({
    id,
  }: {
    id: number
  }): Promise<UserTextEdits> {
    const result = await this.prisma.userTextEdits.findUnique({
      where: { id },
    })

    if (!result) {
      throw new Error(`UserTextEditsRepository_findById: запись с id=${id} не найдена`)
    }

    return result
  }

  /**
   * Обновить текст записи по id.
   */
  async updateText ({
    id,
    text,
  }: {
    id: number
    text: string
  }): Promise<UserTextEdits> {
    return await this.prisma.userTextEdits.update({
      where: { id },
      data: { text },
    })
  }


  async updateTextTag ({ id, tagIndex, text }: {
    id: number
    tagIndex: number
    text: string,
  }): Promise<void> {
    const userTextEdit = await this.findById({ id })

    const textTags = userTextEdit.text.split(',')
    textTags[tagIndex] = text

    await this.updateText({ id, text: textTags.join(',') })
  }

  async updateTextTagPart ({ id, tagIndex, partIndex, text }: {
    id: number
    tagIndex: number
    partIndex: number
    text: string,
  }): Promise<void> {
    const userTextEdit = await this.findById({ id })
    const textTags = userTextEdit.text.split(',')
    const textTag = textTags[tagIndex]

    const textTagParts = textTag.split(' ')
    textTagParts[partIndex] = text

    textTags[tagIndex] = textTagParts.join(' ')

    await this.updateText({ id, text: textTags.join(',') })
  }

  /**
   * Удалить запись по id.
   */
  async deleteById ({
    id,
  }: {
    id: number
  }): Promise<void> {
    await this.prisma.userTextEdits.delete({
      where: { id },
    })
  }

  /**
   * Удалить все записи пользователя.
   */
  async deleteAllByUserId ({
    userId,
  }: {
    userId: number
  }): Promise<void> {
    await this.prisma.userTextEdits.deleteMany({
      where: { userId },
    })
  }
}

