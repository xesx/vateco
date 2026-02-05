import { Controller, Post, Body } from '@nestjs/common'
import { Logger } from '@nestjs/common'

import * as repo from '@repo'

@Controller('tag')
export class TagController {
  private readonly logger = new Logger(TagController.name)

  constructor(private readonly tagrepo: repo.TagRepository) {}

  @Post('list')
  async list() {
    this.logger.log('Получение списка тегов')
    const tags = await this.tagrepo.getAllTags({})
    return tags
  }

  @Post('create')
  async create(@Body() dto: { name: string }) {
    this.logger.log('Создание нового тега')
    const tag = await this.tagrepo.createTag({ name: dto.name })
    return tag
  }

  @Post('delete')
  async delete(@Body() dto: { name: string }) {
    this.logger.log('Удаление тега')
    const tag = await this.tagrepo.deleteTag({ name: dto.name })
    return tag
  }
}
