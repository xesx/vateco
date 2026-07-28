import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { createClient, FileStat } from 'webdav'

const IMAGE_EXTENSION_REGEXP = /\.(jpe?g|png|webp|gif)$/i
const DIR_IMAGE_COUNT_REGEXP = /__(\d+)$/

@Injectable()
export class RandomImageLibService {
  readonly HETZER_STORAGE_BOX_PASSWORD
  readonly client

  constructor(
    private readonly configService: ConfigService
  ) {
    this.HETZER_STORAGE_BOX_PASSWORD = this.configService.get<string>('HETZER_STORAGE_BOX_PASSWORD')

    this.client = createClient(
      "https://u637529.your-storagebox.de",
      {
        username: "u637529",
        password: this.HETZER_STORAGE_BOX_PASSWORD
      }
    )
  }

  async getRandomImage (): Promise<{ filename: string, path: string, content: Buffer }> {
    try {
      const randomItem = await this.walkToRandomImage('/refs')
      const content = await this.client.getFileContents(randomItem.filename) as Buffer

      return {
        filename: randomItem.basename,
        path: randomItem.filename,
        content,
      }
    } catch (error) {
      console.log('RandomImageLibService_getRandomImage_2 Error getting random image', error, error.message)
      throw new Error('RandomImageLibService_getRandomImage_3 Error getting random image from RandomImageLibService')
    }
  }

  // Извлекает количество изображений из окончания папки вида "__123".
  // Возвращает null, если окончания нет или значение некорректно (не число / <= 0)
  private getDirImageCount (basename: string): number | null {
    const match = basename.match(DIR_IMAGE_COUNT_REGEXP)

    if (!match) {
      return null
    }

    const count = Number(match[1])

    if (!Number.isInteger(count) || count <= 0) {
      return null
    }

    return count
  }

  private async walkToRandomImage (dir: string): Promise<FileStat> {
    const directoryItems = await this.client.getDirectoryContents(dir) as FileStat[]

    const imageItems = directoryItems.filter(
      (item) => item.type === 'file' && IMAGE_EXTENSION_REGEXP.test(item.basename)
    )

    // Учитываем только те подпапки, у которых есть валидный счётчик изображений в имени (__N).
    // Папки без окончания или с некорректным счётчиком игнорируем полностью
    const subDirectoryItems = directoryItems
      .filter((item) => item.type === 'directory')
      .map((item) => ({ item, count: this.getDirImageCount(item.basename) }))
      .filter((entry): entry is { item: FileStat, count: number } => entry.count !== null)

    const subDirectoriesWeight = subDirectoryItems.reduce((sum, entry) => sum + entry.count, 0)
    const totalWeight = imageItems.length + subDirectoriesWeight

    if (!totalWeight) {
      throw new Error(`RandomImageLibService_walkToRandomImage_1 Directory ${dir} is empty`)
    }

    // Взвешенный выбор: вероятность попасть в файл текущей папки или в конкретную подпапку
    // пропорциональна количеству изображений, чтобы итоговое распределение было равномерным
    let pick = Math.random() * totalWeight

    if (pick < imageItems.length) {
      return imageItems[Math.floor(pick)]
    }

    pick -= imageItems.length

    for (const { item, count } of subDirectoryItems) {
      if (pick < count) {
        return this.walkToRandomImage(item.filename)
      }

      pick -= count
    }

    // На случай ошибок округления с плавающей точкой — берём последнюю подпапку
    return this.walkToRandomImage(subDirectoryItems[subDirectoryItems.length - 1].item.filename)
  }
}
