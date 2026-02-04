import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import * as repo from '@repo'

@Controller('wf/variant/params')
export class WorkflowVariantParamsController {
  constructor(
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  @Post('get')
  async getParams(@Body() body: { workflowVariantId: number }) {
    try {
      const { workflowVariantId } = body
      if (!workflowVariantId) {
        throw new Error('workflowVariantId обязателен')
      }
      const params = await this.wfrepo.getWorkflowVariantParams(workflowVariantId)
      return {
        success: true,
        data: params,
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

  @Post('update')
  async updateParam(@Body() body: { workflowVariantParamId: number; name?: string; user?: string; value?: unknown; label?: string; enum?: unknown; positionX?: number; positionY?: number }) {
    try {
      const { workflowVariantParamId, name, user, value, label, enum: enumValue, positionX, positionY } = body
      if (!workflowVariantParamId) {
        throw new Error('workflowVariantParamId обязателен')
      }
      await this.wfrepo.updateWorkflowVariantParam({
        workflowVariantParamId,
        name,
        user,
        value,
        label,
        enum: enumValue,
        positionX,
        positionY,
      })
      return {
        success: true,
        message: 'Параметр успешно обновлён',
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
