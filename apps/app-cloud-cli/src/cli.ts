#!/usr/bin/env node

import { NestFactory } from '@nestjs/core'
import { AppCloudCliModule } from './app-cloud-cli.module'
import { AppCloudCliService } from './app-cloud-cli.service'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppCloudCliModule, {
    logger: ['debug'],
  })

  const service = app.get(AppCloudCliService)
  await service.run(process.argv)

  await app.close()
}

bootstrap()
