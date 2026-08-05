import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { createClient, WebDAVClient } from 'webdav'
import * as path from 'path'

@Injectable()
export class FileStorageLibService {
  readonly HETZER_STORAGE_BOX_PASSWORD
  readonly client: WebDAVClient

  constructor (
    private readonly configService: ConfigService
  ) {
    this.HETZER_STORAGE_BOX_PASSWORD = this.configService.get<string>('HETZER_STORAGE_BOX_PASSWORD')

    this.client = createClient(
      'https://u637529.your-storagebox.de',
      {
        username: 'u637529',
        password: this.HETZER_STORAGE_BOX_PASSWORD,
      }
    )
  }

  // Сохраняет изображение (Buffer) по указанному пути, создавая недостающие директории
  async saveImage (filePath: string, content: Buffer): Promise<void> {
    await this.saveFile(filePath, content)
  }

  // Сохраняет текстовый файл по указанному пути, создавая недостающие директории
  async saveText (filePath: string, content: string): Promise<void> {
    await this.saveFile(filePath, content)
  }

  // Универсальное сохранение файла (Buffer или строка)
  async saveFile (filePath: string, content: Buffer | string): Promise<void> {
    try {
      await this.ensureDirectoryExists(path.posix.dirname(filePath))
      await this.client.putFileContents(filePath, content, { overwrite: true })
    } catch (error) {
      console.log('FileStorageLibService_saveFile_1 Error saving file', filePath, error, error.message)
      throw new Error('FileStorageLibService_saveFile_2 Error saving file to FileStorageLibService')
    }
  }

  // Читает файл как Buffer (изображения и любые бинарные файлы)
  async getFile (filePath: string): Promise<Buffer> {
    try {
      return await this.client.getFileContents(filePath) as Buffer
    } catch (error) {
      console.log('FileStorageLibService_getFile_1 Error reading file', filePath, error, error.message)
      throw new Error('FileStorageLibService_getFile_2 Error reading file from FileStorageLibService')
    }
  }

  // Читает файл как текст
  async getText (filePath: string): Promise<string> {
    try {
      return await this.client.getFileContents(filePath, { format: 'text' }) as string
    } catch (error) {
      console.log('FileStorageLibService_getText_1 Error reading text file', filePath, error, error.message)
      throw new Error('FileStorageLibService_getText_2 Error reading text file from FileStorageLibService')
    }
  }

  // Проверяет существование файла/директории по пути
  async exists (filePath: string): Promise<boolean> {
    return this.client.exists(filePath)
  }

  // Возвращает список содержимого директории
  async list (dirPath: string) {
    return this.client.getDirectoryContents(dirPath)
  }

  // Удаляет файл по пути
  async deleteFile (filePath: string): Promise<void> {
    try {
      await this.client.deleteFile(filePath)
    } catch (error) {
      console.log('FileStorageLibService_deleteFile_1 Error deleting file', filePath, error, error.message)
      throw new Error('FileStorageLibService_deleteFile_2 Error deleting file from FileStorageLibService')
    }
  }

  // Рекурсивно создаёт директории по пути, если их ещё нет.
  // Используем встроенный recursive-режим клиента вместо ручной проверки exists+create,
  // чтобы избежать гонки (TOCTOU), из-за которой параллельные вызовы могли получать 409 Conflict
  private async ensureDirectoryExists (dirPath: string): Promise<void> {
    if (!dirPath || dirPath === '/' || dirPath === '.') {
      return
    }

    try {
      await this.client.createDirectory(dirPath, { recursive: true })
    } catch (error) {
      // 405/409 означают, что директория уже существует (в т.ч. из-за гонки параллельных запросов) — это не ошибка
      if (error?.status === 405 || error?.status === 409) {
        return
      }

      throw error
    }
  }
}

