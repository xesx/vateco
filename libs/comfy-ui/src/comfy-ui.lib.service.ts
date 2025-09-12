// import * as assert from 'node:assert/strict'
import * as pm2 from 'pm2'
import axios from 'axios'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// import axios, { AxiosInstance } from 'axios'

@Injectable()
export class ComfyUiLibService {
  private readonly logger = new Logger(ComfyUiLibService.name)
  private readonly comfyuiDir: string

  private readonly COMFY_UI_URL: string

  constructor(private readonly configService: ConfigService) {
    const workspace = this.configService.get<string>('WORKSPACE')
    this.comfyuiDir = `${workspace}/ComfyUI`

    this.COMFY_UI_URL = 'http://localhost:18188'
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
        // /workspace/ComfyUI/venv/bin/python /workspace/ComfyUI/main.py --disable-auto-launch --port 18188 --enable-cors-header
        pm2.start(
          {
            name: 'comfyui',
            cwd: comfyPath,
            script: pythonPath,
            args: ['main.py', '--disable-auto-launch', '--port', '18188', '--enable-cors-header'],
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

  async prompt(workflow: any): Promise<any> {
    const url = this.COMFY_UI_URL + '/prompt'

    try {
      const res = await axios.post(url, { prompt: workflow })
      return res.data
    } catch (error) {
      console.log('ComfyUiLibService_prompt_13')
      throw error
    }
  }
}
