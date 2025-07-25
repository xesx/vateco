import * as assert from 'node:assert'

import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'

import { AppAdminModule } from './app-admin.module'

async function bootstrap() {
  const app = await NestFactory.create(AppAdminModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('ADMIN_PORT')

  assert(port, 'app_admin_main_bootstrap_43 "port" is undefined')

  await app.listen(port)

  console.log('app_admin_main_bootstrap_99 Admin app listening on port:', port)
}

bootstrap()
