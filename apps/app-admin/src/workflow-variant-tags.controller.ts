import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import * as repo from '@repo'

@Controller('wf/variant/tags')
export class WorkflowVariantTagsController {
  constructor(
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  @Post('list')
  async list(@Body() body: { workflowVariantId: number }) {
    try {
      const { workflowVariantId } = body
      if (!workflowVariantId) {
        throw new Error('workflowVariantId обязателен')
      }
      const tags = await this.wfrepo.getWorkflowVariantTags(workflowVariantId)
      return {
        success: true,
        data: tags,
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('add')
  async add(@Body() body: { workflowVariantId: number; tag: string }) {
    try {
      const { workflowVariantId, tag } = body
      if (!workflowVariantId || !tag) {
        throw new Error('workflowVariantId и tag обязательны')
      }
      await this.wfrepo.createWorkflowVariantTag({ workflowVariantId, tag })
      return {
        success: true,
        message: 'Тег успешно добавлен',
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('delete')
  async delete(@Body() body: { workflowVariantId: number; tag: string }) {
    try {
      const { workflowVariantId, tag } = body
      if (!workflowVariantId || !tag) {
        throw new Error('workflowVariantId и tag обязательны')
      }
      await this.wfrepo.deleteWorkflowVariantTag({ workflowVariantId, tag })
      return {
        success: true,
        message: 'Тег успешно удалён',
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
