// import * as assert from 'node:assert/strict'
import * as pm2 from 'pm2'
import axios from 'axios'
import * as WebSocket from 'ws'

console.log('\x1b[36m', 'WebSocket', WebSocket, '\x1b[0m')

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// import axios, { AxiosInstance } from 'axios'

@Injectable()
export class ComfyUiLibService {
  private readonly l = new Logger(ComfyUiLibService.name)
  private readonly comfyuiDir: string
  private wsConnectionMap: Map<string, WebSocket> = new Map()

  private readonly COMFY_UI_URL: string
  private readonly COMFY_UI_WS_URL: string

  constructor(private readonly configService: ConfigService) {
    const workspace = this.configService.get<string>('WORKSPACE')
    this.comfyuiDir = `${workspace}/ComfyUI`

    this.COMFY_UI_URL = 'http://localhost:18188'
    this.COMFY_UI_WS_URL = 'ws://localhost:18188/ws'
  }

  async startComfyUI(): Promise<void> {
    const comfyPath = this.comfyuiDir
    const pythonPath = `${comfyPath}/venv/bin/python`

    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          this.l.error('Ошибка подключения к pm2', err)
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
              this.l.error('Ошибка запуска ComfyUI', err)
              return reject(err)
            }
            this.l.log('✅ ComfyUI запущен через pm2')
            resolve()
          },
        )
      })
    })
  }

  async prompt (workflow: any): Promise<any> {
    const url = this.COMFY_UI_URL + '/prompt'

    try {
      const res = await axios.post(url, { prompt: workflow })
      return res.data
    } catch (error) {
      console.log('ComfyUiLibService_prompt_13')
      throw error
    }
  }

  async wsConnect (url?: string): Promise<WebSocket> {
    url = url || this.COMFY_UI_WS_URL

    return new Promise((resolve) => {
      let ws = this.wsConnectionMap.get(url)

      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          this.l.log('✅ Reusing existing ComfyUI WebSocket connection')
          resolve(ws)
        } else {
          this.l.log('✅ Existing ComfyUI WebSocket connection is not open, creating a new one')
          this.wsConnectionMap.delete(url)
          ws.terminate?.()
        }
      }

      ws = new WebSocket(url || this.COMFY_UI_WS_URL)

      ws.on('open', () => {
        this.l.log('✅ ComfyUI WebSocket connected')
        this.wsConnectionMap.set(url, ws)
        resolve(ws)
      })

      // ws.on('error', (error) => {
      //   this.l.error('Ошибка подключения к ComfyUI WebSocket', error)
      //   reject(error)
      // })
    })
  }
}
