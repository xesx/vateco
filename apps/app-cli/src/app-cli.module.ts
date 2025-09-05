import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'

import { AppCliService } from './app-cli.service'

import {
  TestCli
} from './command'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [AppCliService, TestCli],
})
export class AppCliModule {}