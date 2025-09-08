// import * as assert from 'node:assert/strict'
import * as pm2 from 'pm2'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// import axios, { AxiosInstance } from 'axios'

@Injectable()
export class ComfyUiLibService {
  private readonly logger = new Logger(ComfyUiLibService.name)
  private readonly comfyuiDir: string

  constructor(private readonly configService: ConfigService) {
    const workspace = this.configService.get<string>('WORKSPACE')
    this.comfyuiDir = `${workspace}/ComfyUI`
  }

  async startComfyUI(): Promise<void> {
    const comfyPath = this.comfyuiDir
    const pythonPath = `${comfyPath}/venv/bin/python`

    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          this.logger.error('Ошибка подключения к pm2', err)
          return reject(err)
        }

        pm2.start(
          {
            name: 'comfyui',
            cwd: comfyPath,
            script: './venv/bin/python',
            args: ['main.py', '--disable-auto-launch', '--port 18188', '--enable-cors-header'],
          },
          (err) => {
            pm2.disconnect()
            if (err) {
              this.logger.error('Ошибка запуска ComfyUI', err)
              return reject(err)
            }
            this.logger.log('✅ ComfyUI запущен через pm2')
            resolve()
          },
        )
      })
    })
  }

}
