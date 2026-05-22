import { NestFactory } from '@nestjs/core'

import { BotModuleGp } from './bot.module.gp'

async function bootstrap() {
  await NestFactory.create(BotModuleGp)
}

bootstrap()
