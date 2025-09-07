import { spawn } from 'child_process'

import { Injectable } from '@nestjs/common'

@Injectable()
export class TarHelperLibService {
  async extractTarZst({ filePath, destPath }): Promise<void> {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-x', '--zstd', '-f', filePath, '-C', destPath], {
        stdio: ['ignore', 'inherit', 'inherit'], // передаем вывод в консоль
      })

      tar.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`tar exited with code ${code}`))
        }
      })
    })
  }
}