import { NestFactory } from '@nestjs/core'
import { AppBotModule } from './app-bot.module'

async function bootstrap() {
  const app = await NestFactory.create(AppBotModule)
  await app.listen(process.env.port ?? 3000)
}

bootstrap()
