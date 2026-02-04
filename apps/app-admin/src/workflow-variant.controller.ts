import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import * as repo from '@repo'
import { WorkflowSynthService } from '@synth'

@Controller('wf/variant')
export class WorkflowVariantController {
  constructor(
    private readonly wfsynth: WorkflowSynthService,
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  @Post('create')
  async create(@Body() body: { workflowTemplateId: number; name: string; description?: string }) {
    try {
      const { workflowTemplateId, name, description } = body
      if (!workflowTemplateId || !name) {
        throw new Error('workflowTemplateId и name обязательны')
      }
      const id = await this.wfsynth.createWorkflowVariant({
        workflowTemplateId,
        name,
        description,
      })
      return {
        success: true,
        data: { id },
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

  @Post('list')
  async list(@Body() body: { workflowTemplateId?: number } = {}) {
    try {
      const variants = await this.wfrepo.listWorkflowVariants(body.workflowTemplateId)
      return {
        success: true,
        data: variants,
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
  async update(@Body() body: { workflowVariantId: number; name?: string; description?: string }) {
    try {
      const { workflowVariantId, name, description } = body

      if (!name && !description) {
        throw new Error('Необходимо указать хотя бы одно поле для обновления: name или description')
      }

      const updated = await this.wfrepo.updateWorkflowVariant({
        id: workflowVariantId,
        name,
        description,
      })

      return {
        success: true,
        data: { id: updated.id },
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

  @Post('get')
  async get(@Body() body: { workflowVariantId: number }) {
    try {
      const { workflowVariantId } = body

      const variant = await this.wfrepo.getWorkflowVariant(workflowVariantId)

      return {
        success: true,
        data: variant,
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
  async delete(@Body() body: { workflowVariantId: number }) {
    try {
      const { workflowVariantId } = body

      await this.wfrepo.deleteWorkflowVariant({ workflowVariantId })

      return {
        success: true,
        message: 'Вариант успешно удалён',
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
