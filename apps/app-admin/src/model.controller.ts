import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import * as repo from '@repo'

@Controller('model')
export class ModelController {
  constructor(
    private readonly modelRepo: repo.ModelRepository,
  ) {}

  @Post('create')
  async create(@Body() body: { name: string; comfyUiDirectory: string; comfyUiFileName: string; baseModel?: string; label: string }) {
    try {
      const { name, comfyUiDirectory, comfyUiFileName, baseModel, label } = body
      const id = await this.modelRepo.createModel({ name, comfyUiDirectory, comfyUiFileName, baseModel, label })
      return { success: true, data: { id } }
    } catch (error) {
      throw new HttpException({ success: false, error: error.message }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('get')
  async get(@Body() body: { id: number }) {
    try {
      const { id } = body
      if (!id) throw new Error('ID обязателен')
      const model = await this.modelRepo.getModelById(id)
      return { success: true, data: model }
    } catch (error) {
      throw new HttpException({ success: false, error: error.message }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('get-by-name')
  async getByName(@Body() body: { name: string }) {
    try {
      const { name } = body
      if (!name) throw new Error('Name обязателен')
      const model = await this.modelRepo.getModelByName(name)
      return { success: true, data: model }
    } catch (error) {
      throw new HttpException({ success: false, error: error.message }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('list')
  async list(@Body() body: { comfyUiDirectory: string; tags?: string[]; limit?: number; page?: number }) {
    try {
      const { comfyUiDirectory, tags = [], limit = 20, page = 0 } = body
      let models
      if (tags.length > 0) {
        models = await this.modelRepo.findModels({ comfyUiDirectory, tags, limit, page })
      } else {
        models = await this.modelRepo.findModelsByComfyUiDir({ comfyUiDirectory, limit, page })
      }
      return { success: true, data: models }
    } catch (error) {
      throw new HttpException({ success: false, error: error.message }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('update')
  async update(@Body() body: { id: number; name?: string; comfyUiDirectory?: string; comfyUiFileName?: string; label?: string; description?: string; meta?: unknown; baseModel?: string }) {
    try {
      const { id, name, comfyUiDirectory, comfyUiFileName, label, description, meta, baseModel } = body

      await this.modelRepo.updateModel({ id, name, comfyUiDirectory, comfyUiFileName, label, description, meta: meta === null ? {} : meta, baseModel })

      return { success: true }
    } catch (error) {
      throw new HttpException({ success: false, error: error instanceof Error ? error.message : String(error) }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('get-tags')
  async getTags(@Body() body: { id: number }) {
    try {
      const { id } = body

      const tags = await this.modelRepo.getModelTags(id)

      return { success: true, data: tags }
    } catch (error) {
      throw new HttpException({ success: false, error: error instanceof Error ? error.message : String(error) }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('set-tags')
  async setTags(@Body() body: { id: number; tags: string[] }) {
    try {
      const { id: modelId, tags } = body

      await this.modelRepo.setModelTags({ modelId, tags })

      return { success: true }
    } catch (error) {
      throw new HttpException({ success: false, error: error instanceof Error ? error.message : String(error) }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('add-civitai-link')
  async addCivitaiLink(@Body() body: { modelId: number; url: string }) {
    try {
      const { modelId, url } = body
      if (!url.startsWith('https://civitai.com/models/')) throw new Error('Ссылка должна начинаться с https://civitai.com/models/')

      const parsed = new URL(url)

      // https://civitai.com/models/123456?modelVersionId=654321
      const civitaiId = parsed.pathname.replace('/models/', '').split('/')[0]
      const civitaiVersionId = parsed.searchParams.get('modelVersionId') ?? ''

      if (!civitaiId) throw new Error('Не удалось получить ID модели из ссылки')
      if (!civitaiVersionId) throw new Error('Не удалось получить modelVersionId из ссылки. Убедитесь, что в URL присутствует ?modelVersionId=...')

      await this.modelRepo.createModelCivitaiLink({ modelId, civitaiId, civitaiVersionId })
      return { success: true, data: { civitaiId, civitaiVersionId } }
    } catch (error) {
      throw new HttpException({ success: false, error: error instanceof Error ? error.message : String(error) }, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('add-huggingface-link')
  async addHuggingfaceLink(@Body() body: { modelId: number; url: string }) {
    try {
      const { modelId, url } = body
      if (!url.startsWith('https://huggingface.co/')) throw new Error('Ссылка должна начинаться с https://huggingface.co/')

      const withoutBase = url.replace('https://huggingface.co/', '')
      const blobIndex = withoutBase.indexOf('/blob/main/')

      if (blobIndex === -1) throw new Error('Неверный формат ссылки. Ожидается .../blob/main/...')

      const repo = withoutBase.slice(0, blobIndex)
      const file = withoutBase.slice(blobIndex + '/blob/main/'.length)

      await this.modelRepo.createModelHuggingfaceLink({ modelId, repo, file })
      return { success: true, data: { repo, file } }
    } catch (error) {
      throw new HttpException({ success: false, error: error instanceof Error ? error.message : String(error) }, HttpStatus.BAD_REQUEST)
    }
  }
}
