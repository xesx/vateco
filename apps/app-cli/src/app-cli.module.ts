import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { HelperLibModule } from '@libs/h'
import { RcloneLibModule } from '@libs/rclone'

import { AppCliService } from './app-cli.service'

import {
  TestCli,
  InstallComfyuiV0Cli,
} from './command'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HelperLibModule,
    RcloneLibModule,
  ],
  providers: [
    AppCliService,
    TestCli,
    InstallComfyuiV0Cli,
  ],
})
export class AppCliModule {}