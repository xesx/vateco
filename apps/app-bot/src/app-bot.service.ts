import { Injectable } from '@nestjs/common';

@Injectable()
export class AppBotService {
  getHello(): string {
    return 'Hello World!';
  }
}
