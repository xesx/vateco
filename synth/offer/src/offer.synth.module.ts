import { Module } from '@nestjs/common'
import { OfferSynthService } from './offer.synth.service'
import { OfferViewSynthService } from './offer-view.synth.service'

import * as lib from '@lib'
// import * as repo from '@repo'

@Module({
  imports: [
    lib.TgBotLibModule,
    lib.VastLibModule,
    // lib.MessagesLibModule,
  ],
  providers: [
    OfferSynthService,
    OfferViewSynthService,
  ],
  exports: [OfferSynthService],
})

export class OfferSynthModule {}
