import * as assert from 'node:assert'

import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'

import { AppBaseTgBotModule } from './app-base-tg-bot.module'

async function bootstrap() {
  const app = await NestFactory.create(AppBaseTgBotModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('TELEGRAM_BOT_PORT')

  assert(port, 'app_telegram_bot_main_bootstrap_43 "port" is undefined')

  await app.listen(port)

  console.log('app_telegram_bot_main_bootstrap_99 Telegrab bot app listening on port:', port)
}

bootstrap()
