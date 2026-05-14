import { NestFactory } from '@nestjs/core'

import { AppGpTgBotModule } from './app-gp-tg-bot.module'

async function bootstrap() {
  await NestFactory.create(AppGpTgBotModule)
}

bootstrap()
