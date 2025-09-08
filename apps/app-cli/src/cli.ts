#!/usr/bin/env node

import { NestFactory } from '@nestjs/core'
import { AppCliModule } from './app-cli.module'
import { AppCliService } from './app-cli.service'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppCliModule, {
    logger: ['debug'],
  })

  const service = app.get(AppCliService)
  await service.run(process.argv)

  await app.close()
}

bootstrap()
