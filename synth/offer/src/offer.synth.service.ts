import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
// import * as repo from '@repo'
// import * as kb from '@kb'

import { GEOLOCATION } from '@const'

import { OfferViewSynthService } from './offer-view.synth.service'

@Injectable()
export class OfferSynthService {
  private readonly l = new Logger(OfferSynthService.name)

  constructor(
    private readonly vastlib: lib.VastLibService,
    private readonly tgbotlib: lib.TgBotLibService,

    readonly view: OfferViewSynthService,
  ) {}

  async searchOffers ({ geo, gpu, inDataCenterOnly }: { geo: string; gpu: string; inDataCenterOnly: boolean }) {
    let geolocation: string[] | undefined

    if (GEOLOCATION[geo]) {
      geolocation = [geo]
    } else {
      geolocation = Object.entries(GEOLOCATION)
        .filter(([,value]) => value.region === geo)
        .map(([key]) => key)
    }

    const result = await this.vastlib.importOffers({ gpu, geolocation, inDataCenterOnly })
    const offers = result.offers

    return offers
  }
}
