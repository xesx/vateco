import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { createClient, FileStat } from 'webdav'

const IMAGE_EXTENSION_REGEXP = /\.(jpe?g|png|webp|gif)$/i

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

  private async walkToRandomImage (dir: string): Promise<FileStat> {
    const directoryItems = await this.client.getDirectoryContents(dir) as FileStat[]

    const imageItems = directoryItems.filter(
      (item) => item.type === 'file' && IMAGE_EXTENSION_REGEXP.test(item.basename)
    )
    const subDirectoryItems = directoryItems.filter((item) => item.type === 'directory')

    if (!imageItems.length && !subDirectoryItems.length) {
      throw new Error(`RandomImageLibService_walkToRandomImage_1 Directory ${dir} is empty`)
    }

    // Randomly decide whether to pick a file from the current directory or go deeper into a random subfolder
    const goDeeper = imageItems.length && subDirectoryItems.length
      ? Math.random() < 0.5
      : !imageItems.length

    if (goDeeper) {
      const randomSubDirectory = subDirectoryItems[Math.floor(Math.random() * subDirectoryItems.length)]

      return this.walkToRandomImage(randomSubDirectory.filename)
    }

    return imageItems[Math.floor(Math.random() * imageItems.length)]
  }
}
