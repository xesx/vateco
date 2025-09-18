import { NestFactory } from '@nestjs/core'
import { AppCronModule } from './app-cron.module'

async function bootstrap() {
  const app = await NestFactory.create(AppCronModule)

  console.log('app_cron_main_bootstrap_99 Cron app started')

  // Приложение не слушает порты, только выполняет cron задачи
  await app.init()
}

bootstrap()