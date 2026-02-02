import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common'

import * as repo from '@repo'

@Controller('wf/template')
export class WorkflowTemplateController {
  constructor(
    private readonly workflowRepo: repo.WorkflowRepository,
  ) {}

  @Post('create')
  async create(@Body() body: { name?: string; description?: string; schema?: Record<string, any> }) {
    try {
      const { name, description, schema } = body

      const id = await this.workflowRepo.createWorkflowTemplate({
        name,
        description,
        schema,
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

  @Post('get')
  async get(@Body() body: { id: number }) {
    try {
      const { id } = body

      if (!id) {
        throw new Error('ID обязателен')
      }

      const template = await this.workflowRepo.getWorkflowTemplate(id)

      return {
        success: true,
        data: template,
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

  @Post('update-schema')
  async updateSchema(@Body() body: { id: number; schema?: Record<string, any> }) {
    try {
      const { id, schema } = body

      if (!id) {
        throw new Error('ID обязателен')
      }

      await this.workflowRepo.setWorkflowTemplateSchema({
        id,
        schema,
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

  @Post('update')
  async update(@Body() body: { id: number; name?: string; description?: string }) {
    try {
      const { id, name, description } = body

      if (!id) {
        throw new Error('ID обязателен')
      }

      await this.workflowRepo.updateWorkflowTemplate({
        id,
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
  async list() {
    try {
      const templates = await this.workflowRepo.getAllWorkflowTemplates()

      return {
        success: true,
        data: templates,
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
  async delete(@Body() body: { id: number }) {
    try {
      const { id } = body

      if (!id) {
        throw new Error('ID обязателен')
      }

      await this.workflowRepo.deleteWorkflowTemplate({ id })

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
}
