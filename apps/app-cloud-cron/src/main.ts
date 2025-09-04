import { NestFactory } from '@nestjs/core'
import { AppCloudCronModule } from './app-cloud-cron.module'

async function bootstrap() {
  const app = await NestFactory.create(AppCloudCronModule)

  console.log('app_cloud_cron_main_bootstrap_99 Cloud cron app started')

  // Приложение не слушает порты, только выполняет cron задачи
  await app.init()
}

bootstrap()