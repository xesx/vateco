import { Injectable } from '@nestjs/common'
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { ConfigService } from '@nestjs/config'
import { existsSync, mkdirSync } from 'fs'

@Injectable()
export class MulterConfigAppCloudApiService implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMulterOptions (): MulterModuleOptions {
    const workspace = this.configService.get<string>('WORKSPACE')
    if (!workspace) {
      throw new Error('WORKSPACE не задан в конфигурации')
    }

    const uploadPath = workspace + '/ComfyUI/input'

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true })
    }

    console.log('\x1b[36m%s\x1b[0m', `📁 Multer: файлы будут сохраняться в ${uploadPath}`)

    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          console.log('destination')
          cb(null, uploadPath)
        },
        filename: (req, file, cb) => {
          console.log('filename')
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
          const ext = extname(file.originalname)
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }
  }
}