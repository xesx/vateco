import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { OwnInstanceContext, OwnInstanceMatchContext } from './types'
import { ViewOwnITgBot } from './view.own-i.tg-bot'
import { CommonHandlerOwnITgBot } from './common-handler.own-i.tg-bot'

import { WorkflowSynthService } from '@synth'

import * as kb from '@kb'
import { GEOLOCATION } from '@const'

@Injectable()
export class ActionOwnITgBot {
  constructor(
    private readonly view: ViewOwnITgBot,
    private readonly common: CommonHandlerOwnITgBot,

    private readonly tgbotlib: lib.TgBotLibService,
    private readonly vastlib: lib.VastLibService,
    private readonly cloudapilib: lib.CloudApiCallLibService,
    private readonly wflib: lib.WorkflowLibService,
    private readonly msglib: lib.MessageLibService,
    private readonly h: lib.HelperLibService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,

    private readonly wfsynth: WorkflowSynthService,
  ) {}
}