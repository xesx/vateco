import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
// import * as repo from '@repo'
// import * as kb from '@kb'

import { GEOLOCATION } from '@const'

import { InstanceViewSynthService } from './instance-view.synth.service'

@Injectable()
export class InstanceSynthService {
  private readonly l = new Logger(InstanceSynthService.name)

  constructor(
    private readonly vastlib: lib.VastLibService,
    private readonly tgbotlib: lib.TgBotLibService,

    readonly view: InstanceViewSynthService,
  ) {}

  async importInstanceInfo ({ instanceId }: { instanceId: string }) {
    const instance = await this.vastlib.importInstanceInfo(instanceId)

    const token = instance.jupyter_token
    const ipAddress = instance.public_ipaddr
    const instanceApiPort = instance.ports?.['3042/tcp']?.[0]?.HostPort || 'N/A'
    const instanceAppPort = instance.ports?.['1111/tcp']?.[0]?.HostPort

    const apiUrl = `http://${ipAddress}:${instanceApiPort}`
    const appsMenuLink = instanceAppPort ? `http://${ipAddress}:${instanceAppPort}?token=${token}` : 'N/A'
    const startDate = new Date(Math.round(((instance.start_date || 0) * 1000))).toLocaleString()

    const status = instance.actual_status
    const state = instance.cur_state || 'N/A'

    const gpu = instance.gpu_name || 'N/A'
    const durationInHrs = ((Date.now() / 1000 - (instance.start_date || 0)) / 60 / 60).toFixed(2)

    return {
      token,
      ipAddress,
      instanceApiPort,
      instanceAppPort,
      apiUrl,
      appsMenuLink,
      startDate,
      durationInHrs,
      status,
      state,
      gpu,
    }
  }
}
