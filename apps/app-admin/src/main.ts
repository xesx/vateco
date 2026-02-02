import * as assert from 'node:assert'

import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'

import { AppAdminModule } from './app-admin.module'

async function bootstrap() {
  const app = await NestFactory.create(AppAdminModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('ADMIN_PORT')

  // Включаем CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  assert(port, 'app_admin_main_bootstrap_43 "port" is undefined')

  await app.listen(port)

  console.log('app_admin_main_bootstrap_99 Admin app listening on port:', port)
}

bootstrap()
