import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class CloudCronService {
  private readonly logger = new Logger(CloudCronService.name)

  // Каждую секунду
  @Cron('* * * * * *')
  handleEverySecond() {
    this.logger.debug('⚡ Every second cron job executed')
  }

  // Каждую минуту
  @Cron(CronExpression.EVERY_MINUTE)
  handleEveryMinute() {
    this.logger.log('🕐 Every minute cron job executed')

    // Пример работы с данными
    const currentTime = new Date().toISOString()
    this.logger.log(`Current time: ${currentTime}`)
  }

  // Каждые 5 минут
  @Cron('0 */5 * * * *')
  handleEveryFiveMinutes() {
    this.logger.log('🕐 Every 5 minutes cron job executed')

    // Здесь можно добавить проверку состояния инстансов
    this.checkInstancesStatus()
  }

  // Каждый час
  @Cron(CronExpression.EVERY_HOUR)
  handleEveryHour() {
    this.logger.log('🕐 Every hour cron job executed')

    // Здесь можно добавить очистку старых данных
    this.cleanupOldData()
  }

  private async checkInstancesStatus() {
    this.logger.log('Checking instances status...')
    // Логика проверки статуса инстансов
  }

  private async cleanupOldData() {
    this.logger.log('Cleaning up old data...')
    // Логика очистки старых данных
  }
}