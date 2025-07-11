import * as assert from 'node:assert'

import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('PORT')

  assert(port, 'main_bootstrap_43 "port" is undefined')

  await app.listen(port)
  console.log('Listening on port:', port)
}

bootstrap()
