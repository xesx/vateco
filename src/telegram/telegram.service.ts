import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  constructor(private readonly configService: ConfigService) {}

  getBotToken(): string {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      throw new Error();
    }

    return token
  }

  getAppPort(): number {
    return this.configService.get<number>('PORT', 3000); // значение по умолчанию
  }
}