import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('file')
export class FileAppCloudApiController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // ✅ Без параметров — настройки берутся из MulterModule
  appCloudApiFileUpload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен')
    }

    console.log('--->>> Файл сохранён:', file.filename)
    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
    }
  }
}